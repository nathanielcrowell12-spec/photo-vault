import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/family/enable
 * Enable or disable family sharing on the current user's account
 * 
 * Body: { enabled: boolean }
 * 
 * Only the primary account holder (client with subscription) can enable family sharing.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. "enabled" must be a boolean.' },
        { status: 400 }
      )
    }

    // 3. Use service role for the update (bypasses RLS)
    const serviceSupabase = createServiceRoleClient()

    // 4. Check user is a client (has a subscription/gallery access)
    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('id, user_type, family_sharing_enabled')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Only clients can enable family sharing (they're the ones with gallery access)
    if (profile.user_type !== 'client') {
      return NextResponse.json(
        { error: 'Only clients can enable family sharing' },
        { status: 403 }
      )
    }

    // 5. Update family sharing status
    const { error: updateError } = await serviceSupabase
      .from('user_profiles')
      .update({
        family_sharing_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Family Enable] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update family sharing status' },
        { status: 500 }
      )
    }

    console.log(`[Family Enable] User ${user.id} ${enabled ? 'enabled' : 'disabled'} family sharing`)

    return NextResponse.json({
      success: true,
      family_sharing_enabled: enabled,
      message: enabled 
        ? 'Family sharing enabled. You can now invite family members.'
        : 'Family sharing disabled. Existing secondaries will lose access.'
    })

  } catch (error) {
    console.error('[Family Enable] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/family/enable
 * Get current family sharing status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    const { data: profile, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('family_sharing_enabled, max_secondaries')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get current secondary count
    const { count: secondaryCount } = await serviceSupabase
      .from('secondaries')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', user.id)
      .in('status', ['pending', 'accepted'])

    return NextResponse.json({
      family_sharing_enabled: profile.family_sharing_enabled || false,
      max_secondaries: profile.max_secondaries || 5,
      current_secondary_count: secondaryCount || 0
    })

  } catch (error) {
    console.error('[Family Enable GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

