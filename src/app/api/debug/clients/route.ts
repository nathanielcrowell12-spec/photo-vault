import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError
      }, { status: 401 })
    }

    // Try to fetch clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('photographer_id', user.id)

    return NextResponse.json({
      success: true,
      userId: user.id,
      userEmail: user.email,
      clientsCount: clients?.length || 0,
      clients: clients || [],
      error: clientsError
    })
  } catch (error) {
    logger.error('[DebugClients] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error
    }, { status: 500 })
  }
}
