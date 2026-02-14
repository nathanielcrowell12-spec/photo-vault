import { SupabaseClient } from '@supabase/supabase-js'
import { Readable } from 'stream'
import { generateThumbnails } from './thumbnail-service'
import { storeThumbnails, StoredThumbnails } from './thumbnail-storage'
import { logger } from '@/lib/logger'

/**
 * Combined entry point: generate thumbnails from a source and store them.
 *
 * Returns URLs for thumbnail and medium images.
 * On failure, returns null (caller should fall back to original URL).
 * This ensures thumbnail generation can never break an upload.
 */
export async function processAndStoreThumbnails(
  input: Buffer | Readable,
  supabase: SupabaseClient,
  bucket: string,
  basePath: string,
  filename: string,
): Promise<StoredThumbnails | null> {
  try {
    const { thumbnailBuffer, mediumBuffer } = await generateThumbnails(input)

    return await storeThumbnails(
      supabase,
      bucket,
      basePath,
      filename,
      thumbnailBuffer,
      mediumBuffer,
    )
  } catch (error) {
    logger.error('[Thumbnails] Failed to generate/store thumbnails:', {
      bucket,
      basePath,
      filename,
      error: error instanceof Error ? error.message : String(error),
    })
    // Non-fatal: return null, caller uses original URL as thumbnail (status quo)
    return null
  }
}
