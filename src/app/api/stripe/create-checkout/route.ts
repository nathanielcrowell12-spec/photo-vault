import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getStripeClient, STRIPE_PRICES, PRICING } from '@/lib/stripe'

// Force dynamic rendering to prevent module evaluation during build
export const dynamic = 'force-dynamic'

/**
 * Create Stripe Checkout Session for Client Subscription
 * POST /api/stripe/create-checkout
 *
 * Body:
 * {
 *   galleryId: string
 *   photographerId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

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
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select('id, gallery_name, photographer_id')
      .eq('id', galleryId)
      .eq('photographer_id', photographerId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // 4. Get photographer info
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('id, business_name')
      .eq('id', photographerId)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 })
    }

    // 5. Get user info from user_profiles
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('email, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    // Fallback to auth user email if user_profiles doesn't have it
    const userEmail = userData?.email || user.email || ''
    const userName = userData?.full_name || undefined

    if (userError && !userData) {
      console.warn('[Checkout] User profile not found, using auth user data')
    }

    // 6. Create or retrieve Stripe customer
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

    // 7. Check if client already has an active subscription for this gallery
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

    // 8. Create Stripe Checkout Session
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

    // 9. Log checkout session creation
    console.log(`[Checkout] Created session ${session.id} for user ${user.id}, gallery ${galleryId}`)

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
    console.error('[Checkout] Error creating checkout session:', err)

    return NextResponse.json(
      { error: 'Failed to create checkout session', message: err.message },
      { status: 500 }
    )
  }
}
