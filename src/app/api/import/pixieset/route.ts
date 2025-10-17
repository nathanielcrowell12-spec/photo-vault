import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PixiesetClient } from '@/lib/platforms/pixieset-client'
import { PhotoImportService } from '@/lib/services/photo-import-service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { galleryId, userId } = await request.json()

    if (!galleryId || !userId) {
      return NextResponse.json(
        { error: 'Gallery ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get gallery info from database
    const { data: gallery, error: galleryError } = await supabase
      .from('galleries')
      .select('*')
      .eq('id', galleryId)
      .eq('user_id', userId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: 'Gallery not found or access denied' },
        { status: 404 }
      )
    }

    if (!gallery.gallery_url) {
      return NextResponse.json(
        { error: 'Gallery URL not found' },
        { status: 400 }
      )
    }

    // Create Pixieset client with credentials
    const pixiesetClient = new PixiesetClient({
      platform: 'Pixieset',
      galleryUrl: gallery.gallery_url,
      password: gallery.gallery_password
    })

    // Create import service
    const importService = new PhotoImportService()

    // Start import in background (don't await - return immediately)
    importService.importGallery(
      pixiesetClient,
      galleryId,
      userId,
      gallery.gallery_url
    ).catch(error => {
      console.error('Background import error:', error)
      // Update gallery with error status
      supabase
        .from('galleries')
        .update({
          import_started_at: null,
          metadata: { error: error.message }
        })
        .eq('id', galleryId)
        .then()
    })

    return NextResponse.json({
      success: true,
      message: 'Photo import started',
      galleryId: galleryId
    })

  } catch (error) {
    console.error('Error starting import:', error)
    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    )
  }
}

// Pixieset API integration outline (to be implemented)
/*
async function importFromPixieset(subdomain: string, gallerySlug: string, password: string) {
  // 1. Authenticate with Pixieset (session-based with cookies)
  const authResponse = await fetch('https://galleries.pixieset.com/api/v1/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      gallery_url: `https://${subdomain}.pixieset.com/${gallerySlug}`,
      password: password
    })
  })

  // 2. Get gallery photos list
  const photosResponse = await fetch(
    `https://galleries.pixieset.com/api/v1/galleries/${subdomain}/${gallerySlug}/photos`,
    {
      headers: {
        'Cookie': authResponse.headers.get('set-cookie') || ''
      }
    }
  )

  const photos = await photosResponse.json()

  // 3. Download each photo and upload to Supabase Storage
  for (const photo of photos) {
    const photoUrl = photo.url // or photo.original_url
    const photoData = await fetch(photoUrl)
    const photoBlob = await photoData.blob()
    
    // Upload to Supabase Storage
    const fileName = `${userId}/${galleryId}/original/${photo.id}.jpg`
    await supabase.storage
      .from('photos')
      .upload(fileName, photoBlob)
    
    // Create thumbnail
    const thumbnailBlob = await createThumbnail(photoBlob)
    const thumbnailFileName = `${userId}/${galleryId}/thumbnails/${photo.id}-thumb.jpg`
    await supabase.storage
      .from('thumbnails')
      .upload(thumbnailFileName, thumbnailBlob)
    
    // Save to database
    await supabase.from('gallery_photos').insert({
      gallery_id: galleryId,
      photo_url: getPublicUrl('photos', fileName),
      thumbnail_url: getPublicUrl('thumbnails', thumbnailFileName),
      original_filename: photo.filename,
      width: photo.width,
      height: photo.height,
      taken_at: photo.taken_at
    })
  }

  // 4. Mark gallery as imported
  await supabase
    .from('galleries')
    .update({
      is_imported: true,
      import_completed_at: new Date().toISOString()
    })
    .eq('id', galleryId)
}
*/

