import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fetchPhotographerAnalyticsData } from '@/lib/server/photographer-analytics-service'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    logger.info('[api/photographer/analytics] Auth check:', {
      hasUser: !!user,
      userEmail: user?.email,
      errorMessage: userError?.message,
      errorName: userError?.name,
    })

    if (userError || !user) {
      logger.error('[api/photographer/analytics] Unauthorized -', { userError, hasUser: !!user })
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a photographer
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    if (profile.user_type !== 'photographer') {
      return NextResponse.json({ success: false, error: 'Not a photographer' }, { status: 403 })
    }

    const data = await fetchPhotographerAnalyticsData(user.id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('[api/photographer/analytics] Failed to fetch analytics', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics',
      },
      { status: 500 },
    )
  }
}
