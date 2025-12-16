import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'
import { isFirstTime, calculateTimeFromSignup, getPhotographerSignupDate, mapPaymentOptionToPlanType } from '@/lib/analytics/helpers'

// Force dynamic rendering to prevent module evaluation during build
export const dynamic = 'force-dynamic'

// Lazy initialize Stripe to avoid build-time errors
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  })
}

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
    const stripe = getStripeClient()

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

    // 3. Initialize Supabase client with service role (elevated permissions for admin operations)
    const supabase = createServiceRoleClient()

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
      const supabase = createServiceRoleClient()
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
  const metadata = session.metadata || {}
  const { user_id, tokens, purchase_type, isPublicCheckout, type, galleryId, photographerId, clientId, clientEmail, clientName, galleryName, totalAmount, shootFee, storageFee, shootFeeCents, storageFeeCents, photovaultRevenueCents, photographerPayoutCents } = metadata

  // Handle gallery checkout (both public and authenticated)
  // Public checkout uses: isPublicCheckout === 'true'
  // Authenticated checkout uses: type === 'gallery_payment'
  if ((isPublicCheckout === 'true' || type === 'gallery_payment') && galleryId) {
    const checkoutType = isPublicCheckout === 'true' ? 'public' : 'authenticated'
    console.log(`[Webhook] Processing ${checkoutType} gallery checkout for gallery:`, galleryId)

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
      console.error('[Webhook] No customer email found in checkout')
      throw new Error('No customer email found in checkout')
    }

    const stripeCustomerId = session.customer as string

    // Check if a user with this email already exists (check auth.users, not user_profiles)
    // user_profiles doesn't have an email column - email is in auth.users
    let userId: string | null = null

    // First try to find existing user by email using getUserByEmail (newer Supabase method)
    // If that doesn't work, try listUsers and search manually
    try {
      const { data: existingUser, error: lookupError } = await supabase.auth.admin.getUserByEmail(
        customerEmail.toLowerCase()
      )

      if (!lookupError && existingUser?.user) {
        userId = existingUser.user.id
        console.log('[Webhook] Found existing user by email:', userId)
      }
    } catch (lookupErr) {
      // getUserByEmail might not exist in older versions, fall through to creation
      console.log('[Webhook] getUserByEmail not available or failed, will try to create user')
    }
    let tempPassword: string | null = null

    // If no user exists and this is a public checkout, create account with temp password
    if (!userId && isPublicCheckout === 'true') {
      console.log('[Webhook] Creating new user account for public checkout:', customerEmail)

      // Generate secure random password (16 chars: uppercase, lowercase, numbers)
      const crypto = await import('crypto')
      const randomBytes = crypto.randomBytes(12)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
      tempPassword = Array.from(randomBytes)
        .map(byte => chars[byte % chars.length])
        .join('')

      // Create user with Supabase Admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: customerEmail.toLowerCase(),
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: customerName || '',
          user_type: 'client'
        }
      })

      if (createError) {
        // If user already exists, fetch the existing user instead of failing
        if (createError.code === 'email_exists' || createError.message?.includes('already been registered')) {
          console.log('[Webhook] User already exists, fetching existing user:', customerEmail)

          // List all users and find the matching one (workaround for missing getUserByEmail)
          const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
          const existingUser = allUsers?.users?.find((u: { email?: string; id: string }) => u.email?.toLowerCase() === customerEmail.toLowerCase())

          if (existingUser) {
            userId = existingUser.id
            tempPassword = null // Don't send temp password for existing users
            console.log('[Webhook] Found existing user:', userId)
          } else {
            console.error('[Webhook] Could not find existing user despite email_exists error')
            throw new Error(`User lookup failed: ${createError.message}`)
          }
        } else {
          console.error('[Webhook] Error creating user:', createError)
          throw new Error(`Failed to create user account: ${createError.message}`)
        }
      } else if (!newUser?.user) {
        throw new Error('User creation succeeded but no user returned')
      } else {
        userId = newUser.user.id
        console.log('[Webhook] Created new user account:', userId)

        // Track client account creation (server-side - critical funnel event)
        // userId is guaranteed to be set here (assigned on line above)
        try {
          await trackServerEvent(userId!, EVENTS.CLIENT_CREATED_ACCOUNT, {
            gallery_id: galleryId || undefined,
            photographer_id: photographerId || undefined,
            signup_method: 'email' as const,
          })
        } catch (trackError) {
          console.error('[Webhook] Error tracking client account creation:', trackError)
          // Don't block checkout if tracking fails
        }
      }

      // Create user_profiles record (user_profiles doesn't have email column)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          full_name: customerName || '',
          user_type: 'client',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('[Webhook] Error creating user profile:', profileError)
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
      console.error('[Webhook] Error updating gallery:', galleryError)
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
        console.error('[Webhook] Error linking user to client:', clientUpdateError)
        // Don't fail webhook - user account is created, just not linked
      } else {
        console.log('[Webhook] Successfully linked user', userId, 'to client', clientId)
      }
    } else if (clientId && !userId) {
      console.warn('[Webhook] Cannot link client - no user ID available')
    }

    // Record the commission for the photographer
    // With DESTINATION CHARGES, money is ALREADY transferred to photographer!
    //
    // FEE MODEL (PhotoVault absorbs Stripe fees):
    // - Photographer receives: shoot_fee + 50% of storage_fee (FULL amount, no deductions)
    // - PhotoVault receives: 50% of storage_fee MINUS Stripe fees (~2.9% + $0.30)
    // - Example: $350 payment ($250 shoot + $100 storage)
    //   → Photographer gets $300 (shoot + 50% storage)
    //   → PhotoVault gets ~$40 ($50 minus ~$10 Stripe fees)
    // - This protects photographer earnings and simplifies their accounting
    
    // Handle both metadata formats:
    // - Public checkout: shootFee, storageFee, photovaultFee
    // - Authenticated checkout: shootFeeCents, storageFeeCents, photovaultRevenueCents, photographerPayoutCents
    const amountPaidCents = session.amount_total || parseInt(totalAmount || '0')
    
    let shootFeeCents: number
    let storageFeeCents: number
    let photovaultFeeCents: number
    let photographerGrossCents: number
    
    if (type === 'gallery_payment' && metadata.shootFeeCents) {
      // Authenticated checkout format (from gallery-checkout endpoint)
      shootFeeCents = parseInt(metadata.shootFeeCents.toString() || '0')
      storageFeeCents = parseInt(metadata.storageFeeCents.toString() || '0')
      photovaultFeeCents = parseInt(metadata.photovaultRevenueCents?.toString() || '0')
      photographerGrossCents = parseInt(metadata.photographerPayoutCents?.toString() || '0')
    } else {
      // Public checkout format (legacy - for backwards compatibility)
      shootFeeCents = parseInt(shootFee || '0')
      storageFeeCents = parseInt(storageFee || totalAmount || '0')
      photovaultFeeCents = parseInt(session.metadata?.photovaultFee || '0') || Math.round(storageFeeCents * 0.5)
      photographerGrossCents = amountPaidCents - photovaultFeeCents
    }

    // Get the Stripe transfer ID from the payment intent for reconciliation
    // For destination charges, the transfer is created automatically and linked to the charge
    let stripeTransferId: string | null = null
    try {
      const stripe = getStripeClient()
      if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string,
          { expand: ['latest_charge'] }
        )
        
        // For destination charges, the transfer is on the charge
        const charge = paymentIntent.latest_charge
        if (charge && typeof charge !== 'string') {
          // Get transfer from charge.transfer (available on destination charges)
          if (charge.transfer) {
            stripeTransferId = typeof charge.transfer === 'string' ? charge.transfer : charge.transfer.id
          }
          // Note: transfers.list() doesn't support source_transaction filter
          // For destination charges, the transfer should always be on the charge object
        }
      }
    } catch (err) {
      console.warn('[Webhook] Could not retrieve transfer ID:', err)
      // Don't fail the webhook if we can't get transfer ID - it's not critical
      // The transfer ID can be updated later if needed
    }

    console.log('[Webhook] Commission breakdown (DESTINATION CHARGE - already paid):', {
      totalPaid: amountPaidCents,
      shootFee: shootFeeCents,
      storageFee: storageFeeCents,
      photovaultFee: photovaultFeeCents,
      photographerGross: photographerGrossCents,
      stripeTransferId,
    })

    await supabase.from('commissions').insert({
      photographer_id: photographerId,
      gallery_id: galleryId,
      client_email: customerEmail,
      amount_cents: photographerGrossCents, // What photographer received (before Stripe fees)
      total_paid_cents: amountPaidCents,
      shoot_fee_cents: shootFeeCents,
      storage_fee_cents: storageFeeCents,
      photovault_commission_cents: photovaultFeeCents,
      payment_type: 'upfront', // Year 1 upfront payment
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_transfer_id: stripeTransferId, // Transfer already happened via destination charge
      status: 'paid', // ALREADY PAID - Stripe transferred money via destination charge
      paid_at: new Date().toISOString(), // Paid NOW
      created_at: new Date().toISOString(),
    }).then(({ error }: { error: any }) => {
      if (error) console.warn('[Webhook] Commission insert error (may be duplicate):', error.message)
    })

    // Track payment analytics (server-side - critical funnel events)
    try {
      // Get the payment option ID from gallery metadata for plan_type
      const planType = mapPaymentOptionToPlanType(metadata.paymentOptionId || metadata.payment_option_id)

      // Track client payment completed
      if (userId) {
        // Check if this is the client's first payment
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
        // Check if this is the photographer's first payment (before this one was recorded)
        const photographerSignupDate = await getPhotographerSignupDate(photographerId)
        const timeFromSignup = calculateTimeFromSignup(photographerSignupDate)

        // Check existing paid commissions count (excluding this one since we just inserted)
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
      console.error('[Webhook] Error tracking payment analytics:', trackError)
      // Don't block webhook if tracking fails
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
          loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`
        })

        console.log(`[Webhook] Sent welcome email with temp password to ${customerEmail}`)
      } catch (emailError) {
        console.error('[Webhook] Error sending welcome email:', emailError)
        // Don't fail webhook if email fails - payment is already processed
      }
    }

    console.log(`[Webhook] ${checkoutType === 'public' ? 'Public' : 'Authenticated'} checkout complete for gallery ${galleryId}, customer ${customerEmail}`)

    return `${checkoutType === 'public' ? 'Public' : 'Authenticated'} gallery checkout completed for gallery ${galleryId}, customer ${customerEmail}`
  }

  // Original logic for authenticated checkouts
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
  } else if (type === 'family_takeover') {
    // Family account takeover - secondary taking over billing
    console.log(`[Webhook] Processing family takeover for account: ${metadata.account_id}`)

    const { completeTakeover } = await import('@/lib/server/family-takeover-service')

    await completeTakeover(supabase, {
      account_id: metadata.account_id,
      secondary_id: metadata.secondary_id,
      takeover_type: metadata.takeover_type as 'full_primary' | 'billing_only',
      reason: metadata.reason,
      reason_text: metadata.reason_text,
      new_payer_user_id: metadata.new_payer_user_id,
      previous_primary_id: metadata.previous_primary_id,
    }, session.subscription as string)

    return `Family takeover completed for account ${metadata.account_id} by secondary ${metadata.secondary_id}`
  } else if (type === 'reactivation') {
    // Reactivation fee payment - restore access for 30 days
    const subscriptionId = metadata.stripe_subscription_id
    const galleryId = metadata.gallery_id

    if (!subscriptionId) {
      throw new Error('Missing subscription_id in reactivation checkout metadata')
    }

    console.log(`[Webhook] Processing reactivation payment for subscription ${subscriptionId}`)

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
      console.error('[Webhook] Error restoring access:', updateError)
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
      created_at: now.toISOString()
    })

    // Send reactivation confirmation email
    try {
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

        console.log(`[Webhook] Sent reactivation confirmation email to ${userEmail}`)
      }
    } catch (emailError) {
      console.error('[Webhook] Error sending reactivation email:', emailError)
      // Don't fail webhook for email issues
    }

    console.log(`[Webhook] Reactivation completed for subscription ${subscriptionId}, 30-day access until ${accessEndDate.toISOString()}`)

    return `Reactivation completed for subscription ${subscriptionId}, user ${user_id}, 30-day access window`
  } else {
    return `Checkout completed for user ${user_id}, type: ${purchase_type || type || 'unknown'}`
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
 * Also restores access if it was previously suspended due to failed payments
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
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) throw error

  // If access was suspended, send restoration email
  if (wasAccessSuspended && previousState?.user_id) {
    console.log(`[Webhook] Access restored for subscription ${subscriptionId}`)
    
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
        photographerName = photographerProfile?.business_name || photographerProfile?.full_name || 'Your Photographer'
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

        console.log(`[Webhook] Sent access restored email to ${userEmail}`)
      }
    } catch (emailError) {
      console.error('[Webhook] Error sending access restored email:', emailError)
      // Don't fail webhook if email fails
    }
  }

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

  // Record commission for subscription payment
  // With DESTINATION CHARGES on subscriptions, Stripe handles the split automatically
  // This record is for reporting/dashboard purposes only
  const stripe = getStripeClient()
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
      paymentIntentId = typeof invoiceAny.payment_intent === 'string'
        ? invoiceAny.payment_intent
        : invoiceAny.payment_intent?.id || null

      if (chargeId && typeof chargeId === 'string') {
        const charge = await stripe.charges.retrieve(chargeId)
        if (charge.transfer && typeof charge.transfer === 'string') {
          stripeTransferId = charge.transfer
        }
      }
    } catch (err) {
      console.warn('[Webhook] Could not retrieve transfer ID for subscription:', err)
    }

    await supabase.from('commissions').insert({
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
    }).then(({ error }: { error: any }) => {
      if (error) console.warn('[Webhook] Commission insert error (may be duplicate):', error.message)
      else console.log(`[Webhook] Recorded subscription commission for photographer ${photographerId}`)
    })
  } else {
    console.warn('[Webhook] Missing photographer_id in subscription metadata')
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
 * Tracks failure count and suspends access after 48 hours
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
  const shouldSuspend = timeSinceFirstFailure >= GRACE_PERIOD_MS && !currentSubscription?.access_suspended

  // Build update object
  const updateData: any = {
    status: 'past_due',
    payment_failure_count: newFailureCount,
    updated_at: now.toISOString()
  }

  // Only set last_payment_failure_at on first failure (to track grace period start)
  if (!currentSubscription?.last_payment_failure_at) {
    updateData.last_payment_failure_at = now.toISOString()
  }

  // Suspend access if grace period exceeded (6 months)
  if (shouldSuspend) {
    updateData.access_suspended = true
    updateData.access_suspended_at = now.toISOString()
    console.log(`[Webhook] Suspending access for subscription ${subscriptionId} - 6 month grace period exceeded`)
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
    created_at: now.toISOString()
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
    console.error('[Webhook] Error tracking payment failure:', trackError)
    // Don't block webhook if tracking fails
  }

  // Get user and subscription details for notification
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      user_id,
      gallery_id,
      access_suspended,
      user_profiles!subscriptions_user_id_fkey(full_name),
      photo_galleries!subscriptions_gallery_id_fkey(gallery_name)
    `)
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
      const gracePeriodDays = daysRemaining || (GRACE_PERIOD_MONTHS * 30)

      await EmailService.sendPaymentFailedEmail({
        customerName: subscription.user_profiles?.full_name || 'Valued Customer',
        customerEmail: userEmail,
        amountDue: invoice.amount_due / 100,
        galleryName: subscription.photo_galleries?.gallery_name || 'your gallery',
        updatePaymentLink: `${process.env.NEXT_PUBLIC_SITE_URL}/client/billing`,
        gracePeriodDays: gracePeriodDays,
      })

      console.log(`[Webhook] Sent payment failure email to ${userEmail} (${daysRemaining} days / ~${Math.ceil(daysRemaining / 30)} months remaining in grace period)`)
    }
  }

  return `Payment failed for subscription ${subscriptionId}, failure count: ${newFailureCount}, suspended: ${shouldSuspend}`
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
