import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import {
  createConnectAccount,
  createConnectAccountLink,
  getStripeClient,
} from '@/lib/stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Create Stripe Connect account and onboarding link for photographer
 * POST /api/stripe/connect/authorize
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database queries (bypasses RLS)
    const adminClient = createServiceRoleClient()

    logger.info('[Stripe Connect] User authenticated:', { id: user.id, email: user.email })
    logger.info('[Stripe Connect] Admin client created, querying user_profiles...')

    // Get user profile to verify photographer role
    // Note: email is on auth.users, not user_profiles
    const { data: userProfile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('user_type, full_name')
      .eq('id', user.id)
      .single()

    logger.info('[Stripe Connect] Profile query complete')
    logger.info('[Stripe Connect] userProfile:', JSON.stringify(userProfile, null, 2))
    logger.info('[Stripe Connect] profileError:', JSON.stringify(profileError, null, 2))

    if (profileError || !userProfile) {
      logger.error('[Stripe Connect] Profile not found:', { userId: user.id, error: profileError })
      return NextResponse.json({ error: 'User profile not found', details: profileError }, { status: 404 })
    }

    if (userProfile.user_type !== 'photographer') {
      return NextResponse.json(
        { error: 'Only photographers can connect Stripe accounts' },
        { status: 403 }
      )
    }

    // Get photographer record
    const { data: photographer, error: photographerError } = await adminClient
      .from('photographers')
      .select('id, stripe_connect_account_id, stripe_connect_status')
      .eq('id', user.id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: 'Photographer record not found' },
        { status: 404 }
      )
    }

    // Check if already connected
    if (photographer.stripe_connect_account_id && photographer.stripe_connect_status === 'active') {
      return NextResponse.json(
        {
          error: 'Stripe account already connected',
          accountId: photographer.stripe_connect_account_id,
        },
        { status: 400 }
      )
    }

    const stripe = getStripeClient()

    // Create or retrieve Stripe Connect account
    let accountId = photographer.stripe_connect_account_id

    if (!accountId) {
      // Create new Stripe Connect account
      // Use user.email from auth (not userProfile - that table doesn't have email)
      const account = await createConnectAccount(user.email || '', {
        userId: user.id,
        photographerId: photographer.id,
      })

      accountId = account.id

      // Save account ID to database
      await adminClient
        .from('photographers')
        .update({
          stripe_connect_account_id: accountId,
          stripe_connect_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', photographer.id)
    }

    // Create account link for onboarding
    // Return URL goes through callback to update database with account status
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const returnUrl = `${baseUrl}/api/stripe/connect/callback`
    const refreshUrl = `${baseUrl}/photographers/settings?stripe=refresh`

    const accountLink = await createConnectAccountLink(accountId, returnUrl, refreshUrl)

    return NextResponse.json({
      success: true,
      data: {
        accountId,
        onboardingUrl: accountLink.url,
      },
    })
  } catch (error) {
    const err = error as Error
    logger.error('[Stripe Connect] Error creating account:', err)
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Get Stripe Connect account status
 * GET /api/stripe/connect/authorize
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for database queries (bypasses RLS)
    const adminClient = createServiceRoleClient()

    // Get photographer record
    const { data: photographer, error: photographerError } = await adminClient
      .from('photographers')
      .select('id, stripe_connect_account_id, stripe_connect_status, can_receive_payouts, bank_account_verified')
      .eq('id', user.id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json(
        { error: 'Photographer record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        accountId: photographer.stripe_connect_account_id,
        status: photographer.stripe_connect_status,
        canReceivePayouts: photographer.can_receive_payouts,
        bankAccountVerified: photographer.bank_account_verified,
        isConnected: !!photographer.stripe_connect_account_id && photographer.stripe_connect_status === 'active',
      },
    })
  } catch (error) {
    const err = error as Error
    logger.error('[Stripe Connect] Error fetching account status:', err)
    return NextResponse.json(
      { error: 'Failed to fetch account status', message: err.message },
      { status: 500 }
    )
  }
}



