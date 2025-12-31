import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripeClient, constructWebhookEvent, PHOTOGRAPHER_COMMISSION_RATE } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Stripe from 'stripe'
import { logger } from '@/lib/logger'

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
  trial_end: number | null
}

type StripeInvoice = {
  id: string
  subscription?: string | null
  customer?: string | null
}

type StripePaymentIntent = {
  id: string
  amount: number
  status: string
  metadata: Record<string, string>
  charges: {
    data: Array<{
      id: string
      balance_transaction: string
    }>
  }
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
  const supabase = await createServerSupabaseClient()
  const stripe = getStripeClient()

  try {
    // Get raw body and signature for webhook verification
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      logger.error('[Webhook] Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      logger.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured')
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
      logger.error('[Webhook] Signature verification failed:', error.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    logger.info(`[Webhook] Received event: ${event.type} (id: ${event.id})`)

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
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase, stripe)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase, stripe)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account, supabase)
        break

      default:
        logger.info(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const err = error as Error
    logger.error('[Webhook] Error processing webhook:', err)
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
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  stripe: Stripe
) {
  try {
    const metadata = session.metadata || {}
    const userId = metadata.userId || metadata.client_id
    const photographerId = metadata.photographerId || metadata.photographer_id
    const galleryId = metadata.galleryId || metadata.gallery_id

    if (!userId || !galleryId) {
      logger.error('[Webhook] Missing metadata in checkout session:', session.id)
      return
    }

    // Get subscription from session
    const subscriptionId = session.subscription as string
    if (!subscriptionId) {
      logger.error('[Webhook] No subscription ID in checkout session:', session.id)
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
        logger.error('[Webhook] Error creating subscription:', insertError)
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

    logger.info(`[Webhook] Checkout completed for user ${userId}, gallery ${galleryId}`)
  } catch (error) {
    logger.error('[Webhook] Error handling checkout.session.completed:', error)
    throw error
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdated(
  rawSubscription: Stripe.Subscription,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  try {
    const subscription = rawSubscription as unknown as StripeSubscription
    const metadata = subscription.metadata || {}
    const subscriptionType = metadata.subscription_type

    // Handle platform subscriptions (photographer $22/month)
    if (subscriptionType === 'platform' && metadata.photographer_id) {
      const photographerId = metadata.photographer_id

      // Update photographer subscription
      await supabase
        .from('photographers')
        .update({
          platform_subscription_status: subscription.status === 'trialing' ? 'trialing' : subscription.status,
          platform_subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          platform_subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          platform_subscription_trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', photographerId)

      // Update photographer's user_profiles payment status
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        await supabase
          .from('user_profiles')
          .update({
            payment_status: 'active',
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', photographerId)
      }

      logger.info(`[Webhook] Platform subscription ${subscription.status}: ${subscription.id} for photographer ${photographerId}`)
      return
    }

    // Handle client subscriptions (existing logic)
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

    logger.info(`[Webhook] Subscription ${subscription.status}: ${subscription.id}`)
  } catch (error) {
    logger.error('[Webhook] Error handling subscription.updated:', error)
    throw error
  }
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  try {
    const metadata = subscription.metadata || {}
    const subscriptionType = metadata.subscription_type

    // Handle platform subscriptions (photographer $22/month)
    if (subscriptionType === 'platform' && metadata.photographer_id) {
      const photographerId = metadata.photographer_id

      // Update photographer subscription status
      await supabase
        .from('photographers')
        .update({
          platform_subscription_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', photographerId)

      // Update photographer's user_profiles payment status
      await supabase
        .from('user_profiles')
        .update({
          payment_status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', photographerId)

      logger.info(`[Webhook] Platform subscription cancelled: ${subscription.id} for photographer ${photographerId}`)
      return
    }

    // Handle client subscriptions (existing logic)
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

    logger.info(`[Webhook] Subscription cancelled: ${subscription.id}`)
  } catch (error) {
    logger.error('[Webhook] Error handling subscription.deleted:', error)
    throw error
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(
  rawInvoice: Stripe.Invoice,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  stripe: Stripe
) {
  try {
    const invoice = rawInvoice as unknown as StripeInvoice
    const subscriptionId = invoice.subscription as string
    if (!subscriptionId) {
      return // Not a subscription invoice
    }

    // Get subscription to check metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as StripeSubscription
    const metadata = subscription.metadata || {}
    const subscriptionType = metadata.subscription_type

    // Handle platform subscriptions (photographer $22/month)
    if (subscriptionType === 'platform' && metadata.photographer_id) {
      const photographerId = metadata.photographer_id

      // Update photographer subscription
      await supabase
        .from('photographers')
        .update({
          platform_subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
          platform_subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          platform_subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          platform_subscription_trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', photographerId)

      // Update photographer's user_profiles payment status
      await supabase
        .from('user_profiles')
        .update({
          last_payment_date: new Date().toISOString(),
          payment_status: 'active',
          subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', photographerId)

      logger.info(`[Webhook] Platform subscription invoice paid: ${invoice.id} for photographer ${photographerId}`)
      return
    }

    // Handle client subscriptions (existing logic)
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

    logger.info(`[Webhook] Invoice paid: ${invoice.id}`)
  } catch (error) {
    logger.error('[Webhook] Error handling invoice.paid:', error)
    throw error
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(
  rawInvoice: Stripe.Invoice,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  stripe: Stripe
) {
  try {
    const invoice = rawInvoice as unknown as StripeInvoice
    const subscriptionId = invoice.subscription as string
    if (!subscriptionId) {
      return
    }

    // Get subscription to check metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as StripeSubscription
    const metadata = subscription.metadata || {}
    const subscriptionType = metadata.subscription_type

    // Handle platform subscriptions (photographer $22/month)
    if (subscriptionType === 'platform' && metadata.photographer_id) {
      const photographerId = metadata.photographer_id

      // Update photographer subscription status
      await supabase
        .from('photographers')
        .update({
          platform_subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('id', photographerId)

      // Update photographer's user_profiles payment status
      await supabase
        .from('user_profiles')
        .update({
          payment_status: 'grace_period',
          updated_at: new Date().toISOString(),
        })
        .eq('id', photographerId)

      logger.info(`[Webhook] Platform subscription payment failed: ${invoice.id} for photographer ${photographerId}`)
      return
    }

    // Handle client subscriptions (existing logic)
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

    logger.info(`[Webhook] Invoice payment failed: ${invoice.id}`)
  } catch (error) {
    logger.error('[Webhook] Error handling invoice.payment_failed:', error)
    throw error
  }
}

/**
 * Handle successful payment intent (one-time gallery payments)
 * This is triggered for All-In-One gallery payments
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  stripe: Stripe
) {
  try {
    const metadata = paymentIntent.metadata || {}

    // Check if this is a gallery payment
    if (metadata.type !== 'gallery_payment') {
      logger.info('[Webhook] Payment intent is not a gallery payment, skipping')
      return
    }

    const galleryId = metadata.galleryId
    const photographerId = metadata.photographerId
    const clientId = metadata.clientId
    const billingMode = metadata.billingMode
    const paymentOptionId = metadata.paymentOptionId

    // Parse amounts from metadata
    const shootFeeCents = parseInt(metadata.shootFeeCents || '0', 10)
    const storageFeeCents = parseInt(metadata.storageFeeCents || '0', 10)
    const photographerPayoutCents = parseInt(metadata.photographerPayoutCents || '0', 10)
    const photovaultRevenueCents = parseInt(metadata.photovaultRevenueCents || '0', 10)

    logger.info(`[Webhook] Gallery payment succeeded for gallery ${galleryId}`, {
      totalAmount: paymentIntent.amount,
      shootFee: shootFeeCents,
      storageFee: storageFeeCents,
      photographerPayout: photographerPayoutCents,
      photovaultRevenue: photovaultRevenueCents,
    })

    // 1. Update gallery payment status
    const { error: updateError } = await supabase
      .from('photo_galleries')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq('id', galleryId)

    if (updateError) {
      logger.error('[Webhook] Error updating gallery:', updateError)
    }

    // 2. Record the payment transaction
    const { error: txError } = await supabase
      .from('gallery_payment_transactions')
      .insert({
        gallery_id: galleryId,
        photographer_id: photographerId,
        client_id: clientId,
        payment_option_id: paymentOptionId,
        billing_mode: billingMode,
        shoot_fee: shootFeeCents,
        storage_fee: storageFeeCents,
        total_amount: paymentIntent.amount,
        photographer_commission: storageFeeCents > 0
          ? Math.round(storageFeeCents * PHOTOGRAPHER_COMMISSION_RATE)
          : 0,
        photovault_revenue: photovaultRevenueCents,
        photographer_payout: photographerPayoutCents,
        stripe_fees: Math.round(paymentIntent.amount * 0.029) + 30, // Estimate
        stripe_payment_intent_id: paymentIntent.id,
        status: 'completed',
        paid_at: new Date().toISOString(),
      })

    if (txError) {
      logger.error('[Webhook] Error recording transaction:', txError)
    }

    // 3. Transfer photographer's payout to their connected account
    // The payout includes: full shoot fee + storage commission
    if (photographerPayoutCents > 0) {
      // Get photographer's Stripe account ID
      const { data: photographer } = await supabase
        .from('user_profiles')
        .select('stripe_account_id')
        .eq('id', photographerId)
        .single()

      if (photographer?.stripe_account_id) {
        try {
          // Create transfer to photographer's connected account
          // Stripe Express accounts receive funds via T+2 automatic payouts
          const transfer = await stripe.transfers.create({
            amount: photographerPayoutCents,
            currency: 'usd',
            destination: photographer.stripe_account_id,
            metadata: {
              galleryId,
              photographerId,
              type: 'gallery_payment_payout',
              shootFee: shootFeeCents.toString(),
              storageCommission: (photographerPayoutCents - shootFeeCents).toString(),
            },
          })

          // Update transaction with transfer ID
          await supabase
            .from('gallery_payment_transactions')
            .update({
              stripe_transfer_id: transfer.id,
              transfer_completed_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntent.id)

          logger.info(`[Webhook] Created transfer ${transfer.id} for ${photographerPayoutCents} cents to ${photographer.stripe_account_id}`)

        } catch (transferError) {
          logger.error('[Webhook] Error creating transfer:', transferError)
          // Don't throw - the payment succeeded, we just need to retry the transfer later
          // Mark the transaction as needing manual intervention
          await supabase
            .from('gallery_payment_transactions')
            .update({
              notes: `Transfer failed: ${(transferError as Error).message}. Requires manual processing.`,
            })
            .eq('stripe_payment_intent_id', paymentIntent.id)
        }
      } else {
        logger.warn(`[Webhook] Photographer ${photographerId} has no Stripe account - cannot transfer payout`)
        await supabase
          .from('gallery_payment_transactions')
          .update({
            notes: 'Photographer has no Stripe Connect account. Payout pending account setup.',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
      }
    }

    // 4. Update gallery download tracking count if shoot_only
    if (paymentOptionId === 'shoot_only') {
      // Get photo count from gallery
      const { data: gallery } = await supabase
        .from('photo_galleries')
        .select('photo_count')
        .eq('id', galleryId)
        .single()

      if (gallery?.photo_count) {
        await supabase
          .from('photo_galleries')
          .update({
            total_photos_to_download: gallery.photo_count,
            download_tracking_enabled: true,
          })
          .eq('id', galleryId)
      }
    }

    logger.info(`[Webhook] Gallery payment processing complete for ${galleryId}`)

  } catch (error) {
    logger.error('[Webhook] Error handling payment_intent.succeeded:', error)
    throw error
  }
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdated(
  account: Stripe.Account,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
  try {
    // Find photographer by Stripe Connect account ID
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id')
      .eq('stripe_connect_account_id', account.id)
      .single()

    if (!photographer) {
      logger.info(`[Webhook] No photographer found for Stripe account: ${account.id}`)
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

    logger.info(`[Webhook] Stripe Connect account updated: ${account.id}`)
  } catch (error) {
    logger.error('[Webhook] Error handling account.updated:', error)
    throw error
  }
}



