import { NextResponse } from 'next/server'
import { runErrorProbe } from '@/lib/server/admin-database-service'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    const result = await runErrorProbe()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('[AdminDatabaseErrorProbe] Failed to collect errors', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect errors',
      },
      { status: 500 },
    )
  }
}

