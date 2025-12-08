import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/family/shared-galleries
 * Get all galleries shared with the current user as a secondary
 * 
 * Returns galleries where:
 * - User is an accepted secondary on an account
 * - The gallery belongs to that account's primary
 * - The gallery has is_family_shared = true
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

    // Find all accounts where user is an accepted secondary
    const { data: secondaryRecords, error: secondaryError } = await serviceSupabase
      .from('secondaries')
      .select(`
        id,
        account_id,
        relationship,
        accepted_at
      `)
      .eq('secondary_user_id', user.id)
      .eq('status', 'accepted')

    if (secondaryError) {
      console.error('[Shared Galleries] Error fetching secondary records:', secondaryError)
      return NextResponse.json(
        { error: 'Failed to fetch secondary access' },
        { status: 500 }
      )
    }

    if (!secondaryRecords || secondaryRecords.length === 0) {
      return NextResponse.json({
        galleries: [],
        account_count: 0
      })
    }

    // Get account IDs where user is a secondary
    const accountIds = secondaryRecords.map(s => s.account_id)

    // Get primary account holders' info
    const { data: primaryProfiles, error: profileError } = await serviceSupabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', accountIds)

    if (profileError) {
      console.error('[Shared Galleries] Error fetching primary profiles:', profileError)
    }

    // Create a map of account_id -> primary name
    const primaryNames = new Map(
      (primaryProfiles || []).map(p => [p.id, p.full_name || 'Account Holder'])
    )

    // Get subscription status for each account
    const { data: subscriptions } = await serviceSupabase
      .from('subscriptions')
      .select('user_id, status, access_suspended, cancel_at_period_end, last_payment_failure_at')
      .in('user_id', accountIds)

    // Create a map of account_id -> account status
    const accountStatuses = new Map<string, { status: 'active' | 'grace_period' | 'suspended', needsAttention: boolean }>(
      accountIds.map(id => {
        const sub = subscriptions?.find(s => s.user_id === id)
        if (sub?.access_suspended) {
          return [id, { status: 'suspended' as const, needsAttention: true }]
        } else if (sub?.cancel_at_period_end || sub?.status === 'past_due') {
          return [id, { status: 'grace_period' as const, needsAttention: true }]
        }
        return [id, { status: 'active' as const, needsAttention: false }]
      })
    )

    // Fetch all family-shared galleries for those accounts
    const { data: galleries, error: galleriesError } = await serviceSupabase
      .from('photo_galleries')
      .select(`
        id,
        gallery_name,
        gallery_description,
        cover_image_url,
        platform,
        photographer_name,
        session_date,
        photo_count,
        created_at,
        client_id
      `)
      .in('client_id', accountIds)
      .eq('is_family_shared', true)
      .order('created_at', { ascending: false })

    if (galleriesError) {
      console.error('[Shared Galleries] Error fetching galleries:', galleriesError)
      return NextResponse.json(
        { error: 'Failed to fetch shared galleries' },
        { status: 500 }
      )
    }

    // Enrich galleries with primary name, relationship, and account status
    const enrichedGalleries = (galleries || []).map(gallery => {
      const secondaryRecord = secondaryRecords.find(s => s.account_id === gallery.client_id)
      const accountStatus = accountStatuses.get(gallery.client_id)
      return {
        ...gallery,
        primary_name: primaryNames.get(gallery.client_id) || 'Account Holder',
        relationship: secondaryRecord?.relationship || 'family',
        shared_by_account_id: gallery.client_id,
        account_status: accountStatus?.status || 'active',
        needs_attention: accountStatus?.needsAttention || false
      }
    })

    // Get unique accounts that need attention
    const accountsNeedingAttention = [...new Set(
      enrichedGalleries
        .filter(g => g.needs_attention)
        .map(g => g.shared_by_account_id)
    )]

    console.log(`[Shared Galleries] User ${user.id} has access to ${enrichedGalleries.length} shared galleries from ${accountIds.length} accounts`)

    return NextResponse.json({
      galleries: enrichedGalleries,
      account_count: accountIds.length,
      accounts_needing_attention: accountsNeedingAttention
    })

  } catch (error) {
    console.error('[Shared Galleries] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

