import { NextResponse } from 'next/server'
import { fetchDatabaseStatus } from '@/lib/server/admin-database-service'

export async function GET() {
  try {
    const status = await fetchDatabaseStatus()
    return NextResponse.json({ success: true, data: status })
  } catch (error) {
    console.error('[api/admin/database/status] Failed to fetch status', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch database status',
      },
      { status: 500 },
    )
  }
}

