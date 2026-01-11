import { NextRequest, NextResponse } from 'next/server'
import { fetchAdminRevenueData } from '@/lib/server/admin-revenue-service'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const data = await fetchAdminRevenueData({ startDate, endDate })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('[AdminRevenue] Failed to fetch revenue data', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load revenue data',
      },
      { status: 500 },
    )
  }
}
