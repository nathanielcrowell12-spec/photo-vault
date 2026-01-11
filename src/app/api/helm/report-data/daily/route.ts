import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { verifyHelmAuth, helmErrorResponse } from '@/lib/helm/auth'
import {
  getDayBounds,
  countGalleries,
  countPhotos,
  countPayments,
  getTotalRevenue,
  countNewClients,
  countActivePhotographers,
  getRecentGalleries,
  getRecentPayments,
  detectAlerts
} from '@/lib/helm/queries'
import { DailyReportData } from '@/lib/helm/types'

export async function GET(request: NextRequest) {
  // Verify authentication
  const authError = verifyHelmAuth(request)
  if (authError) return authError

  // Get date parameter
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')

  if (!dateParam) {
    return helmErrorResponse('Missing required parameter: date', 400)
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return helmErrorResponse('Invalid date format. Use YYYY-MM-DD', 400)
  }

  try {
    const supabase = createServiceRoleClient()
    const { start, end } = getDayBounds(dateParam)

    // Run all queries in parallel for performance
    const [
      newGalleries,
      newPhotos,
      totalPayments,
      totalRevenue,
      newClients,
      activePhotographers,
      recentGalleries,
      recentPayments,
      alerts
    ] = await Promise.all([
      countGalleries(supabase, start, end),
      countPhotos(supabase, start, end),
      countPayments(supabase, start, end),
      getTotalRevenue(supabase, start, end),
      countNewClients(supabase, start, end),
      countActivePhotographers(supabase, start, end),
      getRecentGalleries(supabase, start, end, 10),
      getRecentPayments(supabase, start, end, 10),
      detectAlerts(supabase)
    ])

    // Return data directly per Helm spec (no wrapper)
    const response: DailyReportData = {
      period: {
        start: `${dateParam}T00:00:00.000Z`,
        end: `${dateParam}T23:59:59.999Z`
      },
      dataFreshnessUtc: new Date().toISOString(),
      metrics: {
        newGalleries,
        newPhotos,
        totalPayments,
        totalRevenue,
        newClients,
        activePhotographers
      },
      activity: {
        recentGalleries,
        recentPayments
      },
      alerts
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[HelmDailyReport] Error:', error)
    return helmErrorResponse('Failed to generate daily report', 500)
  }
}
