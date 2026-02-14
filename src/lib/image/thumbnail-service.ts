import sharp from 'sharp'
import { Readable } from 'stream'

export interface ThumbnailResult {
  thumbnailBuffer: Buffer
  mediumBuffer: Buffer
  metadata: {
    width: number
    height: number
    format: string
  }
}

export const THUMBNAIL_CONFIG = {
  thumbnail: { width: 400, quality: 80 },
  medium: { width: 1200, quality: 85, progressive: true },
} as const

/**
 * Generate thumbnail and medium-sized images from an input source.
 *
 * Accepts either a Buffer (preferred, used by both live routes) or a
 * Readable stream (for future use). Streams are converted to Buffer
 * internally before processing because Sharp's clone-based dual-output
 * pipeline requires random access to the source data -- calling
 * .metadata() on a stream consumes it, making subsequent .clone() fail.
 *
 * Pipeline: input -> buffer -> sharp(buffer).rotate() -> clone() x2
 */
export async function generateThumbnails(
  input: Buffer | Readable
): Promise<ThumbnailResult> {
  // Convert stream to buffer if needed (fixes QA Critic C1: metadata() consumes streams)
  const inputBuffer = Buffer.isBuffer(input)
    ? input
    : await streamToBuffer(input as Readable)

  // Create Sharp instance from buffer, auto-orient based on EXIF
  const baseImage = sharp(inputBuffer).rotate()

  // Get metadata from the oriented image
  const metadata = await baseImage.metadata()

  // Clone for dual output (safe because input is a buffer, not a consumed stream)
  const [thumbnailBuffer, mediumBuffer] = await Promise.all([
    baseImage.clone()
      .resize(THUMBNAIL_CONFIG.thumbnail.width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: THUMBNAIL_CONFIG.thumbnail.quality,
        progressive: false, // Small files (~30KB) don't benefit from progressive
      })
      .toBuffer(),

    baseImage.clone()
      .resize(THUMBNAIL_CONFIG.medium.width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: THUMBNAIL_CONFIG.medium.quality,
        progressive: true, // Larger images (~200KB) benefit from progressive loading
      })
      .toBuffer(),
  ])

  return {
    thumbnailBuffer,
    mediumBuffer,
    metadata: {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: metadata.format ?? 'unknown',
    },
  }
}

/**
 * Collect a Readable stream into a single Buffer.
 * Used internally to convert stream inputs before Sharp processing.
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
