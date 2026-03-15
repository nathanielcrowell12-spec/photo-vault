import { describe, it, expect, vi } from 'vitest'

// Mock supabase-server to avoid env var checks during import
vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: vi.fn(() => ({ from: vi.fn() })),
}))

import { parseMarkdownUpload } from '../blog'

describe('parseMarkdownUpload', () => {
  const validMarkdown = `---
title: "Test Article Title"
description: "A test description for the article"
author: "Test Author"
tags: ["test", "vitest"]
date: "2026-03-15"
---

This is the body content of the article.

## A heading

Some more content here.
`

  it('parses valid markdown with frontmatter', () => {
    const result = parseMarkdownUpload(validMarkdown, 'test-article.md')
    expect(result.title).toBe('Test Article Title')
    expect(result.description).toBe('A test description for the article')
    expect(result.author).toBe('Test Author')
    expect(result.tags).toEqual(['test', 'vitest'])
    expect(result.publishedAt).toBe('2026-03-15')
    expect(result.content).toContain('This is the body content')
    expect(result.content).not.toContain('title:')
    expect(result.readingTime).toMatch(/\d+ min read/)
  })

  it('derives slug from filename', () => {
    const result = parseMarkdownUpload(validMarkdown, 'my-cool-article.md')
    expect(result.slug).toBe('my-cool-article')
  })

  it('handles .mdx extension', () => {
    const result = parseMarkdownUpload(validMarkdown, 'article-name.mdx')
    expect(result.slug).toBe('article-name')
  })

  it('sanitizes slug from filename with special characters', () => {
    const result = parseMarkdownUpload(validMarkdown, 'My Article $50.md')
    expect(result.slug).toBe('my-article-50')
    expect(result.slug).not.toContain(' ')
    expect(result.slug).not.toContain('$')
  })

  it('removes leading/trailing hyphens from slug', () => {
    const result = parseMarkdownUpload(validMarkdown, '-bad-name-.md')
    expect(result.slug).toBe('bad-name')
  })

  it('collapses consecutive hyphens in slug', () => {
    const result = parseMarkdownUpload(validMarkdown, 'a---b---c.md')
    expect(result.slug).toBe('a-b-c')
  })

  it('throws when title is missing', () => {
    const noTitle = `---
description: "Has description"
author: "Author"
---

Content here.
`
    expect(() => parseMarkdownUpload(noTitle, 'test.md')).toThrow('Missing required frontmatter')
  })

  it('throws when description is missing', () => {
    const noDesc = `---
title: "Has title"
author: "Author"
---

Content here.
`
    expect(() => parseMarkdownUpload(noDesc, 'test.md')).toThrow('Missing required frontmatter')
  })

  it('throws when author is missing', () => {
    const noAuthor = `---
title: "Has title"
description: "Has description"
---

Content here.
`
    expect(() => parseMarkdownUpload(noAuthor, 'test.md')).toThrow('Missing required frontmatter')
  })

  it('handles optional ogImage field', () => {
    const withOg = `---
title: "Test"
description: "Test"
author: "Test"
ogImage: "/images/og.jpg"
---

Content.
`
    const result = parseMarkdownUpload(withOg, 'test.md')
    expect(result.ogImage).toBe('/images/og.jpg')
  })

  it('returns undefined ogImage when not provided', () => {
    const result = parseMarkdownUpload(validMarkdown, 'test.md')
    expect(result.ogImage).toBeUndefined()
  })

  it('handles empty tags gracefully', () => {
    const noTags = `---
title: "Test"
description: "Test"
author: "Test"
---

Content.
`
    const result = parseMarkdownUpload(noTags, 'test.md')
    expect(result.tags).toEqual([])
  })

  it('returns undefined publishedAt when date not in frontmatter', () => {
    const noDate = `---
title: "Test"
description: "Test"
author: "Test"
---

Content.
`
    const result = parseMarkdownUpload(noDate, 'test.md')
    expect(result.publishedAt).toBeUndefined()
  })
})
