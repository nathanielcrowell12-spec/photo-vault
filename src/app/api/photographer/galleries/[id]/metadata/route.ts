import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface MetadataUpdate {
  event_date?: string | null
  location?: string | null
  people?: string[]
  event_type?: string | null
  photographer_name?: string | null
  notes?: string | null
  metadata?: Record<string, unknown>
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: galleryId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates: MetadataUpdate = await request.json()

    // Verify gallery belongs to photographer
    const { data: gallery, error: fetchError } = await supabase
      .from('photo_galleries')
      .select('id, photographer_id')
      .eq('id', galleryId)
      .single()

    if (fetchError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    if (gallery.photographer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update metadata
    const { data: updated, error: updateError } = await supabase
      .from('photo_galleries')
      .update(updates)
      .eq('id', galleryId)
      .select('id, event_date, location, people, event_type, photographer_name, notes, metadata')
      .single()

    if (updateError) {
      console.error('[Metadata] Update error:', updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    // Trigger materialized view refresh (async, don't wait)
    supabase.rpc('refresh_gallery_metadata_suggestions').then((result) => {
      if (result.error) {
        console.error('[Metadata] Failed to refresh suggestions:', result.error)
      } else {
        console.log('[Metadata] Refreshed suggestions view')
      }
    })

    return NextResponse.json({
      success: true,
      gallery: updated
    })
  } catch (error) {
    console.error('[Metadata] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id: galleryId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: gallery, error } = await supabase
      .from('photo_galleries')
      .select('id, event_date, location, people, event_type, photographer_name, notes, metadata')
      .eq('id', galleryId)
      .single()

    if (error || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      gallery
    })
  } catch (error) {
    console.error('[Metadata] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
