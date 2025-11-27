import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getStripeClient, getSubscription, cancelSubscription } from '@/lib/stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Get subscription details
 * GET /api/stripe/subscription?subscriptionId=sub_xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')

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

    // Get subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('client_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Get latest subscription details from Stripe
    const stripeSubscription = await getSubscription(subscriptionId) as unknown as {
      status: string
      current_period_start: number
      current_period_end: number
      cancel_at_period_end: boolean
      canceled_at: number | null
    }

    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        stripe: {
          status: stripeSubscription.status,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          canceled_at: stripeSubscription.canceled_at
            ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
            : null,
        },
      },
    })
  } catch (error) {
    const err = error as Error
    console.error('[Subscription] Error fetching subscription:', err)
    return NextResponse.json(
      { error: 'Failed to fetch subscription', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Cancel subscription
 * POST /api/stripe/subscription
 * Body: { subscriptionId: string, cancelImmediately?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { subscriptionId, cancelImmediately = false } = body

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

    // Verify subscription belongs to user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('client_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Cancel subscription in Stripe
    const stripe = getStripeClient()
    let cancelledSubscription

    if (cancelImmediately) {
      // Cancel immediately
      cancelledSubscription = await cancelSubscription(subscriptionId)
    } else {
      // Cancel at period end
      cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    }

    // Update subscription in database
    await supabase
      .from('subscriptions')
      .update({
        status: cancelledSubscription.status,
        cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
        canceled_at: cancelledSubscription.canceled_at
          ? new Date(cancelledSubscription.canceled_at * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
        canceled_at: cancelledSubscription.canceled_at
          ? new Date(cancelledSubscription.canceled_at * 1000).toISOString()
          : null,
      },
    })
  } catch (error) {
    const err = error as Error
    console.error('[Subscription] Error cancelling subscription:', err)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', message: err.message },
      { status: 500 }
    )
  }
}



