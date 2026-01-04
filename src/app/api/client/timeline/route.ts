import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

interface TimelineGallery {
  id: string
  name: string
  created_at: string
  photo_count: number
  cover_image_url: string | null
  photographer_name: string
  photographer_business: string | null
  location: string | null
  event_type: string | null
}

interface TimelineMonth {
  month: number
  month_name: string
  galleries: TimelineGallery[]
  total_photos: number
}

interface TimelineYear {
  year: number
  months: TimelineMonth[]
  total_photos: number
  sessions: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('q') || ''

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get ALL client records for this user (clients can have multiple records)
    // FK chain: auth.users.id -> clients.user_id -> clients.id -> photo_galleries.client_id
    const { data: clientRecords } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)

    const clientIds = clientRecords?.map(c => c.id) || []

    if (clientIds.length === 0) {
      return NextResponse.json({
        success: true,
        timeline: []
      })
    }

    // Build query - use full-text search if search term provided
    let query = supabase
      .from('photo_galleries')
      .select(`
        id,
        gallery_name,
        gallery_description,
        created_at,
        photo_count,
        cover_image_url,
        photographer_id,
        location,
        event_type,
        people,
        notes
      `)
      .in('client_id', clientIds)

    // Apply full-text search if query provided
    if (searchQuery.trim()) {
      // Use PostgreSQL full-text search on search_vector column
      query = query.textSearch('search_vector', searchQuery, {
        type: 'websearch',
        config: 'english'
      })
    }

    const { data: galleries, error: galleriesError } = await query.order('created_at', { ascending: false })

    if (galleriesError) {
      logger.error('[Timeline] Galleries error:', galleriesError)
      return NextResponse.json(
        { error: 'Failed to fetch galleries' },
        { status: 500 }
      )
    }

    if (!galleries || galleries.length === 0) {
      return NextResponse.json({
        success: true,
        timeline: []
      })
    }

    // Get unique photographer IDs
    const photographerIds = [...new Set(galleries.map(g => g.photographer_id).filter(Boolean))]

    // Fetch photographer info
    const { data: photographers } = await supabase
      .from('user_profiles')
      .select('id, full_name, business_name')
      .in('id', photographerIds)

    const photographerMap = new Map(
      (photographers || []).map(p => [p.id, { name: p.full_name, business: p.business_name }])
    )

    // Group galleries by year and month
    const yearMap = new Map<number, Map<number, TimelineGallery[]>>()

    for (const gallery of galleries) {
      const date = new Date(gallery.created_at)
      const year = date.getFullYear()
      const month = date.getMonth()

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map())
      }
      const monthMap = yearMap.get(year)!

      if (!monthMap.has(month)) {
        monthMap.set(month, [])
      }

      const photographer = photographerMap.get(gallery.photographer_id)

      monthMap.get(month)!.push({
        id: gallery.id,
        name: gallery.gallery_name || 'Untitled Gallery',
        created_at: gallery.created_at,
        photo_count: gallery.photo_count || 0,
        cover_image_url: gallery.cover_image_url,
        photographer_name: photographer?.name || 'Your Photographer',
        photographer_business: photographer?.business || null,
        location: gallery.location,
        event_type: gallery.event_type
      })
    }

    // Convert to array format
    const timeline: TimelineYear[] = []

    for (const [year, monthMap] of yearMap) {
      const months: TimelineMonth[] = []
      let yearPhotos = 0
      let yearSessions = 0

      // Sort months in descending order (most recent first)
      const sortedMonths = [...monthMap.entries()].sort((a, b) => b[0] - a[0])

      for (const [month, monthGalleries] of sortedMonths) {
        const monthPhotos = monthGalleries.reduce((sum, g) => sum + g.photo_count, 0)
        yearPhotos += monthPhotos
        yearSessions += monthGalleries.length

        months.push({
          month,
          month_name: MONTH_NAMES[month],
          galleries: monthGalleries,
          total_photos: monthPhotos
        })
      }

      timeline.push({
        year,
        months,
        total_photos: yearPhotos,
        sessions: yearSessions
      })
    }

    // Sort years in descending order
    timeline.sort((a, b) => b.year - a.year)

    return NextResponse.json({
      success: true,
      timeline
    })
  } catch (error) {
    logger.error('[Timeline] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline data' },
      { status: 500 }
    )
  }
}
