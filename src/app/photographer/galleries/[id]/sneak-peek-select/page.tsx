'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Check,
  Loader2,
  Send,
  Image as ImageIcon,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'

interface Photo {
  id: string
  original_url: string
  thumbnail_url: string
  full_url: string
  filename: string
}

interface Gallery {
  id: string
  gallery_name: string
  client_id: string
  gallery_status: string
  photo_count: number
  total_amount?: number
  clients?: {
    name: string
    email: string
  }
}

export default function SneakPeekSelectPage() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const galleryId = params.id as string

  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || userType !== 'photographer') {
      router.push('/login')
      return
    }
    fetchGalleryAndPhotos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryId, user, userType, authLoading])

  const fetchGalleryAndPhotos = async () => {
    try {
      setLoading(true)

      // Fetch gallery first (without join to avoid RLS issues)
      const { data: galleryData, error: galleryError } = await supabase
        .from('photo_galleries')
        .select('id, gallery_name, client_id, gallery_status, photo_count, total_amount')
        .eq('id', galleryId)
        .single()

      if (galleryError) {
        console.error('Gallery fetch error:', galleryError)
        throw galleryError
      }

      // Fetch client info separately
      let clientInfo: { name: string; email: string } | undefined = undefined
      if (galleryData.client_id) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('name, email')
          .eq('id', galleryData.client_id)
          .single()

        if (!clientError && clientData) {
          clientInfo = clientData
        }
      }

      setGallery({
        ...galleryData,
        clients: clientInfo
      })

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('id, original_url, thumbnail_url, full_url, filename')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: true })

      if (photosError) {
        console.error('Photos fetch error:', photosError)
        throw photosError
      }
      setPhotos(photosData || [])
    } catch (err: any) {
      console.error('Error fetching gallery:', err?.message || err)
      setError('Failed to load gallery: ' + (err?.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const togglePhotoSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos)
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId)
    } else {
      // Limit to 5 sneak peek photos
      if (newSelection.size >= 5) {
        setError('You can select up to 5 photos for the sneak peek')
        return
      }
      newSelection.add(photoId)
    }
    setSelectedPhotos(newSelection)
    setError('')
  }

  const handleSendSneakPeek = async () => {
    if (!gallery?.clients?.email) {
      setError('No client email found for this gallery')
      return
    }

    try {
      setSending(true)
      setError('')

      // Update gallery status to 'ready'
      const { error: updateError } = await supabase
        .from('photo_galleries')
        .update({
          gallery_status: 'ready',
        })
        .eq('id', galleryId)

      if (updateError) throw updateError

      // Mark selected photos as sneak peek
      if (selectedPhotos.size > 0) {
        const { error: photoUpdateError } = await supabase
          .from('photos')
          .update({ is_sneak_peek: true })
          .in('id', Array.from(selectedPhotos))

        if (photoUpdateError) {
          console.warn('Could not mark sneak peek photos:', photoUpdateError)
          // Continue anyway - this is not critical
        }
      }

      // Send gallery ready email via API
      const response = await fetch('/api/email/gallery-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          galleryId,
          sneakPeekPhotoIds: Array.from(selectedPhotos)
        })
      })

      if (!response.ok) {
        const data = await response.json()

        // CRITICAL: Rollback gallery status to 'draft' so photographer can retry
        await supabase
          .from('photo_galleries')
          .update({ gallery_status: 'draft' })
          .eq('id', galleryId)

        // Show error to user based on error type
        if (data.code === 'PHOTOGRAPHER_STRIPE_MISSING') {
          setError('⚠️ Payment setup required: You must complete your Stripe Connect setup in Settings → Payments before you can send gallery notifications to clients.')
        } else if (data.code === 'EMAIL_ALREADY_SENT') {
          // Email was already sent - this is actually success
          setSuccess(true)
          setTimeout(() => {
            router.push('/photographer/galleries')
          }, 2000)
          return
        } else {
          setError(data.error || data.message || 'Failed to send notification. Please try again.')
        }

        // Stay on page so user sees error - don't redirect
        return
      }

      setSuccess(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/photographer/galleries')
      }, 2000)

    } catch (err: any) {
      console.error('Error sending sneak peek:', err)
      setError(err.message || 'Failed to send gallery notification')
    } finally {
      setSending(false)
    }
  }

  const handleSkipSneakPeek = async () => {
    // Clear selection and send without sneak peek
    setSelectedPhotos(new Set())
    await handleSendSneakPeek()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-slate-800/50 border-border max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Gallery Sent!</h2>
            <p className="text-muted-foreground mb-2">
              Email sent to <span className="font-medium">{gallery?.clients?.email}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {gallery?.clients?.name || 'Your client'} can now view
              {gallery?.total_amount && gallery.total_amount > 0
                ? ' and purchase access to '
                : ' '}
              their gallery.
            </p>
            <p className="text-muted-foreground text-sm">Redirecting to galleries...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/photographer/galleries/${galleryId}/upload`}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Send Gallery to {gallery?.clients?.name || 'Client'}
            </h1>
            <p className="text-muted-foreground">
              {gallery?.clients?.email} will receive a notification email.
              Optionally select up to 5 preview photos to include.
            </p>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-500/20 border-red-500/50 text-red-300">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">
              <span className="font-medium">{error}</span>
              {error.includes('Stripe') && (
                <div className="mt-2">
                  <Link
                    href="/photographers/settings"
                    className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    Go to Settings →
                  </Link>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* What will happen notification */}
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
          <Send className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-foreground">
            This will send an email to{' '}
            <span className="font-medium">{gallery?.clients?.email}</span>
            {' '}with a link to view
            {gallery?.total_amount && gallery.total_amount > 0
              ? ' and pay for '
              : ' '}
            the gallery.
          </AlertDescription>
        </Alert>

        {/* Gallery Info */}
        <Card className="bg-slate-800/50 border-border mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground text-lg">{gallery?.gallery_name}</CardTitle>
            <CardDescription className="text-slate-300">
              For: {gallery?.clients?.name || 'Unknown client'} ({gallery?.clients?.email})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                <span>{photos.length} photos</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>{selectedPhotos.size} selected for sneak peek</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <Card className="bg-slate-800/50 border-border">
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No photos in this gallery</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {photos.map((photo) => {
              const isSelected = selectedPhotos.has(photo.id)
              return (
                <div
                  key={photo.id}
                  onClick={() => togglePhotoSelection(photo.id)}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden cursor-pointer
                    transition-all duration-200
                    ${isSelected
                      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900'
                      : 'hover:ring-2 hover:ring-slate-500 hover:ring-offset-2 hover:ring-offset-slate-900'
                    }
                  `}
                >
                  <img
                    src={photo.thumbnail_url || photo.original_url}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-black" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            variant="outline"
            onClick={handleSkipSneakPeek}
            disabled={sending}
            className="border-slate-600 text-foreground hover:text-foreground hover:bg-slate-700"
          >
            Skip Sneak Peek
          </Button>
          <Button
            onClick={handleSendSneakPeek}
            disabled={sending}
            className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {selectedPhotos.size > 0
                  ? `Send with ${selectedPhotos.size} Sneak Peek Photos`
                  : 'Mark Gallery Ready & Notify Client'
                }
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
