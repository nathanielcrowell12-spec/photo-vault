import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Admin client bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a client
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || profile.user_type !== 'client') {
      return NextResponse.json({ error: 'Only clients can use this endpoint' }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const {
      gallery_name,
      gallery_description,
      photo_count,
      session_date,
      metadata
    } = body

    if (!gallery_name) {
      return NextResponse.json({ error: 'Gallery name is required' }, { status: 400 })
    }

    // Look up the client record
    const { data: clientRecord } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    // Create gallery using admin client (bypasses RLS)
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('photo_galleries')
      .insert({
        photographer_id: null,
        client_id: clientRecord?.id || null,
        user_id: user.id, // Also set user_id for ownership
        gallery_name,
        gallery_description: gallery_description || null,
        photo_count: photo_count || 0,
        session_date: session_date || new Date().toISOString(),
        platform: 'photovault',
        gallery_status: 'draft',
        metadata: metadata || null
      })
      .select()
      .single()

    if (galleryError) {
      console.error('Error creating gallery:', galleryError)
      return NextResponse.json(
        { error: galleryError.message, details: galleryError },
        { status: 500 }
      )
    }

    return NextResponse.json({ gallery })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
