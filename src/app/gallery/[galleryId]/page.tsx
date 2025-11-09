'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Grid3X3, 
  Maximize2,
  Download,
  Heart,
  Share2,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Camera,
  Upload
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
  session_date?: string
  photo_count: number
  gallery_url?: string
  is_imported: boolean
  import_started_at?: string
  import_completed_at?: string
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
  const { user, loading: authLoading } = useAuth()
  const [gallery, setGallery] = useState<Gallery | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'slideshow'>('grid')
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [showManualUpload, setShowManualUpload] = useState(false)

  const galleryId = params.galleryId as string

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

      // Fetch gallery info
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', galleryId)
        .single()

      console.log('[Gallery] Gallery query result:', { galleryData, galleryError })

      if (galleryError) {
        console.error('[Gallery] Gallery error:', galleryError)
        throw galleryError
      }

      setGallery(galleryData)

      // Fetch photos for this gallery
      const { data: photosData, error: photosError } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: true })

      console.log('[Gallery] Photos query result:', {
        count: photosData?.length,
        photosError,
        photosData,
        galleryId
      })

      if (photosError) {
        console.error('[Gallery] Photos error:', photosError)
      }

      setPhotos(photosData || [])
      console.log('[Gallery] Successfully loaded gallery with', photosData?.length || 0, 'photos')

    } catch (error) {
      console.error('[Gallery] Error fetching gallery:', error)
      console.error('[Gallery] Error details:', JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }, [galleryId])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchGallery()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, galleryId])

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
          .from('galleries')
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Gallery Not Found</h2>
            <p className="text-slate-600 mb-4">This gallery doesn&apos;t exist or you don&apos;t have access to it.</p>
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

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-border bg-white dark:bg-slate-900 sticky top-0 z-40">
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
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download All
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
                    <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={closeSlideshow}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Previous Button */}
            {selectedPhotoIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20"
                onClick={prevPhoto}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Photo */}
            <div className="max-w-7xl max-h-screen p-8">
              <img
                src={photos[selectedPhotoIndex].photo_url}
                loading="lazy"
                alt={photos[selectedPhotoIndex].original_filename || `Photo ${selectedPhotoIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
              />
              
              {/* Photo Counter */}
              <div className="text-center mt-4 text-white text-sm">
                {selectedPhotoIndex + 1} of {photos.length}
              </div>
            </div>

            {/* Next Button */}
            {selectedPhotoIndex < photos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20"
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

