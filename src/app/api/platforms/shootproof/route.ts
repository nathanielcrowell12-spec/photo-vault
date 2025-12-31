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

    // Fetch galleries from ShootProof API
    const shootproofResponse = await fetch('https://api.shootproof.com/v2/studios/galleries', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!shootproofResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch galleries from ShootProof' },
        { status: shootproofResponse.status }
      )
    }

    const response = await shootproofResponse.json()
    const galleries = response.galleries || []

    // Import galleries to Supabase
    const importedGalleries = []
    for (const gallery of galleries) {
      const { data, error } = await supabase
        .from('photo_galleries')
        .insert({
          photographer_id: photographerId,
          platform: 'shootproof',
          platform_gallery_id: gallery.id,
          gallery_name: gallery.name,
          gallery_description: gallery.description,
          gallery_url: gallery.url,
          cover_image_url: gallery.cover_image_url,
          photo_count: gallery.photo_count || 0,
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
      await importGalleryPhotos(gallery.id, data[0].id, accessToken, 'shootproof')
      importedGalleries.push(data[0])
    }

    return NextResponse.json({
      success: true,
      imported_count: importedGalleries.length,
      galleries: importedGalleries
    })

  } catch (error) {
    logger.error('ShootProof import error:', error)
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
    const photosResponse = await fetch(`https://api.shootproof.com/v2/galleries/${platformGalleryId}/photos`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!photosResponse.ok) {
      logger.error('Failed to fetch photos from ShootProof')
      return
    }

    const response = await photosResponse.json()
    const photos = response.photos || []

    for (const photo of photos) {
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
          file_size: photo.file_size || 0,
          width: photo.width || 0,
          height: photo.height || 0,
          alt_text: photo.alt_text
        })
    }

    logger.info(`Imported ${photos.length} photos for gallery ${galleryId}`)
  } catch (error) {
    logger.error('Error importing photos:', error)
  }
}
