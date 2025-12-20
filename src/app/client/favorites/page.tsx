'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Heart,
  Camera,
  Loader2,
  Image,
  Download,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface FavoritePhoto {
  id: string
  gallery_id: string
  gallery_name: string
  thumbnail_url: string | null
  original_url: string | null
  filename: string | null
  created_at: string
}

export default function FavoritesPage() {
  const { user, userType, loading: authLoading } = useAuth()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoritePhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<FavoritePhoto | null>(null)

  useEffect(() => {
    if (!authLoading && userType !== 'client' && userType !== null) {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType, authLoading])

  useEffect(() => {
    if (userType === 'client') {
      fetchFavorites()
    }
  }, [userType])

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/client/favorites')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFavorites(data.favorites || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (photo: FavoritePhoto) => {
    if (!photo.original_url) return

    try {
      const response = await fetch(photo.original_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.filename || `photo-${photo.id}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
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
              <Heart className="h-6 w-6 text-red-500" />
              <span className="text-xl font-bold text-foreground">My Favorites</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200">
              {favorites.length} {favorites.length === 1 ? 'Photo' : 'Photos'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Loading State */}
          {loading && (
            <Card className="text-center py-12 bg-card/50 border-border">
              <CardContent>
                <Loader2 className="h-12 w-12 text-red-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">Loading your favorites...</h3>
                <p className="text-muted-foreground">Fetching your favorited photos</p>
              </CardContent>
            </Card>
          )}

          {/* Favorites Grid */}
          {!loading && favorites.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {favorites.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square bg-card rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  {photo.thumbnail_url ? (
                    <img
                      src={photo.thumbnail_url}
                      alt={photo.filename || 'Favorite photo'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(photo)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/gallery/${photo.gallery_id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Heart indicator */}
                  <div className="absolute top-2 right-2">
                    <Heart className="h-5 w-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>

                  {/* Gallery name badge */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-foreground text-sm truncate">{photo.gallery_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && favorites.length === 0 && (
            <Card className="text-center py-12 bg-card/50 border-border">
              <CardContent>
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">No favorites yet</h3>
                <p className="text-muted-foreground mb-4">
                  Mark photos as favorites while viewing your galleries to see them here.
                </p>
                <Button asChild>
                  <Link href="/client/dashboard">Browse Galleries</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lightbox */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <div className="relative max-w-5xl max-h-[90vh] w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 text-foreground z-10"
                  onClick={() => setSelectedPhoto(null)}
                >
                  Close
                </Button>

                {selectedPhoto.original_url || selectedPhoto.thumbnail_url ? (
                  <img
                    src={selectedPhoto.original_url || selectedPhoto.thumbnail_url || ''}
                    alt={selectedPhoto.filename || 'Photo'}
                    className="max-w-full max-h-[85vh] mx-auto object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center bg-card rounded-lg">
                    <Image className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 px-4 py-2 rounded-lg">
                  <span className="text-foreground text-sm">{selectedPhoto.gallery_name}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(selectedPhoto)
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
