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

    // First, get the client record(s) linked to this auth user
    // The clients table has user_id FK to auth.users
    const { data: clientRecords } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)

    const clientIds = clientRecords?.map(c => c.id) || []

    // Get total galleries count for this client
    // photo_galleries.client_id references clients.id, NOT auth.users.id
    let galleriesCount = 0
    if (clientIds.length > 0) {
      const { count } = await supabase
        .from('photo_galleries')
        .select('*', { count: 'exact', head: true })
        .in('client_id', clientIds)
      galleriesCount = count || 0
    }

    // Get total photos count across all client's galleries
    // Using a subquery approach: get gallery IDs first, then count photos
    const { data: clientGalleries } = clientIds.length > 0
      ? await supabase
          .from('photo_galleries')
          .select('id')
          .in('client_id', clientIds)
      : { data: [] }

    let photosCount = 0
    if (clientGalleries && clientGalleries.length > 0) {
      const galleryIds = clientGalleries.map(g => g.id)

      // Try gallery_photos table first (newer table)
      const { count: galleryPhotosCount } = await supabase
        .from('gallery_photos')
        .select('*', { count: 'exact', head: true })
        .in('gallery_id', galleryIds)

      if (galleryPhotosCount !== null) {
        photosCount = galleryPhotosCount
      } else {
        // Fallback to photos table if gallery_photos doesn't work
        const { count: fallbackCount } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .in('gallery_id', galleryIds)

        photosCount = fallbackCount || 0
      }
    }

    // Get recent galleries for Recent Sessions section (limit 3)
    const { data: recentGalleries } = clientIds.length > 0
      ? await supabase
          .from('photo_galleries')
          .select(`
            id,
            gallery_name,
            created_at,
            cover_image_url,
            photo_count
          `)
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })
          .limit(3)
      : { data: [] }

    // Get favorites count from gallery_photos
    let favoritesCount = 0
    if (clientGalleries && clientGalleries.length > 0) {
      const galleryIds = clientGalleries.map(g => g.id)

      const { count: favCount } = await supabase
        .from('gallery_photos')
        .select('*', { count: 'exact', head: true })
        .in('gallery_id', galleryIds)
        .eq('is_favorite', true)

      favoritesCount = favCount || 0
    }

    // Map gallery_name to name for frontend compatibility
    const mappedGalleries = (recentGalleries || []).map(g => ({
      id: g.id,
      name: g.gallery_name || 'Untitled Gallery',
      created_at: g.created_at,
      cover_image_url: g.cover_image_url,
      photo_count: g.photo_count
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalPhotos: photosCount,
        photoSessions: galleriesCount || 0,
        favorites: favoritesCount
      },
      recentGalleries: mappedGalleries
    })
  } catch (error) {
    logger.error('[ClientStats] Error fetching client stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
