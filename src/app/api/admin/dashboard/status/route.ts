import { NextResponse } from 'next/server'
import { fetchAdminDashboardStatus } from '@/lib/server/admin-dashboard-service'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const data = await fetchAdminDashboardStatus()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('[AdminDashboardStatus] Failed to fetch status', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load admin dashboard status',
      },
      { status: 500 },
    )
  }
}

