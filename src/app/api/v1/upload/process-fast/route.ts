import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

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
        const send = (data: any) => {
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
          .from('photos')
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
          message: `Found ${imageFiles.length} photos. Processing with MAXIMUM SPEED...`, 
          progress: 40,
          totalPhotos: imageFiles.length 
        })

        // Get gallery info for user ID
        const { data: gallery } = await supabase
          .from('galleries')
          .select('user_id')
          .eq('id', galleryId)
          .single()

        if (!gallery) {
          send({ error: 'Gallery not found', progress: 40 })
          controller.close()
          return
        }

        // SUPER FAST: Process ALL photos in parallel (up to 20 at once)
        let uploadedCount = 0
        const maxConcurrent = 20 // Process up to 20 photos simultaneously
        
        const processPhoto = async (imageFile: { name: string; file: JSZip.JSZipObject }, index: number) => {
          try {
            // Add a small delay to stagger the requests and avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, index * 50))
            
            // Extract photo data
            const photoData = await imageFile.file.async('arraybuffer')
            const photoBlob = new Blob([photoData], { 
              type: getMimeType(imageFile.name) 
            })

            // Generate unique filename
            const timestamp = Date.now()
            const randomStr = Math.random().toString(36).substring(7)
            const ext = imageFile.name.split('.').pop()
            const filename = `${timestamp}-${randomStr}-${index}.${ext}`
            const finalStoragePath = `${gallery.user_id}/${galleryId}/${filename}`

            // Upload to Supabase storage
            const { error: uploadError } = await supabase.storage
              .from('photos')
              .upload(finalStoragePath, photoBlob, {
                contentType: getMimeType(imageFile.name),
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error(`Failed to upload ${imageFile.name}:`, uploadError)
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
                original_filename: imageFile.name,
                file_size: photoBlob.size,
                mime_type: getMimeType(imageFile.name)
              })

            // Update progress
            const newCount = ++uploadedCount
            const progressPercent = 40 + Math.floor((newCount / imageFiles.length) * 50)
            
            send({ 
              progress: progressPercent,
              message: `SUPER FAST: Uploaded ${newCount} of ${imageFiles.length} photos...`,
              currentPhoto: newCount,
              totalPhotos: imageFiles.length
            })

          } catch (photoError) {
            console.error(`Error processing ${imageFile.name}:`, photoError)
          }
        }

        // Process photos in chunks to manage concurrency
        const chunks = []
        for (let i = 0; i < imageFiles.length; i += maxConcurrent) {
          chunks.push(imageFiles.slice(i, i + maxConcurrent))
        }

        for (const chunk of chunks) {
          await Promise.all(chunk.map((imageFile, index) => 
            processPhoto(imageFile, index)
          ))
        }

        send({ message: 'Cleaning up temporary files...', progress: 95 })

        // Delete the temporary ZIP file
        await supabase.storage
          .from('photos')
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
          message: `SUPER FAST: Successfully imported ${uploadedCount} photos!`,
          complete: true,
          galleryId: galleryId
        })

        controller.close()

      } catch (error) {
        console.error('Super Fast Processing error:', error)
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
