import { NextResponse } from 'next/server'
import { vacuumStorage } from '@/lib/server/admin-database-service'

export async function POST() {
  try {
    const result = await vacuumStorage()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[api/admin/database/vacuum] Failed to vacuum storage', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to vacuum storage',
      },
      { status: 500 },
    )
  }
}

