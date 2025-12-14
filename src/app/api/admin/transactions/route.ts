import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import type { Transaction, TransactionsResponse } from '@/types/admin'

export async function GET(request: NextRequest): Promise<NextResponse<TransactionsResponse>> {
  const supabase = createServiceRoleClient()

  // Get query params
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'all' // month, year, all
  const page = parseInt(searchParams.get('page') || '1', 10)
  const search = searchParams.get('search') || ''
  const pageSize = 25

  try {
    // Build date filters
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null

    if (period === 'month') {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    } else if (period === 'year') {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999))
    }

    // Build query
    let query = supabase
      .from('commissions')
      .select(`
        id,
        paid_at,
        client_email,
        payment_type,
        total_paid_cents,
        photovault_commission_cents,
        amount_cents,
        status,
        photographer_id
      `, { count: 'exact' })

    // Apply date filters
    if (startDate && endDate) {
      query = query
        .gte('paid_at', startDate.toISOString())
        .lte('paid_at', endDate.toISOString())
    }

    // Apply search filter
    if (search) {
      query = query.ilike('client_email', `%${search}%`)
    }

    // Order and paginate
    query = query
      .order('paid_at', { ascending: false, nullsFirst: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    const { data: commissions, error, count } = await query

    if (error) throw error

    // Fetch photographer names for all photographer_ids
    const photographerIds = [...new Set(commissions?.map(c => c.photographer_id).filter(Boolean))]
    const photographerNames = new Map<string, string>()

    if (photographerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, business_name, full_name')
        .in('id', photographerIds)

      profiles?.forEach(p => {
        photographerNames.set(p.id, p.business_name || p.full_name || 'Unknown')
      })
    }

    // Map to response type
    const transactions: Transaction[] = (commissions || []).map(c => ({
      id: c.id,
      date: c.paid_at || '',
      clientEmail: c.client_email || 'Unknown',
      paymentType: c.payment_type as 'upfront' | 'monthly' | 'reactivation',
      totalPaidCents: c.total_paid_cents || 0,
      photovaultCommissionCents: c.photovault_commission_cents || 0,
      photographerCommissionCents: c.amount_cents || 0,
      status: c.status as 'paid' | 'refunded' | 'pending',
      photographerName: photographerNames.get(c.photographer_id) || 'Unknown',
    }))

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        total: count || 0,
        page,
        pageSize,
      },
    })
  } catch (error) {
    console.error('[api/admin/transactions] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
