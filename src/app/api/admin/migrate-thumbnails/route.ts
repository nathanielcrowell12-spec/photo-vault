import { createServerSupabaseClient } from '@/lib/supabase'
import { processAndStoreThumbnails } from '@/lib/image/process-and-store-thumbnails'
import { logger } from '@/lib/logger'

export const maxDuration = 300 // 5 minutes for batch processing

/**
 * Admin-only migration endpoint to generate thumbnails for existing photos.
 *
 * Processes both `gallery_photos` (~90 rows) and `photos` (~622 rows) tables.
 * Skips photos that already have real thumbnails (idempotent).
 * Returns SSE progress events for monitoring.
 *
 * Usage: POST /api/admin/migrate-thumbnails
 * Optional body: { "dryRun": true } to preview without processing
 */
export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()

  // Parse optional body
  let dryRun = false
  try {
    const body = await request.json()
    dryRun = body?.dryRun === true
  } catch {
    // No body or invalid JSON — proceed with real run
  }

  // SSE stream for progress reporting
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // ─── 1. Fetch photos needing migration ───────────────────────
        sendEvent({ type: 'status', message: 'Fetching photos needing migration...' })

        // gallery_photos: fetch all, filter in JS (Supabase .or() can't compare two columns)
        const { data: allGalleryPhotos, error: gpError } = await supabase
          .from('gallery_photos')
          .select('id, gallery_id, photo_url, thumbnail_url')

        if (gpError) {
          sendEvent({ type: 'error', message: `Failed to fetch gallery_photos: ${gpError.message}` })
          controller.close()
          return
        }

        // Filter: needs migration if thumbnail_url is null, empty, or equals photo_url
        const galleryPhotosToMigrate = (allGalleryPhotos || []).filter(p =>
          !p.thumbnail_url || p.thumbnail_url === p.photo_url
        )

        // photos table: fetch all, filter in JS
        const { data: allPhotos, error: pError } = await supabase
          .from('photos')
          .select('id, gallery_id, original_url, thumbnail_url, medium_url')

        if (pError) {
          sendEvent({ type: 'error', message: `Failed to fetch photos: ${pError.message}` })
          controller.close()
          return
        }

        // Filter: needs migration if thumbnail_url is null, empty, or equals original_url
        // Also skip if medium_url is already populated (already migrated)
        const photosToMigrate = (allPhotos || []).filter(p =>
          (!p.thumbnail_url || p.thumbnail_url === p.original_url) && !p.medium_url
        )

        const totalCount = galleryPhotosToMigrate.length + photosToMigrate.length
        sendEvent({
          type: 'summary',
          galleryPhotosTotal: allGalleryPhotos?.length || 0,
          galleryPhotosToMigrate: galleryPhotosToMigrate.length,
          photosTotal: allPhotos?.length || 0,
          photosToMigrate: photosToMigrate.length,
          totalToMigrate: totalCount,
          dryRun,
        })

        if (dryRun || totalCount === 0) {
          sendEvent({ type: 'complete', message: dryRun ? 'Dry run complete' : 'No photos need migration', processed: 0, failed: 0 })
          return // controller.close() handled in finally
        }

        // ─── 2. Process gallery_photos ──────────────────────────────
        let processed = 0
        let failed = 0
        const galleriesUpdated = new Set<string>()

        sendEvent({ type: 'status', message: `Processing ${galleryPhotosToMigrate.length} gallery_photos...` })

        // Process in batches of 3 (controls Sharp concurrency without p-limit)
        for (let i = 0; i < galleryPhotosToMigrate.length; i += 3) {
          const batch = galleryPhotosToMigrate.slice(i, i + 3)

          await Promise.all(batch.map(async (photo) => {
            try {
              const { basePath, filename } = parseStoragePath(photo.photo_url)
              if (!basePath || !filename) {
                sendEvent({ type: 'skip', id: photo.id, reason: 'Could not parse storage path' })
                failed++
                return
              }

              // Download original
              const imageBuffer = await downloadFromStorage(supabase, 'photos', `${basePath}/original/${filename}`)
              if (!imageBuffer) {
                sendEvent({ type: 'skip', id: photo.id, reason: 'Failed to download original' })
                failed++
                return
              }

              // Generate and store thumbnails
              const result = await processAndStoreThumbnails(
                imageBuffer,
                supabase,
                'photos',
                basePath,
                filename,
              )

              if (!result) {
                sendEvent({ type: 'skip', id: photo.id, reason: 'Thumbnail generation failed' })
                failed++
                return
              }

              // Update DB row
              const { error: updateError } = await supabase
                .from('gallery_photos')
                .update({
                  thumbnail_url: result.thumbnailUrl,
                  medium_url: result.mediumUrl,
                })
                .eq('id', photo.id)

              if (updateError) {
                sendEvent({ type: 'skip', id: photo.id, reason: `DB update failed: ${updateError.message}` })
                failed++
                return
              }

              processed++
              galleriesUpdated.add(photo.gallery_id)
              sendEvent({ type: 'progress', processed, failed, total: totalCount, table: 'gallery_photos', id: photo.id })
            } catch (err) {
              failed++
              sendEvent({ type: 'skip', id: photo.id, reason: err instanceof Error ? err.message : String(err) })
            }
          }))

        }

        // ─── 3. Process photos table ────────────────────────────────
        sendEvent({ type: 'status', message: `Processing ${photosToMigrate.length} photos...` })

        for (let i = 0; i < photosToMigrate.length; i += 3) {
          const batch = photosToMigrate.slice(i, i + 3)

          await Promise.all(batch.map(async (photo) => {
            try {
              const { basePath, filename } = parseStoragePath(photo.original_url)
              if (!basePath || !filename) {
                sendEvent({ type: 'skip', id: photo.id, reason: 'Could not parse storage path' })
                failed++
                return
              }

              // Download original — desktop uploads don't have /original/ subdirectory
              const storagePath = photo.original_url.includes('/original/')
                ? `${basePath}/original/${filename}`
                : `${basePath}/${filename}`
              const imageBuffer = await downloadFromStorage(supabase, 'photos', storagePath)
              if (!imageBuffer) {
                sendEvent({ type: 'skip', id: photo.id, reason: 'Failed to download original' })
                failed++
                return
              }

              // Generate and store thumbnails
              const result = await processAndStoreThumbnails(
                imageBuffer,
                supabase,
                'photos',
                basePath,
                filename,
              )

              if (!result) {
                sendEvent({ type: 'skip', id: photo.id, reason: 'Thumbnail generation failed' })
                failed++
                return
              }

              // Update DB row
              const { error: updateError } = await supabase
                .from('photos')
                .update({
                  thumbnail_url: result.thumbnailUrl,
                  medium_url: result.mediumUrl,
                })
                .eq('id', photo.id)

              if (updateError) {
                sendEvent({ type: 'skip', id: photo.id, reason: `DB update failed: ${updateError.message}` })
                failed++
                return
              }

              processed++
              galleriesUpdated.add(photo.gallery_id)
              sendEvent({ type: 'progress', processed, failed, total: totalCount, table: 'photos', id: photo.id })
            } catch (err) {
              failed++
              sendEvent({ type: 'skip', id: photo.id, reason: err instanceof Error ? err.message : String(err) })
            }
          }))

        }

        // ─── 4. Update gallery cover images ─────────────────────────
        sendEvent({ type: 'status', message: `Updating cover images for ${galleriesUpdated.size} galleries...` })

        for (const galleryId of galleriesUpdated) {
          try {
            // Get first photo's thumbnail from gallery_photos
            const { data: firstGP } = await supabase
              .from('gallery_photos')
              .select('thumbnail_url')
              .eq('gallery_id', galleryId)
              .order('created_at', { ascending: true })
              .limit(1)
              .single()

            let coverUrl = firstGP?.thumbnail_url

            // If no gallery_photos, try photos table
            if (!coverUrl) {
              const { data: firstP } = await supabase
                .from('photos')
                .select('thumbnail_url')
                .eq('gallery_id', galleryId)
                .order('created_at', { ascending: true })
                .limit(1)
                .single()

              coverUrl = firstP?.thumbnail_url
            }

            if (coverUrl) {
              await supabase
                .from('photo_galleries')
                .update({ cover_image_url: coverUrl })
                .eq('id', galleryId)
            }
          } catch (err) {
            logger.error(`[Migration] Failed to update cover for gallery ${galleryId}:`, err)
          }
        }

        // ─── 5. Done ────────────────────────────────────────────────
        sendEvent({
          type: 'complete',
          message: `Migration complete. ${processed} processed, ${failed} failed.`,
          processed,
          failed,
          galleriesUpdated: galleriesUpdated.size,
        })
      } catch (err) {
        sendEvent({ type: 'error', message: err instanceof Error ? err.message : String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

/**
 * Parse a Supabase Storage public URL to extract basePath and filename.
 *
 * Web uploads:    .../photos/{userId}/{galleryId}/original/{filename}
 *   → basePath: "{userId}/{galleryId}", filename: "{filename}"
 *
 * Desktop uploads: .../photos/galleries/{galleryId}/{timestamp}-{random}-{filename}
 *   → basePath: "galleries/{galleryId}", filename: "{timestamp}-{random}-{filename}"
 */
function parseStoragePath(publicUrl: string): { basePath: string; filename: string } {
  try {
    const url = new URL(publicUrl)
    const pathAfterBucket = url.pathname.split('/photos/')[1]
    if (!pathAfterBucket) return { basePath: '', filename: '' }

    const segments = pathAfterBucket.split('/')

    // Web upload pattern: {userId}/{galleryId}/original/{filename}
    if (segments.includes('original')) {
      const origIndex = segments.indexOf('original')
      const basePath = segments.slice(0, origIndex).join('/')
      const filename = segments.slice(origIndex + 1).join('/')
      return { basePath, filename }
    }

    // Desktop upload pattern: galleries/{galleryId}/{filename}
    // or any other pattern: everything before last segment is basePath
    const filename = segments[segments.length - 1]
    const basePath = segments.slice(0, -1).join('/')
    return { basePath, filename }
  } catch {
    return { basePath: '', filename: '' }
  }
}

/**
 * Download a file from Supabase Storage and return it as a Buffer.
 */
async function downloadFromStorage(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  bucket: string,
  path: string,
): Promise<Buffer | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error || !data) {
      logger.error(`[Migration] Download failed for ${bucket}/${path}:`, error)
      return null
    }

    // data is a Blob — convert to Buffer
    const arrayBuffer = await data.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    logger.error(`[Migration] Download exception for ${bucket}/${path}:`, err)
    return null
  }
}
