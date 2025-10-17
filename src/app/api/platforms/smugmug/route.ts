import { NextRequest, NextResponse } from 'next/server'
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

    // Fetch galleries from SmugMug API
    const smugmugResponse = await fetch('https://api.smugmug.com/api/v2/user/NickName!/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!smugmugResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch galleries from SmugMug' },
        { status: smugmugResponse.status }
      )
    }

    const response = await smugmugResponse.json()
    const albums = response.Response?.Album || []

    // Import galleries to Supabase
    const importedGalleries = []
    for (const album of albums) {
      const { data, error } = await supabase
        .from('photo_galleries')
        .insert({
          photographer_id: photographerId,
          platform: 'smugmug',
          platform_gallery_id: album.AlbumKey,
          gallery_name: album.Name,
          gallery_description: album.Description,
          gallery_url: album.WebUri,
          cover_image_url: album.ImageCount > 0 ? album.Uris?.AlbumImages?.Uri : null,
          photo_count: album.ImageCount || 0,
          session_date: album.DateCreated,
          is_imported: true,
          imported_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Error importing gallery:', error)
        continue
      }

      // Import photos for this gallery
      await importGalleryPhotos(album.AlbumKey, data[0].id, accessToken, 'smugmug')
      importedGalleries.push(data[0])
    }

    return NextResponse.json({
      success: true,
      imported_count: importedGalleries.length,
      galleries: importedGalleries
    })

  } catch (error) {
    console.error('SmugMug import error:', error)
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
    const photosResponse = await fetch(`https://api.smugmug.com/api/v2/album/${platformGalleryId}!images`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!photosResponse.ok) {
      console.error('Failed to fetch photos from SmugMug')
      return
    }

    const response = await photosResponse.json()
    const images = response.Response?.AlbumImage || []

    for (const image of images) {
      await supabase
        .from('photos')
        .insert({
          gallery_id: galleryId,
          platform_photo_id: image.ImageKey,
          filename: image.FileName,
          original_url: image.Uris?.LargestImage?.Uri,
          thumbnail_url: image.Uris?.SmallImage?.Uri,
          medium_url: image.Uris?.MediumImage?.Uri,
          full_url: image.Uris?.LargestImage?.Uri,
          file_size: image.Size || 0,
          width: image.Width || 0,
          height: image.Height || 0,
          alt_text: image.Title
        })
    }

    console.log(`Imported ${images.length} photos for gallery ${galleryId}`)
  } catch (error) {
    console.error('Error importing photos:', error)
  }
}
