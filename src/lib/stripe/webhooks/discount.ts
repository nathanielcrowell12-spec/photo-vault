/**
 * Discount Webhook Handler
 *
 * Handles: customer.discount.created
 * Marks photographers as beta testers when PHOTOVAULT_BETA_2026 coupon is applied
 */
import { logger } from '@/lib/logger'
import { EmailService } from '@/lib/email/email-service'
import type { WebhookContext, HandlerResult, Discount } from './types'

const BETA_COUPON_ID = 'PHOTOVAULT_BETA_2026'
const BETA_LOCKED_PRICE = 22.0

/**
 * Handle discount created event
 * When beta coupon is applied, mark photographer as beta tester
 */
export async function handleDiscountCreated(
  discount: Discount,
  ctx: WebhookContext
): Promise<HandlerResult> {
  logger.info('[Webhook] Processing customer.discount.created', discount.id)

  const { supabase, stripe } = ctx

  // Only process our beta coupon
  // In Stripe v19+, coupon is nested in source.coupon
  const coupon = discount.source?.coupon
  const couponId = typeof coupon === 'string' ? coupon : coupon?.id

  if (couponId !== BETA_COUPON_ID) {
    logger.info(`[Webhook] Ignoring non-beta coupon: ${couponId}`)
    return { success: true, message: `Ignored coupon: ${couponId}` }
  }

  const stripeCustomerId = discount.customer as string
  if (!stripeCustomerId) {
    logger.warn('[Webhook] No customer ID in discount event')
    return { success: true, message: 'No customer ID in discount' }
  }

  // Find user by Stripe customer ID
  // Note: email is not in user_profiles, we get it from Stripe customer
  const { data: userProfile, error: userError } = await supabase
    .from('user_profiles')
    .select('id, full_name, user_type')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (userError || !userProfile) {
    logger.warn(`[Webhook] No user found for Stripe customer: ${stripeCustomerId}`)
    return { success: true, message: `No user found for customer: ${stripeCustomerId}` }
  }

  // Verify this is a photographer
  if (userProfile.user_type !== 'photographer') {
    logger.warn(`[Webhook] Beta coupon applied to non-photographer: ${userProfile.id}`)
    return { success: true, message: 'Coupon applied to non-photographer' }
  }

  // Update photographers table (NOT photographer_profiles)
  // The id column in photographers matches user_profiles.id
  const { error: updateError } = await supabase
    .from('photographers')
    .update({
      is_beta_tester: true,
      beta_start_date: new Date().toISOString(),
      price_locked_at: BETA_LOCKED_PRICE,
    })
    .eq('id', userProfile.id)

  if (updateError) {
    logger.error('[Webhook] Failed to update photographer beta status:', updateError)
    throw updateError
  }

  logger.info(`[Webhook] Marked photographer ${userProfile.id} as beta tester`)

  // Send welcome email (fire-and-forget) - get email from Stripe customer
  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId)
    if (!('deleted' in customer) && customer.email) {
      sendBetaWelcomeEmailAsync(userProfile.full_name || 'Photographer', customer.email)
    }
  } catch (stripeError) {
    logger.warn('[Webhook] Could not retrieve customer email from Stripe:', stripeError)
  }

  return {
    success: true,
    message: `Beta tester status applied to photographer ${userProfile.id}`,
  }
}

/**
 * Send beta welcome email asynchronously (fire-and-forget)
 * Don't block webhook response for email delivery
 */
function sendBetaWelcomeEmailAsync(photographerName: string, email: string): void {
  Promise.resolve().then(async () => {
    try {
      await EmailService.sendBetaWelcomeEmail({
        photographerName,
        photographerEmail: email,
      })
      logger.info(`[Webhook] Beta welcome email sent to ${email}`)
    } catch (emailError) {
      logger.error('[Webhook] Failed to send beta welcome email:', emailError)
      // Don't throw - email failure shouldn't affect webhook success
    }
  })
}
