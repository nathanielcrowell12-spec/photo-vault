/**
 * Reactivation Handler
 *
 * Handles: checkout.session.completed with type === 'reactivation'
 * Restores access for 30 days after reactivation fee payment
 */
import { logger } from '@/lib/logger'
import type { WebhookContext, HandlerResult, CheckoutSession, CheckoutSessionMetadata } from '../types'

/**
 * Handle subscription reactivation checkout
 */
export async function handleReactivation(
  session: CheckoutSession,
  ctx: WebhookContext
): Promise<HandlerResult> {
  const { supabase } = ctx
  const metadata = (session.metadata || {}) as CheckoutSessionMetadata
  const { user_id, stripe_subscription_id: subscriptionId, gallery_id: galleryId } = metadata

  if (!subscriptionId) {
    throw new Error('Missing subscription_id in reactivation checkout metadata')
  }

  logger.info(`[Webhook] Processing reactivation payment for subscription ${subscriptionId}`)

  // Calculate 30-day access period
  const now = new Date()
  const accessEndDate = new Date(now)
  accessEndDate.setDate(accessEndDate.getDate() + 30)

  // Restore access and set 30-day window
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      access_suspended: false,
      access_suspended_at: null,
      payment_failure_count: 0,
      last_payment_failure_at: null,
      // Set period for 30-day decision window
      current_period_start: now.toISOString(),
      current_period_end: accessEndDate.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (updateError) {
    logger.error('[Webhook] Error restoring access:', updateError)
    throw updateError
  }

  // Record the reactivation payment
  await supabase.from('payment_history').insert({
    stripe_invoice_id: session.payment_intent as string,
    stripe_subscription_id: subscriptionId,
    amount_paid_cents: session.amount_total || 2000,
    currency: session.currency || 'usd',
    status: 'succeeded',
    paid_at: now.toISOString(),
    created_at: now.toISOString(),
  })

  // Send reactivation confirmation email (non-blocking)
  try {
    if (!user_id) {
      logger.warn('[Webhook] No user_id in reactivation metadata, skipping email')
      return {
        success: true,
        message: `Reactivation completed for subscription ${subscriptionId}, 30-day access window (no email sent - missing user_id)`,
      }
    }
    const { data: userData } = await supabase.auth.admin.getUserById(user_id)
    const userEmail = userData?.user?.email

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user_id)
      .single()

    const { data: galleryData } = await supabase
      .from('photo_galleries')
      .select('gallery_name')
      .eq('id', galleryId)
      .single()

    if (userEmail) {
      const { EmailService } = await import('@/lib/email/email-service')

      await EmailService.sendGalleryAccessRestoredEmail({
        customerName: userProfile?.full_name || 'Valued Customer',
        customerEmail: userEmail,
        galleryName: galleryData?.gallery_name || 'your gallery',
        photographerName: 'PhotoVault', // Direct reactivation
        accessLink: `${process.env.NEXT_PUBLIC_SITE_URL}/gallery/${galleryId}`,
      })

      logger.info(`[Webhook] Sent reactivation confirmation email to ${userEmail}`)
    }
  } catch (emailError) {
    logger.error('[Webhook] Error sending reactivation email:', emailError)
    // Don't fail webhook for email issues
  }

  logger.info(
    `[Webhook] Reactivation completed for subscription ${subscriptionId}, 30-day access until ${accessEndDate.toISOString()}`
  )

  return {
    success: true,
    message: `Reactivation completed for subscription ${subscriptionId}, user ${user_id}, 30-day access window`,
  }
}
