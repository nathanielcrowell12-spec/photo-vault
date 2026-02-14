import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import { processAndStoreThumbnails } from '@/lib/image/process-and-store-thumbnails'

// Vercel Pro default is 15s — thumbnail generation needs more time (QA Critic C2)
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (err) {
          // Controller already closed by client, ignore
        }
      }

      try {
        const { galleryId, storagePath, totalChunks } = await request.json()

        if (!galleryId || !storagePath || !totalChunks) {
          send({ error: 'Missing required fields', progress: 0 })
          controller.close()
          return
        }

        send({ message: 'Downloading and merging ZIP chunks...', progress: 5 })

        // Download all chunks and merge them into one buffer
        const chunks: Buffer[] = []
        
        for (let i = 0; i < totalChunks; i++) {
          const chunkPath = `${storagePath}.part${i}`
          
          const { data: chunkData, error: downloadError } = await supabase.storage
            .from('gallery-imports')
            .download(chunkPath)

          if (downloadError || !chunkData) {
            logger.error(`Error downloading chunk ${i}:`, downloadError)
            send({ error: `Failed to download chunk ${i}`, progress: 0 })
            controller.close()
            return
          }

          chunks.push(Buffer.from(await chunkData.arrayBuffer()))
          
          const downloadProgress = 5 + ((i + 1) / totalChunks) * 10
          send({ message: `Downloaded chunk ${i + 1}/${totalChunks}...`, progress: downloadProgress })
        }

        send({ message: 'Merging chunks...', progress: 15 })
        const fileBuffer = Buffer.concat(chunks)

        // Detect if file is a ZIP or an image
        const isZip = fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B // PK signature
        const imageFiles: Array<{ name: string; buffer: Buffer }> = []

        if (isZip) {
          send({ message: 'Loading ZIP file...', progress: 20 })
          const zip = await JSZip.loadAsync(fileBuffer)

          // Get all image files from ZIP
          const zipImageFiles: { name: string; file: JSZip.JSZipObject }[] = []

          zip.forEach((relativePath, file) => {
            if (!file.dir && /\.(jpg|jpeg|png|gif|webp|heic|raw|cr2|nef|arw|dng)$/i.test(relativePath)) {
              zipImageFiles.push({ name: relativePath, file })
            }
          })

          // Extract images from ZIP
          for (const { name, file } of zipImageFiles) {
            const imageData = await file.async('arraybuffer')
            imageFiles.push({
              name: name.split('/').pop() || name,
              buffer: Buffer.from(imageData)
            })
          }
        } else {
          // Single image file
          send({ message: 'Processing photo file...', progress: 20 })
          // Get filename from storagePath
          const fileName = storagePath.split('/').pop() || 'photo.jpg'
          imageFiles.push({
            name: fileName,
            buffer: fileBuffer
          })
        }

        send({ message: `Found ${imageFiles.length} image(s). Starting upload...`, progress: 25 })

        // Process and upload each photo
        let uploadedCount = 0
        let firstPhotoUrl: string | null = null // Track first photo for cover image
        // Process 3 photos at a time (controls Sharp concurrency without p-limit)
        // 3 photos x ~10MB x 10x Sharp overhead = ~300MB, safe under 1024MB
        const batchSize = 3
        
        for (let i = 0; i < imageFiles.length; i += batchSize) {
          const batch = imageFiles.slice(i, i + batchSize)

          const results = await Promise.all(
            batch.map(async ({ name, buffer }, batchIndex) => {
              try {
                // Upload to Supabase Storage
                const sanitizedName = name.replace(/[^a-zA-Z0-9.-]/g, '_')
                const timestamp = Date.now()
                const randomSuffix = Math.random().toString(36).substring(2, 8)
                const photoPath = `galleries/${galleryId}/${timestamp}-${randomSuffix}-${sanitizedName}`

                logger.info(`[Process] Uploading photo ${batchIndex + 1}: ${name} -> ${photoPath}`)

                const { error: uploadPhotoError } = await supabase.storage
                  .from('photos')
                  .upload(photoPath, buffer, {
                    contentType: `image/${name.split('.').pop()}`,
                    upsert: false
                  })

                if (uploadPhotoError) {
                  logger.error(`[Process] Storage upload error for ${name}:`, uploadPhotoError)
                  return { success: false, error: 'storage', name }
                }

                // Get public URL for the photo
                const { data: { publicUrl } } = supabase.storage
                  .from('photos')
                  .getPublicUrl(photoPath)

                // Generate thumbnails (concurrency controlled by batch size)
                const thumbResult = await processAndStoreThumbnails(
                  buffer,
                  supabase,
                  'photos',
                  `galleries/${galleryId}`,
                  `${timestamp}-${randomSuffix}-${sanitizedName}`,
                )

                // Save first photo's thumbnail URL for cover image
                if (!firstPhotoUrl) {
                  firstPhotoUrl = thumbResult?.thumbnailUrl ?? publicUrl
                }

                // Create photo record in photos table
                const { error: photoRecordError } = await supabase
                  .from('photos')
                  .insert({
                    gallery_id: galleryId,
                    filename: sanitizedName,
                    original_url: publicUrl,
                    thumbnail_url: thumbResult?.thumbnailUrl ?? publicUrl,
                    medium_url: thumbResult?.mediumUrl ?? null,
                    file_size: buffer.length
                  })

                if (photoRecordError) {
                  logger.error(`[Process] Database insert error for ${name}:`, photoRecordError)
                  return { success: false, error: 'database', name }
                }

                logger.info(`[Process] Successfully uploaded ${name}`)
                return { success: true, name }
              } catch (error) {
                logger.error(`[Process] Exception processing ${name}:`, error)
                return { success: false, error: 'exception', name }
              }
            })
          )

          // Count successes safely (not in parallel)
          const batchSuccesses = results.filter(r => r?.success).length
          uploadedCount += batchSuccesses
          logger.info(`[Process] Batch complete: ${batchSuccesses}/${batch.length} succeeded, total: ${uploadedCount}`)

          const uploadProgress = 25 + ((uploadedCount / imageFiles.length) * 70)
          send({ message: `Uploaded ${uploadedCount}/${imageFiles.length} photos...`, progress: Math.floor(uploadProgress) })
        }

        send({ message: 'Cleaning up...', progress: 95 })

        // Delete chunk files
        const filesToRemove = []
        for (let i = 0; i < totalChunks; i++) {
          filesToRemove.push(`${storagePath}.part${i}`)
        }
        await supabase.storage.from('gallery-imports').remove(filesToRemove)

        // Get current gallery to check cover image
        const { data: currentGallery } = await supabase
          .from('photo_galleries')
          .select('cover_image_url')
          .eq('id', galleryId)
          .single()

        // Use RPC function for atomic increment to avoid race conditions
        // First increment the photo count using the database function
        logger.info(`[Process] Incrementing photo count for gallery ${galleryId} by ${uploadedCount}`)
        const { error: incrementError } = await supabase.rpc('increment_gallery_photo_count', {
          gallery_id: galleryId,
          count_increment: uploadedCount
        })

        if (incrementError) {
          logger.error('[Process] Error incrementing photo count:', incrementError)
        } else {
          logger.info(`[Process] Successfully incremented photo count by ${uploadedCount}`)
        }

        // Then update the import status
        const { error: statusError } = await supabase
          .from('photo_galleries')
          .update({
            is_imported: true,
            import_completed_at: new Date().toISOString()
          })
          .eq('id', galleryId)

        if (statusError) {
          logger.error('[Process] Error updating gallery status:', statusError)
        }

        // Update cover image separately if needed (less critical, not part of atomic operation)
        if (!currentGallery?.cover_image_url || currentGallery.cover_image_url.includes('placeholder')) {
          if (firstPhotoUrl) {
            await supabase
              .from('photo_galleries')
              .update({ cover_image_url: firstPhotoUrl })
              .eq('id', galleryId)
          }
        }

        send({ message: `Import complete! ${uploadedCount} photos imported.`, progress: 100 })
        try {
          controller.close()
        } catch (err) {
          // Controller already closed, ignore
        }

      } catch (error) {
        logger.error('Processing error:', error)
        send({ error: 'Failed to process ZIP file', progress: 0 })
        try {
          controller.close()
        } catch (err) {
          // Controller already closed, ignore
        }
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

