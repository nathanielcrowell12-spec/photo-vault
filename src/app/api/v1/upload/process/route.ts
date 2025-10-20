import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import { generateRandomId } from '@/lib/api-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send helper function
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        const { galleryId, storagePath } = await request.json()

        if (!galleryId || !storagePath) {
          send({ error: 'Missing galleryId or storagePath', progress: 0 })
          controller.close()
          return
        }

        send({ message: 'Downloading ZIP file from storage...', progress: 10 })

        // Download the ZIP file from Supabase storage
          const { data: zipData, error: downloadError } = await supabase.storage
          .from('gallery-imports')
          .download(storagePath)

        if (downloadError || !zipData) {
          console.error('Error downloading ZIP:', downloadError)
          send({ error: 'Failed to download ZIP file from storage', progress: 0 })
          controller.close()
          return
        }

        send({ message: 'Converting ZIP to buffer...', progress: 20 })

        // Convert blob to array buffer
        const arrayBuffer = await zipData.arrayBuffer()
        
        send({ message: 'Extracting photos from ZIP...', progress: 30 })

        // Load ZIP file
        const zip = await JSZip.loadAsync(arrayBuffer)
        
        // Get all image files from the ZIP
        const imageFiles: Array<{ name: string; file: JSZip.JSZipObject }> = []
        
        zip.forEach((relativePath, file) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(relativePath)
          const isNotHidden = !relativePath.includes('__MACOSX') && !relativePath.startsWith('.')
          
          if (isImage && isNotHidden && !file.dir) {
            imageFiles.push({ name: relativePath, file })
          }
        })

        if (imageFiles.length === 0) {
          send({ error: 'No image files found in ZIP', progress: 30 })
          controller.close()
          return
        }

        send({ 
          message: `Found ${imageFiles.length} photos. Processing...`, 
          progress: 40,
          totalPhotos: imageFiles.length 
        })

        // Process and upload each photo
        let uploadedCount = 0
        const batchSize = 10 // Process 10 photos at a time for much faster processing
        
        for (let i = 0; i < imageFiles.length; i += batchSize) {
          const batch = imageFiles.slice(i, i + batchSize)
          
          await Promise.all(
            batch.map(async ({ name, file }) => {
              try {
                // Extract photo data
                const photoData = await file.async('arraybuffer')
                const photoBlob = new Blob([photoData], { 
                  type: getMimeType(name) 
                })

                // Generate unique filename
                const timestamp = Date.now()
                const randomStr = generateRandomId()
                const ext = name.split('.').pop()
                const filename = `${timestamp}-${randomStr}.${ext}`
                
                // Get gallery info for user ID
                const { data: gallery } = await supabase
                  .from('galleries')
                  .select('user_id')
                  .eq('id', galleryId)
                  .single()

                if (!gallery) return

                const finalStoragePath = `${gallery.user_id}/${galleryId}/${filename}`

                // Upload to Supabase storage
                const { error: uploadError } = await supabase.storage
                  .from('photos')
                  .upload(finalStoragePath, photoBlob, {
                    contentType: getMimeType(name),
                    cacheControl: '3600',
                    upsert: false
                  })

                if (uploadError) {
                  console.error(`Failed to upload ${name}:`, uploadError)
                  return
                }

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                  .from('photos')
                  .getPublicUrl(finalStoragePath)

                // Create gallery_photos record
                await supabase
                  .from('gallery_photos')
                  .insert({
                    gallery_id: galleryId,
                    photo_url: publicUrl,
                    storage_path: finalStoragePath,
                    original_filename: name,
                    file_size: photoBlob.size,
                    mime_type: getMimeType(name)
                  })

                uploadedCount++
                
                // Update progress
                const progressPercent = 40 + Math.floor((uploadedCount / imageFiles.length) * 50)
                send({ 
                  progress: progressPercent,
                  message: `Uploaded ${uploadedCount} of ${imageFiles.length} photos...`,
                  currentPhoto: uploadedCount,
                  totalPhotos: imageFiles.length
                })

              } catch (photoError) {
                console.error(`Error processing ${name}:`, photoError)
              }
            })
          )
        }

        send({ message: 'Cleaning up temporary files...', progress: 95 })

        // Delete the temporary ZIP file
        await supabase.storage
          .from('gallery-imports')
          .remove([storagePath])

        // Update gallery with final photo count
        await supabase
          .from('galleries')
          .update({
            photo_count: uploadedCount,
            is_imported: true,
            import_started_at: null
          })
          .eq('id', galleryId)

        send({ 
          progress: 100,
          message: `Successfully imported ${uploadedCount} photos!`,
          complete: true,
          galleryId: galleryId
        })

        controller.close()

      } catch (error) {
        console.error('ZIP Processing error:', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Processing failed',
            progress: 0 
          })}\n\n`)
        )
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

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'heif': 'image/heif'
  }
  return mimeTypes[ext || ''] || 'image/jpeg'
}
