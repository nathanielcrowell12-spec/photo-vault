'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Maximize2 } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'

interface Photo {
  id: string
  url: string
  thumbnail: string
  title: string
  width: number
  height: number
}

interface GalleryGridProps {
  photos: Photo[]
  favorites: Set<string>
  onPhotoClick: (index: number) => void
  onToggleFavorite: (photoId: string) => void
}

export default function GalleryGrid({
  photos,
  favorites,
  onPhotoClick,
  onToggleFavorite
}: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => {
        const isFavorite = favorites.has(photo.id)

        return (
          <Card
            key={photo.id}
            className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
          >
            {/* Photo */}
            <div
              className="aspect-square relative bg-muted"
              onClick={() => onPhotoClick(index)}
            >
              <ImageWithFallback
                src={photo.thumbnail}
                alt={photo.title}
                className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                priority={index < 4}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Maximize2 className="h-8 w-8 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Favorite Button */}
              <Button
                variant="ghost"
                size="icon"
                className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isFavorite ? 'opacity-100' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(photo.id)
                }}
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'
                  }`}
                />
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
