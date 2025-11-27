import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripeClient, constructWebhookEvent } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase'
import Stripe from 'stripe'

// Type helpers for Stripe responses
type StripeSubscription = {
  id: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at: number | null
  customer: string | Stripe.Customer
  metadata: Record<string, string>
}

type StripeInvoice = {
  id: string
  subscription?: string | null
  customer?: string | null
}

// Force dynamic rendering - webhooks must be dynamic
export const dynamic = 'force-dynamic'

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 *
 * Handles all Stripe webhook events:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 * - account.updated (Stripe Connect)
 */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const stripe = getStripeClient()

  try {
    // Get raw body and signature for webhook verification
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    let event: Stripe.Event

    try {
      event = constructWebhookEvent(body, signature, webhookSecret)
    } catch (err) {
      const error = err as Error
      console.error('[Webhook] Signature verification failed:', error.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log(`[Webhook] Received event: ${event.type} (id: ${event.id})`)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase, stripe)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase, stripe)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account, supabase)
        break

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const err = error as Error
    console.error('[Webhook] Error processing webhook:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServerSupabaseClient>,
  stripe: Stripe
) {
  try {
    const metadata = session.metadata || {}
    const userId = metadata.userId || metadata.client_id
    const photographerId = metadata.photographerId || metadata.photographer_id
    const galleryId = metadata.galleryId || metadata.gallery_id

    if (!userId || !galleryId) {
      console.error('[Webhook] Missing metadata in checkout session:', session.id)
      return
    }

    // Get subscription from session
    const subscriptionId = session.subscription as string
    if (!subscriptionId) {
      console.error('[Webhook] No subscription ID in checkout session:', session.id)
      return
    }

    // Retrieve full subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as StripeSubscription

    // Get or create subscription record in database
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (existingSubscription) {
      // Update existing subscription
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)
    } else {
      // Create new subscription record
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          client_id: userId,
          photographer_id: photographerId,
          gallery_id: galleryId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('[Webhook] Error creating subscription:', insertError)
        return
      }
    }

    // Update user payment status
    await supabase
      .from('user_profiles')
      .update({
        payment_status: 'active',
        last_payment_date: new Date().toISOString(),
        subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // Update user's Stripe customer ID if not set (try both tables)
    if (session.customer) {
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: session.customer as string })
        .eq('id', userId)
      
      // Also try users table if it exists
      try {
        await supabase
          .from('users')
          .update({ stripe_customer_id: session.customer as string })
          .eq('id', userId)
      } catch (e) {
        // Table might not exist, that's okay
      }
    }

    console.log(`[Webhook] Checkout completed for user ${userId}, gallery ${galleryId}`)
  } catch (error) {
    console.error('[Webhook] Error handling checkout.session.completed:', error)
    throw error
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdated(
  rawSubscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServerSupabaseClient>
) {
  try {
    const subscription = rawSubscription as unknown as StripeSubscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    const subscriptionData = {
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (existingSubscription) {
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
    } else {
      // Try to get metadata from subscription
      const metadata = subscription.metadata || {}
      const clientId = metadata.client_id
      const photographerId = metadata.photographer_id
      const galleryId = metadata.gallery_id

      if (clientId && galleryId) {
        await supabase.from('subscriptions').insert({
          client_id: clientId,
          photographer_id: photographerId,
          gallery_id: galleryId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          ...subscriptionData,
          created_at: new Date().toISOString(),
        })
      }
    }

    // Update user payment status based on subscription status
    if (subscription.status === 'active' || subscription.status === 'trialing') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('client_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (sub) {
        await supabase
          .from('user_profiles')
          .update({
            payment_status: 'active',
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.client_id)
      }
    }

    console.log(`[Webhook] Subscription ${subscription.status}: ${subscription.id}`)
  } catch (error) {
    console.error('[Webhook] Error handling subscription.updated:', error)
    throw error
  }
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServerSupabaseClient>
) {
  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id)

    // Update user payment status
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('client_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (sub) {
      await supabase
        .from('user_profiles')
        .update({
          payment_status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.client_id)
    }

    console.log(`[Webhook] Subscription cancelled: ${subscription.id}`)
  } catch (error) {
    console.error('[Webhook] Error handling subscription.deleted:', error)
    throw error
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(
  rawInvoice: Stripe.Invoice,
  supabase: ReturnType<typeof createServerSupabaseClient>,
  stripe: Stripe
) {
  try {
    const invoice = rawInvoice as unknown as StripeInvoice
    const subscriptionId = invoice.subscription as string
    if (!subscriptionId) {
      return // Not a subscription invoice
    }

    // Update subscription period
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as StripeSubscription
    await supabase
      .from('subscriptions')
      .update({
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    // Update user last payment date
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('client_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (sub) {
      await supabase
        .from('user_profiles')
        .update({
          last_payment_date: new Date().toISOString(),
          payment_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.client_id)
    }

    console.log(`[Webhook] Invoice paid: ${invoice.id}`)
  } catch (error) {
    console.error('[Webhook] Error handling invoice.paid:', error)
    throw error
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(
  rawInvoice: Stripe.Invoice,
  supabase: ReturnType<typeof createServerSupabaseClient>
) {
  try {
    const invoice = rawInvoice as unknown as StripeInvoice
    const subscriptionId = invoice.subscription as string
    if (!subscriptionId) {
      return
    }

    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    // Update user payment status
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('client_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (sub) {
      await supabase
        .from('user_profiles')
        .update({
          payment_status: 'grace_period',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.client_id)
    }

    console.log(`[Webhook] Invoice payment failed: ${invoice.id}`)
  } catch (error) {
    console.error('[Webhook] Error handling invoice.payment_failed:', error)
    throw error
  }
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(
  account: Stripe.Account,
  supabase: ReturnType<typeof createServerSupabaseClient>
) {
  try {
    // Find photographer by Stripe Connect account ID
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id')
      .eq('stripe_connect_account_id', account.id)
      .single()

    if (!photographer) {
      console.log(`[Webhook] No photographer found for Stripe account: ${account.id}`)
      return
    }

    // Update photographer's Stripe Connect status
    const statusMap: Record<string, string> = {
      enabled: 'active',
      disabled: 'disabled',
      restricted: 'restricted',
      pending: 'pending',
    }

    const connectStatus = statusMap[account.details_submitted ? 'enabled' : 'pending'] || 'pending'

    await supabase
      .from('photographers')
      .update({
        stripe_connect_status: connectStatus,
        can_receive_payouts: account.payouts_enabled || false,
        bank_account_verified: account.details_submitted || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', photographer.id)

    console.log(`[Webhook] Stripe Connect account updated: ${account.id}`)
  } catch (error) {
    console.error('[Webhook] Error handling account.updated:', error)
    throw error
  }
}



