import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

    // Get total galleries count for this client
    const { count: galleriesCount } = await supabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id)

    // Get total photos count across all client's galleries
    // Using a subquery approach: get gallery IDs first, then count photos
    const { data: clientGalleries } = await supabase
      .from('photo_galleries')
      .select('id')
      .eq('client_id', user.id)

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
    const { data: recentGalleries } = await supabase
      .from('photo_galleries')
      .select(`
        id,
        name,
        created_at,
        cover_photo_url,
        photo_count
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    // Downloads and favorites are not tracked yet - return null to indicate not implemented
    const downloaded = null
    const favorites = null

    return NextResponse.json({
      success: true,
      stats: {
        totalPhotos: photosCount,
        photoSessions: galleriesCount || 0,
        downloaded: downloaded,
        favorites: favorites,
        // Flag to indicate which features aren't implemented yet
        notImplemented: ['downloaded', 'favorites']
      },
      recentGalleries: recentGalleries || []
    })
  } catch (error) {
    console.error('[API] Error fetching client stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
