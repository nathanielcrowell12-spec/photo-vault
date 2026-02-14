import { describe, it, expect } from 'vitest'
import {
  getTransformedImageUrl,
  IMAGE_PRESETS,
  type ImagePreset,
} from '../supabase-image-transforms'

const SUPABASE_BASE = 'https://gqmycgopitxpjkxzrnyv.supabase.co/storage/v1'
const SAMPLE_PATH = 'public/photos/gallery-123/photo-abc.jpg'
const SAMPLE_URL = `${SUPABASE_BASE}/object/${SAMPLE_PATH}`

describe('supabase-image-transforms', () => {
  describe('IMAGE_PRESETS', () => {
    it('defines thumbnail, cover, medium, and preview presets', () => {
      expect(IMAGE_PRESETS.thumbnail).toBeDefined()
      expect(IMAGE_PRESETS.cover).toBeDefined()
      expect(IMAGE_PRESETS.medium).toBeDefined()
      expect(IMAGE_PRESETS.preview).toBeDefined()
    })

    it('thumbnail preset has width=400, quality=70', () => {
      expect(IMAGE_PRESETS.thumbnail).toEqual({ width: 400, quality: 70 })
    })

    it('cover preset has width=600, quality=75', () => {
      expect(IMAGE_PRESETS.cover).toEqual({ width: 600, quality: 75 })
    })

    it('medium preset has width=1200, quality=80', () => {
      expect(IMAGE_PRESETS.medium).toEqual({ width: 1200, quality: 80 })
    })

    it('preview preset has width=200, quality=60', () => {
      expect(IMAGE_PRESETS.preview).toEqual({ width: 200, quality: 60 })
    })
  })

  describe('getTransformedImageUrl', () => {
    it('transforms a standard Supabase URL for the thumbnail preset', () => {
      const result = getTransformedImageUrl(SAMPLE_URL, 'thumbnail')
      expect(result).toBe(
        `${SUPABASE_BASE}/render/image/${SAMPLE_PATH}?width=400&quality=70&resize=contain`
      )
    })

    it('transforms a standard Supabase URL for the cover preset', () => {
      const result = getTransformedImageUrl(SAMPLE_URL, 'cover')
      expect(result).toBe(
        `${SUPABASE_BASE}/render/image/${SAMPLE_PATH}?width=600&quality=75&resize=contain`
      )
    })

    it('transforms a standard Supabase URL for the medium preset', () => {
      const result = getTransformedImageUrl(SAMPLE_URL, 'medium')
      expect(result).toBe(
        `${SUPABASE_BASE}/render/image/${SAMPLE_PATH}?width=1200&quality=80&resize=contain`
      )
    })

    it('transforms a standard Supabase URL for the preview preset', () => {
      const result = getTransformedImageUrl(SAMPLE_URL, 'preview')
      expect(result).toBe(
        `${SUPABASE_BASE}/render/image/${SAMPLE_PATH}?width=200&quality=60&resize=contain`
      )
    })

    it('returns undefined for null input', () => {
      expect(getTransformedImageUrl(null, 'thumbnail')).toBeUndefined()
    })

    it('returns undefined for undefined input', () => {
      expect(getTransformedImageUrl(undefined, 'thumbnail')).toBeUndefined()
    })

    it('returns undefined for empty string input', () => {
      expect(getTransformedImageUrl('', 'thumbnail')).toBeUndefined()
    })

    it('returns non-Supabase URL unchanged', () => {
      const externalUrl = 'https://images.unsplash.com/photo-123?w=800'
      expect(getTransformedImageUrl(externalUrl, 'thumbnail')).toBe(externalUrl)
    })

    it('returns local placeholder path unchanged', () => {
      const placeholder = '/images/placeholder-family.svg'
      expect(getTransformedImageUrl(placeholder, 'cover')).toBe(placeholder)
    })

    it('returns already-transformed URL unchanged (idempotent)', () => {
      const alreadyTransformed = `${SUPABASE_BASE}/render/image/${SAMPLE_PATH}?width=400&quality=70&resize=contain`
      expect(getTransformedImageUrl(alreadyTransformed, 'thumbnail')).toBe(alreadyTransformed)
    })

    it('returns already-transformed URL with resize param unchanged (idempotent)', () => {
      const alreadyTransformed = `${SUPABASE_BASE}/render/image/${SAMPLE_PATH}?width=400&quality=70&resize=cover`
      expect(getTransformedImageUrl(alreadyTransformed, 'thumbnail')).toBe(alreadyTransformed)
    })

    it('handles URL with existing query params by appending with &', () => {
      const urlWithParams = `${SUPABASE_BASE}/object/${SAMPLE_PATH}?token=abc123`
      const result = getTransformedImageUrl(urlWithParams, 'thumbnail')
      expect(result).toBe(
        `${SUPABASE_BASE}/render/image/${SAMPLE_PATH}?token=abc123&width=400&quality=70&resize=contain`
      )
    })

    it('handles different Supabase project URLs', () => {
      const otherProjectUrl = 'https://abcdefg.supabase.co/storage/v1/object/public/photos/test.jpg'
      const result = getTransformedImageUrl(otherProjectUrl, 'thumbnail')
      expect(result).toBe(
        'https://abcdefg.supabase.co/storage/v1/render/image/public/photos/test.jpg?width=400&quality=70&resize=contain'
      )
    })
  })
})
