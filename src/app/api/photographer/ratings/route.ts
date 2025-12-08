import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

// GET - Fetch ratings for the authenticated photographer
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role to fetch ratings with client info
    const serviceSupabase = createServiceRoleClient()

    const { data: ratings, error: ratingsError } = await serviceSupabase
      .from('client_ratings')
      .select(`
        id,
        rating,
        review_text,
        communication_rating,
        quality_rating,
        timeliness_rating,
        status,
        photographer_response,
        response_at,
        created_at,
        gallery_id,
        client_id,
        clients (
          id,
          user_id
        ),
        photo_galleries (
          id,
          title
        )
      `)
      .eq('photographer_id', user.id)
      .order('created_at', { ascending: false })

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError)
      return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
    }

    // Get client emails from auth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientUserIds = (ratings || [])
      .map((r: any) => r.clients?.user_id)
      .filter(Boolean) as string[]

    const clientEmails: Record<string, string> = {}
    if (clientUserIds.length > 0) {
      const { data: authUsers } = await serviceSupabase.auth.admin.listUsers()
      authUsers?.users?.forEach(u => {
        if (clientUserIds.includes(u.id) && u.email) {
          clientEmails[u.id] = u.email
        }
      })
    }

    // Format ratings with client info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedRatings = (ratings || []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      reviewText: r.review_text,
      communicationRating: r.communication_rating,
      qualityRating: r.quality_rating,
      timelinessRating: r.timeliness_rating,
      status: r.status,
      photographerResponse: r.photographer_response,
      responseAt: r.response_at,
      createdAt: r.created_at,
      galleryTitle: r.photo_galleries?.title || 'General Review',
      clientEmail: r.clients?.user_id ? clientEmails[r.clients.user_id] || 'Anonymous' : 'Anonymous',
    })) || []

    // Calculate stats
    const publishedRatings = formattedRatings.filter(r => r.status === 'published')
    const avgRating = publishedRatings.length > 0
      ? publishedRatings.reduce((sum, r) => sum + r.rating, 0) / publishedRatings.length
      : 0

    const avgCommunication = publishedRatings.filter(r => r.communicationRating).length > 0
      ? publishedRatings.reduce((sum, r) => sum + (r.communicationRating || 0), 0) /
        publishedRatings.filter(r => r.communicationRating).length
      : 0

    const avgQuality = publishedRatings.filter(r => r.qualityRating).length > 0
      ? publishedRatings.reduce((sum, r) => sum + (r.qualityRating || 0), 0) /
        publishedRatings.filter(r => r.qualityRating).length
      : 0

    const avgTimeliness = publishedRatings.filter(r => r.timelinessRating).length > 0
      ? publishedRatings.reduce((sum, r) => sum + (r.timelinessRating || 0), 0) /
        publishedRatings.filter(r => r.timelinessRating).length
      : 0

    // Rating distribution
    const distribution = [0, 0, 0, 0, 0] // 1-5 stars
    publishedRatings.forEach(r => {
      distribution[r.rating - 1]++
    })

    return NextResponse.json({
      success: true,
      ratings: formattedRatings,
      stats: {
        totalReviews: publishedRatings.length,
        averageRating: Math.round(avgRating * 10) / 10,
        averageCommunication: Math.round(avgCommunication * 10) / 10,
        averageQuality: Math.round(avgQuality * 10) / 10,
        averageTimeliness: Math.round(avgTimeliness * 10) / 10,
        distribution,
      }
    })
  } catch (error) {
    console.error('[API] Error in ratings endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Photographer responds to a rating
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ratingId, response } = body

    if (!ratingId || !response) {
      return NextResponse.json({ error: 'Missing ratingId or response' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Verify the rating belongs to this photographer
    const { data: rating } = await serviceSupabase
      .from('client_ratings')
      .select('photographer_id')
      .eq('id', ratingId)
      .single()

    if (!rating || rating.photographer_id !== user.id) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 })
    }

    // Update with response
    const { error: updateError } = await serviceSupabase
      .from('client_ratings')
      .update({
        photographer_response: response,
        response_at: new Date().toISOString(),
      })
      .eq('id', ratingId)

    if (updateError) {
      console.error('Error updating rating:', updateError)
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error in ratings POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
