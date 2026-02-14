import { describe, it, expect, vi, beforeEach } from 'vitest'
import { storeThumbnails } from '../thumbnail-storage'

// Mock Supabase client
function createMockSupabase(overrides: {
  uploadError?: { message: string } | null
  thumbUploadError?: { message: string } | null
  mediumUploadError?: { message: string } | null
} = {}) {
  const mockUpload = vi.fn()
  const mockGetPublicUrl = vi.fn()

  // Track which path is being uploaded to for per-path error control
  let uploadCallIndex = 0
  mockUpload.mockImplementation(() => {
    const callIdx = uploadCallIndex++
    // First call is thumb, second is medium
    const error = callIdx === 0
      ? (overrides.thumbUploadError ?? overrides.uploadError ?? null)
      : (overrides.mediumUploadError ?? overrides.uploadError ?? null)
    return Promise.resolve({
      data: error ? null : { path: 'some/path' },
      error,
    })
  })

  mockGetPublicUrl.mockImplementation((path: string) => ({
    data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/photos/${path}` },
  }))

  const mockFrom = vi.fn().mockReturnValue({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  })

  return {
    client: { storage: { from: mockFrom } } as any,
    mockFrom,
    mockUpload,
    mockGetPublicUrl,
  }
}

describe('storeThumbnails', () => {
  const thumbBuffer = Buffer.from('fake-thumbnail-data')
  const mediumBuffer = Buffer.from('fake-medium-data')

  describe('successful uploads', () => {
    it('uploads to correct paths: {base}/thumb/{file} and {base}/medium/{file}', async () => {
      const { client, mockUpload } = createMockSupabase()

      await storeThumbnails(
        client,
        'photos',
        'user123/gallery456',
        'photo.jpg',
        thumbBuffer,
        mediumBuffer,
      )

      // Both uploads should be called
      expect(mockUpload).toHaveBeenCalledTimes(2)

      // First call: thumbnail
      expect(mockUpload).toHaveBeenCalledWith(
        'user123/gallery456/thumb/photo.jpg',
        thumbBuffer,
        expect.objectContaining({ contentType: 'image/jpeg', upsert: true }),
      )

      // Second call: medium
      expect(mockUpload).toHaveBeenCalledWith(
        'user123/gallery456/medium/photo.jpg',
        mediumBuffer,
        expect.objectContaining({ contentType: 'image/jpeg', upsert: true }),
      )
    })

    it('returns correct public URLs', async () => {
      const { client } = createMockSupabase()

      const result = await storeThumbnails(
        client,
        'photos',
        'user123/gallery456',
        'photo.jpg',
        thumbBuffer,
        mediumBuffer,
      )

      expect(result.thumbnailUrl).toContain('user123/gallery456/thumb/photo.jpg')
      expect(result.mediumUrl).toContain('user123/gallery456/medium/photo.jpg')
    })

    it('uses the correct bucket name', async () => {
      const { client, mockFrom } = createMockSupabase()

      await storeThumbnails(
        client,
        'my-bucket',
        'base/path',
        'file.jpg',
        thumbBuffer,
        mediumBuffer,
      )

      // from() should be called with the bucket name
      expect(mockFrom).toHaveBeenCalledWith('my-bucket')
    })

    it('uses upsert: true for idempotent uploads', async () => {
      const { client, mockUpload } = createMockSupabase()

      await storeThumbnails(
        client,
        'photos',
        'base',
        'file.jpg',
        thumbBuffer,
        mediumBuffer,
      )

      // Both calls should use upsert: true
      for (const call of mockUpload.mock.calls) {
        expect(call[2]).toEqual(expect.objectContaining({ upsert: true }))
      }
    })
  })

  describe('upload failures', () => {
    it('throws with clear message when thumbnail upload fails', async () => {
      const { client } = createMockSupabase({
        thumbUploadError: { message: 'Bucket not found' },
      })

      await expect(
        storeThumbnails(client, 'photos', 'base', 'file.jpg', thumbBuffer, mediumBuffer)
      ).rejects.toThrow('Thumbnail upload failed: Bucket not found')
    })

    it('throws with clear message when medium upload fails', async () => {
      const { client } = createMockSupabase({
        mediumUploadError: { message: 'Storage full' },
      })

      await expect(
        storeThumbnails(client, 'photos', 'base', 'file.jpg', thumbBuffer, mediumBuffer)
      ).rejects.toThrow('Medium upload failed: Storage full')
    })
  })
})
