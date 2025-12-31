import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getStripeClient } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// Reactivation fee: $20 (100% to PhotoVault)
const REACTIVATION_FEE_CENTS = 2000

/**
 * Reactivate a suspended subscription
 * Two scenarios:
 * 1. During grace period: Resume subscription without fee
 * 2. After grace period (access suspended): Pay $20 reactivation fee
 *
 * POST /api/stripe/reactivate
 * Body: { subscriptionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        photo_galleries!subscriptions_gallery_id_fkey(gallery_name)
      `)
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    const stripe = getStripeClient()

    // Case 1: During grace period (cancel_at_period_end but not suspended)
    // Just resume the subscription - no fee
    if (subscription.cancel_at_period_end && !subscription.access_suspended) {
      // Remove cancel_at_period_end in Stripe
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      })

      // Update database
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      logger.info(`[Reactivate] Subscription ${subscriptionId} resumed (grace period) for user ${user.id}`)

      return NextResponse.json({
        success: true,
        message: 'Subscription resumed successfully! Your access continues uninterrupted.',
        requiresPayment: false,
      })
    }

    // Case 2: Access suspended - requires $20 reactivation fee
    if (subscription.access_suspended) {
      // Get or create Stripe customer
      let stripeCustomerId = subscription.stripe_customer_id

      if (!stripeCustomerId) {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(user.id)
        const userEmail = userData?.user?.email

        // Create Stripe customer
        const customer = await stripe.customers.create({
          email: userEmail || user.email,
          metadata: {
            user_id: user.id,
            reactivation: 'true',
          },
        })
        stripeCustomerId = customer.id
      }

      // Create Checkout session for reactivation fee
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'PhotoVault Reactivation Fee',
                description: `Reactivate access to "${subscription.photo_galleries?.gallery_name || 'your gallery'}" - includes 30 days of access`,
              },
              unit_amount: REACTIVATION_FEE_CENTS,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/billing?reactivated=success&subscriptionId=${subscriptionId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/billing?reactivated=cancelled`,
        metadata: {
          type: 'reactivation',
          subscription_id: subscription.id,
          stripe_subscription_id: subscriptionId,
          user_id: user.id,
          gallery_id: subscription.gallery_id,
        },
      })

      logger.info(`[Reactivate] Created checkout session for suspended subscription ${subscriptionId}`)

      return NextResponse.json({
        success: true,
        requiresPayment: true,
        checkoutUrl: session.url,
        message: 'Reactivation requires a $20 fee. You will be redirected to complete payment.',
      })
    }

    // Case 3: Subscription has failed payments but still in grace period
    // Resume the subscription
    if (subscription.status === 'past_due' && subscription.last_payment_failure_at) {
      // Clear the cancel_at_period_end if set
      if (subscription.cancel_at_period_end) {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        })
      }

      // Reset grace period tracking in database
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
          payment_failure_count: 0,
          last_payment_failure_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id)

      logger.info(`[Reactivate] Subscription ${subscriptionId} resumed (past_due cleared) for user ${user.id}`)

      return NextResponse.json({
        success: true,
        message: 'Subscription resumed. Please update your payment method to avoid future issues.',
        requiresPayment: false,
      })
    }

    // Case 4: Active subscription - no action needed
    if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
      return NextResponse.json({
        success: true,
        message: 'Your subscription is already active!',
        requiresPayment: false,
      })
    }

    return NextResponse.json(
      { error: 'Unable to determine reactivation path. Please contact support.' },
      { status: 400 }
    )
  } catch (error) {
    const err = error as Error
    logger.error('[Reactivate] Error reactivating subscription:', err)
    return NextResponse.json(
      { error: 'Failed to reactivate subscription', message: err.message },
      { status: 500 }
    )
  }
}






