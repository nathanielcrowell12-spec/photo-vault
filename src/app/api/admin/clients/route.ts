import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Client, ClientsResponse } from '@/types/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10)
    const search = searchParams.get('search') || ''

    // Step 1: Get clients from user_profiles
    let query = supabase
      .from('user_profiles')
      .select('id, full_name, payment_status, created_at', { count: 'exact' })
      .eq('user_type', 'client')
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    // Get total count before pagination
    const { count: totalCount } = await query

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: clients, error: profileError } = await query.range(from, to)

    if (profileError) {
      console.error('[api/admin/clients] Profile query error:', profileError)
      throw profileError
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          clients: [],
          total: totalCount || 0,
          page,
          pageSize,
        },
      })
    }

    const clientIds = clients.map(c => c.id)

    // Step 2: Fetch auth users for emails
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    })

    if (authError) {
      console.error('[api/admin/clients] Auth error:', authError)
    }

    const emailMap = new Map<string, string>()
    for (const authUser of authData?.users ?? []) {
      emailMap.set(authUser.id, authUser.email ?? '')
    }

    // Step 3: Bulk fetch galleries for these clients
    const { data: galleries, error: galleriesError } = await supabase
      .from('photo_galleries')
      .select('client_id')
      .in('client_id', clientIds)

    if (galleriesError) {
      console.error('[api/admin/clients] Galleries error:', galleriesError)
    }

    // Step 4: Bulk fetch active subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('client_id')
      .in('client_id', clientIds)
      .eq('status', 'active')

    if (subscriptionsError) {
      console.error('[api/admin/clients] Subscriptions error:', subscriptionsError)
    }

    // Step 5: Bulk fetch commissions (total spent by clients)
    // Need to match by client email since commissions table uses client_email
    const clientEmails = clientIds.map(id => emailMap.get(id)).filter(Boolean) as string[]

    let commissions: { client_email: string; total_paid_cents: number }[] = []
    if (clientEmails.length > 0) {
      const { data: commissionData, error: commissionsError } = await supabase
        .from('commissions')
        .select('client_email, total_paid_cents')
        .in('client_email', clientEmails)
        .eq('status', 'paid')

      if (commissionsError) {
        console.error('[api/admin/clients] Commissions error:', commissionsError)
      }
      commissions = commissionData || []
    }

    // Step 6: Aggregate in JavaScript
    const galleryCounts = new Map<string, number>()
    const subscriptionCounts = new Map<string, number>()
    const spentTotals = new Map<string, number>()

    galleries?.forEach(g => {
      if (g.client_id) {
        galleryCounts.set(g.client_id, (galleryCounts.get(g.client_id) || 0) + 1)
      }
    })

    subscriptions?.forEach(s => {
      if (s.client_id) {
        subscriptionCounts.set(s.client_id, (subscriptionCounts.get(s.client_id) || 0) + 1)
      }
    })

    // Map email back to client ID for spending totals
    const emailToIdMap = new Map<string, string>()
    clientIds.forEach(id => {
      const email = emailMap.get(id)
      if (email) emailToIdMap.set(email, id)
    })

    commissions?.forEach(c => {
      const clientId = emailToIdMap.get(c.client_email)
      if (clientId) {
        spentTotals.set(clientId, (spentTotals.get(clientId) || 0) + (c.total_paid_cents || 0))
      }
    })

    // Step 7: Build enriched response
    const enrichedClients: Client[] = clients.map(c => ({
      id: c.id,
      name: c.full_name || 'Unknown',
      email: emailMap.get(c.id) || '(no email)',
      paymentStatus: c.payment_status,
      galleryCount: galleryCounts.get(c.id) || 0,
      activeSubscriptions: subscriptionCounts.get(c.id) || 0,
      totalSpentCents: spentTotals.get(c.id) || 0,
      createdAt: c.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: {
        clients: enrichedClients,
        total: totalCount || 0,
        page,
        pageSize,
      },
    })
  } catch (error) {
    console.error('[api/admin/clients] Failed to fetch clients', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch clients',
      },
      { status: 500 }
    )
  }
}
