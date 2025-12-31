import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getStripeClient } from '@/lib/stripe'

// Force dynamic rendering to prevent module evaluation during build
export const dynamic = 'force-dynamic'

/**
 * Create Stripe Checkout Session for Direct Monthly Subscription
 * POST /api/stripe/create-direct-subscription
 *
 * This is for clients who:
 * - Sign up directly without a photographer
 * - Are "orphaned" (photographer left the platform)
 * - Are family accounts collecting photos from various sources
 *
 * Revenue: 100% to PhotoVault (no commission split)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify user is a client
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      logger.error('[DirectSubscription] User profile not found:', user.id)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (userProfile.user_type !== 'client') {
      return NextResponse.json(
        { error: 'Only clients can subscribe to the Direct Monthly plan' },
        { status: 403 }
      )
    }

    // 3. Check if client already has an active direct subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, status')
      .eq('client_id', user.id)
      .is('gallery_id', null) // Direct subscriptions have no gallery
      .in('status', ['active', 'trialing', 'past_due'])
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: 'You already have an active PhotoVault subscription',
          subscriptionId: existingSubscription.stripe_subscription_id,
        },
        { status: 400 }
      )
    }

    // 4. Get or create Stripe customer
    const stripe = getStripeClient()
    let customerId = userProfile.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || '',
        name: userProfile.full_name || undefined,
        metadata: {
          userId: user.id,
          role: 'client',
          subscriptionType: 'direct_monthly',
        },
      })

      customerId = customer.id

      // Update user record with Stripe customer ID
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // 5. Get Direct Monthly price ID from environment
    const directMonthlyPriceId = process.env.STRIPE_PRICE_DIRECT_MONTHLY

    if (!directMonthlyPriceId) {
      logger.error('[DirectSubscription] STRIPE_PRICE_DIRECT_MONTHLY not configured')
      return NextResponse.json(
        { error: 'Direct subscription not configured' },
        { status: 500 }
      )
    }

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: directMonthlyPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        subscriptionType: 'direct_monthly',
        commissionRate: '0', // 100% to PhotoVault
      },
      subscription_data: {
        metadata: {
          client_id: user.id,
          subscription_type: 'direct_monthly',
          commission_rate: '0', // No photographer commission
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/billing?subscription=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    // 7. Log checkout session creation
    logger.info(`[DirectSubscription] Created session ${session.id} for user ${user.id}`)

    return NextResponse.json(
      {
        sessionId: session.id,
        url: session.url,
        amount: 800, // $8.00 in cents
        currency: 'usd',
      },
      { status: 200 }
    )
  } catch (error) {
    const err = error as Error
    logger.error('[DirectSubscription] Error creating checkout session:', err)

    return NextResponse.json(
      { error: 'Failed to create checkout session', message: err.message },
      { status: 500 }
    )
  }
}
