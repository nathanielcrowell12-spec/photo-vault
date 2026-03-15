import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

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

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog')

function parseMdxFile(filePath: string): BlogPost | null {
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)

  // Validate required frontmatter fields
  if (!data.title || !data.description || !data.date || !data.author) {
    console.error(`[blog] Missing required frontmatter in ${filePath}. Required: title, description, date, author`)
    return null
  }

  const slug = path.basename(filePath, '.mdx')
  const stats = readingTime(content)

  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    updatedDate: data.updatedDate || undefined,
    author: data.author,
    tags: data.tags || [],
    ogImage: data.ogImage || undefined,
    readingTime: stats.text,
    content,
  }
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return []
  }

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))

  const posts = files
    .map(file => parseMdxFile(path.join(BLOG_DIR, file)))
    .filter((post): post is BlogPost => post !== null)

  // Sort by date descending (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  return parseMdxFile(filePath)
}

export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tagSet = new Set<string>()
  posts.forEach(post => post.tags.forEach(tag => tagSet.add(tag)))
  return Array.from(tagSet).sort()
}
