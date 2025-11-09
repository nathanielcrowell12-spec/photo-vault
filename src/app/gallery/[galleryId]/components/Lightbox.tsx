'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight, Heart, Download } from 'lucide-react'

interface Photo {
  id: string
  url: string
  thumbnail: string
  title: string
  width: number
  height: number
}

interface LightboxProps {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  favorites: Set<string>
  onToggleFavorite: (photoId: string) => void
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  favorites,
  onToggleFavorite
}: LightboxProps) {
  const currentPhoto = photos[currentIndex]
  const isFavorite = favorites.has(currentPhoto.id)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1)
      }
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
        onNavigate(currentIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, onClose, onNavigate, photos.length])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = currentPhoto.url
    link.download = `${currentPhoto.title}.jpg`
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white">
          <h3 className="font-medium">{currentPhoto.title}</h3>
          <p className="text-sm text-slate-300">
            {currentIndex + 1} of {photos.length}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => onToggleFavorite(currentPhoto.id)}
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? 'fill-red-500 text-red-500' : ''
              }`}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Previous Button */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 text-white hover:bg-white/20 h-12 w-12"
          onClick={() => onNavigate(currentIndex - 1)}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {/* Image */}
      <div className="max-w-7xl max-h-screen p-16">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.title}
          className="max-w-full max-h-[85vh] object-contain"
        />
      </div>

      {/* Next Button */}
      {currentIndex < photos.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 text-white hover:bg-white/20 h-12 w-12"
          onClick={() => onNavigate(currentIndex + 1)}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Bottom Thumbnail Strip */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center space-x-2 overflow-x-auto">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => onNavigate(index)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all ${
                index === currentIndex
                  ? 'ring-2 ring-white scale-110'
                  : 'opacity-50 hover:opacity-100'
              }`}
            >
              <img
                src={photo.thumbnail}
                alt={photo.title}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
