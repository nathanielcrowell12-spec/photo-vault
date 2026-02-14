import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies BEFORE importing the module under test
vi.mock('../thumbnail-service', () => ({
  generateThumbnails: vi.fn(),
}))

vi.mock('../thumbnail-storage', () => ({
  storeThumbnails: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

import { processAndStoreThumbnails } from '../process-and-store-thumbnails'
import { generateThumbnails } from '../thumbnail-service'
import { storeThumbnails } from '../thumbnail-storage'
import { logger } from '@/lib/logger'

const mockGenerateThumbnails = vi.mocked(generateThumbnails)
const mockStoreThumbnails = vi.mocked(storeThumbnails)
const mockLoggerError = vi.mocked(logger.error)

describe('processAndStoreThumbnails', () => {
  const fakeBuffer = Buffer.from('fake-image-data')
  const fakeSupabase = {} as any
  const fakeThumbnailResult = {
    thumbnailBuffer: Buffer.from('thumb'),
    mediumBuffer: Buffer.from('medium'),
    metadata: { width: 800, height: 600, format: 'jpeg' },
  }
  const fakeStoredUrls = {
    thumbnailUrl: 'https://test.supabase.co/storage/v1/object/public/photos/base/thumb/file.jpg',
    mediumUrl: 'https://test.supabase.co/storage/v1/object/public/photos/base/medium/file.jpg',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateThumbnails.mockResolvedValue(fakeThumbnailResult)
    mockStoreThumbnails.mockResolvedValue(fakeStoredUrls)
  })

  describe('happy path', () => {
    it('returns thumbnailUrl and mediumUrl on success', async () => {
      const result = await processAndStoreThumbnails(
        fakeBuffer,
        fakeSupabase,
        'photos',
        'user/gallery',
        'photo.jpg',
      )

      expect(result).toEqual(fakeStoredUrls)
    })

    it('passes input buffer to generateThumbnails', async () => {
      await processAndStoreThumbnails(
        fakeBuffer,
        fakeSupabase,
        'photos',
        'base',
        'file.jpg',
      )

      expect(mockGenerateThumbnails).toHaveBeenCalledWith(fakeBuffer)
    })

    it('passes generated buffers to storeThumbnails', async () => {
      await processAndStoreThumbnails(
        fakeBuffer,
        fakeSupabase,
        'photos',
        'base',
        'file.jpg',
      )

      expect(mockStoreThumbnails).toHaveBeenCalledWith(
        fakeSupabase,
        'photos',
        'base',
        'file.jpg',
        fakeThumbnailResult.thumbnailBuffer,
        fakeThumbnailResult.mediumBuffer,
      )
    })
  })

  describe('failure handling', () => {
    it('returns null when thumbnail generation fails', async () => {
      mockGenerateThumbnails.mockRejectedValue(new Error('Sharp crashed'))

      const result = await processAndStoreThumbnails(
        fakeBuffer,
        fakeSupabase,
        'photos',
        'base',
        'file.jpg',
      )

      expect(result).toBeNull()
    })

    it('returns null when storage upload fails', async () => {
      mockStoreThumbnails.mockRejectedValue(new Error('Bucket not found'))

      const result = await processAndStoreThumbnails(
        fakeBuffer,
        fakeSupabase,
        'photos',
        'base',
        'file.jpg',
      )

      expect(result).toBeNull()
    })

    it('logs error via logger.error on generation failure', async () => {
      mockGenerateThumbnails.mockRejectedValue(new Error('Sharp crashed'))

      await processAndStoreThumbnails(
        fakeBuffer,
        fakeSupabase,
        'photos',
        'base/path',
        'file.jpg',
      )

      expect(mockLoggerError).toHaveBeenCalledWith(
        '[Thumbnails] Failed to generate/store thumbnails:',
        expect.objectContaining({
          bucket: 'photos',
          basePath: 'base/path',
          filename: 'file.jpg',
          error: 'Sharp crashed',
        }),
      )
    })

    it('logs error via logger.error on storage failure', async () => {
      mockStoreThumbnails.mockRejectedValue(new Error('Storage full'))

      await processAndStoreThumbnails(
        fakeBuffer,
        fakeSupabase,
        'photos',
        'base',
        'file.jpg',
      )

      expect(mockLoggerError).toHaveBeenCalledWith(
        '[Thumbnails] Failed to generate/store thumbnails:',
        expect.objectContaining({
          error: 'Storage full',
        }),
      )
    })

    it('does not call storeThumbnails when generation fails', async () => {
      mockGenerateThumbnails.mockRejectedValue(new Error('Sharp crashed'))

      await processAndStoreThumbnails(
        fakeBuffer,
        fakeSupabase,
        'photos',
        'base',
        'file.jpg',
      )

      expect(mockStoreThumbnails).not.toHaveBeenCalled()
    })
  })
})
