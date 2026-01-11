import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { verifyHelmAuth, helmErrorResponse } from '@/lib/helm/auth'
import {
  getMonthBounds,
  getPreviousMonthBounds,
  getTotalPhotographers,
  countActivePhotographers,
  getTotalClients,
  getTotalGalleries,
  getTotalPhotos,
  calculateMRR,
  getTotalRevenue,
  getSubscriptionBreakdown,
  countChurnedClients,
  countActiveSubscriptions,
  getCommissionSummary,
  calculateGrowth,
  countNewClients,
  countGalleries
} from '@/lib/helm/queries'
import { MonthlyReportData } from '@/lib/helm/types'

export async function GET(request: NextRequest) {
  // Verify authentication
  const authError = verifyHelmAuth(request)
  if (authError) return authError

  // Get month and year parameters
  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month')
  const yearParam = searchParams.get('year')

  if (!monthParam || !yearParam) {
    return helmErrorResponse('Missing required parameters: month and year', 400)
  }

  const month = parseInt(monthParam, 10)
  const year = parseInt(yearParam, 10)

  // Validate month (1-12) and year
  if (isNaN(month) || month < 1 || month > 12) {
    return helmErrorResponse('Invalid month. Must be 1-12', 400)
  }

  if (isNaN(year) || year < 2000 || year > 2100) {
    return helmErrorResponse('Invalid year. Must be between 2000 and 2100', 400)
  }

  try {
    const supabase = createServiceRoleClient()
    const { start, end } = getMonthBounds(month, year)
    const prev = getPreviousMonthBounds(month, year)

    // Current month metrics
    const [
      totalPhotographers,
      activePhotographers,
      totalClients,
      totalGalleries,
      totalPhotos,
      mrr,
      totalRevenue,
      subscriptionBreakdown,
      churnedThisMonth,
      activeAtStartOfMonth,
      commissionSummary
    ] = await Promise.all([
      getTotalPhotographers(supabase),
      countActivePhotographers(supabase, start, end),
      getTotalClients(supabase),
      getTotalGalleries(supabase),
      getTotalPhotos(supabase),
      calculateMRR(supabase),
      getTotalRevenue(supabase, start, end),
      getSubscriptionBreakdown(supabase),
      countChurnedClients(supabase, start, end),
      countActiveSubscriptions(supabase), // Approximation for start of month
      getCommissionSummary(supabase, start, end)
    ])

    // Calculate churn rate
    const churnRate = activeAtStartOfMonth > 0
      ? Math.round((churnedThisMonth / activeAtStartOfMonth) * 10000) / 100
      : 0

    // Previous month metrics for growth calculations
    const [
      prevClients,
      prevGalleries
    ] = await Promise.all([
      countNewClients(supabase, prev.start, prev.end),
      countGalleries(supabase, prev.start, prev.end)
    ])

    // Current month new counts for growth
    const [
      newClientsThisMonth,
      newGalleriesThisMonth
    ] = await Promise.all([
      countNewClients(supabase, start, end),
      countGalleries(supabase, start, end)
    ])

    // Format dates for response
    const startDate = new Date(start).toISOString().split('T')[0]
    const endDate = new Date(end).toISOString().split('T')[0]

    // Return data directly per Helm spec (no wrapper)
    const response: MonthlyReportData = {
      period: {
        month,
        year,
        startDate,
        endDate
      },
      dataFreshnessUtc: new Date().toISOString(),
      metrics: {
        totalPhotographers,
        activePhotographers,
        totalClients,
        totalGalleries,
        totalPhotos,
        mrr,
        arr: mrr * 12,
        totalRevenue,
        churnRate
      },
      subscriptionBreakdown,
      growth: {
        mrrGrowth: 0, // Would need historical MRR data
        photographerGrowth: 0, // Would need historical data
        clientGrowth: calculateGrowth(newClientsThisMonth, prevClients),
        galleryGrowth: calculateGrowth(newGalleriesThisMonth, prevGalleries)
      },
      commissionSummary
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[HelmMonthlyReport] Error:', error)
    return helmErrorResponse('Failed to generate monthly report', 500)
  }
}
