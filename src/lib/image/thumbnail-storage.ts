import { SupabaseClient } from '@supabase/supabase-js'

export interface StoredThumbnails {
  thumbnailUrl: string
  mediumUrl: string
}

/**
 * Upload pre-generated thumbnail and medium images to Supabase Storage.
 *
 * Path structure mirrors original with size subdirs:
 *   Original: {basePath}/original/{filename}.jpg  (or galleries/{id}/{filename})
 *   Thumb:    {basePath}/thumb/{filename}.jpg
 *   Medium:   {basePath}/medium/{filename}.jpg
 *
 * Uses upsert: true so migration job is idempotent --
 * re-running on already-processed photos safely overwrites thumbnails.
 */
export async function storeThumbnails(
  supabase: SupabaseClient,
  bucket: string,
  basePath: string,
  filename: string,
  thumbnailBuffer: Buffer,
  mediumBuffer: Buffer,
): Promise<StoredThumbnails> {
  const thumbPath = `${basePath}/thumb/${filename}`
  const mediumPath = `${basePath}/medium/${filename}`

  const [thumbResult, mediumResult] = await Promise.all([
    supabase.storage
      .from(bucket)
      .upload(thumbPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      }),
    supabase.storage
      .from(bucket)
      .upload(mediumPath, mediumBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      }),
  ])

  if (thumbResult.error) throw new Error(`Thumbnail upload failed: ${thumbResult.error.message}`)
  if (mediumResult.error) throw new Error(`Medium upload failed: ${mediumResult.error.message}`)

  const { data: { publicUrl: thumbnailUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(thumbPath)

  const { data: { publicUrl: mediumUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(mediumPath)

  return { thumbnailUrl, mediumUrl }
}
