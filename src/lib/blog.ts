import matter from 'gray-matter'
import readingTime from 'reading-time'
import { createServiceRoleClient } from '@/lib/supabase-server'

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  updatedDate?: string
  author: string
  tags: string[]
  ogImage?: string
  readingTime: string
  content: string
}

interface BlogPostRow {
  id: string
  slug: string
  title: string
  description: string
  content: string
  author: string
  tags: string[]
  og_image: string | null
  reading_time: string
  status: string
  published_at: string | null
  updated_at: string
  created_at: string
}

function rowToPost(row: BlogPostRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    date: row.published_at || row.created_at,
    updatedDate: row.updated_at !== row.created_at ? row.updated_at : undefined,
    author: row.author,
    tags: row.tags || [],
    ogImage: row.og_image || undefined,
    readingTime: row.reading_time,
    content: row.content,
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('[blog] Failed to fetch posts:', error)
    return []
  }

  return (data as BlogPostRow[]).map(rowToPost)
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    return null
  }

  return rowToPost(data as BlogPostRow)
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts()
  const tagSet = new Set<string>()
  posts.forEach(post => post.tags.forEach(tag => tagSet.add(tag)))
  return Array.from(tagSet).sort()
}

/**
 * Parse a raw markdown file (with frontmatter) into fields ready for DB insert.
 * Used by the upload API route. Pure function — no DB calls.
 */
export function parseMarkdownUpload(rawContent: string, filename: string): {
  slug: string
  title: string
  description: string
  author: string
  tags: string[]
  ogImage?: string
  readingTime: string
  content: string
  publishedAt?: string
} {
  const { data, content } = matter(rawContent)

  if (!data.title || !data.description || !data.author) {
    throw new Error(
      'Missing required frontmatter fields. Required: title, description, author'
    )
  }

  // Derive slug from filename (strip .md / .mdx extension)
  const slug = filename.replace(/\.(mdx?|md)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const stats = readingTime(content)

  return {
    slug,
    title: data.title,
    description: data.description,
    author: data.author,
    tags: data.tags || [],
    ogImage: data.ogImage || undefined,
    readingTime: stats.text,
    content,
    publishedAt: data.date || undefined,
  }
}
