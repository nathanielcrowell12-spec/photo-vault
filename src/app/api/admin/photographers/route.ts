import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Photographer, PhotographersResponse } from '@/types/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10)
    const search = searchParams.get('search') || ''

    // Step 1: Get photographers from user_profiles
    let query = supabase
      .from('user_profiles')
      .select('id, full_name, business_name, city, state, payment_status, created_at', { count: 'exact' })
      .eq('user_type', 'photographer')
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,business_name.ilike.%${search}%`)
    }

    // Get total count before pagination
    const { count: totalCount } = await query

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: photographers, error: profileError } = await query.range(from, to)

    if (profileError) {
      console.error('[api/admin/photographers] Profile query error:', profileError)
      throw profileError
    }

    if (!photographers || photographers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          photographers: [],
          total: totalCount || 0,
          page,
          pageSize,
        },
      })
    }

    const photographerIds = photographers.map(p => p.id)

    // Step 2: Fetch auth users for emails
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    })

    if (authError) {
      console.error('[api/admin/photographers] Auth error:', authError)
      // Don't throw - continue without emails
    }

    const emailMap = new Map<string, string>()
    for (const authUser of authData?.users ?? []) {
      emailMap.set(authUser.id, authUser.email ?? '')
    }

    // Step 3: Bulk fetch galleries for these photographers
    const { data: galleries, error: galleriesError } = await supabase
      .from('photo_galleries')
      .select('photographer_id, client_id')
      .in('photographer_id', photographerIds)

    if (galleriesError) {
      console.error('[api/admin/photographers] Galleries error:', galleriesError)
    }

    // Step 4: Bulk fetch commissions
    const { data: commissions, error: commissionsError } = await supabase
      .from('commissions')
      .select('photographer_id, photovault_commission_cents')
      .in('photographer_id', photographerIds)
      .eq('status', 'paid')

    if (commissionsError) {
      console.error('[api/admin/photographers] Commissions error:', commissionsError)
    }

    // Step 5: Aggregate in JavaScript
    const galleryCounts = new Map<string, number>()
    const clientSets = new Map<string, Set<string>>()
    const revenueTotals = new Map<string, number>()

    galleries?.forEach(g => {
      galleryCounts.set(g.photographer_id, (galleryCounts.get(g.photographer_id) || 0) + 1)
      if (!clientSets.has(g.photographer_id)) {
        clientSets.set(g.photographer_id, new Set())
      }
      if (g.client_id) {
        clientSets.get(g.photographer_id)!.add(g.client_id)
      }
    })

    commissions?.forEach(c => {
      revenueTotals.set(
        c.photographer_id,
        (revenueTotals.get(c.photographer_id) || 0) + (c.photovault_commission_cents || 0)
      )
    })

    // Step 6: Build enriched response
    const enrichedPhotographers: Photographer[] = photographers.map(p => ({
      id: p.id,
      name: p.business_name || p.full_name || 'Unknown',
      email: emailMap.get(p.id) || '(no email)',
      city: p.city,
      state: p.state,
      paymentStatus: p.payment_status,
      galleryCount: galleryCounts.get(p.id) || 0,
      clientCount: clientSets.get(p.id)?.size || 0,
      totalRevenueCents: revenueTotals.get(p.id) || 0,
      createdAt: p.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: {
        photographers: enrichedPhotographers,
        total: totalCount || 0,
        page,
        pageSize,
      },
    })
  } catch (error) {
    console.error('[api/admin/photographers] Failed to fetch photographers', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch photographers',
      },
      { status: 500 }
    )
  }
}
