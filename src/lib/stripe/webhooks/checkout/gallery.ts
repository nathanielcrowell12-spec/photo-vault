/**
 * Gallery Checkout Handler
 *
 * Handles: checkout.session.completed for gallery payments
 * - Public checkout (isPublicCheckout === 'true'): Creates user account
 * - Authenticated checkout (type === 'gallery_payment'): Existing user pays
 *
 * This is the most complex handler - handles user creation, commission recording,
 * subscription access, and welcome emails.
 */
import { logger } from '@/lib/logger'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'
import {
  isFirstTime,
  calculateTimeFromSignup,
  getPhotographerSignupDate,
  mapPaymentOptionToPlanType,
} from '@/lib/analytics/helpers'
import { getStripeClient } from '../helpers'
import type { WebhookContext, HandlerResult, CheckoutSession, CheckoutSessionMetadata } from '../types'

/**
 * Handle gallery checkout (both public and authenticated)
 */
export async function handleGalleryCheckout(
  session: CheckoutSession,
  ctx: WebhookContext
): Promise<HandlerResult> {
  const { supabase, stripe } = ctx
  const metadata = (session.metadata || {}) as CheckoutSessionMetadata
  const {
    isPublicCheckout,
    type,
    galleryId,
    photographerId,
    clientId,
    clientEmail,
    clientName,
    totalAmount,
    shootFee,
    storageFee,
  } = metadata

  const checkoutType = isPublicCheckout === 'true' ? 'public' : 'authenticated'
  logger.info(`[Webhook] Processing ${checkoutType} gallery checkout for gallery:`, galleryId)

  // Get client email from clients table (photographer already has it)
  let customerEmail: string = ''
  let customerName: string = ''

  if (clientId) {
    const { data: client } = await supabase
      .from('clients')
      .select('email, name')
      .eq('id', clientId)
      .single()

    if (client) {
      customerEmail = client.email
      customerName = client.name
    }
  }

  // Fallback to Stripe session email if client record doesn't have it
  if (!customerEmail) {
    customerEmail = session.customer_details?.email || clientEmail || ''
    customerName = session.customer_details?.name || clientName || customerName
  }

  if (!customerEmail) {
    logger.error('[Webhook] No customer email found in checkout')
    throw new Error('No customer email found in checkout')
  }

  const stripeCustomerId = session.customer as string

  // Check if a user with this email already exists
  let userId: string | null = null
  let tempPassword: string | null = null

  // First try to find existing user by email using listUsers
  try {
    const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const existingUser = allUsers?.users?.find(
      (u: { email?: string; id: string }) =>
        u.email?.toLowerCase() === customerEmail.toLowerCase()
    )

    if (existingUser) {
      userId = existingUser.id
      logger.info('[Webhook] Found existing user by email:', userId)
    }
  } catch (lookupErr) {
    logger.info('[Webhook] User lookup failed, will try to create user')
  }

  // If no user exists and this is a public checkout, create account with temp password
  if (!userId && isPublicCheckout === 'true') {
    logger.info('[Webhook] Creating new user account for public checkout:', customerEmail)

    // Generate secure random password (16 chars: uppercase, lowercase, numbers)
    const crypto = await import('crypto')
    const randomBytes = crypto.randomBytes(12)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    tempPassword = Array.from(randomBytes)
      .map((byte) => chars[byte % chars.length])
      .join('')

    // Create user with Supabase Admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: customerEmail.toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: customerName || '',
        user_type: 'client',
      },
    })

    if (createError) {
      // If user already exists, fetch the existing user instead of failing
      if (
        createError.code === 'email_exists' ||
        createError.message?.includes('already been registered')
      ) {
        logger.info('[Webhook] User already exists, fetching existing user:', customerEmail)

        // List all users and find the matching one (workaround for missing getUserByEmail)
        const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        const existingUser = allUsers?.users?.find(
          (u: { email?: string; id: string }) =>
            u.email?.toLowerCase() === customerEmail.toLowerCase()
        )

        if (existingUser) {
          userId = existingUser.id
          tempPassword = null // Don't send temp password for existing users
          logger.info('[Webhook] Found existing user:', userId)
        } else {
          logger.error('[Webhook] Could not find existing user despite email_exists error')
          throw new Error(`User lookup failed: ${createError.message}`)
        }
      } else {
        logger.error('[Webhook] Error creating user:', createError)
        throw new Error(`Failed to create user account: ${createError.message}`)
      }
    } else if (!newUser?.user) {
      throw new Error('User creation succeeded but no user returned')
    } else {
      userId = newUser.user.id
      logger.info('[Webhook] Created new user account:', userId)

      // Track client account creation (server-side - critical funnel event)
      try {
        await trackServerEvent(userId!, EVENTS.CLIENT_CREATED_ACCOUNT, {
          gallery_id: galleryId || undefined,
          photographer_id: photographerId || undefined,
          signup_method: 'email' as const,
        })
      } catch (trackError) {
        logger.error('[Webhook] Error tracking client account creation:', trackError)
        // Don't block checkout if tracking fails
      }
    }

    // Create user_profiles record
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: userId,
      full_name: customerName || '',
      user_type: 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      logger.error('[Webhook] Error creating user profile:', profileError)
      // Don't fail - profile might already exist or be created by trigger
    }
  }

  // Update gallery payment status
  const { error: galleryError } = await supabase
    .from('photo_galleries')
    .update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq('id', galleryId)

  if (galleryError) {
    logger.error('[Webhook] Error updating gallery:', galleryError)
  }

  // Update client record to link user (happens after user creation)
  if (clientId && userId) {
    const { error: clientUpdateError } = await supabase
      .from('clients')
      .update({
        user_id: userId,
      })
      .eq('id', clientId)

    if (clientUpdateError) {
      logger.error('[Webhook] Error linking user to client:', clientUpdateError)
      // Don't fail webhook - user account is created, just not linked
    } else {
      logger.info('[Webhook] Successfully linked user to client', { userId, clientId })
    }
  } else if (clientId && !userId) {
    logger.warn('[Webhook] Cannot link client - no user ID available')
  }

  // Record the commission for the photographer
  // With DESTINATION CHARGES, money is ALREADY transferred to photographer!
  const amountPaidCents = session.amount_total || parseInt(totalAmount || '0')

  let shootFeeCents: number
  let storageFeeCents: number
  let photovaultFeeCents: number
  let photographerGrossCents: number

  if (type === 'gallery_payment' && metadata.shootFeeCents) {
    // Authenticated checkout format (from gallery-checkout endpoint)
    shootFeeCents = parseInt(metadata.shootFeeCents?.toString() || '0')
    storageFeeCents = parseInt(metadata.storageFeeCents?.toString() || '0')
    photovaultFeeCents = parseInt(metadata.photovaultRevenueCents?.toString() || '0')
    photographerGrossCents = parseInt(metadata.photographerPayoutCents?.toString() || '0')
  } else {
    // Public checkout format (legacy - for backwards compatibility)
    shootFeeCents = parseInt(shootFee || '0')
    storageFeeCents = parseInt(storageFee || totalAmount || '0')
    photovaultFeeCents =
      parseInt(session.metadata?.photovaultFee || '0') || Math.round(storageFeeCents * 0.5)
    photographerGrossCents = amountPaidCents - photovaultFeeCents
  }

  // Get the Stripe transfer ID from the payment intent for reconciliation
  let stripeTransferId: string | null = null
  try {
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string,
        { expand: ['latest_charge'] }
      )

      // For destination charges, the transfer is on the charge
      const charge = paymentIntent.latest_charge
      if (charge && typeof charge !== 'string') {
        if (charge.transfer) {
          stripeTransferId =
            typeof charge.transfer === 'string' ? charge.transfer : charge.transfer.id
        }
      }
    }
  } catch (err) {
    logger.warn('[Webhook] Could not retrieve transfer ID:', err)
    // Don't fail the webhook if we can't get transfer ID - it's not critical
  }

  logger.info('[Webhook] Commission breakdown (DESTINATION CHARGE - already paid):', {
    totalPaid: amountPaidCents,
    shootFee: shootFeeCents,
    storageFee: storageFeeCents,
    photovaultFee: photovaultFeeCents,
    photographerGross: photographerGrossCents,
    stripeTransferId,
  })

  await supabase
    .from('commissions')
    .insert({
      photographer_id: photographerId,
      gallery_id: galleryId,
      client_email: customerEmail,
      amount_cents: photographerGrossCents, // What photographer received
      total_paid_cents: amountPaidCents,
      shoot_fee_cents: shootFeeCents,
      storage_fee_cents: storageFeeCents,
      photovault_commission_cents: photovaultFeeCents,
      payment_type: 'upfront', // Year 1 upfront payment
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_transfer_id: stripeTransferId,
      status: 'paid', // ALREADY PAID - Stripe transferred money via destination charge
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .then(({ error }: { error: any }) => {
      if (error)
        logger.warn('[Webhook] Commission insert error (may be duplicate):', error.message)
    })

  // Track payment analytics (server-side - critical funnel events)
  try {
    const planType = mapPaymentOptionToPlanType(
      metadata.paymentOptionId || metadata.payment_option_id
    )

    // Track client payment completed
    if (userId) {
      const isFirstPayment = await isFirstTime('commissions', 'client_email', customerEmail)

      await trackServerEvent(userId, EVENTS.CLIENT_PAYMENT_COMPLETED, {
        gallery_id: galleryId,
        photographer_id: photographerId || '',
        plan_type: planType || 'annual',
        amount_cents: amountPaidCents,
        is_first_payment: isFirstPayment,
      })
    }

    // Track photographer received first payment
    if (photographerId) {
      const photographerSignupDate = await getPhotographerSignupDate(photographerId)
      const timeFromSignup = calculateTimeFromSignup(photographerSignupDate)

      // Check existing paid commissions count
      const { count: existingCommissions } = await supabase
        .from('commissions')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographerId)
        .eq('status', 'paid')

      // If this is their first (count includes the one we just inserted)
      if ((existingCommissions || 0) === 1) {
        await trackServerEvent(photographerId, EVENTS.PHOTOGRAPHER_RECEIVED_FIRST_PAYMENT, {
          amount_cents: photographerGrossCents,
          client_id: clientId || '',
          gallery_id: galleryId,
          time_from_signup_seconds: timeFromSignup ?? 0,
        })
      }
    }
  } catch (trackError) {
    logger.error('[Webhook] Error tracking payment analytics:', trackError)
    // Don't block webhook if tracking fails
  }

  // CRITICAL: Create subscription record to grant gallery access
  if (userId && galleryId) {
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id || null

    // Use payment intent or session ID as a pseudo-subscription ID
    const pseudoSubscriptionId = session.payment_intent
      ? `pi_${session.payment_intent}`
      : `cs_${session.id}`

    // Calculate subscription period (1 year for annual payment)
    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)

    const { error: subscriptionError } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        gallery_id: galleryId,
        stripe_subscription_id: pseudoSubscriptionId,
        stripe_customer_id: customerId,
        status: 'active',
        plan_type: 'annual_upfront', // Year 1 payment
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'stripe_subscription_id',
      }
    )

    if (subscriptionError) {
      logger.error('[Webhook] Error creating subscription record:', subscriptionError)
      // Don't fail webhook - payment is processed, this can be fixed later
    } else {
      logger.info('[Webhook] Created subscription record', { userId, galleryId })
    }
  }

  // Send welcome email with temp password if account was just created
  if (tempPassword && userId) {
    try {
      const { EmailService } = await import('@/lib/email/email-service')
      const { data: galleryData } = await supabase
        .from('photo_galleries')
        .select('gallery_name')
        .eq('id', galleryId)
        .single()

      await EmailService.sendWelcomeEmailWithPassword({
        customerName: customerName || 'Valued Customer',
        customerEmail: customerEmail,
        tempPassword: tempPassword,
        galleryName: galleryData?.gallery_name || 'your gallery',
        galleryUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/gallery/${galleryId}`,
        loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      })

      logger.info(`[Webhook] Sent welcome email with temp password to ${customerEmail}`)
    } catch (emailError) {
      logger.error('[Webhook] Error sending welcome email:', emailError)
      // Don't fail webhook if email fails - payment is already processed
    }
  }

  logger.info(
    `[Webhook] ${checkoutType === 'public' ? 'Public' : 'Authenticated'} checkout complete for gallery ${galleryId}, customer ${customerEmail}`
  )

  return {
    success: true,
    message: `${checkoutType === 'public' ? 'Public' : 'Authenticated'} gallery checkout completed for gallery ${galleryId}, customer ${customerEmail}`,
  }
}
