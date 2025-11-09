import { NextResponse } from 'next/server'
import { validateRlsPolicies } from '@/lib/server/admin-database-service'

export async function POST() {
  try {
    const result = await validateRlsPolicies()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[api/admin/database/rls] Failed to validate policies', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate policies',
      },
      { status: 500 },
    )
  }
}

