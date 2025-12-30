import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getStripeClient } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

/**
 * Cancel a subscription
 * Sets cancel_at_period_end = true (triggers 6-month grace period)
 *
 * POST /api/stripe/cancel-subscription
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

    // Verify subscription belongs to user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Cancel subscription in Stripe at period end
    // This gives the user access until the end of their current billing period
    const stripe = getStripeClient()
    const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    }) as unknown as { id: string; cancel_at_period_end: boolean; current_period_end: number }

    // Update subscription in database
    // The actual cancellation and grace period tracking happens via webhooks
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    console.log(`[Cancel] Subscription ${subscriptionId} set to cancel at period end for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period. You will enter a 6-month grace period where you can resume anytime.',
      data: {
        subscriptionId: cancelledSubscription.id,
        cancel_at_period_end: cancelledSubscription.cancel_at_period_end,
        current_period_end: new Date(cancelledSubscription.current_period_end * 1000).toISOString(),
      },
    })
  } catch (error) {
    const err = error as Error
    console.error('[Cancel] Error cancelling subscription:', err)
    return NextResponse.json(
      { error: 'Failed to cancel subscription', message: err.message },
      { status: 500 }
    )
  }
}





