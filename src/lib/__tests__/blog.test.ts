import { describe, it, expect } from 'vitest'
import { getAllPosts, getPostBySlug, getAllTags } from '../blog'

describe('blog loader', () => {
  describe('getAllPosts', () => {
    it('returns an array of posts', () => {
      const posts = getAllPosts()
      expect(Array.isArray(posts)).toBe(true)
      expect(posts.length).toBeGreaterThan(0)
    })

    it('returns posts sorted by date descending', () => {
      const posts = getAllPosts()
      for (let i = 1; i < posts.length; i++) {
        const prev = new Date(posts[i - 1].date).getTime()
        const curr = new Date(posts[i].date).getTime()
        expect(prev).toBeGreaterThanOrEqual(curr)
      }
    })

    it('each post has all required fields', () => {
      const posts = getAllPosts()
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

    it('slug matches filename without .mdx extension', () => {
      const posts = getAllPosts()
      for (const post of posts) {
        expect(post.slug).not.toContain('.mdx')
        expect(post.slug).not.toContain('/')
      }
    })
  })

  describe('getPostBySlug', () => {
    it('returns a post for a valid slug', () => {
      const post = getPostBySlug('madison-photographers-add-50-100')
      expect(post).not.toBeNull()
      expect(post!.title).toContain('Madison Photographers')
    })

    it('returns null for an invalid slug', () => {
      const post = getPostBySlug('this-post-does-not-exist-ever')
      expect(post).toBeNull()
    })

    it('returns correct reading time', () => {
      const post = getPostBySlug('madison-photographers-add-50-100')
      expect(post).not.toBeNull()
      // Article is ~2000 words, should be 8-10 min read
      expect(post!.readingTime).toMatch(/\d+ min read/)
    })
  })

  describe('getAllTags', () => {
    it('returns an array of unique tags', () => {
      const tags = getAllTags()
      expect(Array.isArray(tags)).toBe(true)
      expect(tags.length).toBeGreaterThan(0)
      // Check uniqueness
      expect(new Set(tags).size).toBe(tags.length)
    })

    it('tags are sorted alphabetically', () => {
      const tags = getAllTags()
      const sorted = [...tags].sort()
      expect(tags).toEqual(sorted)
    })
  })
})
