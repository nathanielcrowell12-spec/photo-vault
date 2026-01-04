/**
 * Stripe Webhook Module
 *
 * Main entry point for webhook processing.
 * Provides processWebhookEvent() which handles:
 * - Idempotency checking
 * - Event routing to appropriate handlers
 * - Result logging and error handling
 */
import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import { handleCheckoutCompleted } from './checkout'
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from './subscription'
import { handlePaymentSucceeded, handlePaymentFailed } from './invoice'
import { handlePayoutCreated } from './payout'
import { handleDiscountCreated } from './discount'
import {
  getStripeClient,
  checkIdempotency,
  markProcessed,
  logWebhookResult,
  logWebhookError,
} from './helpers'
import type { WebhookContext, HandlerResult, Discount } from './types'
import type Stripe from 'stripe'

// Re-export helpers for route.ts
export { getStripeClient, checkIdempotency, markProcessed, logWebhookResult, logWebhookError } from './helpers'

// Re-export types
export * from './types'

/**
 * Process a Stripe webhook event
 *
 * This is the main entry point called by route.ts.
 * Handles idempotency, routing, and logging.
 *
 * @param event - The verified Stripe event
 * @returns HandlerResult with success status and message
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<HandlerResult> {
  const supabase = createServiceRoleClient()
  const startTime = Date.now()

  // 1. CHECK IDEMPOTENCY FIRST (before any processing)
  const alreadyProcessed = await checkIdempotency(supabase, event.id)
  if (alreadyProcessed) {
    logger.info(`[Webhook] Event ${event.id} already processed, skipping`)
    return { success: true, message: 'Already processed' }
  }

  // 2. CREATE CONTEXT for handlers
  const ctx: WebhookContext = {
    supabase,
    stripe: getStripeClient(),
    eventId: event.id,
    eventType: event.type,
  }

  // 3. PROCESS - route to appropriate handler
  let result: HandlerResult
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          ctx
        )
        break

      case 'customer.subscription.created':
        result = await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
          ctx
        )
        break

      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          ctx
        )
        break

      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          ctx
        )
        break

      case 'invoice.payment_succeeded':
        result = await handlePaymentSucceeded(event.data.object as Stripe.Invoice, ctx)
        break

      case 'invoice.payment_failed':
        result = await handlePaymentFailed(event.data.object as Stripe.Invoice, ctx)
        break

      case 'payout.created':
        result = await handlePayoutCreated(event.data.object as Stripe.Payout, ctx)
        break

      case 'customer.discount.created':
        result = await handleDiscountCreated(event.data.object as Discount, ctx)
        break

      default:
        logger.info(`[Webhook] Unhandled event type: ${event.type}`)
        result = { success: true, message: `Unhandled event type: ${event.type}` }
    }
  } catch (error) {
    // DO NOT mark as processed on error - allows Stripe to retry
    logger.error(`[Webhook] Handler error for ${event.type}:`, error)
    throw error // Re-throw to caller
  }

  // 4. MARK PROCESSED ONLY AFTER SUCCESS
  const processingTime = Date.now() - startTime
  await markProcessed(supabase, event.id, event.type)
  await logWebhookResult(supabase, event.id, event.type, result.message, processingTime)

  logger.info(`[Webhook] Successfully processed ${event.type} in ${processingTime}ms`)

  return result
}
