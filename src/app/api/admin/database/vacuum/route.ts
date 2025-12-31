import { NextResponse } from 'next/server'
import { vacuumStorage } from '@/lib/server/admin-database-service'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    const result = await vacuumStorage()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('[AdminDatabaseVacuum] Failed to vacuum storage', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to vacuum storage',
      },
      { status: 500 },
    )
  }
}

