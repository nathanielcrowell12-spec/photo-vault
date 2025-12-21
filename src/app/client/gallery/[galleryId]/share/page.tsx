'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  ArrowLeft,
  Share2,
  Copy,
  Trash2,
  Plus,
  ExternalLink,
  Loader2,
  Link2,
  Eye,
  Download,
  Clock,
  Check
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface ShareLink {
  id: string
  share_token: string
  shareUrl: string
  label: string | null
  expires_at: string | null
  download_limit: number | null
  downloads_used: number
  view_count: number
  isActive: boolean
  created_at: string
  is_revoked: boolean
}

export default function ManageShareLinksPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading, userType } = useAuth()
  const { toast } = useToast()
  const galleryId = params.galleryId as string

  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [galleryName, setGalleryName] = useState<string>('')
  const [photoCount, setPhotoCount] = useState<number>(0)

  // Form state
  const [label, setLabel] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [downloadLimit, setDownloadLimit] = useState<number | null>(null) // null until gallery loaded

  const fetchShareLinks = useCallback(async () => {
    try {
      const response = await fetch(`/api/gallery/${galleryId}/share-links`)
      if (!response.ok) {
        throw new Error('Failed to fetch share links')
      }
      const data = await response.json()
      setShareLinks(data.shareLinks || [])
    } catch (error) {
      console.error('Error fetching share links:', error)
      toast({
        title: 'Error',
        description: 'Failed to load share links',
        variant: 'destructive',
      })
    } finally {
      setLoadingLinks(false)
    }
  }, [galleryId, toast])

  const fetchGalleryInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/gallery/${galleryId}`)
      if (response.ok) {
        const data = await response.json()
        setGalleryName(data.gallery?.gallery_name || 'Gallery')
        const count = data.gallery?.photo_count || 0
        setPhotoCount(count)
        // Set default download limit to 1.25x gallery size (ensures full gallery download)
        const defaultLimit = Math.ceil(count * 1.25)
        setDownloadLimit(defaultLimit > 0 ? defaultLimit : 10)
      }
    } catch (error) {
      console.error('Error fetching gallery info:', error)
    }
  }, [galleryId])

  useEffect(() => {
    if (!authLoading && user) {
      fetchShareLinks()
      fetchGalleryInfo()
    }
  }, [authLoading, user, fetchShareLinks, fetchGalleryInfo])

  // Redirect if not client
  useEffect(() => {
    if (!authLoading && userType && userType !== 'client') {
      router.push('/dashboard')
    }
  }, [authLoading, userType, router])

  const createShareLink = async () => {
    setCreating(true)
    try {
      const response = await fetch(`/api/gallery/${galleryId}/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label || null,
          expiresInDays,
          downloadLimit,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link')
      }

      toast({
        title: 'Share link created!',
        description: 'Your share link is ready to use.',
      })

      // Reset form
      setLabel('')
      setExpiresInDays(30)
      setDownloadLimit(5)

      // Refresh list
      fetchShareLinks()
    } catch (error) {
      console.error('Error creating share link:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create share link',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(linkId)
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard',
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  const revokeShareLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to revoke this share link? Anyone with the link will immediately lose access.')) {
      return
    }

    try {
      const response = await fetch(`/api/gallery/${galleryId}/share-links/${linkId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke share link')
      }

      toast({
        title: 'Share link revoked',
        description: 'The link is no longer active.',
      })

      fetchShareLinks()
    } catch (error) {
      console.error('Error revoking share link:', error)
      toast({
        title: 'Error',
        description: 'Failed to revoke share link',
        variant: 'destructive',
      })
    }
  }

  if (authLoading || loadingLinks) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Sign in required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to manage share links.</p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeLinks = shareLinks.filter(link => link.isActive && !link.is_revoked)
  const expiredLinks = shareLinks.filter(link =>
    !link.is_revoked && link.expires_at && new Date(link.expires_at) < new Date()
  )
  const revokedLinks = shareLinks.filter(link => link.is_revoked)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Share Links</h1>
              <p className="text-sm text-muted-foreground">
                {galleryName}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Create New Link */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Share Link
            </CardTitle>
            <CardDescription>
              Share your gallery with friends and family. They can view photos without needing an account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="label">Label (optional)</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Wedding Guests, Family"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Help you remember who you shared with
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Expires In: {expiresInDays} days</Label>
                <Slider
                  value={[expiresInDays]}
                  onValueChange={(value: number[]) => setExpiresInDays(value[0])}
                  min={1}
                  max={365}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 day</span>
                  <span>1 year</span>
                </div>
              </div>

              <div>
                <Label>
                  Photo Downloads: {downloadLimit === null ? 'Loading...' : downloadLimit === 0 ? 'View Only' : `${downloadLimit} photos`}
                </Label>
                <Slider
                  value={[downloadLimit ?? 0]}
                  onValueChange={(value: number[]) => setDownloadLimit(value[0])}
                  min={0}
                  max={Math.max(Math.ceil(photoCount * 3), 50)}
                  step={1}
                  className="mt-2"
                  disabled={downloadLimit === null}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>View only</span>
                  <span>{Math.max(Math.ceil(photoCount * 3), 50)} max</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This gallery has {photoCount} photos. Default is {Math.ceil(photoCount * 1.25)} downloads
                  (125% of gallery size) to ensure recipients can download the full gallery.
                </p>
              </div>
            </div>

            <Button onClick={createShareLink} disabled={creating || downloadLimit === null} className="w-full sm:w-auto">
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Share Link
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Active Links */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Active Share Links ({activeLinks.length})
          </h2>

          {activeLinks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active share links yet.</p>
                <p className="text-sm">Create one above to share your gallery!</p>
              </CardContent>
            </Card>
          ) : (
            activeLinks.map(link => (
              <Card key={link.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {link.label && (
                          <Badge variant="outline">{link.label}</Badge>
                        )}
                        {link.download_limit === 0 ? (
                          <Badge variant="secondary">
                            <Eye className="h-3 w-3 mr-1" />
                            View Only
                          </Badge>
                        ) : link.download_limit === 100 || link.download_limit === null ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Download className="h-3 w-3 mr-1" />
                            Unlimited
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Download className="h-3 w-3 mr-1" />
                            {link.download_limit - link.downloads_used} left
                          </Badge>
                        )}
                        {link.expires_at && (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Expires {new Date(link.expires_at).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>

                      <div className="bg-muted rounded-lg p-3 mb-3 flex items-center gap-2">
                        <code className="text-sm flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {link.shareUrl}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(link.shareUrl, link.id)}
                        >
                          {copiedId === link.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={link.shareUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>

                      <div className="text-sm text-muted-foreground space-x-4">
                        <span>
                          <Eye className="h-3 w-3 inline mr-1" />
                          {link.view_count} views
                        </span>
                        {link.download_limit !== null && link.download_limit !== 0 && (
                          <span>
                            <Download className="h-3 w-3 inline mr-1" />
                            {link.downloads_used} downloads
                          </span>
                        )}
                        <span>
                          Created {new Date(link.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeShareLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Revoked Links */}
        {revokedLinks.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground">Revoked Links</h2>
            {revokedLinks.map(link => (
              <Card key={link.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Revoked</Badge>
                      {link.label && (
                        <span className="text-sm text-muted-foreground">
                          {link.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {link.view_count} views before revocation
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Expired Links */}
        {expiredLinks.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold text-muted-foreground flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Expired Links ({expiredLinks.length})
            </h2>
            {expiredLinks.map(link => (
              <Card key={link.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Expired</Badge>
                      {link.label && (
                        <span className="text-sm text-muted-foreground">
                          {link.label}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Expired {new Date(link.expires_at!).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {link.view_count} views • {link.downloads_used} downloads
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">About Share Links</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Share links let anyone view your gallery without an account</li>
              <li>• Create as many share links as you need</li>
              <li>• Download limits apply to total individual photo downloads via the link</li>
              <li>• Links automatically expire based on your setting</li>
              <li>• Revoke a link anytime to immediately remove access</li>
            </ul>
          </CardContent>
        </Card>

        {/* Legal Disclaimers */}
        <Card className="mt-4 border-amber-200 bg-amber-50/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 text-amber-800">Important Legal Notice</h3>
            <ul className="text-sm text-amber-700 space-y-2">
              <li>
                <strong>Copyright:</strong> By sharing this gallery, you confirm that you have the right
                to share these photos. The photographer retains all copyrights unless otherwise agreed.
              </li>
              <li>
                <strong>Personal Use:</strong> Photos shared via these links are intended for personal,
                non-commercial use only unless you have a commercial license.
              </li>
              <li>
                <strong>Privacy:</strong> Please respect the privacy of individuals in these photos.
                Do not share photos publicly without consent from all identifiable persons.
              </li>
              <li>
                <strong>Redistribution:</strong> Recipients should not redistribute these photos
                without your permission. You are responsible for who you share with.
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
