import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface SearchRequest {
  query?: string
  event_date_start?: string
  event_date_end?: string
  location?: string
  people?: string[]
  event_type?: string
  photographer_name?: string
  limit?: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SearchRequest = await request.json()
    const {
      query,
      event_date_start,
      event_date_end,
      location,
      people,
      event_type,
      photographer_name,
      limit = 50
    } = body

    // Use the search function we created in the database
    const { data: galleries, error } = await supabase.rpc('search_galleries', {
      p_photographer_id: user.id,
      p_search_query: query || null,
      p_event_date_start: event_date_start || null,
      p_event_date_end: event_date_end || null,
      p_location: location || null,
      p_people: people || null,
      p_event_type: event_type || null,
      p_photographer_name: photographer_name || null,
      p_limit: limit
    })

    if (error) {
      console.error('[Search] Database error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Fetch client details for each gallery
    const galleryIds = galleries?.map((g: { id: string }) => g.id) || []

    let enrichedGalleries = galleries || []

    if (galleryIds.length > 0) {
      const { data: galleriesWithClients } = await supabase
        .from('photo_galleries')
        .select(`
          id,
          client:clients(id, name, email)
        `)
        .in('id', galleryIds)

      enrichedGalleries = galleries.map((gallery: { id: string }) => {
        const clientData = galleriesWithClients?.find((g: { id: string }) => g.id === gallery.id)
        const client = clientData?.client
        return {
          ...gallery,
          client: Array.isArray(client) ? client[0] : client || null
        }
      })
    }

    return NextResponse.json({
      success: true,
      galleries: enrichedGalleries,
      total: enrichedGalleries.length
    })
  } catch (error) {
    console.error('[Search] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
