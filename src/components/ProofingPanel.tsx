'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface Photo {
  id: string
  photo_url: string
  thumbnail_url?: string
  medium_url?: string
  original_filename?: string
}

interface ProofingSelection {
  photo_id: string
  filter_selection: string | null
  client_note: string | null
}

interface ProofingSubmission {
  id: string
  photo_id: string
  filter_selection: string | null
  client_note: string | null
  submitted_at: string | null
}

interface ProofingPanelProps {
  galleryId: string
  galleryName: string
  photos: Photo[]
  proofingDeadline?: string | null
  isSubmitted?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const FILTERS = [
  { id: null, label: 'Original', css: 'none' },
  { id: 'grayscale', label: 'Black & White', css: 'grayscale(100%)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(80%)' },
  { id: 'brightness-up', label: 'Brighten', css: 'brightness(1.2)' },
  { id: 'warmth', label: 'Warm', css: 'sepia(20%) saturate(1.2)' },
  { id: 'cool-tone', label: 'Cool', css: 'hue-rotate(20deg) saturate(0.9)' },
  { id: 'contrast-up', label: 'High Contrast', css: 'contrast(1.3)' },
] as const

const MAX_NOTE_LENGTH = 500
const DEBOUNCE_MS = 2000

// ============================================================================
// Component
// ============================================================================

export default function ProofingPanel({
  galleryId,
  galleryName,
  photos,
  proofingDeadline,
  isSubmitted: initialIsSubmitted = false,
}: ProofingPanelProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [selections, setSelections] = useState<Map<string, ProofingSelection>>(new Map())
  const [isSubmitted, setIsSubmitted] = useState(initialIsSubmitted)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showZeroChangeDialog, setShowZeroChangeDialog] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentPhoto = photos[currentPhotoIndex]
  const currentSelection = currentPhoto ? selections.get(currentPhoto.id) : null

  // ============================================================================
  // Load existing proofing data
  // ============================================================================

  useEffect(() => {
    async function loadExisting() {
      try {
        const res = await fetch(`/api/gallery/${galleryId}/proofing`)
        if (!res.ok) return

        const data = await res.json()
        if (data.submissions && data.submissions.length > 0) {
          const map = new Map<string, ProofingSelection>()
          for (const sub of data.submissions as ProofingSubmission[]) {
            map.set(sub.photo_id, {
              photo_id: sub.photo_id,
              filter_selection: sub.filter_selection,
              client_note: sub.client_note,
            })
          }
          setSelections(map)
          if (data.is_submitted) {
            setIsSubmitted(true)
          }
        }
      } catch (err) {
        console.error('[Proofing] Error loading existing data:', err)
      } finally {
        setLoadingExisting(false)
      }
    }

    loadExisting()
  }, [galleryId])

  // ============================================================================
  // Auto-save (debounced)
  // ============================================================================

  const saveSelection = useCallback(async (photoId: string, selection: ProofingSelection) => {
    if (isSubmitted) return

    setSaving(true)
    try {
      const res = await fetch(`/api/gallery/${galleryId}/proofing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_id: photoId,
          filter_selection: selection.filter_selection,
          client_note: selection.client_note,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        console.error('[Proofing] Save error:', data.error)
      }
    } catch (err) {
      console.error('[Proofing] Save error:', err)
    } finally {
      setSaving(false)
    }
  }, [galleryId, isSubmitted])

  const debouncedSave = useCallback((photoId: string, selection: ProofingSelection) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveSelection(photoId, selection), DEBOUNCE_MS)
  }, [saveSelection])

  // ============================================================================
  // Selection Handlers
  // ============================================================================

  const updateFilter = (filterId: string | null) => {
    if (!currentPhoto || isSubmitted) return

    const existing = selections.get(currentPhoto.id)
    const updated: ProofingSelection = {
      photo_id: currentPhoto.id,
      filter_selection: filterId,
      client_note: existing?.client_note ?? null,
    }

    setSelections(new Map(selections).set(currentPhoto.id, updated))
    debouncedSave(currentPhoto.id, updated)
  }

  const updateNote = (note: string) => {
    if (!currentPhoto || isSubmitted) return
    if (note.length > MAX_NOTE_LENGTH) return

    const existing = selections.get(currentPhoto.id)
    const updated: ProofingSelection = {
      photo_id: currentPhoto.id,
      filter_selection: existing?.filter_selection ?? null,
      client_note: note || null,
    }

    setSelections(new Map(selections).set(currentPhoto.id, updated))
    debouncedSave(currentPhoto.id, updated)
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  const goToPhoto = (index: number) => {
    if (index >= 0 && index < photos.length) {
      setCurrentPhotoIndex(index)
    }
  }

  // ============================================================================
  // Zero-change detection
  // ============================================================================

  const hasAnyChanges = useCallback(() => {
    for (const sel of selections.values()) {
      if (sel.filter_selection !== null || (sel.client_note !== null && sel.client_note !== '')) {
        return true
      }
    }
    return false
  }, [selections])

  const handleSubmitClick = () => {
    if (reviewedCount === 0) return
    if (!hasAnyChanges()) {
      setShowZeroChangeDialog(true)
    } else {
      setShowConfirmDialog(true)
    }
  }

  const handleZeroChangeConfirm = () => {
    setShowZeroChangeDialog(false)
    setShowConfirmDialog(true)
  }

  // ============================================================================
  // Submit
  // ============================================================================

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    try {
      // Flush any pending saves first
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }

      // Save current photo if it has unsaved changes
      if (currentPhoto && selections.has(currentPhoto.id)) {
        await saveSelection(currentPhoto.id, selections.get(currentPhoto.id)!)
      }

      const res = await fetch(`/api/gallery/${galleryId}/proofing/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to submit proofing')
        return
      }

      setIsSubmitted(true)
      setShowConfirmDialog(false)
    } catch (err) {
      setError('Failed to submit proofing. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ============================================================================
  // Render: Loading
  // ============================================================================

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ============================================================================
  // Render: Submitted (read-only)
  // ============================================================================

  if (isSubmitted) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Alert className="mb-6">
          <Check className="h-4 w-4" />
          <AlertDescription>
            <strong>Proofing submitted!</strong> Your photographer has received your preferences.
            They&apos;ll review your selections and prepare the final gallery.
          </AlertDescription>
        </Alert>

        <h2 className="text-lg font-semibold text-foreground mb-4">Your Selections</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => {
            const sel = selections.get(photo.id)
            const filter = FILTERS.find(f => f.id === sel?.filter_selection) || FILTERS[0]

            return (
              <div key={photo.id} className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                  <img
                    src={photo.thumbnail_url || photo.photo_url}
                    alt={photo.original_filename || 'Photo'}
                    className="w-full h-full object-cover"
                    style={{ filter: filter.css }}
                  />
                  {sel?.filter_selection && (
                    <Badge className="absolute bottom-2 left-2 text-xs" variant="secondary">
                      {filter.label}
                    </Badge>
                  )}
                </div>
                {sel?.client_note && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    &ldquo;{sel.client_note}&rdquo;
                  </p>
                )}
                {!sel && (
                  <p className="text-xs text-muted-foreground italic">Approved as-is</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ============================================================================
  // Render: Active Proofing
  // ============================================================================

  const currentFilter = FILTERS.find(f => f.id === (currentSelection?.filter_selection ?? null)) || FILTERS[0]
  const reviewedCount = selections.size
  const totalPhotos = photos.length

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{galleryName} — Proofing</h2>
          <p className="text-sm text-muted-foreground">
            Review each photo. Select a filter preference or leave notes for your photographer.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {proofingDeadline && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Due {new Date(proofingDeadline).toLocaleDateString()}
            </Badge>
          )}
          {saving && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </Badge>
          )}
          <Badge variant="secondary">
            {reviewedCount}/{totalPhotos} reviewed
          </Badge>
        </div>
      </div>

      {/* Photo Navigation Thumbnails */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-thin">
        {photos.map((photo, index) => {
          const hasFeedback = selections.has(photo.id)
          return (
            <button
              key={photo.id}
              onClick={() => goToPhoto(index)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors ${
                index === currentPhotoIndex
                  ? 'border-primary'
                  : hasFeedback
                    ? 'border-green-500/50'
                    : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={photo.thumbnail_url || photo.photo_url}
                alt=""
                className="w-full h-full object-cover"
              />
              {hasFeedback && (
                <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="h-2 w-2 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Main Proofing Area */}
      {currentPhoto && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Original */}
          <div>
            <p className="text-sm text-muted-foreground mb-2 font-medium">Original</p>
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              <img
                src={currentPhoto.medium_url || currentPhoto.photo_url}
                alt={currentPhoto.original_filename || 'Original'}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Right: Filter Preview + Controls */}
          <div>
            <p className="text-sm text-muted-foreground mb-2 font-medium">
              Preview — {currentFilter.label}
            </p>
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-4">
              <img
                src={currentPhoto.medium_url || currentPhoto.photo_url}
                alt="Filter preview"
                className="w-full h-full object-contain"
                style={{ filter: currentFilter.css }}
              />
            </div>

            {/* Filter Selection */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Filter Preference</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id ?? 'original'}
                    onClick={() => updateFilter(filter.id)}
                    className={`text-center p-2 rounded-md border transition-colors text-xs ${
                      (currentSelection?.filter_selection ?? null) === filter.id
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:border-primary/50 text-muted-foreground'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Note */}
              <div className="mt-4">
                <p className="text-sm text-muted-foreground font-medium mb-1.5">
                  Note for photographer
                </p>
                <Textarea
                  value={currentSelection?.client_note || ''}
                  onChange={(e) => updateNote(e.target.value)}
                  placeholder="e.g., 'Can you crop tighter?' or 'Love this one!'"
                  rows={3}
                  maxLength={MAX_NOTE_LENGTH}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {(currentSelection?.client_note || '').length}/{MAX_NOTE_LENGTH}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => goToPhoto(currentPhotoIndex - 1)}
          disabled={currentPhotoIndex === 0}
          className="border-border"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentPhotoIndex + 1} of {totalPhotos}
        </span>

        {currentPhotoIndex < totalPhotos - 1 ? (
          <Button
            variant="outline"
            onClick={() => goToPhoto(currentPhotoIndex + 1)}
            className="border-border"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <div /> // spacer
        )}
      </div>

      {/* Submit */}
      <div className="mt-8 border-t border-border pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Zero-change confirmation dialog */}
        {showZeroChangeDialog && (
          <Card className="border-amber-500/20 bg-amber-500/5 mb-4">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">
                    No changes requested
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Proofing is your opportunity to request edits before final delivery.
                    Are you sure you don&apos;t have any changes to request?
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowZeroChangeDialog(false)}
                      className="bg-primary"
                    >
                      Go Back
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleZeroChangeConfirm}
                      className="border-border"
                    >
                      Yes, I&apos;m sure
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!showConfirmDialog && !showZeroChangeDialog ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {reviewedCount === 0
                ? 'Review at least one photo before submitting.'
                : `${reviewedCount} of ${totalPhotos} photos reviewed. Unreviewed photos will be marked "Approved as-is."`}
            </p>
            <Button
              onClick={handleSubmitClick}
              disabled={reviewedCount === 0}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit to Photographer
            </Button>
          </div>
        ) : showConfirmDialog ? (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-1">
                    Ready to submit?
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    You cannot make changes after submitting. Your photographer will review your
                    filter preferences and notes, then prepare the final gallery.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDialog(false)}
                      disabled={submitting}
                      className="border-border"
                    >
                      Go Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Confirm & Submit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
