'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTrackEvent } from '@/hooks/useAnalytics'
import { EVENTS } from '@/types/analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Maximize2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  Lock,
  CreditCard,
  CheckCircle,
  Heart
} from 'lucide-react'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import Link from 'next/link'
import ManualPhotoUpload from '@/components/ManualPhotoUpload'

interface Gallery {
  id: string
  gallery_name: string
  gallery_description?: string
  platform: string
  photographer_name?: string
  photographer_id?: string
  session_date?: string
  photo_count: number
  gallery_url?: string
  is_imported: boolean
  import_started_at?: string
  import_completed_at?: string
  client_id?: string
  user_id?: string  // Owner for self-uploaded galleries
  // Pricing fields
  total_amount?: number
  shoot_fee?: number
  storage_fee?: number
  payment_option_id?: string
  billing_mode?: string
  // Joined data for access control
  clients?: { user_id: string } | { user_id: string }[] | null
}

interface Photo {
  id: string
  photo_url: string
  thumbnail_url?: string
  original_filename?: string
  width?: number
  height?: number
  taken_at?: string
  is_favorite: boolean
}

export default function GalleryViewerPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userType, loading: authLoading } = useAuth()
  const track = useTrackEvent()
  const hasTrackedViewRef = useRef(false)
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow'>('grid')
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [showManualUpload, setShowManualUpload] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [accessSuspended, setAccessSuspended] = useState(false)

  const galleryId = params.galleryId as string
  const paymentStatus = searchParams.get('payment')

  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true)
      console.log('[Gallery] Fetching gallery:', galleryId)

      // Check current auth state
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('[Gallery] Current authenticated user:', {
        userId: currentUser?.id,
        email: currentUser?.email
      })

      // If user is authenticated, try direct Supabase query (respects RLS)
      if (currentUser) {
        const { data: galleryData, error: galleryError } = await supabase
          .from('photo_galleries')
          .select(`
            *,
            clients (
              user_id
            )
          `)
          .eq('id', galleryId)
          .single()

        console.log('[Gallery] Gallery query result:', { galleryData, galleryError })

        if (!galleryError && galleryData) {
          setGallery(galleryData)

          // Fetch photos for this gallery - try gallery_photos first, then photos table
          let { data: photosData, error: photosError } = await supabase
            .from('gallery_photos')
            .select('*')
            .eq('gallery_id', galleryId)
            .order('created_at', { ascending: true })

          console.log('[Gallery] gallery_photos query result:', {
            count: photosData?.length,
            photosError,
            galleryId
          })

          // If no photos in gallery_photos, check the photos table (used by photographer upload)
          if (!photosData || photosData.length === 0) {
            const { data: altPhotosData, error: altPhotosError } = await supabase
              .from('photos')
              .select('id, original_url, thumbnail_url, filename, created_at')
              .eq('gallery_id', galleryId)
              .order('created_at', { ascending: true })

            console.log('[Gallery] photos table fallback result:', {
              count: altPhotosData?.length,
              altPhotosError,
              galleryId
            })

            if (altPhotosData && altPhotosData.length > 0) {
              // Map photos table columns to expected Photo interface
              photosData = altPhotosData.map(p => ({
                id: p.id,
                photo_url: p.original_url,
                thumbnail_url: p.thumbnail_url || p.original_url,
                original_filename: p.filename,
                is_favorite: false
              }))
            }
          }

          setPhotos(photosData || [])
          console.log('[Gallery] Successfully loaded gallery with', photosData?.length || 0, 'photos')
          return
        }
        // If RLS blocked access, fall through to API
        console.log('[Gallery] RLS blocked direct access, trying API')
      }

      // Use public API for unauthenticated users or if RLS blocked
      console.log('[Gallery] Using public API to fetch gallery')
      const response = await fetch(`/api/gallery/${galleryId}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Gallery] API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch gallery')
      }

      const data = await response.json()
      console.log('[Gallery] API response:', data)

      setGallery(data.gallery)
      setPhotos(data.photos || [])
      console.log('[Gallery] Successfully loaded gallery via API with', data.photos?.length || 0, 'photos')

    } catch (error) {
      console.error('[Gallery] Error fetching gallery:', error)
      console.error('[Gallery] Error details:', JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }, [galleryId])

  // Check if user has access to this gallery (paid subscription or is the photographer)
  const checkAccess = useCallback(async (galleryData: Gallery) => {
    console.log('[Gallery] checkAccess called - userType:', userType, 'user.id:', user?.id, 'photographer_id:', galleryData.photographer_id)

    if (!user || !userType) {
      console.log('[Gallery] No user or userType yet, waiting...')
      return // Don't set checkingAccess to false - still waiting
    }

    // Photographers always have access to their own galleries
    if (userType === 'photographer') {
      if (galleryData.photographer_id === user.id) {
        console.log('[Gallery] Photographer owns this gallery - full access')
        setHasAccess(true)
        setCheckingAccess(false)
        return
      }
      // Photographer viewing someone else's gallery - show paywall
      console.log('[Gallery] Photographer viewing other gallery - paywall')
      setHasAccess(false)
      setCheckingAccess(false)
      return
    }

    // Admins always have access
    if (userType === 'admin') {
      console.log('[Gallery] Admin user - full access')
      setHasAccess(true)
      setCheckingAccess(false)
      return
    }

    // Client - check access
    if (userType === 'client') {
      // FIRST: Check if this is a self-uploaded gallery (no photographer involved)
      // Self-uploaded galleries have photographer_id = NULL and user_id = auth.uid
      // Note: client_id is NULL for self-uploads, ownership is via user_id
      if (!galleryData.photographer_id && galleryData.user_id === user.id) {
        console.log('[Gallery] Self-uploaded gallery - owner has free access')
        setHasAccess(true)
        setCheckingAccess(false)
        return
      }

      // SECOND: Check if client owns this gallery via client record but no pricing was set
      // This handles galleries where photographer assigned to client but didn't set up payment
      // NOTE: client_id is FK to clients.id, we need to check clients.user_id = auth.uid
      const clientData = Array.isArray(galleryData.clients)
        ? galleryData.clients[0]
        : galleryData.clients

      if (clientData?.user_id === user.id && !galleryData.total_amount) {
        console.log('[Gallery] Gallery assigned to client with no pricing - free access')
        setHasAccess(true)
        setCheckingAccess(false)
        return
      }

      // THIRD: Check subscription for photographer-created galleries with pricing
      try {
        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('id, status, access_suspended')
          .eq('user_id', user.id)
          .eq('gallery_id', galleryId)
          .maybeSingle()

        if (error) {
          console.error('[Gallery] Subscription check error:', error.message || error)
          setHasAccess(false)
          setCheckingAccess(false)
          return
        }

        if (subscription) {
          // Check if access is suspended due to failed payments
          if (subscription.access_suspended) {
            console.log('[Gallery] Subscription found but ACCESS SUSPENDED - showing suspension notice')
            setAccessSuspended(true)
            setHasAccess(false)
          } else if (subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'past_due') {
            // Allow access for active, trialing, and past_due (48hr grace period)
            console.log('[Gallery] Active subscription found - full access')
            setHasAccess(true)
          } else {
            console.log('[Gallery] Subscription status not valid for access:', subscription.status)
            setHasAccess(false)
          }
        } else {
          console.log('[Gallery] No subscription found - paywall')
          setHasAccess(false)
        }
      } catch (err) {
        console.error('[Gallery] Error checking subscription:', err)
        setHasAccess(false)
      }
      setCheckingAccess(false)
      return
    }

    // Unknown user type - show paywall
    console.log('[Gallery] Unknown user type:', userType, '- showing paywall')
    setHasAccess(false)
    setCheckingAccess(false)
  }, [user, userType, galleryId])

  useEffect(() => {
    // Always fetch gallery (even for unauthenticated users)
    // Paywall will handle access control
    if (!authLoading) {
      fetchGallery()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, galleryId])

  // Check access once gallery is loaded
  useEffect(() => {
    if (gallery) {
      // If payment just succeeded, grant access immediately
      if (paymentStatus === 'success') {
        console.log('[Gallery] Payment success detected - granting access')
        setHasAccess(true)
        setShowPaymentSuccess(true)
        setCheckingAccess(false)
        // Clear the success message after 5 seconds
        setTimeout(() => setShowPaymentSuccess(false), 5000)
        return
      }

      if (user && userType) {
        // Authenticated user - check based on role
        checkAccess(gallery)
      } else if (!authLoading && !user) {
        // Unauthenticated user - check if gallery requires payment

        // Self-uploaded galleries (no photographer) are free to view
        if (!gallery.photographer_id) {
          console.log('[Gallery] Unauthenticated visitor - self-uploaded gallery, free access')
          setHasAccess(true)
          setCheckingAccess(false)
          return
        }

        // Galleries with no pricing set are free to view
        if (!gallery.total_amount) {
          console.log('[Gallery] Unauthenticated visitor - no pricing set, free access')
          setHasAccess(true)
          setCheckingAccess(false)
          return
        }

        // Photographer-created gallery with pricing - show paywall
        console.log('[Gallery] Unauthenticated visitor - paid gallery, showing paywall')
        setHasAccess(false)
        setCheckingAccess(false)
      }
    }
  }, [gallery, user, userType, authLoading, checkAccess, paymentStatus])

  // Track gallery view when user has access (once per page load)
  useEffect(() => {
    if (!gallery || !hasAccess || checkingAccess || hasTrackedViewRef.current) return

    // Track the view
    if (userType === 'client') {
      track(EVENTS.CLIENT_VIEWED_GALLERY, {
        gallery_id: gallery.id,
        photographer_id: gallery.photographer_id || '',
        photo_count: photos.length,
      })
    } else {
      // Generic gallery_viewed for photographers, admins, or anonymous
      const isOwner = user?.id === gallery.photographer_id || user?.id === gallery.user_id
      track(EVENTS.GALLERY_VIEWED, {
        gallery_id: gallery.id,
        photographer_id: gallery.photographer_id || '',
        photo_count: photos.length,
        is_owner: isOwner,
        viewer_type: userType || 'anonymous',
      })
    }

    hasTrackedViewRef.current = true
  }, [gallery, hasAccess, checkingAccess, photos.length, userType, track])

  const handleImportPhotos = async () => {
    if (!user || !gallery) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      // Call the import API
      const response = await fetch('/api/import/pixieset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          galleryId: galleryId,
          userId: user.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()
      console.log('Import started:', result)

      // Simulate progress (real progress tracking would need WebSocket or polling)
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90 // Stop at 90%, will complete when photos appear
          }
          return prev + 5
        })
      }, 1000)

      // Poll for completion
      const checkCompletion = setInterval(async () => {
        const { data: updatedGallery } = await supabase
          .from('photo_galleries')
          .select('is_imported, photo_count')
          .eq('id', galleryId)
          .single()

        if (updatedGallery?.is_imported) {
          clearInterval(interval)
          clearInterval(checkCompletion)
          setImportProgress(100)
          
          // Refresh gallery data
          setTimeout(() => {
            fetchGallery()
            setIsImporting(false)
            setImportProgress(0)
          }, 1000)
        }
      }, 3000) // Check every 3 seconds

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(interval)
        clearInterval(checkCompletion)
        setIsImporting(false)
        alert('Import is taking longer than expected. Please refresh the page to check status.')
      }, 600000)

    } catch (error) {
      console.error('Error importing photos:', error)
      alert(`Failed to start import: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const openSlideshow = (index: number) => {
    console.log('[Gallery] Opening slideshow for photo:', {
      index,
      photo: photos[index],
      photo_url: photos[index]?.photo_url,
      thumbnail_url: photos[index]?.thumbnail_url
    })
    setSelectedPhotoIndex(index)
    setViewMode('slideshow')
  }

  const closeSlideshow = () => {
    setSelectedPhotoIndex(null)
    setViewMode('grid')
  }

  const nextPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1)
    }
  }

  const prevPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1)
    }
  }

  const downloadPhoto = async (photoUrl: string, filename: string) => {
    try {
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading photo:', error)
      alert('Failed to download photo')
    }
  }

  const downloadAllPhotos = async () => {
    if (!photos || photos.length === 0) {
      alert('No photos to download')
      return
    }

    if (confirm(`Download all ${photos.length} photos? This may take a while.`)) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const filename = photo.original_filename || `photo-${i + 1}.jpg`
        await downloadPhoto(photo.photo_url, filename)
        // Add delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      alert('All photos downloaded!')
    }
  }

  const toggleFavorite = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/favorite`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[Gallery] Failed to toggle favorite:', error)
        return
      }

      const data = await response.json()

      // Track favorite event if adding to favorites (not unfavoriting)
      if (data.is_favorite && gallery) {
        track(EVENTS.PHOTO_FAVORITED, {
          gallery_id: gallery.id,
          photo_id: photoId,
          photographer_id: gallery.photographer_id || '',
        })
      }

      // Update local state optimistically
      setPhotos(prevPhotos =>
        prevPhotos.map(photo =>
          photo.id === photoId
            ? { ...photo, is_favorite: data.is_favorite }
            : photo
        )
      )
    } catch (error) {
      console.error('[Gallery] Error toggling favorite:', error)
    }
  }

  // Keyboard navigation for slideshow
  useEffect(() => {
    if (viewMode === 'slideshow') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeSlideshow()
        if (e.key === 'ArrowRight') nextPhoto()
        if (e.key === 'ArrowLeft') prevPhoto()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewMode, selectedPhotoIndex, nextPhoto, prevPhoto])

  if (loading || authLoading || checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground dark:text-foreground">Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Gallery Not Found</h2>
            <p className="text-muted-foreground mb-4">This gallery doesn&apos;t exist or you don&apos;t have access to it.</p>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Access Suspended - show payment required message for suspended subscriptions
  if (!checkingAccess && !hasAccess && accessSuspended) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm" className="text-foreground hover:bg-accent/50">
                <Link href="/client/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{gallery.gallery_name}</h1>
                <p className="text-sm text-red-400">
                  Access suspended - payment required
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            {/* Preview thumbnails (blurred) */}
            {photos.length > 0 && (
              <div className="mb-8 relative">
                <div className="grid grid-cols-3 gap-2 blur-sm opacity-30">
                  {photos.slice(0, 6).map((photo, index) => (
                    <div key={photo.id} className="aspect-square bg-slate-700 rounded-lg overflow-hidden">
                      <img
                        src={photo.thumbnail_url || photo.photo_url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Suspended Access Card */}
            <Card className="bg-slate-800/50 border-red-900/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">Access Suspended</h2>
                <p className="text-muted-foreground mb-6">
                  Your payment could not be processed. Please update your payment method to restore access to your {gallery.photo_count} photos.
                </p>

                {/* Warning Box */}
                <div className="bg-red-950/50 border border-red-900/50 rounded-xl p-6 mb-6 text-left">
                  <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Why was my access suspended?
                  </h3>
                  <ul className="text-muted-foreground text-sm space-y-2">
                    <li>• We tried to process your payment but it was declined</li>
                    <li>• Your card may have expired or has insufficient funds</li>
                    <li>• The 48-hour grace period has ended</li>
                  </ul>
                </div>

                {/* Restore Access Info */}
                <div className="bg-green-950/30 border border-green-900/50 rounded-xl p-6 mb-6 text-left">
                  <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    How to restore access
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Simply update your payment method and your access will be restored immediately. 
                    All your photos are safe and waiting for you.
                  </p>
                </div>

                {/* Update Payment Button */}
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  <Link href="/client/billing">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Update Payment Method
                  </Link>
                </Button>

                <p className="text-xs text-muted-foreground mt-4">
                  Need help? Contact us at{' '}
                  <a href="mailto:support@photovault.photo" className="text-amber-500 hover:underline">
                    support@photovault.photo
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Paywall - show subscription prompt if user doesn't have access
  if (!checkingAccess && !hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm" className="text-foreground hover:bg-accent/50">
                <Link href="/client/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{gallery.gallery_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {gallery.photo_count} photos ready for you
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            {/* Preview thumbnails (blurred) */}
            {photos.length > 0 && (
              <div className="mb-8 relative">
                <div className="grid grid-cols-3 gap-2 blur-sm opacity-50">
                  {photos.slice(0, 6).map((photo, index) => (
                    <div key={photo.id} className="aspect-square bg-slate-700 rounded-lg overflow-hidden">
                      <img
                        src={photo.thumbnail_url || photo.photo_url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/60 backdrop-blur-sm rounded-full p-4">
                    <Lock className="h-8 w-8 text-foreground" />
                  </div>
                </div>
              </div>
            )}

            {/* Subscribe Card */}
            <Card className="bg-slate-800/50 border-border backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-8 w-8 text-amber-500" />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">Your Photos Are Ready!</h2>
                <p className="text-muted-foreground mb-6">
                  Subscribe to unlock full access to all {gallery.photo_count} photos in this gallery.
                </p>

                {/* Pricing - Show total only, no fee breakdown */}
                <div className="bg-slate-900/50 rounded-xl p-6 mb-6">
                  {gallery.total_amount ? (
                    <>
                      <div className="text-amber-500 font-semibold mb-2">Photography Services</div>
                      <div className="text-3xl font-bold text-foreground mb-1">
                        ${(gallery.total_amount / 100).toFixed(0)}
                      </div>
                      <div className="text-muted-foreground text-sm">One-time payment</div>

                      {gallery.billing_mode === 'all_in_one' && (
                        <>
                          <div className="border-t border-border my-4" />
                          <div className="text-green-500 font-semibold mb-2">After Year 1</div>
                          <div className="text-xl font-bold text-foreground mb-1">$8/month</div>
                          <div className="text-muted-foreground text-sm">Continued access</div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-amber-500 font-semibold mb-2">Year 1</div>
                      <div className="text-3xl font-bold text-foreground mb-1">$100</div>
                      <div className="text-muted-foreground text-sm">Full year of access</div>

                      <div className="border-t border-border my-4" />

                      <div className="text-green-500 font-semibold mb-2">Year 2+</div>
                      <div className="text-xl font-bold text-foreground mb-1">$8/month</div>
                      <div className="text-muted-foreground text-sm">Continued access</div>
                    </>
                  )}
                </div>

                {/* Features */}
                <div className="text-left mb-6 space-y-2">
                  {[
                    'Unlimited high-resolution downloads',
                    'Access from any device',
                    'Share with family & friends',
                    'Photos stored securely forever',
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-foreground text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Pay Button */}
                <Button
                  size="lg"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  onClick={async (e) => {
                    const button = e.currentTarget
                    button.disabled = true
                    button.textContent = 'Redirecting to checkout...'

                    try {
                      // Use public-checkout if not logged in, gallery-checkout if logged in
                      const endpoint = user ? '/api/stripe/gallery-checkout' : '/api/stripe/public-checkout'
                      
                      console.log('[Checkout] Starting checkout for gallery:', galleryId, 'endpoint:', endpoint)
                      const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ galleryId })
                      })
                      console.log('[Checkout] Response status:', response.status)
                      const data = await response.json()
                      console.log('[Checkout] Response data:', data)

                      if (data.url) {
                        console.log('[Checkout] Redirecting to:', data.url)
                        window.location.href = data.url
                      } else if (data.redirectUrl) {
                        // Handle shoot-only galleries that don't need payment
                        console.log('[Checkout] Redirecting to:', data.redirectUrl)
                        window.location.href = data.redirectUrl
                      } else {
                        console.error('[Checkout] No URL in response:', data)
                        alert(data.error || data.message || 'Failed to start checkout. Please try again.')
                        button.disabled = false
                        button.textContent = 'Pay Now'
                      }
                    } catch (error) {
                      console.error('[Checkout] Error:', error)
                      alert('Failed to start checkout. Please try again.')
                      button.disabled = false
                      button.textContent = 'Pay Now'
                    }
                  }}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay Now
                </Button>

                <p className="text-xs text-muted-foreground mt-4">
                  Secure payment powered by Stripe.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Payment Success Banner */}
      {showPaymentSuccess && (
        <div className="bg-green-500 text-foreground py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Payment successful! Welcome to your gallery.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-40 backdrop-blur-sm">
        <div className="container-pixieset py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{gallery.gallery_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {gallery.photographer_name && `${gallery.photographer_name} • `}
                  <Badge variant="outline" className="ml-1">{gallery.platform}</Badge>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={downloadAllPhotos} disabled={photos.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Download All ({photos.length})
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-pixieset py-8">
        {/* Gallery Not Imported Yet */}
        {photos.length === 0 && (
          <div className="space-y-6 mb-6">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Photos Not Imported Yet</strong>
                    <p className="text-sm mt-1">
                      This gallery has {gallery.photo_count} photos on {gallery.platform}. 
                      Choose how you want to import them:
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Import Options */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Option 1: Auto Import from Pixieset */}
              <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Auto Import from {gallery.platform}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Automatically download all {gallery.photo_count} photos from your {gallery.platform} gallery
                      </p>
                    </div>
                    <Button
                      onClick={handleImportPhotos}
                      disabled={isImporting}
                      className="w-full"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing... {importProgress}%
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Auto Import
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Option 2: Manual Upload */}
              <Card className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Upload from Device</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload photos directly from your computer, phone, or tablet
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowManualUpload(!showManualUpload)}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {showManualUpload ? 'Hide Upload' : 'Manual Upload'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Manual Upload Component */}
            {showManualUpload && (
              <ManualPhotoUpload
                galleryId={galleryId}
                onUploadComplete={() => {
                  setShowManualUpload(false)
                  fetchGallery()
                }}
              />
            )}
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <Card
                key={photo.id}
                className="group cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => openSlideshow(index)}
              >
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={photo.thumbnail_url || photo.photo_url}
                    alt={photo.original_filename || `Photo ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Maximize2 className="h-8 w-8 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No photos in this gallery yet</p>
          </div>
        )}

        {/* Slideshow/Lightbox Modal */}
        {viewMode === 'slideshow' && selectedPhotoIndex !== null && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            {/* Top Action Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-white/20"
                onClick={() => toggleFavorite(photos[selectedPhotoIndex].id)}
                title={photos[selectedPhotoIndex].is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    photos[selectedPhotoIndex].is_favorite
                      ? 'fill-red-500 text-red-500'
                      : 'text-foreground'
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-white/20"
                onClick={() => {
                  const photo = photos[selectedPhotoIndex]
                  const filename = photo.original_filename || `photo-${selectedPhotoIndex + 1}.jpg`
                  downloadPhoto(photo.photo_url, filename)
                }}
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-white/20"
                onClick={closeSlideshow}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Previous Button */}
            {selectedPhotoIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-foreground hover:bg-white/20"
                onClick={prevPhoto}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Photo */}
            <div className="max-w-7xl max-h-screen p-8">
              <img
                src={photos[selectedPhotoIndex].photo_url || photos[selectedPhotoIndex].thumbnail_url}
                alt={photos[selectedPhotoIndex].original_filename || `Photo ${selectedPhotoIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
                onError={(e) => {
                  console.error('Failed to load photo:', photos[selectedPhotoIndex].photo_url)
                  // Try fallback to thumbnail if main image fails
                  if (photos[selectedPhotoIndex].thumbnail_url) {
                    e.currentTarget.src = photos[selectedPhotoIndex].thumbnail_url || ''
                  }
                }}
              />

              {/* Photo Counter */}
              <div className="text-center mt-4 text-foreground text-sm">
                {selectedPhotoIndex + 1} of {photos.length}
              </div>
            </div>

            {/* Next Button */}
            {selectedPhotoIndex < photos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-foreground hover:bg-white/20"
                onClick={nextPhoto}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

