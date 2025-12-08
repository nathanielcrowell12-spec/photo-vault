import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const field = searchParams.get('field')
    const query = searchParams.get('query') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!field || !['location', 'event_type', 'photographer_name', 'people'].includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    // Query materialized view
    let dbQuery = supabase
      .from('gallery_metadata_suggestions')
      .select('value, usage_count, last_used')
      .eq('field_type', field)
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (query) {
      dbQuery = dbQuery.ilike('value', `${query}%`)
    }

    const { data: suggestions, error } = await dbQuery

    if (error) {
      console.error('[Suggest] Database error:', error)
      return NextResponse.json({ error: 'Suggest failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions || []
    })
  } catch (error) {
    console.error('[Suggest] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
