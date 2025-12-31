import { NextResponse } from 'next/server'
import { fetchAdminAnalyticsData } from '@/lib/server/admin-analytics-service'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const data = await fetchAdminAnalyticsData()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('[AdminAnalytics] Failed to fetch analytics data', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics data',
      },
      { status: 500 },
    )
  }
}
