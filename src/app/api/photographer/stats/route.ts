import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

    // Get active clients count
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', user.id)
      .eq('status', 'active')

    // Get total galleries count
    const { count: galleriesCount } = await supabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })
      .eq('photographer_id', user.id)

    // Get photographer data for earnings
    const { data: photographerData } = await supabase
      .from('photographers')
      .select('monthly_commission, total_commission_earned')
      .eq('id', user.id)
      .single()

    // Get total photos count
    const { count: photosCount } = await supabase
      .from('photos')
      .select('*, photo_galleries!inner(photographer_id)', { count: 'exact', head: true })
      .eq('photo_galleries.photographer_id', user.id)

    return NextResponse.json({
      success: true,
      stats: {
        activeClients: clientsCount || 0,
        totalGalleries: galleriesCount || 0,
        monthlyEarnings: photographerData?.monthly_commission || 0,
        totalEarnings: photographerData?.total_commission_earned || 0,
        totalPhotos: photosCount || 0,
        clientRating: 5.0, // Placeholder - implement rating system later
      }
    })
  } catch (error) {
    console.error('[API] Error fetching photographer stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
