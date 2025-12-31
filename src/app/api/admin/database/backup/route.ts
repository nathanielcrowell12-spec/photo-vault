import { NextResponse } from 'next/server'
import { runDatabaseBackup } from '@/lib/server/admin-database-service'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    const result = await runDatabaseBackup()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('[AdminDatabaseBackup] Failed to run backup', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger backup',
      },
      { status: 500 },
    )
  }
}

