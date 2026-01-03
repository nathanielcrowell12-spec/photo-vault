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

    // First, get the client record ID from the user_id
    // FK chain: auth.users.id -> clients.user_id -> clients.id -> photo_galleries.client_id
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!clientRecord) {
      return NextResponse.json({
        success: true,
        favorites: []
      })
    }

    // Get all gallery IDs for this client
    const { data: clientGalleries } = await supabase
      .from('photo_galleries')
      .select('id, gallery_name')
      .eq('client_id', clientRecord.id)

    if (!clientGalleries || clientGalleries.length === 0) {
      return NextResponse.json({
        success: true,
        favorites: []
      })
    }

    const galleryIds = clientGalleries.map(g => g.id)
    const galleryNameMap = new Map(clientGalleries.map(g => [g.id, g.gallery_name]))

    // Fetch all favorited photos from these galleries
    const { data: favorites, error: favError } = await supabase
      .from('gallery_photos')
      .select(`
        id,
        gallery_id,
        thumbnail_url,
        original_url,
        filename,
        created_at
      `)
      .in('gallery_id', galleryIds)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false })

    if (favError) {
      logger.error('[Favorites] Error:', favError)
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      )
    }

    // Add gallery name to each photo
    const favoritesWithGallery = (favorites || []).map(photo => ({
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
