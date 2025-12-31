/**
 * Checkout Session Router
 *
 * Routes checkout.session.completed events to appropriate handlers
 * based on metadata (type, purchase_type, isPublicCheckout)
 */
import { logger } from '@/lib/logger'
import { handleGalleryCheckout } from './gallery'
import { handleTokenPurchase } from './tokens'
import { handleFamilyTakeover } from './family'
import { handleReactivation } from './reactivation'
import type { WebhookContext, HandlerResult, CheckoutSession, CheckoutSessionMetadata } from '../types'

/**
 * Main router for checkout.session.completed events
 * Routes to appropriate sub-handler based on metadata
 */
export async function handleCheckoutCompleted(
  session: CheckoutSession,
  ctx: WebhookContext
): Promise<HandlerResult> {
  const metadata = (session.metadata || {}) as CheckoutSessionMetadata
  const { type, purchase_type, isPublicCheckout, galleryId, user_id } = metadata

  // Route to appropriate handler based on metadata

  // 1. Gallery checkout (public or authenticated)
  if ((isPublicCheckout === 'true' || type === 'gallery_payment') && galleryId) {
    return handleGalleryCheckout(session, ctx)
  }

  // 2. Token purchase
  if (purchase_type === 'tokens') {
    return handleTokenPurchase(session, ctx)
  }

  // 3. Subscription checkout (defers to subscription.created event)
  if (purchase_type === 'subscription') {
    return {
      success: true,
      message: `Subscription checkout completed for user ${user_id}, handled by subscription.created event`,
    }
  }

  // 4. Family takeover
  if (type === 'family_takeover') {
    return handleFamilyTakeover(session, ctx)
  }

  // 5. Reactivation
  if (type === 'reactivation') {
    return handleReactivation(session, ctx)
  }

  // Unknown checkout type - log for debugging but don't fail
  logger.info(`[Webhook] Unhandled checkout type: ${purchase_type || type || 'unknown'}`)
  return {
    success: true,
    message: `Checkout completed, type: ${purchase_type || type || 'unknown'}`,
  }
}

// Re-export sub-handlers for direct access if needed
export { handleGalleryCheckout } from './gallery'
export { handleTokenPurchase } from './tokens'
export { handleFamilyTakeover } from './family'
export { handleReactivation } from './reactivation'
