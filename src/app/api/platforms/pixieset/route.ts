import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, photographerId } = await request.json()

    if (!accessToken || !photographerId) {
      return NextResponse.json(
        { error: 'Access token and photographer ID are required' },
        { status: 400 }
      )
    }

    // Fetch galleries from Pixieset API
    const pixiesetResponse = await fetch('https://api.pixieset.com/v1/collections', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!pixiesetResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch galleries from Pixieset' },
        { status: pixiesetResponse.status }
      )
    }

    const galleries = await pixiesetResponse.json()

    // Import galleries to Supabase
    const importedGalleries = []
    for (const gallery of galleries.data) {
      const { data, error } = await supabase
        .from('photo_galleries')
        .insert({
          photographer_id: photographerId,
          platform: 'pixieset',
          platform_gallery_id: gallery.id,
          gallery_name: gallery.name,
          gallery_description: gallery.description,
          gallery_url: gallery.url,
          cover_image_url: gallery.cover_image?.url,
          photo_count: gallery.photo_count,
          session_date: gallery.created_at,
          is_imported: true,
          imported_at: new Date().toISOString()
        })
        .select()

      if (error) {
        logger.error('Error importing gallery:', error)
        continue
      }

      // Import photos for this gallery
      await importGalleryPhotos(gallery.id, data[0].id, accessToken, 'pixieset')
      importedGalleries.push(data[0])
    }

    return NextResponse.json({
      success: true,
      imported_count: importedGalleries.length,
      galleries: importedGalleries
    })

  } catch (error) {
    logger.error('Pixieset import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function importGalleryPhotos(
  platformGalleryId: string, 
  galleryId: string, 
  accessToken: string, 
  platform: string
) {
  try {
    const photosResponse = await fetch(`https://api.pixieset.com/v1/collections/${platformGalleryId}/photos`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!photosResponse.ok) {
      logger.error('Failed to fetch photos from Pixieset')
      return
    }

    const photos = await photosResponse.json()

    for (const photo of photos.data) {
      await supabase
        .from('photos')
        .insert({
          gallery_id: galleryId,
          platform_photo_id: photo.id,
          filename: photo.filename,
          original_url: photo.url,
          thumbnail_url: photo.thumbnail_url,
          medium_url: photo.medium_url,
          full_url: photo.full_url,
          file_size: photo.file_size,
          width: photo.width,
          height: photo.height,
          alt_text: photo.alt_text
        })
    }

    logger.info(`Imported ${photos.data.length} photos for gallery ${galleryId}`)
  } catch (error) {
    logger.error('Error importing photos:', error)
  }
}
