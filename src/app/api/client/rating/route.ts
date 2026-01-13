import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

// GET - Check if client has already rated a gallery
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const galleryId = searchParams.get('galleryId')

    if (!galleryId) {
      return NextResponse.json({ error: 'Gallery ID required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Get gallery to find the photographer
    const { data: gallery } = await serviceSupabase
      .from('photo_galleries')
      .select('photographer_id')
      .eq('id', galleryId)
      .single()

    if (!gallery) {
      return NextResponse.json({ hasRated: false, canRate: false })
    }

    // Get client record for this user with this photographer
    const { data: client } = await serviceSupabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('photographer_id', gallery.photographer_id)
      .maybeSingle()

    if (!client) {
      return NextResponse.json({ hasRated: false, canRate: false })
    }

    // Check if already rated
    const { data: existingRating } = await serviceSupabase
      .from('client_ratings')
      .select('id, rating, review_text')
      .eq('client_id', client.id)
      .eq('gallery_id', galleryId)
      .single()

    return NextResponse.json({
      hasRated: !!existingRating,
      canRate: true,
      existingRating: existingRating || null,
    })
  } catch (error) {
    logger.error('[ClientRating] Error checking rating status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Submit a new rating
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      galleryId,
      rating,
      reviewText,
      communicationRating,
      qualityRating,
      timelinessRating,
    } = body

    if (!galleryId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating data' }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()

    // Get gallery first to find the photographer
    const { data: gallery } = await serviceSupabase
      .from('photo_galleries')
      .select('photographer_id')
      .eq('id', galleryId)
      .single()

    if (!gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Get client record for this user with this photographer
    const { data: client } = await serviceSupabase
      .from('clients')
      .select('id, photographer_id')
      .eq('user_id', user.id)
      .eq('photographer_id', gallery.photographer_id)
      .maybeSingle()

    if (!client) {
      return NextResponse.json({ error: 'Client record not found' }, { status: 404 })
    }

    // Check if already rated this gallery
    const { data: existingRating } = await serviceSupabase
      .from('client_ratings')
      .select('id')
      .eq('client_id', client.id)
      .eq('gallery_id', galleryId)
      .single()

    if (existingRating) {
      // Update existing rating
      const { error: updateError } = await serviceSupabase
        .from('client_ratings')
        .update({
          rating,
          review_text: reviewText || null,
          communication_rating: communicationRating || null,
          quality_rating: qualityRating || null,
          timeliness_rating: timelinessRating || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRating.id)

      if (updateError) {
        logger.error('[ClientRating] Error updating rating:', updateError)
        return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 })
      }

      return NextResponse.json({ success: true, updated: true })
    }

    // Create new rating
    const { error: insertError } = await serviceSupabase
      .from('client_ratings')
      .insert({
        photographer_id: gallery.photographer_id,
        client_id: client.id,
        gallery_id: galleryId,
        rating,
        review_text: reviewText || null,
        communication_rating: communicationRating || null,
        quality_rating: qualityRating || null,
        timeliness_rating: timelinessRating || null,
      })

    if (insertError) {
      logger.error('[ClientRating] Error creating rating:', insertError)
      return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 })
    }

    return NextResponse.json({ success: true, created: true })
  } catch (error) {
    logger.error('[ClientRating] Error submitting rating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
