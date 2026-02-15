import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get photographer profile for beta tester status
    const { data: photographerProfile } = await supabase
      .from('photographers')
      .select('is_beta_tester, beta_start_date, price_locked_at')
      .eq('id', user.id)
      .single()

    // Get active clients count
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', user.id)
      .eq('status', 'active')

    // Get total galleries count (exclude soft-deleted)
    const { count: galleriesCount } = await supabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', user.id)
      .eq('is_deleted', false)

    // Get total earnings from commissions table (real data)
    const { data: allCommissions } = await supabase
      .from('commissions')
      .select('amount_cents')
      .eq('photographer_id', user.id)

    const totalEarnings = (allCommissions?.reduce((sum, c) => sum + c.amount_cents, 0) || 0) / 100

    // Get monthly earnings from commissions table (current month)
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: monthlyCommissions } = await supabase
      .from('commissions')
      .select('amount_cents')
      .eq('photographer_id', user.id)
      .gte('created_at', firstOfMonth)

    const monthlyEarnings = (monthlyCommissions?.reduce((sum, c) => sum + c.amount_cents, 0) || 0) / 100

    // Get total photos count
    const { count: photosCount } = await supabase
      .from('photos')
      .select('*, photo_galleries!inner(photographer_id)', { count: 'exact', head: true })
      .eq('photo_galleries.photographer_id', user.id)

    // Get average client rating from client_ratings table
    let clientRating = 0
    let ratingCount = 0
    try {
      const { data: ratings } = await supabase
        .from('client_ratings')
        .select('rating')
        .eq('photographer_id', user.id)
        .eq('status', 'published')

      if (ratings && ratings.length > 0) {
        clientRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        ratingCount = ratings.length
      }
    } catch {
      // Table may not exist yet - that's ok, return 0
    }

    return NextResponse.json({
      success: true,
      stats: {
        activeClients: clientsCount || 0,
        totalGalleries: galleriesCount || 0,
        monthlyEarnings: monthlyEarnings,
        totalEarnings: totalEarnings,
        totalPhotos: photosCount || 0,
        clientRating: Math.round(clientRating * 10) / 10,
        ratingCount: ratingCount,
      },
      profile: {
        isBetaTester: photographerProfile?.is_beta_tester || false,
        betaStartDate: photographerProfile?.beta_start_date || null,
        priceLockedAt: photographerProfile?.price_locked_at || null,
      },
    })
  } catch (error) {
    logger.error('[PhotographerStats] Error fetching photographer stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
