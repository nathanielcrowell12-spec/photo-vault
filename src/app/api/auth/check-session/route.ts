import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Get Supabase auth cookies
    const accessToken = cookieStore.get('sb-gqmycgopitxpjkxzrnyv-auth-token')?.value
    const refreshToken = cookieStore.get('sb-gqmycgopitxpjkxzrnyv-auth-token-refresh')?.value

    logger.info('[Check Session] Access token exists:', !!accessToken)
    logger.info('[Check Session] Refresh token exists:', !!refreshToken)

    if (!accessToken) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found'
      })
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify the session
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    logger.info('[Check Session] User:', user?.email)
    logger.info('[Check Session] Error:', error)

    if (error || !user) {
      return NextResponse.json({
        authenticated: false,
        message: 'Invalid session'
      })
    }

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      email: user.email,
      token: accessToken
    })
  } catch (error) {
    logger.error('[Check Session] Error:', error)
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to check session'
    }, { status: 500 })
  }
}
