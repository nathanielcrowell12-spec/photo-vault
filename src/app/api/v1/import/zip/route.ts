import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parser for large files
  },
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send helper function
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }

        // Get form data
        const formData = await request.formData()
        const zipFile = formData.get('zipFile') as File
        const platform = formData.get('platform') as string
        const galleryName = formData.get('galleryName') as string
        const userId = request.headers.get('x-user-id')

        // Check file size (allow up to 2GB)
        if (zipFile.size > 2 * 1024 * 1024 * 1024) {
          send({ error: 'File too large. Maximum size is 2GB.', progress: 0 })
          controller.close()
          return
        }

        if (!zipFile || !userId) {
          send({ error: 'ZIP file and user ID are required', progress: 0 })
          controller.close()
          return
        }

        send({ message: 'Reading ZIP file...', progress: 10 })

        // Convert File to ArrayBuffer
        const arrayBuffer = await zipFile.arrayBuffer()
        
        send({ message: 'Extracting photos from ZIP...', progress: 20 })

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
          send({ error: 'No image files found in ZIP', progress: 20 })
          controller.close()
          return
        }

        send({ 
          message: `Found ${imageFiles.length} photos. Creating gallery...`, 
          progress: 30,
          totalPhotos: imageFiles.length 
        })

        // Create gallery record
        const { data: gallery, error: galleryError } = await supabase
          .from('galleries')
          .insert({
            user_id: userId,
            gallery_name: galleryName || `${platform} Gallery`,
            gallery_description: `Imported from ${platform} ZIP file`,
            platform: platform || 'ZIP Upload',
            photo_count: 0,
            is_imported: false,
            cover_image_url: '/images/placeholder-family.svg',
            import_started_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (galleryError || !gallery) {
          console.error('ZIP Upload: Error creating gallery:', galleryError)
          send({ error: 'Failed to create gallery record', progress: 30 })
          controller.close()
          return
        }

        const galleryId = gallery.id
        send({ message: 'Gallery created. Uploading photos...', progress: 40 })

        // Process and upload each photo
        let uploadedCount = 0
        const batchSize = 5 // Process 5 photos at a time
        
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
                const randomStr = Math.random().toString(36).substring(7)
                const ext = name.split('.').pop()
                const filename = `${timestamp}-${randomStr}.${ext}`
                const storagePath = `${userId}/${galleryId}/${filename}`

                // Upload to Supabase storage
                const { error: uploadError } = await supabase.storage
                  .from('photos')
                  .upload(storagePath, photoBlob, {
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
                  .getPublicUrl(storagePath)

                // Create gallery_photos record
                await supabase
                  .from('gallery_photos')
                  .insert({
                    gallery_id: galleryId,
                    photo_url: publicUrl,
                    storage_path: storagePath,
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
          complete: true
        })

        controller.close()

      } catch (error) {
        console.error('ZIP Upload: Processing error:', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Upload failed',
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

