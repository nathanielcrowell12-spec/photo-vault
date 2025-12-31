import { NextResponse } from 'next/server'
import { fetchAdminRevenueData } from '@/lib/server/admin-revenue-service'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const data = await fetchAdminRevenueData()
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
