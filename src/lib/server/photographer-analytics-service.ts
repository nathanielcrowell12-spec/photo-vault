'use server'

import { createServiceRoleClient } from '@/lib/supabase-server'

export type MonthlyBreakdown = {
  month: string
  upfront: number
  recurring: number
  total: number
  newClients: number
  activeClients: number
}

export type GrowthMetrics = {
  revenueGrowth: number
  clientGrowth: number
  recurringGrowth: number
}

export type Totals = {
  totalRevenue: number
  totalUpfront: number
  totalRecurring: number
  totalNewClients: number
  averageMonthlyRevenue: number
}

export type Projections = {
  nextMonth: number
  next3Months: number
  nextYear: number
  recurringRunRate: number
}

export type RetentionMetrics = {
  totalClients: number
  activeClients: number
  avgClientLifetime: number
  avgClientValue: number
}

export type PhotographerAnalyticsData = {
  monthlyBreakdown: MonthlyBreakdown[]
  growthMetrics: GrowthMetrics
  totals: Totals
  projections: Projections
  retentionMetrics: RetentionMetrics
}

export async function fetchPhotographerAnalyticsData(
  photographerId: string
): Promise<PhotographerAnalyticsData> {
  const supabase = createServiceRoleClient()

  try {
    // For now, since we don't have payment data yet (waiting for Stripe integration)
    // we'll return safe zero values. This won't cause errors like mock data might.

    // Fetch basic client data
    const { count: totalClients, error: clientsError } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('photographer_id', photographerId)
      .eq('status', 'active')

    if (clientsError) {
      console.warn('[photographer-analytics] Could not fetch clients', clientsError)
    }

    // Fetch session count
    const { count: sessionCount, error: sessionsError } = await supabase
      .from('photo_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('photographer_id', photographerId)

    if (sessionsError) {
      console.warn('[photographer-analytics] Could not fetch sessions', sessionsError)
    }

    // Fetch commission earnings from photographer record
    const { data: photographerData, error: photographerError } = await supabase
      .from('photographers')
      .select('total_commission_earned, monthly_commission')
      .eq('id', photographerId)
      .single()

    if (photographerError) {
      console.warn('[photographer-analytics] Could not fetch photographer data', photographerError)
    }

    const totalEarned = photographerData?.total_commission_earned || 0
    const monthlyEarned = photographerData?.monthly_commission || 0

    // Generate 12 months of data (all zeros for now until Stripe integration)
    const monthlyBreakdown: MonthlyBreakdown[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      monthlyBreakdown.push({
        month: monthName,
        upfront: 0,
        recurring: 0,
        total: 0,
        newClients: 0,
        activeClients: 0,
      })
    }

    return {
      monthlyBreakdown,
      growthMetrics: {
        revenueGrowth: 0,
        clientGrowth: 0,
        recurringGrowth: 0,
      },
      totals: {
        totalRevenue: totalEarned,
        totalUpfront: 0,
        totalRecurring: 0,
        totalNewClients: totalClients || 0,
        averageMonthlyRevenue: monthlyEarned,
      },
      projections: {
        nextMonth: monthlyEarned,
        next3Months: monthlyEarned * 3,
        nextYear: monthlyEarned * 12,
        recurringRunRate: monthlyEarned * 12,
      },
      retentionMetrics: {
        totalClients: totalClients || 0,
        activeClients: totalClients || 0,
        avgClientLifetime: 0,
        avgClientValue: totalClients && totalClients > 0 ? totalEarned / totalClients : 0,
      },
    }
  } catch (error) {
    console.error('[photographer-analytics-service] Failed to fetch analytics', error)

    // Return safe empty structure
    const emptyMonths: MonthlyBreakdown[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      emptyMonths.push({
        month: monthName,
        upfront: 0,
        recurring: 0,
        total: 0,
        newClients: 0,
        activeClients: 0,
      })
    }

    return {
      monthlyBreakdown: emptyMonths,
      growthMetrics: {
        revenueGrowth: 0,
        clientGrowth: 0,
        recurringGrowth: 0,
      },
      totals: {
        totalRevenue: 0,
        totalUpfront: 0,
        totalRecurring: 0,
        totalNewClients: 0,
        averageMonthlyRevenue: 0,
      },
      projections: {
        nextMonth: 0,
        next3Months: 0,
        nextYear: 0,
        recurringRunRate: 0,
      },
      retentionMetrics: {
        totalClients: 0,
        activeClients: 0,
        avgClientLifetime: 0,
        avgClientValue: 0,
      },
    }
  }
}
