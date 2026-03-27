'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  MessageSquare,
  Upload,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

// ============================================================================
// Types
// ============================================================================

interface ProofingEntry {
  id: string
  photo_id: string
  filter_selection: string | null
  client_note: string | null
  submitted_at: string | null
  photographer_acknowledged: boolean
}

interface Photo {
  id: string
  original_url: string
  thumbnail_url: string | null
  medium_url: string | null
  filename: string | null
  sort_position: number | null
}

interface Gallery {
  id: string
  gallery_name: string
  gallery_status: string
  payment_timing: string
  client_id: string
  has_proofing_changes: boolean | null
}

const FILTER_CSS: Record<string, string> = {
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(80%)',
  'brightness-up': 'brightness(1.2)',
  'contrast-up': 'contrast(1.3)',
  warmth: 'sepia(20%) saturate(1.2)',
  'cool-tone': 'hue-rotate(20deg) saturate(0.9)',
}

const FILTER_LABELS: Record<string, string> = {
  grayscale: 'Black & White',
  sepia: 'Sepia',
  'brightness-up': 'Brighten',
  'contrast-up': 'High Contrast',
  warmth: 'Warm',
  'cool-tone': 'Cool',
}

const PHOTOS_PER_PAGE = 24

// ============================================================================
// Component
// ============================================================================

export default function ProofingReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userType, loading: authLoading } = useAuth()
  const galleryId = params.id as string

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [proofingEntries, setProofingEntries] = useState<ProofingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [replacingPhotoId, setReplacingPhotoId] = useState<string | null>(null)
  const [acknowledgingPhotoId, setAcknowledgingPhotoId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceTargetPhotoId = useRef<string | null>(null)

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data: galleryData, error: galleryError } = await supabase
        .from('photo_galleries')
        .select('id, gallery_name, gallery_status, payment_timing, client_id, has_proofing_changes')
        .eq('id', galleryId)
        .eq('photographer_id', user.id)
        .single()

      if (galleryError || !galleryData) {
        setError('Gallery not found or access denied')
        return
      }

      setGallery(galleryData)

      const { data: photosData } = await supabase
        .from('photos')
        .select('id, original_url, thumbnail_url, medium_url, filename, sort_position')
        .eq('gallery_id', galleryId)
        .order('sort_position', { ascending: true, nullsFirst: false })

      setPhotos(photosData || [])

      const res = await fetch(`/api/gallery/${galleryId}/proofing`)
      if (res.ok) {
        const data = await res.json()
        setProofingEntries(data.submissions || [])
      }
    } catch (err) {
      console.error('[ProofingReview] Error:', err)
      setError('Failed to load proofing data')
    } finally {
      setLoading(false)
    }
  }, [user, galleryId])

  useEffect(() => {
    if (!authLoading && user && userType === 'photographer') {
      loadData()
    }
  }, [authLoading, user, userType, loadData])

  // ============================================================================
  // Derived State
  // ============================================================================

  const proofingMap = new Map(proofingEntries.map(e => [e.photo_id, e]))

  // Photos with actual client feedback (filter or note)
  const feedbackPhotoIds = new Set(
    proofingEntries
      .filter(e => e.filter_selection || e.client_note)
      .map(e => e.photo_id)
  )

  // Unresolved = has feedback AND not acknowledged
  const unresolvedCount = proofingEntries.filter(
    e => (e.filter_selection || e.client_note) && !e.photographer_acknowledged
  ).length

  const totalPhotos = photos.length
  const totalFeedback = feedbackPhotoIds.size

  // Pagination
  const totalPages = Math.max(1, Math.ceil(totalPhotos / PHOTOS_PER_PAGE))
  const startIdx = (currentPage - 1) * PHOTOS_PER_PAGE
  const pagePhotos = photos.slice(startIdx, startIdx + PHOTOS_PER_PAGE)

  // Zero-change detection
  const isZeroChanges = gallery?.has_proofing_changes === false

  // ============================================================================
  // Acknowledge
  // ============================================================================

  const handleAcknowledge = async (photoId: string) => {
    setAcknowledgingPhotoId(photoId)

    // Optimistic update
    setProofingEntries(prev =>
      prev.map(e =>
        e.photo_id === photoId
          ? { ...e, photographer_acknowledged: true }
          : e
      )
    )

    try {
      const res = await fetch(`/api/gallery/${galleryId}/proofing/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId }),
      })

      if (!res.ok) {
        // Rollback
        setProofingEntries(prev =>
          prev.map(e =>
            e.photo_id === photoId
              ? { ...e, photographer_acknowledged: false }
              : e
          )
        )
        const data = await res.json()
        setError(data.error || 'Failed to acknowledge')
      }
    } catch {
      // Rollback
      setProofingEntries(prev =>
        prev.map(e =>
          e.photo_id === photoId
            ? { ...e, photographer_acknowledged: false }
            : e
        )
      )
      setError('Failed to acknowledge feedback')
    } finally {
      setAcknowledgingPhotoId(null)
    }
  }

  // ============================================================================
  // Replace Photo
  // ============================================================================

  const handleReplaceClick = (photoId: string) => {
    replaceTargetPhotoId.current = photoId
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const photoId = replaceTargetPhotoId.current
    if (!file || !photoId) return

    // Reset file input so the same file can be selected again
    e.target.value = ''
    setReplacingPhotoId(photoId)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/gallery/${galleryId}/photos/${photoId}/replace`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to replace photo')
        return
      }

      const data = await res.json()

      // Update photo in state with new URLs
      setPhotos(prev =>
        prev.map(p =>
          p.id === photoId
            ? {
                ...p,
                original_url: data.photo.original_url,
                thumbnail_url: data.photo.thumbnail_url,
                medium_url: data.photo.medium_url,
                full_url: data.photo.full_url,
                filename: data.photo.filename,
              }
            : p
        )
      )

      // Also mark as acknowledged (replace auto-acknowledges)
      setProofingEntries(prev =>
        prev.map(e =>
          e.photo_id === photoId
            ? { ...e, photographer_acknowledged: true }
            : e
        )
      )
    } catch {
      setError('Failed to replace photo')
    } finally {
      setReplacingPhotoId(null)
      replaceTargetPhotoId.current = null
    }
  }

  // ============================================================================
  // Mark Revisions Complete (soft-gated)
  // ============================================================================

  const handleFinalizeClick = () => {
    if (unresolvedCount > 0) {
      setShowFinalizeDialog(true)
    } else {
      handleMarkComplete()
    }
  }

  const handleMarkComplete = async () => {
    if (!gallery) return

    setShowFinalizeDialog(false)
    setCompleting(true)
    setError('')

    try {
      let nextStatus: string
      if (gallery.payment_timing === 'after_proofing') {
        nextStatus = 'payment_pending'
      } else if (gallery.payment_timing === 'external') {
        nextStatus = 'delivered'
      } else {
        nextStatus = 'delivered'
      }

      const { error: updateError } = await supabase
        .from('photo_galleries')
        .update({ gallery_status: nextStatus })
        .eq('id', galleryId)

      if (updateError) {
        setError('Failed to update gallery status')
        return
      }

      fetch(`/api/gallery/${galleryId}/proofing/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'revisions_complete' }),
      }).catch(err => console.error('[ProofingReview] Revisions complete email error:', err))

      setCompleted(true)
      setGallery({ ...gallery, gallery_status: nextStatus })
    } catch {
      setError('Failed to complete revisions')
    } finally {
      setCompleting(false)
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !gallery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!gallery) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden file input for photo replacement */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/photographer/galleries">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Proofing Review — {gallery.gallery_name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  {/* Progress counter: X/Y format */}
                  <span className="text-sm font-medium text-foreground">
                    {unresolvedCount}/{totalPhotos}
                    <span className="text-muted-foreground ml-1">
                      {unresolvedCount === 1 ? 'photo needs attention' : 'photos need attention'}
                    </span>
                  </span>
                  {totalFeedback > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {totalFeedback} {totalFeedback === 1 ? 'photo' : 'photos'} with feedback
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={gallery.gallery_status === 'proofing_complete' ? 'default' : 'secondary'}>
                {gallery.gallery_status === 'proofing_complete' && 'Ready for Review'}
                {gallery.gallery_status === 'payment_pending' && 'Awaiting Payment'}
                {gallery.gallery_status === 'delivered' && 'Delivered'}
                {gallery.gallery_status === 'proofing' && 'Client Still Proofing'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Completion Success */}
        {completed && (
          <Alert className="mb-6">
            <Check className="h-4 w-4" />
            <AlertDescription>
              {gallery.gallery_status === 'payment_pending'
                ? 'Revisions marked complete. Your client will now see the payment screen.'
                : 'Gallery marked as delivered. Your client can now access their photos.'}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Zero-change warning banner */}
        {isZeroChanges && gallery.gallery_status === 'proofing_complete' && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-foreground">
              <span className="font-semibold">Customer made no change requests.</span>{' '}
              Please verify with your customer that they have no edits to request.
              This is unusual — proofing exists so clients can request adjustments before final delivery.
            </AlertDescription>
          </Alert>
        )}

        {/* Photo Grid — paginated */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {pagePhotos.map((photo) => {
            const entry = proofingMap.get(photo.id)
            const hasFeedback = entry && (entry.filter_selection || entry.client_note)
            const isAcknowledged = entry?.photographer_acknowledged
            const isReplacing = replacingPhotoId === photo.id
            const isAcknowledging = acknowledgingPhotoId === photo.id

            if (!hasFeedback) {
              // No feedback — just show the original thumbnail
              return (
                <div key={photo.id} className="group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={photo.thumbnail_url || photo.original_url}
                      alt={photo.filename || 'Photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )
            }

            // Has feedback — show side-by-side card spanning 2 columns
            const filterCss = entry.filter_selection ? FILTER_CSS[entry.filter_selection] : 'none'
            const filterLabel = entry.filter_selection ? FILTER_LABELS[entry.filter_selection] : null

            return (
              <Card
                key={photo.id}
                className={`col-span-2 overflow-hidden transition-all ${
                  isAcknowledged
                    ? 'border-green-500/30 bg-green-500/5 opacity-75'
                    : 'border-amber-500/30 bg-card/50'
                }`}
              >
                <CardContent className="p-0">
                  <div className="grid grid-cols-2">
                    {/* Original */}
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">Original</p>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo.medium_url || photo.thumbnail_url || photo.original_url}
                          alt={photo.filename || 'Photo'}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Client's Requested Look */}
                    <div className="p-3 bg-muted/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-xs text-muted-foreground font-medium">Client&apos;s Preference</p>
                        {filterLabel && (
                          <Badge variant="secondary" className="text-xs">{filterLabel}</Badge>
                        )}
                      </div>
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo.medium_url || photo.thumbnail_url || photo.original_url}
                          alt="Client preference"
                          className="w-full h-full object-contain"
                          style={{ filter: filterCss }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Note + Actions */}
                  <div className="px-3 pb-3 space-y-2">
                    {entry.client_note && (
                      <div className="p-2.5 bg-background rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground font-medium mb-0.5">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          Client Note:
                        </p>
                        <p className="text-sm text-foreground">&ldquo;{entry.client_note}&rdquo;</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {gallery.gallery_status === 'proofing_complete' && !completed && (
                      <div className="flex gap-2">
                        {isAcknowledged ? (
                          <Badge variant="outline" className="text-green-600 border-green-500/30">
                            <Check className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleReplaceClick(photo.id)}
                              disabled={isReplacing}
                            >
                              {isReplacing ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                                  Replace
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledge(photo.id)}
                              disabled={isAcknowledging}
                            >
                              {isAcknowledging ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Acknowledge
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="min-w-[2.5rem]"
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Mark Revisions Complete */}
        {gallery.gallery_status === 'proofing_complete' && !completed && (
          <div className="border-t border-border pt-6 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Ready to finalize?</p>
                <p className="text-sm text-muted-foreground">
                  {gallery.payment_timing === 'after_proofing'
                    ? 'This will send your client to the payment screen.'
                    : 'This will deliver the gallery to your client.'}
                </p>
              </div>
              <Button
                onClick={handleFinalizeClick}
                disabled={completing}
                variant={unresolvedCount > 0 ? 'outline' : 'default'}
              >
                {completing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Mark Revisions Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Finalize confirmation dialog (soft gate) */}
      {showFinalizeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground mb-2">
                    Unresolved feedback remaining
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You still have <span className="font-bold text-foreground">{unresolvedCount}</span> of{' '}
                    <span className="font-bold text-foreground">{totalPhotos}</span> photos with
                    unresolved client feedback. Are you sure you want to finalize the gallery?
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowFinalizeDialog(false)}
                >
                  Go Back
                </Button>
                <Button
                  variant="default"
                  onClick={handleMarkComplete}
                  disabled={completing}
                >
                  {completing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Yes, Finalize
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
