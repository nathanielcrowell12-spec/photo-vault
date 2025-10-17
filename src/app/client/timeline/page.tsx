'use client'

import { useState, useEffect } from 'react'
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
  Users,
  Heart,
  Download,
  Share2,
  Filter,
  Search,
  Star,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Play,
  Pause
} from 'lucide-react'
import Link from 'next/link'

interface Photo {
  id: string
  url: string
  thumbnail: string
  photographer_name: string
  photographer_business: string
  session_name: string
  session_date: string
  session_type: 'wedding' | 'family' | 'portrait' | 'event' | 'other'
  location?: string
  tags: string[]
  is_favorite: boolean
  download_count: number
  share_count: number
}

interface TimelineYear {
  year: number
  months: TimelineMonth[]
  total_photos: number
  sessions: number
}

interface TimelineMonth {
  month: number
  month_name: string
  sessions: PhotoSession[]
  total_photos: number
}

interface PhotoSession {
  id: string
  name: string
  date: string
  photographer_name: string
  photographer_business: string
  session_type: string
  location?: string
  photos: Photo[]
  photo_count: number
}

export default function PhotoTimelinePage() {
  const { user, userType } = useAuth()
  const router = useRouter()
  const [timelineData, setTimelineData] = useState<TimelineYear[]>([])
  const [filteredData, setFilteredData] = useState<TimelineYear[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline')
  const [filters, setFilters] = useState({
    search: '',
    photographer: 'all',
    session_type: 'all',
    favorites_only: false
  })
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!loading && userType !== 'client' && userType !== null) {
      router.push('/dashboard')
    }
  }, [loading, userType, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (userType === 'client') {
      fetchTimelineData()
    }
  }, [userType])

  useEffect(() => {
    if (userType === 'client') {
      applyFilters()
    }
  }, [timelineData, filters, userType])

  if (userType !== 'client') {
    return null
  }

  const fetchTimelineData = async () => {
    // Simulate API call - in real implementation, this would fetch from database
    setTimeout(() => {
      const mockData: TimelineYear[] = [
        {
          year: 2024,
          total_photos: 1250,
          sessions: 8,
          months: [
            {
              month: 10,
              month_name: 'October',
              total_photos: 450,
              sessions: [
                {
                  id: '1',
                  name: 'Smith Wedding',
                  date: '2024-10-15',
                  photographer_name: 'Emma Rodriguez',
                  photographer_business: 'Emma Rodriguez Photography',
                  session_type: 'wedding',
                  location: 'Garden Venue, Portland',
                  photo_count: 450,
                  photos: generateMockPhotos(450, 'Emma Rodriguez', 'Emma Rodriguez Photography', 'Smith Wedding', 'wedding', 'Garden Venue, Portland')
                }
              ]
            },
            {
              month: 9,
              month_name: 'September',
              total_photos: 200,
              sessions: [
                {
                  id: '2',
                  name: 'Family Portrait Session',
                  date: '2024-09-20',
                  photographer_name: 'Mike Chen',
                  photographer_business: 'Chen Studios',
                  session_type: 'family',
                  location: 'Portland Park',
                  photo_count: 200,
                  photos: generateMockPhotos(200, 'Mike Chen', 'Chen Studios', 'Family Portrait Session', 'family', 'Portland Park')
                }
              ]
            },
            {
              month: 8,
              month_name: 'August',
              total_photos: 300,
              sessions: [
                {
                  id: '3',
                  name: 'Engagement Photos',
                  date: '2024-08-10',
                  photographer_name: 'Sarah Thompson',
                  photographer_business: 'Thompson Photography',
                  session_type: 'portrait',
                  location: 'Columbia River Gorge',
                  photo_count: 300,
                  photos: generateMockPhotos(300, 'Sarah Thompson', 'Thompson Photography', 'Engagement Photos', 'portrait', 'Columbia River Gorge')
                }
              ]
            },
            {
              month: 7,
              month_name: 'July',
              total_photos: 300,
              sessions: [
                {
                  id: '4',
                  name: 'Corporate Event',
                  date: '2024-07-25',
                  photographer_name: 'David Kim',
                  photographer_business: 'Kim Event Photography',
                  session_type: 'event',
                  location: 'Convention Center',
                  photo_count: 300,
                  photos: generateMockPhotos(300, 'David Kim', 'Kim Event Photography', 'Corporate Event', 'event', 'Convention Center')
                }
              ]
            }
          ]
        },
        {
          year: 2023,
          total_photos: 800,
          sessions: 5,
          months: [
            {
              month: 12,
              month_name: 'December',
              total_photos: 150,
              sessions: [
                {
                  id: '5',
                  name: 'Holiday Family Photos',
                  date: '2023-12-15',
                  photographer_name: 'Lisa Wang',
                  photographer_business: 'Wang Photography',
                  session_type: 'family',
                  location: 'Home Studio',
                  photo_count: 150,
                  photos: generateMockPhotos(150, 'Lisa Wang', 'Wang Photography', 'Holiday Family Photos', 'family', 'Home Studio')
                }
              ]
            },
            {
              month: 6,
              month_name: 'June',
              total_photos: 650,
              sessions: [
                {
                  id: '6',
                  name: 'Graduation Ceremony',
                  date: '2023-06-15',
                  photographer_name: 'Alex Martinez',
                  photographer_business: 'Martinez Studios',
                  session_type: 'event',
                  location: 'University Campus',
                  photo_count: 650,
                  photos: generateMockPhotos(650, 'Alex Martinez', 'Martinez Studios', 'Graduation Ceremony', 'event', 'University Campus')
                }
              ]
            }
          ]
        }
      ]
      setTimelineData(mockData)
    }, 1000)
  }

  const generateMockPhotos = (count: number, photographer: string, business: string, session: string, type: string, location: string): Photo[] => {
    return Array.from({ length: Math.min(count, 50) }, (_, i) => ({
      id: `${type}_${i}`,
      url: `/api/placeholder/800/600`,
      thumbnail: `/api/placeholder/300/200`,
      photographer_name: photographer,
      photographer_business: business,
      session_name: session,
      session_date: new Date().toISOString(),
      session_type: type as any,
      location,
      tags: ['professional', type],
      is_favorite: Math.random() > 0.8,
      download_count: Math.floor(Math.random() * 10),
      share_count: Math.floor(Math.random() * 5)
    }))
  }

  const applyFilters = () => {
    let filtered = [...timelineData]

    // Filter by search term
    if (filters.search) {
      filtered = filtered.map(year => ({
        ...year,
        months: year.months.map(month => ({
          ...month,
          sessions: month.sessions.filter(session =>
            session.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            session.photographer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
            session.location?.toLowerCase().includes(filters.search.toLowerCase())
          )
        })).filter(month => month.sessions.length > 0)
      })).filter(year => year.months.length > 0)
    }

    // Filter by photographer
    if (filters.photographer !== 'all') {
      filtered = filtered.map(year => ({
        ...year,
        months: year.months.map(month => ({
          ...month,
          sessions: month.sessions.filter(session => session.photographer_business === filters.photographer)
        })).filter(month => month.sessions.length > 0)
      })).filter(year => year.months.length > 0)
    }

    // Filter by session type
    if (filters.session_type !== 'all') {
      filtered = filtered.map(year => ({
        ...year,
        months: year.months.map(month => ({
          ...month,
          sessions: month.sessions.filter(session => session.session_type === filters.session_type)
        })).filter(month => month.sessions.length > 0)
      })).filter(year => year.months.length > 0)
    }

    // Filter by favorites
    if (filters.favorites_only) {
      filtered = filtered.map(year => ({
        ...year,
        months: year.months.map(month => ({
          ...month,
          sessions: month.sessions.map(session => ({
            ...session,
            photos: session.photos.filter(photo => photo.is_favorite)
          })).filter(session => session.photos.length > 0)
        })).filter(month => month.sessions.length > 0)
      })).filter(year => year.months.length > 0)
    }

    setFilteredData(filtered)
  }

  const getPhotographers = () => {
    const photographers = new Set<string>()
    timelineData.forEach(year => 
      year.months.forEach(month =>
        month.sessions.forEach(session =>
          photographers.add(session.photographer_business)
        )
      )
    )
    return Array.from(photographers)
  }

  const getSessionTypes = () => {
    const types = new Set<string>()
    timelineData.forEach(year => 
      year.months.forEach(month =>
        month.sessions.forEach(session =>
          types.add(session.session_type)
        )
      )
    )
    return Array.from(types)
  }

  const toggleFavorite = (photoId: string) => {
    // In real implementation, this would update the database
    console.log('Toggle favorite:', photoId)
  }

  const downloadPhoto = (photoId: string) => {
    // In real implementation, this would trigger download
    console.log('Download photo:', photoId)
  }

  const sharePhoto = (photoId: string) => {
    // In real implementation, this would open share dialog
    console.log('Share photo:', photoId)
  }

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'wedding': return '💒'
      case 'family': return '👨‍👩‍👧‍👦'
      case 'portrait': return '📸'
      case 'event': return '🎉'
      default: return '📷'
    }
  }

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'wedding': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
      case 'family': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'portrait': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'event': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-purple-600" />
              <span className="text-xl font-bold">Photo Timeline</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
              {timelineData.reduce((sum, year) => sum + year.total_photos, 0)} Photos
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Search photos, sessions, photographers..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full"
                  />
                </div>
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
                <Select value={filters.session_type} onValueChange={(value) => setFilters({...filters, session_type: value})}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {getSessionTypes().map(type => (
                      <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={filters.favorites_only ? "default" : "outline"}
                  onClick={() => setFilters({...filters, favorites_only: !filters.favorites_only})}
                  className="flex items-center space-x-2"
                >
                  <Heart className="h-4 w-4" />
                  <span>Favorites</span>
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant={viewMode === 'timeline' ? "default" : "outline"}
                    onClick={() => setViewMode('timeline')}
                    size="sm"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? "default" : "outline"}
                    onClick={() => setViewMode('grid')}
                    size="sm"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <div className="space-y-8">
            {filteredData.map((year) => (
              <Card key={year.year} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{year.year}</CardTitle>
                      <CardDescription>
                        {year.sessions} sessions • {year.total_photos} photos
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {year.months.map((month) => (
                    <div key={month.month} className="border-b last:border-b-0">
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-semibold mb-2">
                          {month.month_name} {year.year}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {month.sessions.length} sessions • {month.total_photos} photos
                        </p>
                      </div>
                      <div className="p-6 space-y-6">
                        {month.sessions.map((session) => (
                          <div key={session.id} className="border rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-xl font-semibold mb-2">{session.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(session.date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Camera className="h-4 w-4" />
                                    <span>{session.photographer_name}</span>
                                  </div>
                                  {session.location && (
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{session.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge className={`${getSessionTypeColor(session.session_type)} flex items-center space-x-1`}>
                                <span>{getSessionTypeIcon(session.session_type)}</span>
                                <span className="capitalize">{session.session_type}</span>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {session.photos.slice(0, 12).map((photo) => (
                                <div key={photo.id} className="relative group">
                                  <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Camera className="h-8 w-8 text-slate-400" />
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => toggleFavorite(photo.id)}
                                      >
                                        <Heart className={`h-4 w-4 ${photo.is_favorite ? 'text-red-500 fill-current' : ''}`} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => downloadPhoto(photo.id)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => sharePhoto(photo.id)}
                                      >
                                        <Share2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  {photo.is_favorite && (
                                    <div className="absolute top-2 right-2">
                                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                                    </div>
                                  )}
                                </div>
                              ))}
                              {session.photos.length > 12 && (
                                <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    +{session.photos.length - 12} more
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                                <span>{session.photo_count} photos</span>
                                <span>by {session.photographer_business}</span>
                              </div>
                              <Button variant="outline" size="sm">
                                View All Photos
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredData.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Camera className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No photos found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Try adjusting your filters or import photos from your photographers.
                </p>
                <Button asChild>
                  <Link href="/client/import">Import Photos</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
