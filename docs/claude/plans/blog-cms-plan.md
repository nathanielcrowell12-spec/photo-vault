# Blog CMS Plan: Supabase-Backed Blog with Admin Upload

**Date:** 2026-03-15
**Author:** Claude (Supabase + Next.js Expert)
**Status:** Draft — awaiting critique

## Summary

Migrate PhotoVault's file-based MDX blog to a Supabase-backed system where the admin uploads `.md` files through the admin dashboard. Blog posts are stored in a `blog_posts` table with full frontmatter fields, rendered dynamically with ISR (on-demand revalidation), and managed via a new admin blog page — eliminating the need to redeploy for new content.

---

## 1. Database Schema

### Migration SQL

```sql
-- Migration: Create blog_posts table
-- Name: 20260315_create_blog_posts

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  og_image TEXT,
  reading_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX idx_blog_posts_status ON blog_posts (status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts (published_at DESC);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN (tags);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "blog_posts_public_read"
  ON blog_posts
  FOR SELECT
  USING (status = 'published');

-- Admins can do everything
CREATE POLICY "blog_posts_admin_all"
  ON blog_posts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (SELECT auth.uid())
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (SELECT auth.uid())
      AND user_type = 'admin'
    )
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();
```

### Column Rationale

| Column | Why |
|--------|-----|
| `slug` | URL path segment, UNIQUE constraint, matches current `/blog/[slug]` routes |
| `content` | Raw markdown body (frontmatter stripped) |
| `reading_time` | Pre-calculated at upload time (e.g., "8 min read") |
| `status` | `draft` or `published` — only published posts are public |
| `published_at` | Separate from `created_at` — controls sort order and display date |
| `tags` | PostgreSQL text array — supports GIN index for future tag filtering |
| `og_image` | Optional Open Graph image URL |

---

## 2. Implementation Steps (Ordered)

1. **Apply Supabase migration** — create `blog_posts` table with RLS
2. **Create API route** `POST /api/admin/blog/upload` — accepts `.md` file upload, parses frontmatter, validates, inserts into DB
3. **Create API route** `GET /api/admin/blog` — lists all posts (any status) for admin
4. **Create API route** `PATCH /api/admin/blog/[id]` — update post status (publish/unpublish)
5. **Create API route** `DELETE /api/admin/blog/[id]` — delete a post
6. **Update `src/lib/blog.ts`** — replace filesystem reads with Supabase queries
7. **Update `src/app/blog/[slug]/page.tsx`** — change `dynamicParams` to `true`, remove `generateStaticParams`, add revalidation
8. **Update `src/app/blog/page.tsx`** — make async, fetch from Supabase
9. **Create admin page** `src/app/admin/blog/page.tsx` — file upload + post list + publish/unpublish/delete
10. **Migrate existing article** — insert `madison-photographers-add-50-100.mdx` content into DB
11. **Remove old content directory** — delete `src/content/blog/` after migration verified
12. **Test end-to-end** — upload, publish, view, unpublish, delete

---

## 3. File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/app/api/admin/blog/upload/route.ts` | POST: parse .md upload, insert into blog_posts |
| `src/app/api/admin/blog/route.ts` | GET: list all posts for admin |
| `src/app/api/admin/blog/[id]/route.ts` | PATCH: update status; DELETE: remove post |
| `src/app/admin/blog/page.tsx` | Admin blog management UI |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/blog.ts` | Replace fs reads with Supabase queries |
| `src/app/blog/page.tsx` | Make async, minor adjustments for dynamic data |
| `src/app/blog/[slug]/page.tsx` | `dynamicParams = true`, remove `generateStaticParams`, add `revalidate` |

### Deleted Files

| File | When |
|------|------|
| `src/content/blog/madison-photographers-add-50-100.mdx` | After migration verified |

---

## 4. Code Examples

### 4.1 Updated `src/lib/blog.ts`

```typescript
import { createServiceRoleClient } from '@/lib/supabase-server'
import readingTime from 'reading-time'
import matter from 'gray-matter'

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
 * Used by the upload API route.
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
```

### 4.2 API Route: Upload (`src/app/api/admin/blog/upload/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { parseMarkdownUpload } from '@/lib/blog'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const publishImmediately = formData.get('publish') === 'true'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.match(/\.(md|mdx)$/i)) {
      return NextResponse.json(
        { success: false, error: 'File must be a .md or .mdx file' },
        { status: 400 }
      )
    }

    // 500KB limit for markdown files
    if (file.size > 512_000) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 500KB)' },
        { status: 400 }
      )
    }

    const rawContent = await file.text()
    const parsed = parseMarkdownUpload(rawContent, file.name)

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', parsed.slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: `A post with slug "${parsed.slug}" already exists` },
        { status: 409 }
      )
    }

    // Insert
    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        slug: parsed.slug,
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        author: parsed.author,
        tags: parsed.tags,
        og_image: parsed.ogImage || null,
        reading_time: parsed.readingTime,
        status: publishImmediately ? 'published' : 'draft',
        published_at: publishImmediately
          ? (parsed.publishedAt || new Date().toISOString())
          : null,
      })
      .select()
      .single()

    if (insertError) {
      logger.error('[BlogUpload] Insert failed:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to save blog post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: post }, { status: 201 })
  } catch (error) {
    logger.error('[BlogUpload] Unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
```

### 4.3 API Route: List + Status + Delete

**`src/app/api/admin/blog/route.ts`** (GET — list all posts for admin):

```typescript
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Use service role to bypass RLS (admin needs to see drafts too)
    const { createServiceRoleClient } = await import('@/lib/supabase-server')
    const adminClient = createServiceRoleClient()

    const { data, error } = await adminClient
      .from('blog_posts')
      .select('id, slug, title, author, status, tags, reading_time, published_at, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('[AdminBlog] List error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('[AdminBlog] Unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

**`src/app/api/admin/blog/[id]/route.ts`** (PATCH + DELETE):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

interface Props {
  params: Promise<{ id: string }>
}

async function verifyAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  return profile?.user_type === 'admin' ? user : null
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['draft', 'published'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be "draft" or "published"' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    const updateData: Record<string, unknown> = { status }
    if (status === 'published') {
      // Only set published_at if not already set
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('published_at')
        .eq('id', id)
        .single()

      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('[AdminBlog] Update error:', error)
      return NextResponse.json({ success: false, error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('[AdminBlog] PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('[AdminBlog] Delete error:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete post' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[AdminBlog] DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

### 4.4 Admin Blog Page (`src/app/admin/blog/page.tsx`)

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import AccessGuard from '@/components/AccessGuard'

interface BlogPostAdmin {
  id: string
  slug: string
  title: string
  author: string
  status: 'draft' | 'published'
  tags: string[]
  reading_time: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export default function AdminBlogPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPostAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [publishOnUpload, setPublishOnUpload] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<BlogPostAdmin | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blog')
      const json = await res.json()
      if (json.success) {
        setPosts(json.data)
      } else {
        toast.error('Failed to load blog posts')
      }
    } catch {
      toast.error('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('publish', publishOnUpload ? 'true' : 'false')

      const res = await fetch('/api/admin/blog/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()
      if (json.success) {
        toast.success(`"${json.data.title}" uploaded successfully`)
        fetchPosts()
      } else {
        toast.error(json.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      // Reset the file input
      e.target.value = ''
    }
  }

  const toggleStatus = async (post: BlogPostAdmin) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success(`Post ${newStatus === 'published' ? 'published' : 'unpublished'}`)
        fetchPosts()
      } else {
        toast.error(json.error || 'Failed to update post')
      }
    } catch {
      toast.error('Failed to update post')
    }
  }

  const handleDelete = async () => {
    if (!postToDelete) return

    try {
      const res = await fetch(`/api/admin/blog/${postToDelete.id}`, {
        method: 'DELETE',
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Post deleted')
        fetchPosts()
      } else {
        toast.error(json.error || 'Failed to delete post')
      }
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    }
  }

  return (
    <AccessGuard requiredRole="admin">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Blog Management</h1>
            <p className="text-muted-foreground">Upload, publish, and manage blog posts</p>
          </div>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Article
            </CardTitle>
            <CardDescription>
              Upload a .md file with frontmatter (title, description, author, tags, date)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="md-upload" className="sr-only">
                  Choose markdown file
                </Label>
                <Input
                  id="md-upload"
                  type="file"
                  accept=".md,.mdx"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="publish-immediately"
                  checked={publishOnUpload}
                  onCheckedChange={(checked) => setPublishOnUpload(checked === true)}
                />
                <Label htmlFor="publish-immediately" className="text-sm">
                  Publish immediately
                </Label>
              </div>
            </div>
            {uploading && (
              <p className="text-sm text-muted-foreground">Uploading and parsing...</p>
            )}
          </CardContent>
        </Card>

        {/* Posts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Posts ({posts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="text-muted-foreground">No blog posts yet. Upload one above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reading Time</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{post.reading_time}</TableCell>
                      <TableCell>
                        {new Date(post.published_at || post.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {post.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(post)}
                          title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {post.status === 'published' ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPostToDelete(post)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Blog Post
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{postToDelete?.title}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AccessGuard>
  )
}
```

### 4.5 Updated Blog Index Page (`src/app/blog/page.tsx`)

Key change: `getAllPosts()` is now async. The page itself is already a server component.

```typescript
// Change the function call from sync to async:
export default async function BlogIndexPage() {
  const posts = await getAllPosts()
  // ... rest stays the same
}
```

### 4.6 Updated Blog Post Page (`src/app/blog/[slug]/page.tsx`)

Key changes:

```typescript
// REMOVE these lines:
// export async function generateStaticParams() { ... }
// export const dynamicParams = false

// ADD revalidation (ISR — revalidate every 60 seconds):
export const revalidate = 60

// UPDATE generateMetadata and the page component to use async getPostBySlug:
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)  // now async
  // ... rest same
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)  // now async
  // ... rest same
}
```

**Why `revalidate = 60` instead of `revalidate = 0`:** Blog posts don't change every second. 60-second ISR gives us near-instant updates while keeping the Vercel edge cache warm for SEO crawlers and fast page loads. The admin can wait 60 seconds for a published post to appear — or we could add on-demand revalidation later.

---

## 5. Data Migration

### Migrate the existing MDX article

Option A (preferred): Upload via the new admin UI after building it — this tests the entire flow.

Option B (SQL fallback): Run this after the migration is applied:

```sql
INSERT INTO blog_posts (slug, title, description, content, author, tags, reading_time, status, published_at)
VALUES (
  'madison-photographers-add-50-100',
  'How Madison Photographers Can Add $50–$100 to Every Shoot Without Clients Feeling Upsold',
  'Learn how photographers in Madison, WI can add $50–$100 to every wedding and family session by upgrading their gallery delivery experience.',
  E'If you''re shooting weddings in Madison right now...', -- full content here
  'Nate Crowell',
  ARRAY['madison-photography', 'pricing', 'recurring-revenue', 'wedding-photography'],
  '8 min read',
  'published',
  '2026-03-14T00:00:00Z'
);
```

**Recommended approach:** Use Option A. Build the system first, then upload the existing `.mdx` file through the admin dashboard as the first real test. This validates the entire pipeline.

---

## 6. Caching Strategy

| Layer | Approach |
|-------|----------|
| **Blog index** (`/blog`) | `revalidate = 60` — ISR with 60-second TTL |
| **Blog post** (`/blog/[slug]`) | `revalidate = 60` — ISR with 60-second TTL |
| **Admin pages** | No caching (client-side `'use client'` fetching) |
| **API routes** | No caching (always fresh for admin operations) |

### Why not on-demand revalidation?

On-demand revalidation (`revalidatePath`) requires calling it from the API route after a mutation. This is a fine optimization for Phase 2, but for Phase 1 the 60-second ISR is simpler and sufficient. The admin creates content infrequently (a few times per month), so a 60-second delay is imperceptible.

### Future enhancement (optional)

Add `revalidatePath('/blog')` and `revalidatePath('/blog/[slug]')` calls to the PATCH and upload API routes for instant cache invalidation. This is a 2-line addition per route.

---

## 7. Phase 2 Sketch: Photographer Submissions

### Additional columns for `blog_posts` table

```sql
ALTER TABLE blog_posts
  ADD COLUMN submitted_by UUID REFERENCES auth.users(id),
  ADD COLUMN photographer_profile_url TEXT,
  ADD COLUMN review_notes TEXT,
  ADD COLUMN reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN reviewed_at TIMESTAMPTZ;
```

### Additional RLS policy

```sql
-- Photographers can insert drafts and view their own submissions
CREATE POLICY "blog_posts_photographer_submit"
  ON blog_posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = (SELECT auth.uid())
      AND user_type = 'photographer'
    )
    AND status = 'draft'
    AND submitted_by = (SELECT auth.uid())
  );

CREATE POLICY "blog_posts_photographer_read_own"
  ON blog_posts
  FOR SELECT
  USING (
    submitted_by = (SELECT auth.uid())
  );
```

### Phase 2 workflow outline

1. Photographer uploads `.md` file through a photographer dashboard page
2. Post is created with `status = 'draft'`, `submitted_by` = photographer's user ID
3. Admin sees submissions in review queue on admin blog page
4. Admin can approve (set `status = 'published'`), reject (add `review_notes`), or request edits
5. Published article includes a byline linking to the photographer's directory profile (`photographer_profile_url`)
6. This creates a valuable SEO backlink for the photographer — incentive to write

### Not built in Phase 1

- Photographer submission UI
- Review queue / approval workflow
- Email notifications for submission status changes
- Photographer byline component with directory link

---

## 8. Testing Steps

### Manual Testing Checklist

1. **Migration:** Apply the SQL migration and verify the table exists with correct columns, indexes, and RLS policies
2. **Upload (valid):** Upload a `.md` file with complete frontmatter through admin UI — should succeed
3. **Upload (invalid):** Upload a file missing required frontmatter — should show error
4. **Upload (duplicate slug):** Upload a file with the same slug as an existing post — should show 409 error
5. **Upload (wrong format):** Try uploading a `.txt` or `.jpg` file — should be rejected
6. **Upload (too large):** Try a file > 500KB — should be rejected
7. **Draft visibility:** Upload as draft — should NOT appear on `/blog` or be accessible at `/blog/[slug]`
8. **Publish:** Toggle a draft to published — should appear on `/blog` within 60 seconds
9. **Unpublish:** Toggle a published post to draft — should disappear from `/blog` within 60 seconds
10. **Delete:** Delete a post — should be removed from admin list and blog
11. **Blog index:** Verify `/blog` shows all published posts sorted by date (newest first)
12. **Blog post:** Verify `/blog/[slug]` renders markdown correctly with MDXRemote
13. **SEO schema:** Verify structured data (Article, Breadcrumb) is still present on blog pages
14. **404:** Visit `/blog/nonexistent-slug` — should return 404
15. **Auth guard:** Try accessing admin blog API routes without auth — should return 401/403
16. **Existing article:** Migrate the existing MDX article and verify it renders identically

### Automated Tests (Phase 1 minimum)

- Unit test for `parseMarkdownUpload()` — valid frontmatter, missing fields, slug generation
- API route test for upload — valid file, missing file, duplicate slug, non-admin user

---

## 9. Gotchas

1. **`getAllPosts` and `getPostBySlug` become async** — Every call site in `blog/page.tsx` and `blog/[slug]/page.tsx` must be updated. The `generateStaticParams` and `generateMetadata` functions are already async, but the default export page components must also be async (they already are in the current code, so this is safe).

2. **`dynamicParams = false` must be removed** — If left in place, Next.js will 404 any slug not returned by `generateStaticParams`. Since we're removing `generateStaticParams`, we must remove `dynamicParams = false` too.

3. **MDXRemote still works with DB content** — `MDXRemote` accepts a `source` string, not a file path. Since we're storing the markdown body (not the file reference), this continues to work unchanged.

4. **RLS policy for public reads** — The public read policy filters on `status = 'published'`. The service role client bypasses RLS. The admin list API uses the service role client so it can see drafts. The blog frontend uses the service role client too (server-side only), but filters on published status in the query for defense in depth.

5. **Slug collision** — If someone uploads `my-post.md` and `my_post.md`, they'll generate the same slug. The UNIQUE constraint will catch this, and the API returns a 409. Good enough for Phase 1 with a single admin user.

6. **`gray-matter` stays as a dependency** — We still need it to parse frontmatter from uploaded files. `reading-time` also stays.

7. **No image upload** — This plan handles markdown text only. Images referenced in posts must be hosted elsewhere (e.g., Supabase Storage, external URLs). Image upload is a Phase 2+ concern.

8. **Admin auth pattern inconsistency** — The existing admin pages use the deprecated `supabase` import from `@/lib/supabase` (client-side). The new API routes use `createServerSupabaseClient` from `@/lib/supabase-server`. This is the correct pattern going forward. The admin page itself is `'use client'` and fetches via API routes, consistent with other admin pages like `/admin/users`.

9. **`createServerSupabaseClient` vs `createServiceRoleClient`** — The upload route uses `createServerSupabaseClient` (cookie-based, RLS-aware) for auth verification, then the RLS `admin_all` policy allows the insert. The list route needs `createServiceRoleClient` to see drafts because the RLS public read policy only shows published posts. Alternative: add an RLS policy for admin SELECT on all statuses, then use the cookie-based client everywhere. Either works; the plan uses the service role approach for simplicity.

10. **Next.js 15 params are async** — Already handled in the existing code (`await params`), but worth calling out.

---

## Existing Code to Reference

| What | Path |
|------|------|
| Current blog lib | `src/lib/blog.ts` |
| Blog index page | `src/app/blog/page.tsx` |
| Blog post page | `src/app/blog/[slug]/page.tsx` |
| Existing article | `src/content/blog/madison-photographers-add-50-100.mdx` |
| Admin users page (UI pattern) | `src/app/admin/users/page.tsx` |
| Admin users API (API pattern) | `src/app/api/admin/users/route.ts` |
| Supabase server client | `src/lib/supabase-server.ts` |
| Deprecated supabase client | `src/lib/supabase.ts` |
| Logger | `src/lib/logger.ts` |
| AccessGuard component | `src/components/AccessGuard.tsx` |
