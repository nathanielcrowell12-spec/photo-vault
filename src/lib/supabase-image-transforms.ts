// IMPORTANT: As of 2026-02, thumbnail_url === original_url in the database.
// This function is applied at render time to ALL image URLs regardless of column.
// If the DB is ever migrated to store actual thumbnails, revisit this.
//
// Supabase Storage (Pro plan) provides on-the-fly image transforms via the
// /render/image/ endpoint. Transforms are cached on the global CDN.
// See: https://supabase.com/docs/guides/storage/serving/image-transformations

export type ImagePreset = 'thumbnail' | 'cover' | 'medium' | 'preview'

interface PresetConfig {
  width: number
  quality: number
  // resize=contain is REQUIRED — Supabase defaults to resize=cover which crops
  // images unpredictably when only width is specified. With resize=contain,
  // Supabase scales proportionally within the given width without cropping.
  // CSS object-cover / object-contain on <img> handles fitting to containers.
}

export const IMAGE_PRESETS: Record<ImagePreset, PresetConfig> = {
  thumbnail: { width: 400, quality: 70 },
  cover: { width: 600, quality: 75 },
  medium: { width: 1200, quality: 80 },
  preview: { width: 200, quality: 60 },
}

// Matches any Supabase Storage URL containing /storage/v1/object/
const SUPABASE_STORAGE_PATTERN = /\.supabase\.co\/storage\/v1\/object\//

/**
 * Rewrites a Supabase Storage URL to use the /render/image/ transform endpoint.
 *
 * Guards:
 * - null/undefined/empty → returns undefined
 * - Non-Supabase URL → returns unchanged
 * - Already-transformed URL (contains /render/image/) → returns unchanged
 *
 * @param url - The image URL (from photo_url, thumbnail_url, or cover_image_url)
 * @param preset - Which size preset to apply
 * @returns Transformed URL, original URL if not Supabase, or undefined if falsy
 */
export function getTransformedImageUrl(
  url: string | null | undefined,
  preset: ImagePreset
): string | undefined {
  if (!url) return undefined

  // Not a Supabase Storage URL — return unchanged
  if (!SUPABASE_STORAGE_PATTERN.test(url)) return url

  // Already transformed — return unchanged (idempotent)
  if (url.includes('/render/image/')) return url

  const config = IMAGE_PRESETS[preset]
  const params = `width=${config.width}&quality=${config.quality}&resize=contain`

  // Replace /object/ with /render/image/
  const transformedBase = url.replace('/storage/v1/object/', '/storage/v1/render/image/')

  // Append params: use & if URL already has query params, ? otherwise
  const separator = transformedBase.includes('?') ? '&' : '?'
  return `${transformedBase}${separator}${params}`
}
