import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all galleries for this photographer to extract unique values
    const { data: galleries, error } = await supabase
      .from('photo_galleries')
      .select('event_date, location, people')
      .eq('photographer_id', user.id)

    if (error) {
      console.error('[FilterOptions] Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
    }

    // Extract unique years
    const years = new Set<number>()
    galleries?.forEach((g) => {
      if (g.event_date) {
        const year = new Date(g.event_date).getFullYear()
        years.add(year)
      }
    })

    // Extract unique locations
    const locations = new Set<string>()
    galleries?.forEach((g) => {
      if (g.location) locations.add(g.location)
    })

    // Extract unique people
    const people = new Set<string>()
    galleries?.forEach((g) => {
      if (g.people && Array.isArray(g.people)) {
        g.people.forEach((p: string) => people.add(p))
      }
    })

    return NextResponse.json({
      success: true,
      years: Array.from(years).sort((a, b) => b - a),
      locations: Array.from(locations).sort(),
      people: Array.from(people).sort(),
    })
  } catch (error) {
    console.error('[FilterOptions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
