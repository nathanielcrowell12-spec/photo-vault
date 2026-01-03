import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to find photo in both tables (photos = desktop uploader, gallery_photos = web imports)
    let photo: { id: string; gallery_id: string; is_favorite: boolean } | null = null
    let photoTable: 'photos' | 'gallery_photos' = 'photos'

    // First try 'photos' table (canonical, used by desktop uploader)
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('id, gallery_id, is_favorite')
      .eq('id', photoId)
      .maybeSingle()

    if (photosData) {
      photo = photosData
      photoTable = 'photos'
    } else {
      // Try 'gallery_photos' table (legacy, used by web imports)
      const { data: galleryPhotosData, error: galleryPhotosError } = await supabase
        .from('gallery_photos')
        .select('id, gallery_id, is_favorite')
        .eq('id', photoId)
        .maybeSingle()

      if (galleryPhotosData) {
        photo = galleryPhotosData
        photoTable = 'gallery_photos'
      } else {
        logger.error('[Favorite API] Photo not found in either table:', { photosError, galleryPhotosError })
        return NextResponse.json(
          { error: 'Photo not found' },
          { status: 404 }
        )
      }
    }

    // Get gallery to verify access
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select(`
        id,
        client_id,
        user_id,
        photographer_id,
        clients (
          user_id
        )
      `)
      .eq('id', photo.gallery_id)
      .single()

    if (galleryError || !gallery) {
      logger.error('[Favorite API] Gallery not found:', galleryError)
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this photo's gallery
    // Access granted if:
    // 1. User owns the gallery directly (user_id) - for self-uploaded galleries
    // 2. User is the photographer
    // 3. User is linked to a client record that's assigned to this gallery
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientData = (gallery as any).clients
    const clientUserId = Array.isArray(clientData)
      ? clientData[0]?.user_id
      : clientData?.user_id

    const hasAccess =
      gallery.user_id === user.id ||
      gallery.photographer_id === user.id ||
      clientUserId === user.id

    if (!hasAccess) {
      logger.error('[Favorite API] User does not have access to this photo:', {
        userId: user.id,
        galleryUserId: gallery.user_id,
        photographerId: gallery.photographer_id,
        clientUserId
      })
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Toggle the favorite status in the correct table
    const newFavoriteStatus = !photo.is_favorite

    const { error: updateError } = await supabase
      .from(photoTable)
      .update({ is_favorite: newFavoriteStatus })
      .eq('id', photoId)

    if (updateError) {
      logger.error('[Favorite API] Failed to update:', updateError)
      return NextResponse.json(
        { error: 'Failed to update favorite status' },
        { status: 500 }
      )
    }

    logger.info(`[Favorite API] Photo ${photoId} in ${photoTable} is_favorite set to ${newFavoriteStatus}`)

    return NextResponse.json({
      success: true,
      is_favorite: newFavoriteStatus
    })
  } catch (error) {
    logger.error('[Favorite API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
