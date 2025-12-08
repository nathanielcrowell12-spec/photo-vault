'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  ArrowLeft,
  Send,
  Clock,
  ThumbsUp,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import AccessGuard from '@/components/AccessGuard'

type Rating = {
  id: string
  rating: number
  reviewText: string | null
  communicationRating: number | null
  qualityRating: number | null
  timelinessRating: number | null
  status: string
  photographerResponse: string | null
  responseAt: string | null
  createdAt: string
  galleryTitle: string
  clientEmail: string
}

type RatingStats = {
  totalReviews: number
  averageRating: number
  averageCommunication: number
  averageQuality: number
  averageTimeliness: number
  distribution: number[]
}

export default function PhotographerFeedbackPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch('/api/photographer/ratings')
        const data = await response.json()
        if (data.success) {
          setRatings(data.ratings)
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Failed to fetch ratings:', error)
      } finally {
        setDataLoading(false)
      }
    }

    if (user) {
      fetchRatings()
    }
  }, [user])

  const handleSubmitResponse = async (ratingId: string) => {
    if (!responseText.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/photographer/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingId, response: responseText }),
      })

      if (response.ok) {
        // Update local state
        setRatings(ratings.map(r =>
          r.id === ratingId
            ? { ...r, photographerResponse: responseText, responseAt: new Date().toISOString() }
            : r
        ))
        setRespondingTo(null)
        setResponseText('')
      }
    } catch (error) {
      console.error('Failed to submit response:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <AccessGuard requiredAccess="canAccessPhotographerDashboard">
      <div className="min-h-screen bg-neutral-900 text-neutral-100">
        <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/photographer/dashboard"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Client Feedback</h1>
                <p className="text-neutral-400 mt-1">See what your clients are saying</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Overall Rating */}
              <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    </div>
                    <span className="text-sm text-yellow-400 font-medium">Overall Rating</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      {stats.averageRating.toFixed(1)}
                    </span>
                    <span className="text-neutral-400">/ 5</span>
                  </div>
                  {renderStars(Math.round(stats.averageRating), 'md')}
                </CardContent>
              </Card>

              {/* Communication */}
              <Card className="bg-white/[0.03] border-white/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-neutral-400 font-medium">Communication</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {stats.averageCommunication > 0 ? stats.averageCommunication.toFixed(1) : '-'}
                    </span>
                    {stats.averageCommunication > 0 && <span className="text-neutral-400">/ 5</span>}
                  </div>
                </CardContent>
              </Card>

              {/* Quality */}
              <Card className="bg-white/[0.03] border-white/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <ThumbsUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-sm text-neutral-400 font-medium">Photo Quality</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {stats.averageQuality > 0 ? stats.averageQuality.toFixed(1) : '-'}
                    </span>
                    {stats.averageQuality > 0 && <span className="text-neutral-400">/ 5</span>}
                  </div>
                </CardContent>
              </Card>

              {/* Timeliness */}
              <Card className="bg-white/[0.03] border-white/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-sm text-neutral-400 font-medium">Timeliness</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {stats.averageTimeliness > 0 ? stats.averageTimeliness.toFixed(1) : '-'}
                    </span>
                    {stats.averageTimeliness > 0 && <span className="text-neutral-400">/ 5</span>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rating Distribution */}
          {stats && stats.totalReviews > 0 && (
            <Card className="bg-white/[0.03] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star - 1]
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-sm text-neutral-400 w-16">{star} stars</span>
                      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-500 w-12 text-right">{count}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Client Reviews ({stats?.totalReviews || 0})
              </h2>
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            ) : ratings.length === 0 ? (
              <Card className="bg-white/[0.03] border-white/5">
                <CardContent className="py-12 text-center">
                  <Star className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-300 mb-2">No reviews yet</h3>
                  <p className="text-neutral-500 max-w-md mx-auto">
                    When clients leave feedback after viewing their galleries, their reviews will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <Card key={rating.id} className="bg-white/[0.03] border-white/5">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {rating.clientEmail.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white">{rating.clientEmail}</p>
                              <p className="text-sm text-neutral-500">
                                {rating.galleryTitle} • {new Date(rating.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Stars */}
                          <div className="flex items-center gap-2 mb-3">
                            {renderStars(rating.rating, 'md')}
                            <span className="text-sm text-neutral-400">{rating.rating}.0</span>
                          </div>

                          {/* Sub-ratings */}
                          {(rating.communicationRating || rating.qualityRating || rating.timelinessRating) && (
                            <div className="flex flex-wrap gap-4 mb-3 text-sm">
                              {rating.communicationRating && (
                                <span className="text-neutral-400">
                                  Communication: <span className="text-white">{rating.communicationRating}/5</span>
                                </span>
                              )}
                              {rating.qualityRating && (
                                <span className="text-neutral-400">
                                  Quality: <span className="text-white">{rating.qualityRating}/5</span>
                                </span>
                              )}
                              {rating.timelinessRating && (
                                <span className="text-neutral-400">
                                  Timeliness: <span className="text-white">{rating.timelinessRating}/5</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Review text */}
                          {rating.reviewText && (
                            <p className="text-neutral-300 mb-4">{rating.reviewText}</p>
                          )}

                          {/* Photographer Response */}
                          {rating.photographerResponse ? (
                            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-medium text-amber-400">Your Response</span>
                                <span className="text-xs text-neutral-500">
                                  {rating.responseAt && new Date(rating.responseAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-neutral-300 text-sm">{rating.photographerResponse}</p>
                            </div>
                          ) : respondingTo === rating.id ? (
                            <div className="mt-4 space-y-3">
                              <Textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Write a response to this review..."
                                className="bg-neutral-800 border-neutral-700 text-white"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleSubmitResponse(rating.id)}
                                  disabled={submitting || !responseText.trim()}
                                  className="bg-amber-500 hover:bg-amber-400 text-black"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  {submitting ? 'Sending...' : 'Send Response'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRespondingTo(null)
                                    setResponseText('')
                                  }}
                                  className="border-neutral-600 text-neutral-300"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRespondingTo(rating.id)}
                              className="mt-3 border-neutral-600 text-neutral-300 hover:bg-white/5"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Respond
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AccessGuard>
  )
}
