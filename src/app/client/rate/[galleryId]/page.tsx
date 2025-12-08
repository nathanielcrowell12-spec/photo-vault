'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Zap,
  ArrowLeft,
  Check,
  Camera,
} from 'lucide-react'
import Link from 'next/link'

export default function RatePhotographerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const galleryId = params.galleryId as string

  const [gallery, setGallery] = useState<{ title: string; photographerName: string } | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [hasRated, setHasRated] = useState(false)
  const [canRate, setCanRate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Rating state
  const [overallRating, setOverallRating] = useState(0)
  const [communicationRating, setCommunicationRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [timelinessRating, setTimelinessRating] = useState(0)
  const [reviewText, setReviewText] = useState('')

  // Hover state for star animation
  const [hoverRating, setHoverRating] = useState(0)
  const [hoverCommunication, setHoverCommunication] = useState(0)
  const [hoverQuality, setHoverQuality] = useState(0)
  const [hoverTimeliness, setHoverTimeliness] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        // Check rating status
        const ratingRes = await fetch(`/api/client/rating?galleryId=${galleryId}`)
        const ratingData = await ratingRes.json()

        setHasRated(ratingData.hasRated)
        setCanRate(ratingData.canRate)

        if (ratingData.existingRating) {
          setOverallRating(ratingData.existingRating.rating)
          setReviewText(ratingData.existingRating.review_text || '')
        }

        // Get gallery info
        const galleryRes = await fetch(`/api/gallery/${galleryId}`)
        const galleryData = await galleryRes.json()

        if (galleryData.gallery) {
          setGallery({
            title: galleryData.gallery.title,
            photographerName: galleryData.gallery.photographer?.business_name || 'Your Photographer',
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setPageLoading(false)
      }
    }

    if (user && galleryId) {
      fetchData()
    }
  }, [user, loading, galleryId, router])

  const handleSubmit = async () => {
    if (overallRating < 1) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/client/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          galleryId,
          rating: overallRating,
          reviewText,
          communicationRating: communicationRating || null,
          qualityRating: qualityRating || null,
          timelinessRating: timelinessRating || null,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({
    rating,
    setRating,
    hoverValue,
    setHoverValue,
    size = 'lg',
    label,
  }: {
    rating: number
    setRating: (val: number) => void
    hoverValue: number
    setHoverValue: (val: number) => void
    size?: 'sm' | 'lg'
    label?: string
  }) => {
    const sizeClass = size === 'lg' ? 'w-10 h-10' : 'w-6 h-6'
    const displayValue = hoverValue || rating

    return (
      <div>
        {label && <p className="text-sm text-neutral-400 mb-2">{label}</p>}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`${sizeClass} transition-colors ${
                  star <= displayValue
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-neutral-600 hover:text-yellow-400/50'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white/[0.03] border-white/10">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-neutral-400 mb-6">
              Your feedback helps photographers improve their service.
            </p>
            <Button asChild className="bg-amber-500 hover:bg-amber-400 text-black">
              <Link href="/client/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!canRate) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white/[0.03] border-white/10">
          <CardContent className="pt-8 pb-8 text-center">
            <Camera className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Cannot Rate</h2>
            <p className="text-neutral-400 mb-6">
              You need to be a client with access to this gallery to leave a rating.
            </p>
            <Button asChild variant="outline" className="border-neutral-600">
              <Link href="/client/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/client/gallery/${galleryId}`}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Rate Your Experience</h1>
            <p className="text-neutral-400 mt-1">
              {gallery?.title || 'Gallery'} by {gallery?.photographerName || 'Photographer'}
            </p>
          </div>
        </div>

        {hasRated && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-400 text-sm">
              You've already rated this gallery. Submitting will update your previous rating.
            </p>
          </div>
        )}

        {/* Main Rating */}
        <Card className="bg-white/[0.03] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Overall Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-neutral-400 text-sm">
              How would you rate your overall experience?
            </p>
            <div className="flex items-center gap-4">
              <StarRating
                rating={overallRating}
                setRating={setOverallRating}
                hoverValue={hoverRating}
                setHoverValue={setHoverRating}
                size="lg"
              />
              {overallRating > 0 && (
                <span className="text-2xl font-bold text-yellow-400">{overallRating}.0</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Ratings */}
        <Card className="bg-white/[0.03] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Detailed Feedback (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Communication */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Communication
                </div>
                <StarRating
                  rating={communicationRating}
                  setRating={setCommunicationRating}
                  hoverValue={hoverCommunication}
                  setHoverValue={setHoverCommunication}
                  size="sm"
                />
              </div>

              {/* Quality */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <ThumbsUp className="w-4 h-4 text-purple-400" />
                  Photo Quality
                </div>
                <StarRating
                  rating={qualityRating}
                  setRating={setQualityRating}
                  hoverValue={hoverQuality}
                  setHoverValue={setHoverQuality}
                  size="sm"
                />
              </div>

              {/* Timeliness */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Timeliness
                </div>
                <StarRating
                  rating={timelinessRating}
                  setRating={setTimelinessRating}
                  hoverValue={hoverTimeliness}
                  setHoverValue={setHoverTimeliness}
                  size="sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Written Review */}
        <Card className="bg-white/[0.03] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Written Review (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this photographer..."
              className="bg-neutral-800 border-neutral-700 text-white min-h-[120px]"
              maxLength={1000}
            />
            <p className="text-xs text-neutral-500 mt-2 text-right">
              {reviewText.length}/1000 characters
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={overallRating < 1 || submitting}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-6 text-lg font-semibold"
          >
            {submitting ? 'Submitting...' : hasRated ? 'Update Rating' : 'Submit Rating'}
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-neutral-600 text-neutral-300 py-6"
          >
            <Link href={`/client/gallery/${galleryId}`}>Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
