'use server'

import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export type RevenueStats = {
  totalRevenue: number
  thisMonth: number
  thisYear: number
  averageOrder: number
}

export type RecentPayment = {
  id: string
  customer: string  // Client email (commissions table stores email, not name)
  amount: number    // PhotoVault's commission in dollars
  status: string
  date: string
}

export type TopPhotographer = {
  name: string
  revenue: number   // Photographer's total earnings (not PhotoVault's cut)
  sessions: number  // Gallery count (photo_sessions table is empty)
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

export type AdminRevenueParams = {
  startDate?: string  // YYYY-MM-DD format
  endDate?: string    // YYYY-MM-DD format
}

export async function fetchAdminRevenueData(params: AdminRevenueParams = {}): Promise<AdminRevenueData> {
  const supabase = createServiceRoleClient()

  try {
    // Fetch total revenue (PhotoVault's commission only, not total client paid)
    // photovault_commission_cents = what PhotoVault keeps after photographer cut
    const { data: allCommissions, error: allCommissionsError } = await supabase
      .from('commissions')
      .select('photovault_commission_cents')
      .eq('status', 'paid')

    if (allCommissionsError) throw allCommissionsError

    const totalRevenueCents = allCommissions?.reduce((sum, c) => sum + (c.photovault_commission_cents || 0), 0) || 0
    const totalRevenue = totalRevenueCents / 100  // Convert to dollars

    // Fetch selected month's revenue (or current month if no params)
    const now = new Date()
    let startOfMonth: Date
    let endOfMonth: Date

    if (params.startDate && params.endDate) {
      // Use provided date range
      startOfMonth = new Date(params.startDate + 'T00:00:00.000Z')
      endOfMonth = new Date(params.endDate + 'T23:59:59.999Z')
    } else {
      // Default to current month
      startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
      endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    }

    const { data: monthCommissions, error: monthError } = await supabase
      .from('commissions')
      .select('photovault_commission_cents')
      .gte('paid_at', startOfMonth.toISOString())
      .lte('paid_at', endOfMonth.toISOString())
      .eq('status', 'paid')

    if (monthError) throw monthError

    const thisMonthCents = monthCommissions?.reduce((sum, c) => sum + (c.photovault_commission_cents || 0), 0) || 0
    const thisMonth = thisMonthCents / 100  // Convert to dollars

    // Fetch selected year's revenue (based on selected month's year, or current year)
    const selectedYear = params.startDate ? new Date(params.startDate).getUTCFullYear() : now.getUTCFullYear()
    const startOfYear = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0, 0))
    const endOfYear = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999))

    const { data: yearCommissions, error: yearError } = await supabase
      .from('commissions')
      .select('photovault_commission_cents')
      .gte('paid_at', startOfYear.toISOString())
      .lte('paid_at', endOfYear.toISOString())
      .eq('status', 'paid')

    if (yearError) throw yearError

    const thisYearCents = yearCommissions?.reduce((sum, c) => sum + (c.photovault_commission_cents || 0), 0) || 0
    const thisYear = thisYearCents / 100  // Convert to dollars

    // Calculate average order (PhotoVault's cut per transaction)
    const averageOrder = allCommissions && allCommissions.length > 0 ? totalRevenue / allCommissions.length : 0

    // Fetch THIS MONTH's payments (matches the monthly revenue header)
    const { data: recentPaymentsData, error: recentError } = await supabase
      .from('commissions')
      .select(`
        id,
        photovault_commission_cents,
        total_paid_cents,
        paid_at,
        status,
        client_email,
        payment_type
      `)
      .eq('status', 'paid')
      .gte('paid_at', startOfMonth.toISOString())
      .lte('paid_at', endOfMonth.toISOString())
      .order('paid_at', { ascending: false })

    if (recentError) throw recentError

    const recentPayments: RecentPayment[] = (recentPaymentsData || []).map((c: any) => ({
      id: c.id.substring(0, 8).toUpperCase(),
      customer: c.client_email || 'Unknown',
      amount: (c.photovault_commission_cents || 0) / 100,
      status: c.status === 'paid' ? 'Paid' : c.status === 'refunded' ? 'Refunded' : 'Pending',
      date: c.paid_at ? new Date(c.paid_at).toLocaleDateString() : '—',
    }))

    // Fetch top photographers by commission revenue
    // First, aggregate commissions by photographer
    const { data: allCommissionsData, error: commissionsError } = await supabase
      .from('commissions')
      .select('photographer_id, amount_cents')  // Photographer's earnings (not PhotoVault's)
      .eq('status', 'paid')

    if (commissionsError) throw commissionsError

    // Aggregate by photographer
    const photographerRevenue = new Map<string, number>()
    for (const comm of allCommissionsData || []) {
      if (comm.photographer_id) {
        const current = photographerRevenue.get(comm.photographer_id) || 0
        photographerRevenue.set(comm.photographer_id, current + comm.amount_cents)
      }
    }

    // Sort and take top 3
    const topPhotographerIds = Array.from(photographerRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    // Fetch photographer details
    const topPhotographers: TopPhotographer[] = await Promise.all(
      topPhotographerIds.map(async ([photographerId, revenueCents]) => {
        // Get photographer name
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('business_name, full_name')
          .eq('id', photographerId)
          .single()

        // Count galleries instead of sessions (photo_sessions table is empty)
        const { count: galleriesCount } = await supabase
          .from('photo_galleries')
          .select('id', { count: 'exact', head: true })
          .eq('photographer_id', photographerId)

        return {
          name: profile?.business_name || profile?.full_name || 'Unknown',
          revenue: revenueCents / 100,  // Convert to dollars
          sessions: galleriesCount || 0,  // Use galleries count instead of sessions
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
      recentPayments, // Show all this month's transactions
      topPhotographers,
      failedPayments,
    }
  } catch (error) {
    logger.error('[admin-revenue-service] Failed to fetch revenue data', error)

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
