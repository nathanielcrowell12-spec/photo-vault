'use server'

import { createServiceRoleClient } from '@/lib/supabase-server'

export type RevenueStats = {
  totalRevenue: number
  thisMonth: number
  thisYear: number
  averageOrder: number
}

export type RecentPayment = {
  id: string
  customer: string
  amount: number
  status: string
  date: string
}

export type TopPhotographer = {
  name: string
  revenue: number
  sessions: number
}

export type FailedPayment = {
  id: string
  customer: string
  amount: number
  reason: string
  date: string
}

export type AdminRevenueData = {
  stats: RevenueStats
  recentPayments: RecentPayment[]
  topPhotographers: TopPhotographer[]
  failedPayments: FailedPayment[]
}

export async function fetchAdminRevenueData(): Promise<AdminRevenueData> {
  const supabase = createServiceRoleClient()

  try {
    // Fetch total revenue
    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('client_payments')
      .select('amount_paid')
      .eq('status', 'active')

    if (allPaymentsError) throw allPaymentsError

    const totalRevenue = allPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0

    // Fetch this month's revenue
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))

    const { data: monthPayments, error: monthError } = await supabase
      .from('client_payments')
      .select('amount_paid')
      .gte('payment_date', startOfMonth.toISOString())
      .lte('payment_date', endOfMonth.toISOString())
      .eq('status', 'active')

    if (monthError) throw monthError

    const thisMonth = monthPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0

    // Fetch this year's revenue
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
    const endOfYear = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999))

    const { data: yearPayments, error: yearError } = await supabase
      .from('client_payments')
      .select('amount_paid')
      .gte('payment_date', startOfYear.toISOString())
      .lte('payment_date', endOfYear.toISOString())
      .eq('status', 'active')

    if (yearError) throw yearError

    const thisYear = yearPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0

    // Calculate average order
    const averageOrder = allPayments && allPayments.length > 0 ? totalRevenue / allPayments.length : 0

    // Fetch recent payments with client info
    const { data: recentPaymentsData, error: recentError } = await supabase
      .from('client_payments')
      .select(`
        id,
        amount_paid,
        payment_date,
        status,
        clients!inner(name)
      `)
      .order('payment_date', { ascending: false })
      .limit(10)

    if (recentError) throw recentError

    const recentPayments: RecentPayment[] = (recentPaymentsData || []).map((p: any) => ({
      id: p.id.substring(0, 8).toUpperCase(),
      customer: p.clients?.name || 'Unknown',
      amount: p.amount_paid || 0,
      status: p.status === 'active' ? 'Active' : p.status === 'inactive' ? 'Inactive' : 'Expired',
      date: p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—',
    }))

    // Fetch top photographers by revenue
    const { data: photographersData, error: photographersError } = await supabase
      .from('photographers')
      .select(`
        id,
        total_commission_earned,
        user_profiles!inner(business_name, full_name)
      `)
      .order('total_commission_earned', { ascending: false })
      .limit(3)

    if (photographersError) throw photographersError

    // Get session counts for each photographer
    const topPhotographers: TopPhotographer[] = await Promise.all(
      (photographersData || []).map(async (p: any) => {
        const { count } = await supabase
          .from('photo_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('photographer_id', p.id)

        return {
          name: p.user_profiles?.business_name || p.user_profiles?.full_name || 'Unknown',
          revenue: p.total_commission_earned || 0,
          sessions: count || 0,
        }
      })
    )

    // Failed payments - for now, return empty array since we don't have failed payment tracking yet
    // This will be populated when Stripe webhooks are integrated
    const failedPayments: FailedPayment[] = []

    return {
      stats: {
        totalRevenue,
        thisMonth,
        thisYear,
        averageOrder,
      },
      recentPayments: recentPayments.slice(0, 3), // Show only top 3
      topPhotographers,
      failedPayments,
    }
  } catch (error) {
    console.error('[admin-revenue-service] Failed to fetch revenue data', error)

    // Return empty data structure on error
    return {
      stats: {
        totalRevenue: 0,
        thisMonth: 0,
        thisYear: 0,
        averageOrder: 0,
      },
      recentPayments: [],
      topPhotographers: [],
      failedPayments: [],
    }
  }
}
