import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase'

// Force dynamic rendering to prevent module evaluation during build
export const dynamic = 'force-dynamic'

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

/**
 * Stripe Webhook Handler
 * Processes payment events and updates database accordingly
 *
 * Events handled:
 * - checkout.session.completed: Token purchases
 * - customer.subscription.created: New subscriptions
 * - invoice.payment_succeeded: Successful subscription payments
 * - invoice.payment_failed: Failed subscription payments
 * - customer.subscription.deleted: Subscription cancellations
 * - payout.created: Photographer payouts (Stripe Connect)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('[Webhook] Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // 2. Verify webhook signature (CRITICAL SECURITY)
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      const error = err as Error
      console.error('[Webhook] Signature verification failed:', error.message)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      )
    }

    console.log(`[Webhook] Received event: ${event.type} (${event.id})`)

    // 3. Initialize Supabase client with service role (elevated permissions)
    const supabase = createServerSupabaseClient()

    // 4. Check idempotency - prevent duplicate processing
    const { data: alreadyProcessed } = await supabase
      .from('processed_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single()

    if (alreadyProcessed) {
      console.log(`[Webhook] Event ${event.id} already processed, skipping`)
      return NextResponse.json({ message: 'Already processed' }, { status: 200 })
    }

    // 5. Route to appropriate handler based on event type
    let handlerResult: string

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          handlerResult = await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase)
          break

        case 'customer.subscription.created':
          handlerResult = await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase)
          break

        case 'invoice.payment_succeeded':
          handlerResult = await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
          break

        case 'invoice.payment_failed':
          handlerResult = await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase)
          break

        case 'customer.subscription.deleted':
          handlerResult = await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
          break

        case 'customer.subscription.updated':
          handlerResult = await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
          break

        case 'payout.created':
          handlerResult = await handlePayoutCreated(event.data.object as Stripe.Payout, supabase)
          break

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`)
          handlerResult = `Unhandled event type: ${event.type}`
      }
    } catch (handlerError) {
      const error = handlerError as Error
      console.error(`[Webhook] Handler error for ${event.type}:`, error)
      throw error // Re-throw to be caught by outer try-catch
    }

    // 6. Mark as processed (idempotency)
    await supabase.from('processed_webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString()
    })

    // 7. Log success
    const processingTime = Date.now() - startTime
    await supabase.from('webhook_logs').insert({
      event_id: event.id,
      event_type: event.type,
      status: 'success',
      processing_time_ms: processingTime,
      result_message: handlerResult,
      processed_at: new Date().toISOString()
    })

    console.log(`[Webhook] Successfully processed ${event.type} in ${processingTime}ms`)

    return NextResponse.json({
      message: 'Webhook processed successfully',
      event_type: event.type,
      processing_time_ms: processingTime
    }, { status: 200 })

  } catch (error) {
    const err = error as Error
    console.error('[Webhook] Error:', err)

    // Log error to database
    try {
      const supabase = createServerSupabaseClient()
      await supabase.from('webhook_logs').insert({
        event_type: 'error',
        status: 'failed',
        error_message: err.message,
        stack_trace: err.stack,
        processing_time_ms: Date.now() - startTime,
        processed_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error('[Webhook] Failed to log error:', logError)
    }

    // Return 500 so Stripe will retry
    return NextResponse.json(
      { error: 'Webhook processing failed', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Handle completed checkout session (token purchases)
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
): Promise<string> {
  console.log('[Webhook] Processing checkout.session.completed', session.id)

  // Extract metadata
  const { user_id, tokens, purchase_type } = session.metadata || {}

  if (!user_id) {
    throw new Error('Missing user_id in checkout session metadata')
  }

  // Handle different purchase types
  if (purchase_type === 'tokens' && tokens) {
    // Token purchase
    const tokenAmount = parseInt(tokens)

    // Add tokens to user balance using RPC function
    const { error: rpcError } = await supabase.rpc('add_tokens_to_balance', {
      p_user_id: user_id,
      p_tokens: tokenAmount,
      p_payment_intent_id: session.payment_intent
    })

    if (rpcError) {
      console.error('[Webhook] RPC error:', rpcError)
      // If RPC doesn't exist, update directly
      const { error: updateError } = await supabase
        .from('users')
        .update({
          token_balance: supabase.raw(`COALESCE(token_balance, 0) + ${tokenAmount}`)
        })
        .eq('id', user_id)

      if (updateError) throw updateError
    }

    // Record transaction
    await supabase.from('token_transactions').insert({
      user_id,
      transaction_type: 'purchase',
      tokens_amount: tokenAmount,
      stripe_payment_intent_id: session.payment_intent,
      stripe_charge_id: session.payment_intent, // Charge ID is in payment_intent for new API
      amount_paid_cents: session.amount_total,
      currency: session.currency,
      description: `Token purchase - ${tokenAmount} tokens`,
      created_at: new Date().toISOString()
    })

    return `Added ${tokenAmount} tokens to user ${user_id}`
  } else if (purchase_type === 'subscription') {
    // Subscription created via checkout - handled by subscription.created event
    return `Subscription checkout completed for user ${user_id}`
  } else {
    return `Checkout completed for user ${user_id}, type: ${purchase_type || 'unknown'}`
  }
}

/**
 * Handle new subscription created
 */
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
): Promise<string> {
  console.log('[Webhook] Processing customer.subscription.created', subscription.id)

  const customerId = subscription.customer as string

  // Get user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (userError || !user) {
    throw new Error(`User not found for Stripe customer: ${customerId}`)
  }

  // Extract plan info from metadata or subscription items
  const planType = subscription.metadata?.plan_type || 'unknown'

  // Get billing period from first subscription item (all items share the same billing period)
  const firstItem = subscription.items.data[0]
  const currentPeriodStart = firstItem?.current_period_start
  const currentPeriodEnd = firstItem?.current_period_end

  // Create subscription record
  const { error: insertError } = await supabase.from('subscriptions').insert({
    user_id: user.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status,
    plan_type: planType,
    current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : new Date().toISOString(),
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : new Date().toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  if (insertError) throw insertError

  return `Created subscription ${subscription.id} for user ${user.id}`
}

/**
 * Handle successful subscription payment
 * NOW CREATES COMMISSION RECORDS
 */
async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
): Promise<string> {
  console.log('[Webhook] Processing invoice.payment_succeeded', invoice.id)

  // Extract subscription ID - it can be a string ID or expanded Subscription object
  const invoiceSubscription = (invoice as any).subscription
  const subscriptionId = typeof invoiceSubscription === 'string'
    ? invoiceSubscription
    : invoiceSubscription?.id

  if (!subscriptionId) {
    // Not a subscription payment, might be one-time payment
    return `Invoice ${invoice.id} paid (not subscription-related)`
  }

  // Update subscription status and period
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(invoice.period_start * 1000).toISOString(),
      current_period_end: new Date(invoice.period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) throw error

  // Record payment in payment history
  const { data: paymentRecord } = await supabase.from('payment_history').insert({
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    amount_paid_cents: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
    created_at: new Date().toISOString()
  }).select().single()

  // **NEW: Create commission record**
  // Get client and photographer info from subscription metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const photographerId = subscription.metadata?.photographer_id
  const clientId = subscription.metadata?.client_id
  const galleryId = subscription.metadata?.gallery_id

  if (photographerId && clientId && paymentRecord) {
    const { createCommission } = await import('@/lib/server/commission-service')

    const commissionResult = await createCommission({
      photographerId,
      clientId,
      clientPaymentId: paymentRecord.id,
      paymentAmountCents: invoice.amount_paid,
      paymentDate: new Date(invoice.status_transitions.paid_at! * 1000),
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      commissionType: invoice.billing_reason === 'subscription_create' ? 'upfront' : 'recurring'
    })

    if (!commissionResult.success) {
      console.error('[Webhook] Failed to create commission:', commissionResult.error)
      // Don't throw - payment still succeeded, commission can be created manually
    } else {
      console.log(`[Webhook] Created commission ${commissionResult.commissionId}`)
    }
  } else {
    console.warn('[Webhook] Missing photographer_id or client_id in subscription metadata')
  }

  // Send payment successful email to client
  if (clientId && galleryId) {
    const { data: clientData } = await supabase
      .from('users')
      .select(`
        email,
        full_name,
        clients!inner(
          photographer_id,
          photographers!inner(
            users!inner(full_name)
          )
        )
      `)
      .eq('id', clientId)
      .single()

    const { data: galleryData } = await supabase
      .from('photo_galleries')
      .select('name')
      .eq('id', galleryId)
      .single()

    if (clientData && galleryData) {
      const { EmailService } = await import('@/lib/email/email-service')

      const nextBillingDate = new Date(invoice.period_end * 1000)
      const planName = invoice.billing_reason === 'subscription_create'
        ? 'Gallery Access - Monthly (First Payment)'
        : 'Gallery Access - Monthly'

      await EmailService.sendPaymentSuccessfulEmail({
        customerName: clientData.full_name || 'Valued Customer',
        customerEmail: clientData.email,
        amountPaid: invoice.amount_paid / 100,
        planName: planName,
        galleryName: galleryData.name,
        photographerName: clientData.clients.photographers.users.full_name,
        receiptUrl: invoice.hosted_invoice_url || undefined,
        nextBillingDate: nextBillingDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
      })

      console.log(`[Webhook] Sent payment successful email to ${clientData.email}`)
    }
  }

  return `Payment succeeded for subscription ${subscriptionId}, commission ${photographerId && clientId ? 'created' : 'skipped'}`
}

/**
 * Handle failed subscription payment
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
): Promise<string> {
  console.log('[Webhook] Processing invoice.payment_failed', invoice.id)

  const invoiceSubscription = (invoice as any).subscription
  const subscriptionId = typeof invoiceSubscription === 'string'
    ? invoiceSubscription
    : invoiceSubscription?.id

  if (!subscriptionId) {
    return `Invoice ${invoice.id} payment failed (not subscription-related)`
  }

  // Mark subscription as past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) throw error

  // Record failed payment
  await supabase.from('payment_history').insert({
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    amount_paid_cents: 0,
    currency: invoice.currency,
    status: 'failed',
    created_at: new Date().toISOString()
  })

  // Get user and subscription details for notification
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      user_id,
      gallery_id,
      users!inner(email, full_name),
      photo_galleries!inner(name)
    `)
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (subscription) {
    // Send payment failed email
    const { EmailService } = await import('@/lib/email/email-service')

    await EmailService.sendPaymentFailedEmail({
      customerName: subscription.users.full_name || 'Valued Customer',
      customerEmail: subscription.users.email,
      amountDue: invoice.amount_due / 100,
      galleryName: subscription.photo_galleries.name,
      updatePaymentLink: `${process.env.NEXT_PUBLIC_SITE_URL}/client/billing`,
      gracePeriodDays: 90,
    })

    console.log(`[Webhook] Sent payment failure email to ${subscription.users.email}`)
  }

  return `Payment failed for subscription ${subscriptionId}`
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
): Promise<string> {
  console.log('[Webhook] Processing customer.subscription.deleted', subscription.id)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) throw error

  return `Subscription ${subscription.id} canceled`
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
): Promise<string> {
  console.log('[Webhook] Processing customer.subscription.updated', subscription.id)

  // Get billing period from first subscription item (all items share the same billing period)
  const firstItem = subscription.items.data[0]
  const currentPeriodStart = firstItem?.current_period_start
  const currentPeriodEnd = firstItem?.current_period_end

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000).toISOString() : undefined,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : undefined,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) throw error

  return `Subscription ${subscription.id} updated`
}

/**
 * Handle photographer payout (Stripe Connect)
 */
async function handlePayoutCreated(
  payout: Stripe.Payout,
  supabase: any
): Promise<string> {
  console.log('[Webhook] Processing payout.created', payout.id)

  // Get photographer by Stripe Connect account ID
  const { data: photographer, error: photoError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_connect_account_id', payout.destination)
    .single()

  if (photoError || !photographer) {
    console.warn(`[Webhook] Photographer not found for Stripe Connect account: ${payout.destination}`)
    return `Payout ${payout.id} created but photographer not found in database`
  }

  // Record payout
  const { error: insertError } = await supabase.from('payouts').insert({
    photographer_id: photographer.id,
    stripe_payout_id: payout.id,
    amount_cents: payout.amount,
    currency: payout.currency,
    status: payout.status,
    arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
    description: payout.description || 'Photographer earnings payout',
    created_at: new Date().toISOString()
  })

  if (insertError) throw insertError

  return `Payout ${payout.id} created for photographer ${photographer.id}`
}
