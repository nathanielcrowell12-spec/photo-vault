import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  getStripeClient,
  createConnectAccount,
  createConnectAccountLink,
  STRIPE_CONNECT_CLIENT_ID,
} from '@/lib/stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Create Stripe Connect account and onboarding link for photographer
 * POST /api/stripe/connect/authorize
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify photographer role
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, email, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (userProfile.user_type !== 'photographer') {
      return NextResponse.json(
        { error: 'Only photographers can connect Stripe accounts' },
        { status: 403 }
      )
    }

    // Get photographer record
    const { data: photographer, error: photographerError } = await supabase
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
      const account = await createConnectAccount(userProfile.email || '', {
        userId: user.id,
        photographerId: photographer.id,
      })

      accountId = account.id

      // Save account ID to database
      await supabase
        .from('photographers')
        .update({
          stripe_connect_account_id: accountId,
          stripe_connect_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', photographer.id)
    }

    // Create account link for onboarding
    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/photographers/settings?stripe=success`
    const refreshUrl = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/photographers/settings?stripe=refresh`

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
    console.error('[Stripe Connect] Error creating account:', err)
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
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get photographer record
    const { data: photographer, error: photographerError } = await supabase
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
    console.error('[Stripe Connect] Error fetching account status:', err)
    return NextResponse.json(
      { error: 'Failed to fetch account status', message: err.message },
      { status: 500 }
    )
  }
}



