import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { verifyHelmAuth, helmErrorResponse } from '@/lib/helm/auth'
import {
  getWeekBounds,
  getPreviousWeekBounds,
  countGalleries,
  countGalleriesByStatus,
  countPhotos,
  getTotalRevenue,
  countNewClients,
  countChurnedClients,
  countActiveSubscriptions,
  calculateMRR,
  getTopPhotographers,
  calculateGrowth,
  formatDate
} from '@/lib/helm/queries'
import { WeeklyReportData } from '@/lib/helm/types'

export async function GET(request: NextRequest) {
  // Verify authentication
  const authError = verifyHelmAuth(request)
  if (authError) return authError

  // Get weekStart parameter
  const { searchParams } = new URL(request.url)
  const weekStartParam = searchParams.get('weekStart')

  if (!weekStartParam) {
    return helmErrorResponse('Missing required parameter: weekStart', 400)
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartParam)) {
    return helmErrorResponse('Invalid date format. Use YYYY-MM-DD', 400)
  }

  try {
    const supabase = createServiceRoleClient()
    const { start, end } = getWeekBounds(weekStartParam)
    const prev = getPreviousWeekBounds(weekStartParam)

    // Calculate week end date for response
    const weekEndDate = new Date(new Date(weekStartParam + 'T00:00:00.000Z').getTime() + 6 * 24 * 60 * 60 * 1000)

    // Current week metrics
    const [
      galleriesCreated,
      galleriesPublished,
      photosUploaded,
      totalRevenue,
      newClients,
      churnedClients,
      activeSubscriptions,
      mrr,
      topPhotographers
    ] = await Promise.all([
      countGalleries(supabase, start, end),
      countGalleriesByStatus(supabase, 'live', start, end),
      countPhotos(supabase, start, end),
      getTotalRevenue(supabase, start, end),
      countNewClients(supabase, start, end),
      countChurnedClients(supabase, start, end),
      countActiveSubscriptions(supabase),
      calculateMRR(supabase),
      getTopPhotographers(supabase, start, end, 5)
    ])

    // Previous week metrics for trends
    const [
      prevGalleries,
      prevRevenue,
      prevClients
    ] = await Promise.all([
      countGalleries(supabase, prev.start, prev.end),
      getTotalRevenue(supabase, prev.start, prev.end),
      countNewClients(supabase, prev.start, prev.end)
    ])

    // Return data directly per Helm spec (no wrapper)
    const response: WeeklyReportData = {
      period: {
        weekStart: weekStartParam,
        weekEnd: formatDate(weekEndDate)
      },
      dataFreshnessUtc: new Date().toISOString(),
      metrics: {
        galleriesCreated,
        galleriesPublished,
        photosUploaded,
        totalRevenue,
        newClients,
        churnedClients,
        activeSubscriptions,
        mrr
      },
      trends: {
        galleryGrowth: calculateGrowth(galleriesCreated, prevGalleries),
        revenueGrowth: calculateGrowth(totalRevenue, prevRevenue),
        clientGrowth: calculateGrowth(newClients, prevClients)
      },
      topPhotographers
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('[HelmWeeklyReport] Error:', error)
    return helmErrorResponse('Failed to generate weekly report', 500)
  }
}
