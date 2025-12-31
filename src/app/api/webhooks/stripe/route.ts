/**
 * Stripe Webhook Route Handler
 *
 * Thin wrapper that validates the webhook signature and delegates
 * to the modular webhook processing system.
 *
 * Events handled:
 * - checkout.session.completed: Gallery payments, token purchases, family takeover, reactivation
 * - customer.subscription.created: New subscriptions
 * - customer.subscription.updated: Subscription status changes
 * - customer.subscription.deleted: Subscription cancellations
 * - invoice.payment_succeeded: Successful subscription payments
 * - invoice.payment_failed: Failed subscription payments
 * - payout.created: Photographer payouts (Stripe Connect)
 */
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { processWebhookEvent, getStripeClient, logWebhookError } from '@/lib/stripe/webhooks'

// Force dynamic rendering to prevent module evaluation during build
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      logger.error('[Webhook] Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // 2. Verify webhook signature (CRITICAL SECURITY)
    const stripe = getStripeClient()
    let event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      const error = err as Error
      logger.error('[Webhook] Signature verification failed:', error.message)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      )
    }

    logger.info(`[Webhook] Received event: ${event.type} (${event.id})`)

    // 3. Process the event using the modular webhook system
    const result = await processWebhookEvent(event)

    // 4. Return response
    return NextResponse.json(
      {
        message: result.message,
        event_type: event.type,
        processing_time_ms: Date.now() - startTime,
      },
      { status: result.success ? 200 : 500 }
    )
  } catch (error) {
    const err = error as Error
    logger.error('[Webhook] Error:', err)

    // Log error to database
    await logWebhookError(err, Date.now() - startTime)

    // Return 500 so Stripe will retry
    return NextResponse.json(
      { error: 'Webhook processing failed', message: err.message },
      { status: 500 }
    )
  }
}
