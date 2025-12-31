import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getStripeClient, STRIPE_PRICES, PRICING } from '@/lib/stripe'

// Force dynamic rendering to prevent module evaluation during build
export const dynamic = 'force-dynamic'

/**
 * Create Stripe Checkout Session for Client Subscription
 * POST /api/stripe/create-checkout
 *
 * SECURITY: Only the client associated with a gallery can be billed.
 * This prevents fraudulent photographers from sending bills to random users.
 *
 * Body:
 * {
 *   galleryId: string
 *   photographerId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { galleryId, photographerId } = body

    if (!galleryId || !photographerId) {
      return NextResponse.json(
        { error: 'Missing required fields: galleryId, photographerId' },
        { status: 400 }
      )
    }

    // 3. Verify gallery exists and belongs to photographer
    // Also fetch client_id for security verification
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select('id, gallery_name, photographer_id, client_id')
      .eq('id', galleryId)
      .eq('photographer_id', photographerId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // 4. SECURITY CHECK: Verify the authenticated user is the client for this gallery
    // This prevents photographers from billing random users
    if (gallery.client_id) {
      // Gallery has a client_id - verify the user is linked to this client
      const { data: clientRecord, error: clientError } = await supabase
        .from('clients')
        .select('id, user_id, email')
        .eq('id', gallery.client_id)
        .single()

      if (clientError || !clientRecord) {
        logger.error('[Checkout] Client record not found for gallery:', galleryId)
        return NextResponse.json(
          { error: 'Client record not found for this gallery' },
          { status: 404 }
        )
      }

      // Check if the client record is linked to the authenticated user
      const isLinkedByUserId = clientRecord.user_id === user.id
      const isLinkedByEmail = clientRecord.email?.toLowerCase() === user.email?.toLowerCase()

      if (!isLinkedByUserId && !isLinkedByEmail) {
        logger.warn(
          `[Checkout] SECURITY: User ${user.id} (${user.email}) attempted to checkout for gallery ${galleryId} ` +
          `but is not the associated client (client_id: ${gallery.client_id}, client_email: ${clientRecord.email})`
        )
        return NextResponse.json(
          { error: 'You are not authorized to pay for this gallery. Only the assigned client can complete payment.' },
          { status: 403 }
        )
      }

      // If matched by email but not yet linked by user_id, link them now
      if (!isLinkedByUserId && isLinkedByEmail) {
        await supabase
          .from('clients')
          .update({ user_id: user.id })
          .eq('id', gallery.client_id)
        logger.info(`[Checkout] Linked client ${gallery.client_id} to user ${user.id} via email match`)
      }
    } else {
      // Gallery has no client_id - this is likely a family/direct account scenario
      // Verify the user owns this gallery directly (user_id on gallery)
      const { data: galleryWithUser } = await supabase
        .from('photo_galleries')
        .select('user_id')
        .eq('id', galleryId)
        .single()

      if (galleryWithUser?.user_id && galleryWithUser.user_id !== user.id) {
        logger.warn(
          `[Checkout] SECURITY: User ${user.id} attempted to checkout for gallery ${galleryId} ` +
          `but gallery belongs to user ${galleryWithUser.user_id}`
        )
        return NextResponse.json(
          { error: 'You are not authorized to pay for this gallery.' },
          { status: 403 }
        )
      }
    }

    // 5. Get photographer info
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('id, business_name')
      .eq('id', photographerId)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 })
    }

    // 7. Get user info from user_profiles
    // Note: email is on auth.users, not user_profiles
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    // Use email from auth user (not in user_profiles table)
    const userEmail = user.email || ''
    const userName = userData?.full_name || undefined

    if (userError && !userData) {
      logger.warn('[Checkout] User profile not found, using auth user data')
    }

    // 8. Create or retrieve Stripe customer
    const stripe = getStripeClient()
    let customerId = userData?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName,
        metadata: {
          userId: user.id,
          role: 'client',
        },
      })

      customerId = customer.id

      // Update user record with Stripe customer ID (try both tables)
      if (userData) {
        await supabase
          .from('user_profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }
      
      // Also try users table if it exists
      try {
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      } catch (e) {
        // Table might not exist, that's okay
      }
    }

    // 9. Check if client already has an active subscription for this gallery
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, status')
      .eq('client_id', user.id)
      .eq('gallery_id', galleryId)
      .in('status', ['active', 'trialing', 'past_due'])
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        {
          error: 'You already have an active subscription for this gallery',
          subscriptionId: existingSubscription.stripe_subscription_id,
        },
        { status: 400 }
      )
    }

    // 10. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: STRIPE_PRICES.CLIENT_MONTHLY,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        photographerId: photographer.id,
        galleryId: gallery.id,
        galleryName: gallery.gallery_name || gallery.id,
      },
      subscription_data: {
        metadata: {
          client_id: user.id,
          photographer_id: photographer.id,
          gallery_id: gallery.id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/gallery/${galleryId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/gallery/${galleryId}?payment=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      automatic_tax: {
        enabled: false, // Enable this in production if needed
      },
    })

    // 11. Log checkout session creation
    logger.info(`[Checkout] Created session ${session.id} for user ${user.id}, gallery ${galleryId}`)

    return NextResponse.json(
      {
        sessionId: session.id,
        url: session.url,
        amount: PRICING.CLIENT_MONTHLY.amount,
        currency: PRICING.CLIENT_MONTHLY.currency,
      },
      { status: 200 }
    )
  } catch (error) {
    const err = error as Error
    logger.error('[Checkout] Error creating checkout session:', err)

    return NextResponse.json(
      { error: 'Failed to create checkout session', message: err.message },
      { status: 500 }
    )
  }
}
