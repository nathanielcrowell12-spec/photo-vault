import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'
import sharp from 'sharp'
import { generateThumbnails, THUMBNAIL_CONFIG } from '../thumbnail-service'

const FIXTURES = join(__dirname, 'fixtures')

function loadFixture(name: string): Buffer {
  return readFileSync(join(FIXTURES, name))
}

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

describe('generateThumbnails', () => {
  describe('thumbnail output', () => {
    it('generates thumbnail at <= 400px width from a larger image', async () => {
      const input = loadFixture('test-800x600.jpg')
      const result = await generateThumbnails(input)

      const thumbMeta = await sharp(result.thumbnailBuffer).metadata()
      expect(thumbMeta.width).toBeLessThanOrEqual(THUMBNAIL_CONFIG.thumbnail.width)
      expect(thumbMeta.format).toBe('jpeg')
    })

    it('generates thumbnail that preserves aspect ratio', async () => {
      const input = loadFixture('test-800x600.jpg')
      const result = await generateThumbnails(input)

      const thumbMeta = await sharp(result.thumbnailBuffer).metadata()
      // Original is 800x600 (4:3). Thumbnail at 400px wide should be 400x300.
      expect(thumbMeta.width).toBe(400)
      expect(thumbMeta.height).toBe(300)
    })

    it('does not enlarge small images (withoutEnlargement)', async () => {
      const input = loadFixture('test-200x150.jpg')
      const result = await generateThumbnails(input)

      const thumbMeta = await sharp(result.thumbnailBuffer).metadata()
      // 200px is smaller than 400px thumbnail width — should stay at 200px
      expect(thumbMeta.width).toBe(200)
      expect(thumbMeta.height).toBe(150)
    })
  })

  describe('medium output', () => {
    it('generates medium at <= 1200px width from a larger image', async () => {
      const input = loadFixture('test-2000x3000.jpg')
      const result = await generateThumbnails(input)

      const medMeta = await sharp(result.mediumBuffer).metadata()
      expect(medMeta.width).toBeLessThanOrEqual(THUMBNAIL_CONFIG.medium.width)
      expect(medMeta.format).toBe('jpeg')
    })

    it('generates medium that preserves aspect ratio for portrait images', async () => {
      const input = loadFixture('test-2000x3000.jpg')
      const result = await generateThumbnails(input)

      const medMeta = await sharp(result.mediumBuffer).metadata()
      // Portrait 2000x3000 -> resize(1200, null) constrains width only
      // Width: 1200, Height: 1200 * (3000/2000) = 1800
      expect(medMeta.width).toBe(1200)
      expect(medMeta.height).toBe(1800)
    })

    it('does not enlarge small images for medium size', async () => {
      const input = loadFixture('test-200x150.jpg')
      const result = await generateThumbnails(input)

      const medMeta = await sharp(result.mediumBuffer).metadata()
      // 200x150 is smaller than 1200px — should stay at 200x150
      expect(medMeta.width).toBe(200)
      expect(medMeta.height).toBe(150)
    })

    it('generates progressive JPEG for medium', async () => {
      const input = loadFixture('test-800x600.jpg')
      const result = await generateThumbnails(input)

      // Progressive JPEGs have multiple SOS (Start of Scan) markers (0xFF 0xDA)
      // Count occurrences of the SOS marker in the buffer
      let sosCount = 0
      for (let i = 0; i < result.mediumBuffer.length - 1; i++) {
        if (result.mediumBuffer[i] === 0xFF && result.mediumBuffer[i + 1] === 0xDA) {
          sosCount++
        }
      }
      // Progressive JPEGs have multiple SOS markers (typically 3+), baseline has exactly 1
      expect(sosCount).toBeGreaterThan(1)
    })
  })

  describe('format handling', () => {
    it('handles PNG input and converts to JPEG', async () => {
      const input = loadFixture('test-600x400.png')
      const result = await generateThumbnails(input)

      const thumbMeta = await sharp(result.thumbnailBuffer).metadata()
      expect(thumbMeta.format).toBe('jpeg')

      const medMeta = await sharp(result.mediumBuffer).metadata()
      expect(medMeta.format).toBe('jpeg')
    })

    it('rejects non-image input with an error', async () => {
      const textBuffer = Buffer.from('This is not an image file')

      await expect(generateThumbnails(textBuffer)).rejects.toThrow()
    })

    it('rejects zero-byte input with an error', async () => {
      const emptyBuffer = Buffer.alloc(0)

      await expect(generateThumbnails(emptyBuffer)).rejects.toThrow()
    })
  })

  describe('stream input', () => {
    it('accepts a Readable stream and produces same results as Buffer', async () => {
      const buffer = loadFixture('test-800x600.jpg')
      const stream = bufferToStream(buffer)

      const bufferResult = await generateThumbnails(buffer)
      const streamResult = await generateThumbnails(stream)

      // Both should produce thumbnails of the same dimensions
      const bufThumbMeta = await sharp(bufferResult.thumbnailBuffer).metadata()
      const strThumbMeta = await sharp(streamResult.thumbnailBuffer).metadata()

      expect(strThumbMeta.width).toBe(bufThumbMeta.width)
      expect(strThumbMeta.height).toBe(bufThumbMeta.height)
    })
  })

  describe('metadata', () => {
    it('returns correct width and height in metadata', async () => {
      const input = loadFixture('test-800x600.jpg')
      const result = await generateThumbnails(input)

      expect(result.metadata.width).toBe(800)
      expect(result.metadata.height).toBe(600)
    })

    it('returns format in metadata', async () => {
      const input = loadFixture('test-800x600.jpg')
      const result = await generateThumbnails(input)

      expect(result.metadata.format).toBe('jpeg')
    })

    it('returns format as png for PNG input', async () => {
      const input = loadFixture('test-600x400.png')
      const result = await generateThumbnails(input)

      // Metadata reflects input format
      expect(result.metadata.format).toBe('png')
    })
  })
})

describe('THUMBNAIL_CONFIG', () => {
  it('exports thumbnail width of 400', () => {
    expect(THUMBNAIL_CONFIG.thumbnail.width).toBe(400)
  })

  it('exports medium width of 1200', () => {
    expect(THUMBNAIL_CONFIG.medium.width).toBe(1200)
  })
})
