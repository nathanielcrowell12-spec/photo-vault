import { describe, it, expect, vi } from 'vitest'

// Mock the Supabase client so tests don't need real env vars
vi.mock('@/lib/supabase-server', () => {
  const mockData = [
    {
      id: '1',
      slug: 'madison-photographers-add-50-100',
      title: 'How Madison Photographers Can Add $50–$100 to Every Shoot',
      description: 'Learn how photographers can add revenue.',
      content: 'Article content here with enough words to calculate reading time. '.repeat(50),
      author: 'Nate Crowell',
      tags: ['madison-photography', 'pricing', 'recurring-revenue', 'wedding-photography'],
      og_image: null,
      reading_time: '8 min read',
      status: 'published',
      published_at: '2026-03-14T00:00:00Z',
      updated_at: '2026-03-14T00:00:00Z',
      created_at: '2026-03-14T00:00:00Z',
    },
  ]

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    single: vi.fn().mockResolvedValue({ data: mockData[0], error: null }),
  }

  return {
    createServiceRoleClient: vi.fn(() => ({
      from: vi.fn(() => mockQueryBuilder),
    })),
  }
})

import { getAllPosts, getPostBySlug, getAllTags } from '../blog'

describe('blog loader (Supabase-backed)', () => {
  describe('getAllPosts', () => {
    it('returns an array of posts', async () => {
      const posts = await getAllPosts()
      expect(Array.isArray(posts)).toBe(true)
      expect(posts.length).toBeGreaterThan(0)
    })

    it('each post has all required fields', async () => {
      const posts = await getAllPosts()
      for (const post of posts) {
        expect(post.slug).toBeTruthy()
        expect(post.title).toBeTruthy()
        expect(post.description).toBeTruthy()
        expect(post.date).toBeTruthy()
        expect(post.author).toBeTruthy()
        expect(Array.isArray(post.tags)).toBe(true)
        expect(post.readingTime).toBeTruthy()
        expect(post.content).toBeTruthy()
      }
    })
  })

  describe('getPostBySlug', () => {
    it('returns a post for a valid slug', async () => {
      const post = await getPostBySlug('madison-photographers-add-50-100')
      expect(post).not.toBeNull()
      expect(post!.title).toContain('Madison Photographers')
    })

    it('returns correct reading time', async () => {
      const post = await getPostBySlug('madison-photographers-add-50-100')
      expect(post).not.toBeNull()
      expect(post!.readingTime).toMatch(/\d+ min read/)
    })
  })

  describe('getAllTags', () => {
    it('returns an array of unique sorted tags', async () => {
      const tags = await getAllTags()
      expect(Array.isArray(tags)).toBe(true)
      expect(tags.length).toBeGreaterThan(0)
      // Check uniqueness
      expect(new Set(tags).size).toBe(tags.length)
      // Check sorted
      const sorted = [...tags].sort()
      expect(tags).toEqual(sorted)
    })
  })
})
