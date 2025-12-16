import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role to bypass RLS for public gallery viewing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

/**
 * GET /api/gallery/[galleryId]
 * Public endpoint to fetch gallery info for paywall display
 * Returns limited info - full access requires subscription
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await params

    if (!galleryId) {
      return NextResponse.json({ error: 'Gallery ID required' }, { status: 400 })
    }

    // Fetch gallery with photographer info
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('photo_galleries')
      .select(`
        id,
        gallery_name,
        gallery_description,
        platform,
        photographer_id,
        client_id,
        photo_count,
        total_amount,
        shoot_fee,
        storage_fee,
        payment_option_id,
        billing_mode,
        is_imported
      `)
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      console.error('[API Gallery] Error:', galleryError)
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Get photographer name
    const { data: photographer } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name')
      .eq('id', gallery.photographer_id)
      .single()

    // Fetch photos (just thumbnails for preview)
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('gallery_photos')
      .select('id, thumbnail_url, original_url')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: true })
      .limit(6) // Only return first 6 for preview

    if (photosError) {
      console.error('[API Gallery] Photos error:', photosError)
    }

    return NextResponse.json({
      gallery: {
        ...gallery,
        photographer_name: photographer?.full_name || 'Your Photographer'
      },
      photos: photos || []
    })

  } catch (error) {
    console.error('[API Gallery] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    )
  }
}
