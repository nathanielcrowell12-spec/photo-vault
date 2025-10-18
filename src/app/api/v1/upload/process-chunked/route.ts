import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
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
            console.error(`Error downloading chunk ${i}:`, downloadError)
            send({ error: `Failed to download chunk ${i}`, progress: 0 })
            controller.close()
            return
          }

          chunks.push(Buffer.from(await chunkData.arrayBuffer()))
          
          const downloadProgress = 5 + ((i + 1) / totalChunks) * 10
          send({ message: `Downloaded chunk ${i + 1}/${totalChunks}...`, progress: downloadProgress })
        }

        send({ message: 'Merging chunks...', progress: 15 })
        const zipBuffer = Buffer.concat(chunks)

        send({ message: 'Loading ZIP file...', progress: 20 })
        const zip = await JSZip.loadAsync(zipBuffer)

        // Get all image files
        const imageFiles: { name: string; file: JSZip.JSZipObject }[] = []
        
        zip.forEach((relativePath, file) => {
          if (!file.dir && /\.(jpg|jpeg|png|gif|webp)$/i.test(relativePath)) {
            imageFiles.push({ name: relativePath, file })
          }
        })

        send({ message: `Found ${imageFiles.length} images. Starting upload...`, progress: 25 })

        // Process and upload each photo
        let uploadedCount = 0
        let firstPhotoUrl: string | null = null // Track first photo for cover image
        const batchSize = 10 // Process 10 photos at a time
        
        for (let i = 0; i < imageFiles.length; i += batchSize) {
          const batch = imageFiles.slice(i, i + batchSize)
          
          await Promise.all(
            batch.map(async ({ name, file }) => {
              try {
                const imageData = await file.async('arraybuffer')
                const buffer = Buffer.from(imageData)

                // Upload to Supabase Storage
                const fileName = name.split('/').pop() || name
                const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
                const timestamp = Date.now()
                const photoPath = `galleries/${galleryId}/${timestamp}-${sanitizedName}`

                const { error: uploadPhotoError } = await supabase.storage
                  .from('photos')
                  .upload(photoPath, buffer, {
                    contentType: `image/${fileName.split('.').pop()}`,
                    upsert: false
                  })

                if (uploadPhotoError) {
                  console.error('Error uploading photo:', uploadPhotoError)
                  return
                }

                // Get public URL for the photo
                const { data: { publicUrl } } = supabase.storage
                  .from('photos')
                  .getPublicUrl(photoPath)

                // Save first photo URL for cover image
                if (!firstPhotoUrl) {
                  firstPhotoUrl = publicUrl
                }

                // Create photo record in gallery_photos
                const { error: photoRecordError } = await supabase
                  .from('gallery_photos')
                  .insert({
                    gallery_id: galleryId,
                    photo_url: publicUrl,
                    thumbnail_url: publicUrl, // You can generate thumbnails later
                    original_filename: sanitizedName,
                    file_size: buffer.length
                  })

                if (photoRecordError) {
                  console.error('Error creating photo record:', photoRecordError)
                  return
                }

                uploadedCount++
              } catch (error) {
                console.error('Error processing photo:', error)
              }
            })
          )

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

        // Update gallery with photo count and cover image
        await supabase
          .from('galleries')
          .update({
            photo_count: uploadedCount,
            is_imported: true,
            import_completed_at: new Date().toISOString(),
            cover_image_url: firstPhotoUrl || '/images/placeholder-family.svg'
          })
          .eq('id', galleryId)

        send({ message: `Import complete! ${uploadedCount} photos imported.`, progress: 100 })
        controller.close()

      } catch (error) {
        console.error('Processing error:', error)
        send({ error: 'Failed to process ZIP file', progress: 0 })
        controller.close()
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

