import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Fetch clients for this photographer
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, email, status')
      .eq('photographer_id', user.id)
      .eq('status', 'active')
      .order('name')

    if (clientsError) {
      console.error('[API] Error fetching clients:', clientsError)
      return NextResponse.json(
        { error: 'Failed to fetch clients', details: clientsError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      clients: clients || []
    })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
