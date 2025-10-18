import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import unzipper from 'unzipper'
import { Readable } from 'stream'

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

        // Download the ZIP file from Supabase storage as a stream
        const { data: zipData, error: downloadError } = await supabase.storage
          .from('photos')
          .download(storagePath)

        if (downloadError || !zipData) {
          console.error('Error downloading ZIP:', downloadError)
          send({ error: 'Failed to download ZIP file from storage', progress: 0 })
          controller.close()
          return
        }

        send({ message: 'Converting to stream for processing...', progress: 20 })

        // Convert blob to readable stream
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const zipStream = Readable.fromWeb(zipData.stream() as ReadableStream<any>)
        
        send({ message: 'Extracting photos from ZIP (streaming)...', progress: 30 })

        // Get gallery info for user ID
        const { data: gallery } = await supabase
          .from('galleries')
          .select('user_id')
          .eq('id', galleryId)
          .single()

        if (!gallery) {
          send({ error: 'Gallery not found', progress: 30 })
          controller.close()
          return
        }

        let uploadedCount = 0
        let totalFiles = 0
        let processedFiles = 0

        // First pass: count total files
        send({ message: 'Scanning ZIP file...', progress: 35 })
        
        const countStream = Readable.fromWeb(zipData.stream())
        const countParser = countStream.pipe(unzipper.Parse())

        await new Promise((resolve, reject) => {
          countParser.on('entry', (entry) => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(entry.path)
            const isNotHidden = !entry.path.includes('__MACOSX') && !entry.path.startsWith('.')
            
            if (isImage && isNotHidden && entry.type === 'File') {
              totalFiles++
            }
            entry.autodrain()
          })

          countParser.on('end', resolve)
          countParser.on('error', reject)
        })

        if (totalFiles === 0) {
          send({ error: 'No image files found in ZIP', progress: 35 })
          controller.close()
          return
        }

        send({ 
          message: `Found ${totalFiles} photos. Processing with streaming...`, 
          progress: 40,
          totalPhotos: totalFiles 
        })

        // Second pass: process files with streaming
        const processStream = Readable.fromWeb(zipData.stream())
        const parser = processStream.pipe(unzipper.Parse())

        const uploadPromises: Promise<void>[] = []
        const maxConcurrentUploads = 5 // Process up to 5 photos simultaneously

        await new Promise((resolve, reject) => {
          parser.on('entry', async (entry) => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(entry.path)
            const isNotHidden = !entry.path.includes('__MACOSX') && !entry.path.startsWith('.')
            
            if (isImage && isNotHidden && entry.type === 'File') {
              processedFiles++

              // Wait if we have too many concurrent uploads
              while (uploadPromises.length >= maxConcurrentUploads) {
                await Promise.race(uploadPromises)
                // Remove completed promises
                for (let i = uploadPromises.length - 1; i >= 0; i--) {
                  try {
                    await uploadPromises[i]
                    uploadPromises.splice(i, 1)
                  } catch (error) {
                    // Promise already resolved/rejected
                    uploadPromises.splice(i, 1)
                  }
                }
              }

              const uploadPromise = processPhotoEntry(entry, galleryId, gallery.user_id, () => {
                uploadedCount++
                const progressPercent = 40 + Math.floor((uploadedCount / totalFiles) * 50)
                send({ 
                  progress: progressPercent,
                  message: `Uploaded ${uploadedCount} of ${totalFiles} photos...`,
                  currentPhoto: uploadedCount,
                  totalPhotos: totalFiles
                })
              })

              uploadPromises.push(uploadPromise)
            } else {
              entry.autodrain()
            }
          })

          parser.on('end', async () => {
            // Wait for all remaining uploads to complete
            try {
              await Promise.all(uploadPromises)
              resolve(undefined)
            } catch (error) {
              reject(error)
            }
          })

          parser.on('error', reject)
        })

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
          message: `Successfully imported ${uploadedCount} photos using streaming!`,
          complete: true,
          galleryId: galleryId
        })

        controller.close()

      } catch (error) {
        console.error('Streaming ZIP Processing error:', error)
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

interface PhotoEntry {
  fileName: string
  fileSize: number
  isDirectory: boolean
}

async function processPhotoEntry(
  entry: PhotoEntry, 
  galleryId: string, 
  userId: string, 
  onComplete: () => void
): Promise<void> {
  try {
    // Collect the file data
    const chunks: Buffer[] = []
    
    await new Promise<void>((resolve, reject) => {
      entry.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      
      entry.on('end', () => {
        resolve()
      })
      
      entry.on('error', reject)
    })

    const photoData = Buffer.concat(chunks)
    const photoBlob = new Blob([photoData], { 
      type: getMimeType(entry.path) 
    })

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const ext = entry.path.split('.').pop()
    const filename = `${timestamp}-${randomStr}.${ext}`
    const finalStoragePath = `${userId}/${galleryId}/${filename}`

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(finalStoragePath, photoBlob, {
        contentType: getMimeType(entry.path),
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error(`Failed to upload ${entry.path}:`, uploadError)
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
        original_filename: entry.path,
        file_size: photoBlob.size,
        mime_type: getMimeType(entry.path)
      })

    onComplete()

  } catch (error) {
    console.error(`Error processing ${entry.path}:`, error)
  }
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
