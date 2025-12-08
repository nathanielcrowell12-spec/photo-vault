import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/galleries/[id]/sharing
 * Get the family sharing status of a gallery
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: galleryId } = await params

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // Get gallery with sharing status
    const { data: gallery, error: galleryError } = await serviceSupabase
      .from('photo_galleries')
      .select('id, client_id, is_family_shared')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Check user owns this gallery
    if (gallery.client_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only view sharing status of your own galleries' },
        { status: 403 }
      )
    }

    // Check if user has family sharing enabled
    const { data: profile } = await serviceSupabase
      .from('user_profiles')
      .select('family_sharing_enabled')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      gallery_id: gallery.id,
      is_family_shared: gallery.is_family_shared || false,
      family_sharing_enabled: profile?.family_sharing_enabled || false
    })

  } catch (error) {
    console.error('[Gallery Sharing GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/galleries/[id]/sharing
 * Toggle family sharing for a gallery
 * 
 * Body: { is_family_shared: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: galleryId } = await params

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { is_family_shared } = body

    if (typeof is_family_shared !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. "is_family_shared" must be a boolean.' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // Get gallery to verify ownership
    const { data: gallery, error: galleryError } = await serviceSupabase
      .from('photo_galleries')
      .select('id, client_id, gallery_name')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Check user owns this gallery
    if (gallery.client_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only change sharing status of your own galleries' },
        { status: 403 }
      )
    }

    // Check if user has family sharing enabled (required to share galleries)
    const { data: profile } = await serviceSupabase
      .from('user_profiles')
      .select('family_sharing_enabled')
      .eq('id', user.id)
      .single()

    if (is_family_shared && !profile?.family_sharing_enabled) {
      return NextResponse.json(
        { error: 'Enable family sharing in settings first before sharing galleries' },
        { status: 400 }
      )
    }

    // Update gallery sharing status
    const { error: updateError } = await serviceSupabase
      .from('photo_galleries')
      .update({
        is_family_shared,
        updated_at: new Date().toISOString()
      })
      .eq('id', galleryId)

    if (updateError) {
      console.error('[Gallery Sharing PATCH] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update sharing status' },
        { status: 500 }
      )
    }

    // Also update/create gallery_sharing record for audit trail
    const { error: sharingError } = await serviceSupabase
      .from('gallery_sharing')
      .upsert({
        gallery_id: galleryId,
        account_id: user.id,
        is_family_shared,
        shared_at: is_family_shared ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'gallery_id'
      })

    if (sharingError) {
      console.warn('[Gallery Sharing PATCH] Gallery sharing record error:', sharingError)
      // Don't fail - the main update succeeded
    }

    console.log(`[Gallery Sharing] Gallery ${galleryId} sharing ${is_family_shared ? 'enabled' : 'disabled'} by user ${user.id}`)

    return NextResponse.json({
      success: true,
      gallery_id: galleryId,
      is_family_shared,
      message: is_family_shared
        ? `"${gallery.gallery_name}" is now shared with your family members`
        : `"${gallery.gallery_name}" is no longer shared with family`
    })

  } catch (error) {
    console.error('[Gallery Sharing PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

