'use client'

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
import { useToast } from '@/components/ui/use-toast'
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
  const { toast } = useToast()
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
        toast({ title: 'Failed to load blog posts', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to load blog posts', variant: 'destructive' })
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

    // Client-side file size validation
    if (file.size > 512_000) {
      toast({ title: 'File too large (max 500KB)', variant: 'destructive' })
      e.target.value = ''
      return
    }

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
        toast({ title: `"${json.data.title}" uploaded successfully` })
        fetchPosts()
      } else {
        toast({ title: json.error || 'Upload failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
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
        toast({ title: `Post ${newStatus === 'published' ? 'published' : 'unpublished'}` })
        fetchPosts()
      } else {
        toast({ title: json.error || 'Failed to update post', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to update post', variant: 'destructive' })
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
        toast({ title: 'Post deleted' })
        fetchPosts()
      } else {
        toast({ title: json.error || 'Failed to delete post', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to delete post', variant: 'destructive' })
    } finally {
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    }
  }

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Management</h1>
          <p className="text-muted-foreground">Upload, publish, and manage blog posts</p>
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
              <div className="rounded-md border">
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
                        <TableCell className="font-medium max-w-[300px] truncate">
                          {post.title}
                        </TableCell>
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
                        <TableCell className="text-right space-x-1">
                          {post.status === 'published' && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="View post"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(post)}
                            aria-label={post.status === 'published' ? 'Unpublish' : 'Publish'}
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
                            aria-label="Delete post"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
