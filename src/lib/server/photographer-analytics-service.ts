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
    // Fetch basic client data
    const { count: totalClients, error: clientsError } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('photographer_id', photographerId)
      .eq('status', 'active')

    if (clientsError) {
      console.warn('[photographer-analytics] Could not fetch clients', clientsError)
    }

    // Fetch all commissions for this photographer from the commissions table
    const { data: commissions, error: commissionsError } = await supabase
      .from('commissions')
      .select('amount_cents, payment_type, created_at, client_email')
      .eq('photographer_id', photographerId)
      .order('created_at', { ascending: true })

    if (commissionsError) {
      console.warn('[photographer-analytics] Could not fetch commissions', commissionsError)
    }

    // Fetch client creation dates for new client tracking
    const { data: clients, error: clientListError } = await supabase
      .from('clients')
      .select('created_at')
      .eq('photographer_id', photographerId)

    if (clientListError) {
      console.warn('[photographer-analytics] Could not fetch client list', clientListError)
    }

    // Generate 12 months of data from real commission data
    const monthlyBreakdown: MonthlyBreakdown[] = []
    const now = new Date()

    // Initialize monthly data map
    const monthlyData: Map<string, { upfront: number; recurring: number; newClients: Set<string>; clientEmails: Set<string> }> = new Map()

    // Initialize all 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData.set(monthKey, { upfront: 0, recurring: 0, newClients: new Set(), clientEmails: new Set() })
    }

    // Process commissions into monthly buckets
    if (commissions && commissions.length > 0) {
      for (const commission of commissions) {
        const commissionDate = new Date(commission.created_at)
        const monthKey = `${commissionDate.getFullYear()}-${String(commissionDate.getMonth() + 1).padStart(2, '0')}`

        const monthData = monthlyData.get(monthKey)
        if (monthData) {
          const amountDollars = commission.amount_cents / 100
          if (commission.payment_type === 'upfront') {
            monthData.upfront += amountDollars
          } else {
            monthData.recurring += amountDollars
          }
          if (commission.client_email) {
            monthData.clientEmails.add(commission.client_email)
          }
        }
      }
    }

    // Track new clients per month
    if (clients && clients.length > 0) {
      for (const client of clients) {
        const clientDate = new Date(client.created_at)
        const monthKey = `${clientDate.getFullYear()}-${String(clientDate.getMonth() + 1).padStart(2, '0')}`

        const monthData = monthlyData.get(monthKey)
        if (monthData) {
          monthData.newClients.add(client.created_at) // Using created_at as unique identifier
        }
      }
    }

    // Build the monthly breakdown array
    let cumulativeClients = 0
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

      const data = monthlyData.get(monthKey) || { upfront: 0, recurring: 0, newClients: new Set(), clientEmails: new Set() }
      cumulativeClients += data.newClients.size

      monthlyBreakdown.push({
        month: monthName,
        upfront: Math.round(data.upfront * 100) / 100,
        recurring: Math.round(data.recurring * 100) / 100,
        total: Math.round((data.upfront + data.recurring) * 100) / 100,
        newClients: data.newClients.size,
        activeClients: cumulativeClients,
      })
    }

    // Calculate totals from real data
    const totalUpfront = commissions?.filter(c => c.payment_type === 'upfront').reduce((sum, c) => sum + c.amount_cents, 0) || 0
    const totalRecurring = commissions?.filter(c => c.payment_type === 'monthly' || c.payment_type === 'reactivation').reduce((sum, c) => sum + c.amount_cents, 0) || 0
    const totalRevenue = totalUpfront + totalRecurring

    // Calculate growth metrics (compare last month to previous month)
    const lastMonthIndex = monthlyBreakdown.length - 1
    const prevMonthIndex = monthlyBreakdown.length - 2

    const lastMonthTotal = monthlyBreakdown[lastMonthIndex]?.total || 0
    const prevMonthTotal = monthlyBreakdown[prevMonthIndex]?.total || 0
    const revenueGrowth = prevMonthTotal > 0 ? ((lastMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 : 0

    const lastMonthRecurring = monthlyBreakdown[lastMonthIndex]?.recurring || 0
    const prevMonthRecurring = monthlyBreakdown[prevMonthIndex]?.recurring || 0
    const recurringGrowth = prevMonthRecurring > 0 ? ((lastMonthRecurring - prevMonthRecurring) / prevMonthRecurring) * 100 : 0

    const lastMonthNewClients = monthlyBreakdown[lastMonthIndex]?.newClients || 0
    const prevMonthNewClients = monthlyBreakdown[prevMonthIndex]?.newClients || 0
    const clientGrowth = prevMonthNewClients > 0 ? ((lastMonthNewClients - prevMonthNewClients) / prevMonthNewClients) * 100 : 0

    // Calculate average monthly revenue
    const monthsWithRevenue = monthlyBreakdown.filter(m => m.total > 0).length
    const averageMonthlyRevenue = monthsWithRevenue > 0 ? (totalRevenue / 100) / monthsWithRevenue : 0

    // Calculate projections based on recent trends
    const last3MonthsAvg = monthlyBreakdown.slice(-3).reduce((sum, m) => sum + m.total, 0) / 3
    const currentRecurringMonthly = lastMonthRecurring

    return {
      monthlyBreakdown,
      growthMetrics: {
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        clientGrowth: Math.round(clientGrowth * 10) / 10,
        recurringGrowth: Math.round(recurringGrowth * 10) / 10,
      },
      totals: {
        totalRevenue: totalRevenue / 100,
        totalUpfront: totalUpfront / 100,
        totalRecurring: totalRecurring / 100,
        totalNewClients: totalClients || 0,
        averageMonthlyRevenue: Math.round(averageMonthlyRevenue * 100) / 100,
      },
      projections: {
        nextMonth: Math.round(last3MonthsAvg * 100) / 100,
        next3Months: Math.round(last3MonthsAvg * 3 * 100) / 100,
        nextYear: Math.round(last3MonthsAvg * 12 * 100) / 100,
        recurringRunRate: Math.round(currentRecurringMonthly * 12 * 100) / 100,
      },
      retentionMetrics: {
        totalClients: totalClients || 0,
        activeClients: totalClients || 0,
        avgClientLifetime: 365, // Default to 1 year - would need subscription tracking for real data
        avgClientValue: totalClients && totalClients > 0 ? Math.round((totalRevenue / 100 / totalClients) * 100) / 100 : 0,
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
