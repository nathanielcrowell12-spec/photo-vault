'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  Calendar,
  Camera,
  MapPin,
  Loader2,
  Image,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
// Note: getTransformedImageUrl removed — thumbnails are now pre-generated at upload time

interface TimelineGallery {
  id: string
  name: string
  created_at: string
  photo_count: number
  cover_image_url: string | null
  photographer_name: string
  photographer_business: string | null
  location: string | null
  event_type: string | null
}

interface TimelineMonth {
  month: number
  month_name: string
  galleries: TimelineGallery[]
  total_photos: number
}

interface TimelineYear {
  year: number
  months: TimelineMonth[]
  total_photos: number
  sessions: number
}

export default function PhotoTimelinePage() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()

  const [timelineData, setTimelineData] = useState<TimelineYear[]>([])
  const [filteredData, setFilteredData] = useState<TimelineYear[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    photographer: 'all',
    event_type: 'all'
  })

  useEffect(() => {
    if (!authLoading && userType !== 'client' && userType !== null) {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType, authLoading])

  useEffect(() => {
    if (userType === 'client') {
      fetchTimelineData()
    }
  }, [userType])

  // Debounced server-side search
  useEffect(() => {
    if (userType !== 'client') return

    const timeoutId = setTimeout(() => {
      if (filters.search) {
        setLoading(true)
        fetchTimelineData(filters.search)
      } else {
        // Re-fetch without search if cleared
        setLoading(true)
        fetchTimelineData()
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [filters.search, userType])

  useEffect(() => {
    applyFilters()
  }, [timelineData, filters])

  const fetchTimelineData = async (searchQuery?: string) => {
    try {
      const url = searchQuery
        ? `/api/client/timeline?q=${encodeURIComponent(searchQuery)}`
        : '/api/client/timeline'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTimelineData(data.timeline || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch timeline data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...timelineData]

    // Search is now server-side via full-text search
    // Only apply local filters for photographer and event_type dropdowns

    // Filter by photographer
    if (filters.photographer !== 'all') {
      filtered = filtered.map(year => ({
        ...year,
        months: year.months.map(month => ({
          ...month,
          galleries: month.galleries.filter(gallery =>
            gallery.photographer_name === filters.photographer ||
            gallery.photographer_business === filters.photographer
          )
        })).filter(month => month.galleries.length > 0)
      })).filter(year => year.months.length > 0)
    }

    // Filter by event type
    if (filters.event_type !== 'all') {
      filtered = filtered.map(year => ({
        ...year,
        months: year.months.map(month => ({
          ...month,
          galleries: month.galleries.filter(gallery => gallery.event_type === filters.event_type)
        })).filter(month => month.galleries.length > 0)
      })).filter(year => year.months.length > 0)
    }

    setFilteredData(filtered)
  }

  const getPhotographers = () => {
    const photographers = new Set<string>()
    timelineData.forEach(year =>
      year.months.forEach(month =>
        month.galleries.forEach(gallery => {
          photographers.add(gallery.photographer_name)
          if (gallery.photographer_business) {
            photographers.add(gallery.photographer_business)
          }
        })
      )
    )
    return Array.from(photographers)
  }

  const getEventTypes = () => {
    const types = new Set<string>()
    timelineData.forEach(year =>
      year.months.forEach(month =>
        month.galleries.forEach(gallery => {
          if (gallery.event_type) {
            types.add(gallery.event_type)
          }
        })
      )
    )
    return Array.from(types)
  }

  const getEventTypeIcon = (type: string | null) => {
    if (!type) return null
    const typeLower = type.toLowerCase()
    if (typeLower.includes('wedding')) return '💒'
    if (typeLower.includes('family')) return '👨‍👩‍👧‍👦'
    if (typeLower.includes('portrait')) return '📸'
    if (typeLower.includes('event') || typeLower.includes('party')) return '🎉'
    if (typeLower.includes('graduation')) return '🎓'
    if (typeLower.includes('baby') || typeLower.includes('newborn')) return '👶'
    return '📷'
  }

  const getEventTypeColor = (type: string | null) => {
    if (!type) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    const typeLower = type.toLowerCase()
    if (typeLower.includes('wedding')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    if (typeLower.includes('family')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (typeLower.includes('portrait')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    if (typeLower.includes('event') || typeLower.includes('party')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const getTotalPhotos = () => {
    return timelineData.reduce((sum, year) => sum + year.total_photos, 0)
  }

  if (authLoading || (userType !== 'client' && userType !== null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-purple-600" />
              <span className="text-xl font-bold text-foreground">Photo Timeline</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
              {getTotalPhotos().toLocaleString()} Photos
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <Card className="mb-8 bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <Input
                    placeholder="Search by name, location, people, event type, notes..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full"
                  />
                </div>
                {getPhotographers().length > 1 && (
                  <Select value={filters.photographer} onValueChange={(value) => setFilters({...filters, photographer: value})}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="All Photographers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Photographers</SelectItem>
                      {getPhotographers().map(photographer => (
                        <SelectItem key={photographer} value={photographer}>{photographer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {getEventTypes().length > 0 && (
                  <Select value={filters.event_type} onValueChange={(value) => setFilters({...filters, event_type: value})}>
                    <SelectTrigger className="w-full lg:w-48">
                      <SelectValue placeholder="All Event Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Event Types</SelectItem>
                      {getEventTypes().map(type => (
                        <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card className="text-center py-12 bg-card/50 border-border">
              <CardContent>
                <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Loading your timeline...</h3>
                <p className="text-muted-foreground">Fetching your photo galleries</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {!loading && filteredData.length > 0 && (
            <div className="space-y-8">
              {filteredData.map((year) => (
                <Card key={year.year} className="overflow-hidden bg-card/50 border-border">
                  <CardHeader className="bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-foreground">{year.year}</CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {year.sessions} {year.sessions === 1 ? 'gallery' : 'galleries'} • {year.total_photos.toLocaleString()} photos
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {year.months.map((month) => (
                      <div key={month.month} className="border-b last:border-b-0 border-border">
                        <div className="p-6 bg-card/30">
                          <h3 className="text-lg font-semibold mb-2 text-foreground">
                            {month.month_name} {year.year}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {month.galleries.length} {month.galleries.length === 1 ? 'gallery' : 'galleries'} • {month.total_photos.toLocaleString()} photos
                          </p>
                        </div>
                        <div className="p-6 space-y-6">
                          {month.galleries.map((gallery) => (
                            <Link
                              key={gallery.id}
                              href={`/gallery/${gallery.id}`}
                              className="block border border-border rounded-lg p-6 hover:bg-secondary/30 transition-colors"
                            >
                              <div className="flex items-start gap-6">
                                {/* Cover Photo */}
                                <div className="w-32 h-24 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                                  {gallery.cover_image_url ? (
                                    <img
                                      src={gallery.cover_image_url}
                                      alt={gallery.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Image className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>

                                {/* Gallery Info */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="text-xl font-semibold text-foreground flex items-center gap-2">
                                        {gallery.name}
                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                      </h4>
                                      <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="h-4 w-4" />
                                          <span>{new Date(gallery.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <Camera className="h-4 w-4" />
                                          <span>{gallery.photographer_name}</span>
                                        </div>
                                        {gallery.location && (
                                          <div className="flex items-center space-x-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{gallery.location}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {gallery.event_type && (
                                      <Badge className={`${getEventTypeColor(gallery.event_type)} flex items-center space-x-1`}>
                                        <span>{getEventTypeIcon(gallery.event_type)}</span>
                                        <span className="capitalize">{gallery.event_type}</span>
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between mt-4">
                                    <span className="text-sm text-muted-foreground">
                                      {gallery.photo_count.toLocaleString()} photos
                                    </span>
                                    <Button variant="outline" size="sm">
                                      View Gallery
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredData.length === 0 && (
            <Card className="text-center py-12 bg-card/50 border-border">
              <CardContent>
                <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {timelineData.length === 0 ? 'No photos yet' : 'No matching galleries'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {timelineData.length === 0
                    ? 'Your photo galleries will appear here once they\'re created.'
                    : 'Try adjusting your search or filters to find what you\'re looking for.'
                  }
                </p>
                {filters.search || filters.photographer !== 'all' || filters.event_type !== 'all' ? (
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ search: '', photographer: 'all', event_type: 'all' })}
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/client/dashboard">Back to Dashboard</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
