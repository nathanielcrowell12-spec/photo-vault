/**
 * Photographer Commissions API
 * GET /api/photographer/commissions
 *
 * Returns the photographer's commission history and totals.
 * With Stripe Connect destination charges, all commissions are "paid" immediately.
 * Money settles to photographer's bank in ~2 days (Stripe standard).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import {
  getPhotographerCommissions,
  getPhotographerCommissionTotals,
} from '@/lib/server/commission-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a photographer
    const adminClient = createServiceRoleClient()
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'photographer') {
      return NextResponse.json(
        { error: 'Only photographers can access this endpoint' },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch commissions and totals in parallel
    const [commissions, totals] = await Promise.all([
      getPhotographerCommissions(user.id, limit),
      getPhotographerCommissionTotals(user.id),
    ])

    // Get gallery names for each commission
    const galleryIds = [...new Set(commissions.map(c => c.gallery_id).filter(Boolean))]
    let galleries: Record<string, string> = {}

    if (galleryIds.length > 0) {
      const { data: galleryData } = await adminClient
        .from('photo_galleries')
        .select('id, gallery_name')
        .in('id', galleryIds)

      if (galleryData) {
        galleries = Object.fromEntries(
          galleryData.map(g => [g.id, g.gallery_name])
        )
      }
    }

    // Enrich commissions with gallery names
    const enrichedCommissions = commissions.map(commission => ({
      ...commission,
      gallery_name: galleries[commission.gallery_id] || 'Unknown Gallery',
      amount_dollars: commission.amount_cents / 100,
      total_paid_dollars: commission.total_paid_cents / 100,
      shoot_fee_dollars: commission.shoot_fee_cents / 100,
      storage_fee_dollars: commission.storage_fee_cents / 100,
      photovault_commission_dollars: commission.photovault_commission_cents / 100,
    }))

    return NextResponse.json({
      commissions: enrichedCommissions,
      totals,
      meta: {
        count: commissions.length,
        limit,
        // With destination charges, there's no "pending" - everything is paid immediately
        // Stripe handles 2-day settlement to photographer's bank
        payoutInfo: 'Earnings are automatically deposited to your bank account within 2 business days via Stripe.',
      },
    })
  } catch (error) {
    const err = error as Error
    console.error('[API:Commissions] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch commissions', message: err.message },
      { status: 500 }
    )
  }
}
