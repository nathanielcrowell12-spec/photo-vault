/**
 * Invoice Webhook Handlers
 *
 * Handles: invoice.payment_succeeded, invoice.payment_failed
 * Manages subscription payments, access restoration, and commission tracking
 */
import { logger } from '@/lib/logger'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'
import { getStripeClient } from './helpers'
import type { WebhookContext, HandlerResult, Invoice } from './types'

/**
 * Handle successful subscription payment
 * Creates commission records and restores access if previously suspended
 */
export async function handlePaymentSucceeded(
  invoice: Invoice,
  ctx: WebhookContext
): Promise<HandlerResult> {
  logger.info('[Webhook] Processing invoice.payment_succeeded', invoice.id)

  const { supabase, stripe } = ctx

  // Extract subscription ID - it can be a string ID or expanded Subscription object
  const invoiceSubscription = (invoice as any).subscription
  const subscriptionId =
    typeof invoiceSubscription === 'string'
      ? invoiceSubscription
      : invoiceSubscription?.id

  if (!subscriptionId) {
    // Not a subscription payment, might be one-time payment
    return {
      success: true,
      message: `Invoice ${invoice.id} paid (not subscription-related)`,
    }
  }

  // Check if access was previously suspended (for restoration email)
  const { data: previousState } = await supabase
    .from('subscriptions')
    .select('access_suspended, user_id, gallery_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  const wasAccessSuspended = previousState?.access_suspended === true

  // Update subscription status, period, and RESET failure tracking
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(invoice.period_start * 1000).toISOString(),
      current_period_end: new Date(invoice.period_end * 1000).toISOString(),
      // Reset payment failure tracking
      payment_failure_count: 0,
      last_payment_failure_at: null,
      access_suspended: false,
      access_suspended_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) throw error

  // If access was suspended, send restoration email (non-blocking)
  if (wasAccessSuspended && previousState?.user_id) {
    logger.info(`[Webhook] Access restored for subscription ${subscriptionId}`)

    try {
      // Get user details for email
      const { data: userData } = await supabase.auth.admin.getUserById(previousState.user_id)
      const userEmail = userData?.user?.email

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', previousState.user_id)
        .single()

      const { data: galleryData } = await supabase
        .from('photo_galleries')
        .select('gallery_name, photographer_id')
        .eq('id', previousState.gallery_id)
        .single()

      // Get photographer name
      let photographerName = 'Your Photographer'
      if (galleryData?.photographer_id) {
        const { data: photographerProfile } = await supabase
          .from('user_profiles')
          .select('full_name, business_name')
          .eq('id', galleryData.photographer_id)
          .single()
        photographerName =
          photographerProfile?.business_name ||
          photographerProfile?.full_name ||
          'Your Photographer'
      }

      if (userEmail) {
        const { EmailService } = await import('@/lib/email/email-service')

        await EmailService.sendGalleryAccessRestoredEmail({
          customerName: userProfile?.full_name || 'Valued Customer',
          customerEmail: userEmail,
          galleryName: galleryData?.gallery_name || 'your gallery',
          photographerName: photographerName,
          accessLink: `${process.env.NEXT_PUBLIC_SITE_URL}/gallery/${previousState.gallery_id}`,
        })

        logger.info(`[Webhook] Sent access restored email to ${userEmail}`)
      }
    } catch (emailError) {
      logger.error('[Webhook] Error sending access restored email:', emailError)
      // Don't fail webhook if email fails
    }
  }

  // Record payment in payment history
  const { data: paymentRecord } = await supabase
    .from('payment_history')
    .insert({
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      amount_paid_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  // Record commission for subscription payment
  // With DESTINATION CHARGES on subscriptions, Stripe handles the split automatically
  // This record is for reporting/dashboard purposes only
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const photographerId = subscription.metadata?.photographer_id
  const clientId = subscription.metadata?.client_id
  const galleryId = subscription.metadata?.gallery_id

  if (photographerId && paymentRecord) {
    // For subscriptions with destination charges, the split is automatic
    // We just record it for dashboard/reporting
    const amountPaidCents = invoice.amount_paid
    // 50/50 split for monthly subscriptions
    const photovaultFeeCents = Math.round(amountPaidCents * 0.5)
    const photographerGrossCents = amountPaidCents - photovaultFeeCents

    // Get transfer ID if available (for destination charge subscriptions)
    let stripeTransferId: string | null = null
    let paymentIntentId: string | null = null
    try {
      // Invoice may have charge and payment_intent as expandable fields
      const invoiceAny = invoice as any
      const chargeId = invoiceAny.charge
      paymentIntentId =
        typeof invoiceAny.payment_intent === 'string'
          ? invoiceAny.payment_intent
          : invoiceAny.payment_intent?.id || null

      if (chargeId && typeof chargeId === 'string') {
        const charge = await stripe.charges.retrieve(chargeId)
        if (charge.transfer && typeof charge.transfer === 'string') {
          stripeTransferId = charge.transfer
        }
      }
    } catch (err) {
      logger.warn('[Webhook] Could not retrieve transfer ID for subscription:', err)
    }

    await supabase
      .from('commissions')
      .insert({
        photographer_id: photographerId,
        gallery_id: galleryId || null,
        client_email: invoice.customer_email || '',
        amount_cents: photographerGrossCents,
        total_paid_cents: amountPaidCents,
        shoot_fee_cents: 0, // Monthly subscription has no shoot fee
        storage_fee_cents: amountPaidCents, // All of it is storage fee
        photovault_commission_cents: photovaultFeeCents,
        payment_type: invoice.billing_reason === 'subscription_create' ? 'upfront' : 'monthly',
        stripe_payment_intent_id: paymentIntentId || invoice.id, // Fallback to invoice ID
        stripe_transfer_id: stripeTransferId,
        status: 'paid', // With destination charges, already paid
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .then(({ error }: { error: any }) => {
        if (error)
          logger.warn('[Webhook] Commission insert error (may be duplicate):', error.message)
        else logger.info(`[Webhook] Recorded subscription commission for photographer ${photographerId}`)
      })
  } else {
    logger.warn('[Webhook] Missing photographer_id in subscription metadata')
  }

  // Send payment successful email to client (non-blocking)
  if (clientId && galleryId) {
    try {
      const { data: clientData } = await supabase
        .from('users')
        .select(
          `
          email,
          full_name,
          clients!inner(
            photographer_id,
            photographers!inner(
              users!inner(full_name)
            )
          )
        `
        )
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
        const planName =
          invoice.billing_reason === 'subscription_create'
            ? 'Gallery Access - Monthly (First Payment)'
            : 'Gallery Access - Monthly'

        await EmailService.sendPaymentSuccessfulEmail({
          customerName: clientData.full_name || 'Valued Customer',
          customerEmail: clientData.email,
          amountPaid: invoice.amount_paid / 100,
          planName: planName,
          galleryName: galleryData.name,
          photographerName: (clientData as any).clients.photographers.users.full_name,
          receiptUrl: invoice.hosted_invoice_url || undefined,
          nextBillingDate: nextBillingDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        })

        logger.info(`[Webhook] Sent payment successful email to ${clientData.email}`)
      }
    } catch (emailError) {
      logger.error('[Webhook] Error sending payment successful email:', emailError)
      // Don't fail webhook if email fails
    }
  }

  return {
    success: true,
    message: `Payment succeeded for subscription ${subscriptionId}, commission ${photographerId && clientId ? 'created' : 'skipped'}`,
  }
}

/**
 * Handle failed subscription payment
 * Tracks failure count and suspends access after 6-month grace period
 */
export async function handlePaymentFailed(
  invoice: Invoice,
  ctx: WebhookContext
): Promise<HandlerResult> {
  logger.info('[Webhook] Processing invoice.payment_failed', invoice.id)

  const { supabase } = ctx

  const invoiceSubscription = (invoice as any).subscription
  const subscriptionId =
    typeof invoiceSubscription === 'string'
      ? invoiceSubscription
      : invoiceSubscription?.id

  if (!subscriptionId) {
    return {
      success: true,
      message: `Invoice ${invoice.id} payment failed (not subscription-related)`,
    }
  }

  const now = new Date()
  // Grace period: 6 months (per payment-models.ts COMMISSION_RULES)
  // During grace: client can resume $8/month anytime, no penalty
  // After grace: gallery archived, requires $20 reactivation
  const GRACE_PERIOD_MONTHS = 6
  const GRACE_PERIOD_MS = GRACE_PERIOD_MONTHS * 30 * 24 * 60 * 60 * 1000 // ~6 months in ms

  // Get current subscription state
  const { data: currentSubscription } = await supabase
    .from('subscriptions')
    .select('payment_failure_count, last_payment_failure_at, access_suspended')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  // Calculate new failure count and check if suspension is needed
  const newFailureCount = (currentSubscription?.payment_failure_count || 0) + 1
  const firstFailureTime = currentSubscription?.last_payment_failure_at
    ? new Date(currentSubscription.last_payment_failure_at)
    : now

  // Check if 6 months have passed since first failure
  const timeSinceFirstFailure = now.getTime() - firstFailureTime.getTime()
  const shouldSuspend =
    timeSinceFirstFailure >= GRACE_PERIOD_MS && !currentSubscription?.access_suspended

  // Build update object
  const updateData: Record<string, any> = {
    status: 'past_due',
    payment_failure_count: newFailureCount,
    updated_at: now.toISOString(),
  }

  // Only set last_payment_failure_at on first failure (to track grace period start)
  if (!currentSubscription?.last_payment_failure_at) {
    updateData.last_payment_failure_at = now.toISOString()
  }

  // Suspend access if grace period exceeded (6 months)
  if (shouldSuspend) {
    updateData.access_suspended = true
    updateData.access_suspended_at = now.toISOString()
    logger.info(
      `[Webhook] Suspending access for subscription ${subscriptionId} - 6 month grace period exceeded`
    )
  }

  // Update subscription
  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscriptionId)

  if (error) throw error

  // Record failed payment in history
  await supabase.from('payment_history').insert({
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    amount_paid_cents: 0,
    currency: invoice.currency,
    status: 'failed',
    created_at: now.toISOString(),
  })

  // Track client payment failed (server-side - critical event for churn tracking)
  try {
    // Get subscription to find user and gallery
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('user_id, gallery_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subData?.user_id) {
      await trackServerEvent(subData.user_id, EVENTS.CLIENT_PAYMENT_FAILED, {
        gallery_id: subData.gallery_id || '',
        failure_reason: 'card_declined', // Generic - actual reason in Stripe dashboard
        failure_count: newFailureCount,
        amount_cents: invoice.amount_due,
      })
    }
  } catch (trackError) {
    logger.error('[Webhook] Error tracking payment failure:', trackError)
    // Don't block webhook if tracking fails
  }

  // Get user and subscription details for notification (non-blocking)
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(
        `
        user_id,
        gallery_id,
        access_suspended,
        user_profiles!subscriptions_user_id_fkey(full_name),
        photo_galleries!subscriptions_gallery_id_fkey(gallery_name)
      `
      )
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subscription) {
      // Get user email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(subscription.user_id)
      const userEmail = userData?.user?.email

      if (userEmail) {
        const { EmailService } = await import('@/lib/email/email-service')

        // Calculate time remaining in 6-month grace period
        const msRemaining = Math.max(0, GRACE_PERIOD_MS - timeSinceFirstFailure)
        const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000))
        // Show months for clarity (on first failure, show full 6 months)
        const gracePeriodDays = daysRemaining || GRACE_PERIOD_MONTHS * 30

        await EmailService.sendPaymentFailedEmail({
          customerName: (subscription as any).user_profiles?.full_name || 'Valued Customer',
          customerEmail: userEmail,
          amountDue: invoice.amount_due / 100,
          galleryName: (subscription as any).photo_galleries?.gallery_name || 'your gallery',
          updatePaymentLink: `${process.env.NEXT_PUBLIC_SITE_URL}/client/billing`,
          gracePeriodDays: gracePeriodDays,
        })

        logger.info(
          `[Webhook] Sent payment failure email to ${userEmail} (${daysRemaining} days / ~${Math.ceil(daysRemaining / 30)} months remaining in grace period)`
        )
      }
    }
  } catch (emailError) {
    logger.error('[Webhook] Error sending payment failed email:', emailError)
    // Don't fail webhook if email fails
  }

  return {
    success: true,
    message: `Payment failed for subscription ${subscriptionId}, failure count: ${newFailureCount}, suspended: ${shouldSuspend}`,
  }
}
