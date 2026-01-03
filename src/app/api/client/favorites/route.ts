import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get ALL client records for this user (clients can have multiple records)
    // FK chain: auth.users.id -> clients.user_id -> clients.id -> photo_galleries.client_id
    logger.info('[Favorites] User ID:', user.id)

    const { data: clientRecords, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)

    logger.info('[Favorites] Client records:', { clientRecords, clientError })

    if (!clientRecords || clientRecords.length === 0) {
      logger.info('[Favorites] No client records found, returning empty')
      return NextResponse.json({
        success: true,
        favorites: []
      })
    }

    const clientIds = clientRecords.map(c => c.id)
    logger.info('[Favorites] Client IDs:', clientIds)

    // Get all gallery IDs for ALL client records
    const { data: clientGalleries, error: galleriesError } = await supabase
      .from('photo_galleries')
      .select('id, gallery_name')
      .in('client_id', clientIds)

    logger.info('[Favorites] Galleries:', { clientGalleries, galleriesError })

    if (!clientGalleries || clientGalleries.length === 0) {
      logger.info('[Favorites] No galleries found, returning empty')
      return NextResponse.json({
        success: true,
        favorites: []
      })
    }

    const galleryIds = clientGalleries.map(g => g.id)
    logger.info('[Favorites] Gallery IDs:', galleryIds)
    const galleryNameMap = new Map(clientGalleries.map(g => [g.id, g.gallery_name]))

    // Fetch favorited photos from BOTH tables (photos = desktop, gallery_photos = web)
    const [photosResult, galleryPhotosResult] = await Promise.all([
      supabase
        .from('photos')
        .select('id, gallery_id, thumbnail_url, original_url, filename, created_at')
        .in('gallery_id', galleryIds)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('gallery_photos')
        .select('id, gallery_id, thumbnail_url, original_url, filename, created_at')
        .in('gallery_id', galleryIds)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false })
    ])

    logger.info('[Favorites] Photos result:', { data: photosResult.data?.length, error: photosResult.error })
    logger.info('[Favorites] Gallery photos result:', { data: galleryPhotosResult.data?.length, error: galleryPhotosResult.error })

    if (photosResult.error) {
      logger.error('[Favorites] Error querying photos:', photosResult.error)
    }
    if (galleryPhotosResult.error) {
      logger.error('[Favorites] Error querying gallery_photos:', galleryPhotosResult.error)
    }

    // Combine results from both tables
    const allFavorites = [
      ...(photosResult.data || []),
      ...(galleryPhotosResult.data || [])
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Add gallery name to each photo
    const favoritesWithGallery = allFavorites.map(photo => ({
      ...photo,
      gallery_name: galleryNameMap.get(photo.gallery_id) || 'Unknown Gallery'
    }))

    return NextResponse.json({
      success: true,
      favorites: favoritesWithGallery
    })
  } catch (error) {
    logger.error('[Favorites] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}
