'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Camera, User, ExternalLink, Edit } from 'lucide-react'
import { Gallery } from '@/types/gallery'
import { NAVIGATION_ROUTES, UI_CONSTANTS, NavigationUtils } from '@/lib/component-constants'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'

interface GalleryCardProps {
  gallery: Gallery
  isPhotographer: boolean
  onEdit: (gallery: Gallery) => void
  onNavigate: (url: string) => void
  onImageError?: (galleryId: string, imageUrl: string) => void
}

export function GalleryCard({ gallery, isPhotographer, onEdit, onNavigate, onImageError }: GalleryCardProps) {
  const handleImportClick = () => {
    onNavigate(NAVIGATION_ROUTES.CLIENT_IMPORT)
  }

  const handleEditClick = () => {
    onEdit(gallery)
  }

  const handleExternalLinkClick = () => {
    if (gallery.gallery_url) {
      NavigationUtils.openExternalLink(gallery.gallery_url)
    }
  }

  const handleImageError = () => {
    onImageError?.(gallery.id, gallery.cover_image_url || '')
  }

  return (
    <Card className={`group hover:shadow-lg transition-shadow ${UI_CONSTANTS.TRANSITION_DURATION_FAST}`}>
      <CardContent className="p-4">
        {/* Cover Image */}
        <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100 aspect-video">
          <ImageWithFallback
            src={gallery.cover_image_url}
            alt={gallery.gallery_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={handleImageError}
          />
          
          {/* Platform Badge */}
          <Badge 
            variant="secondary" 
            className={`absolute ${UI_CONSTANTS.BADGE_TOP_RIGHT} bg-white/90 text-gray-800`}
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
                <Camera className={UI_CONSTANTS.ICON_SIZE_SMALL} />
                <span>{gallery.photo_count}</span>
              </div>
              {gallery.session_date && (
                <div className="flex items-center space-x-1">
                  <Calendar className={UI_CONSTANTS.ICON_SIZE_SMALL} />
                  <span>{new Date(gallery.session_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Photographer Info (for clients) */}
          {!isPhotographer && gallery.photographer_name && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className={UI_CONSTANTS.ICON_SIZE_SMALL} />
              <span>{UI_CONSTANTS.PHOTOGRAPHER_BY_PREFIX} {gallery.photographer_name}</span>
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
                  <Edit className={`${UI_CONSTANTS.ICON_SIZE_SMALL} mr-1`} />
                  {UI_CONSTANTS.EDIT_TEXT}
                </Button>
                {gallery.gallery_url && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleExternalLinkClick}
                  >
                    <ExternalLink className={UI_CONSTANTS.ICON_SIZE_SMALL} />
                  </Button>
                )}
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={handleImportClick}
                className="flex-1"
              >
                {UI_CONSTANTS.IMPORT_PHOTOS_TEXT}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}