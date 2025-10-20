'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Camera, User, ExternalLink, Edit } from 'lucide-react'
import { Gallery } from '@/types/gallery'
import { NAVIGATION_ROUTES } from '@/lib/component-constants'

interface GalleryCardProps {
  gallery: Gallery
  isPhotographer: boolean
  onEdit: (gallery: Gallery) => void
  onNavigate: (url: string) => void
}

export function GalleryCard({ gallery, isPhotographer, onEdit, onNavigate }: GalleryCardProps) {
  const handleImportClick = () => {
    onNavigate(NAVIGATION_ROUTES.CLIENT_IMPORT)
  }

  const handleEditClick = () => {
    onEdit(gallery)
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        {/* Cover Image */}
        <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100 aspect-video">
          {gallery.cover_image_url ? (
            <img
              src={gallery.cover_image_url}
              alt={gallery.gallery_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Platform Badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-white/90 text-gray-800"
          >
            {gallery.platform}
          </Badge>
        </div>

        {/* Gallery Info */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{gallery.gallery_name}</h3>
            {gallery.gallery_description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {gallery.gallery_description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Camera className="h-4 w-4" />
                <span>{gallery.photo_count}</span>
              </div>
              {gallery.session_date && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(gallery.session_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Photographer Info (for clients) */}
          {!isPhotographer && gallery.photographer_name && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>by {gallery.photographer_name}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            {isPhotographer ? (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleEditClick}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {gallery.gallery_url && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(gallery.gallery_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={handleImportClick}
                className="flex-1"
              >
                Import Photos
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}