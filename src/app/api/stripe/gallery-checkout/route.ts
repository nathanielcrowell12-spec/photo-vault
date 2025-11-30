import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getStripeClient, PHOTOGRAPHER_COMMISSION_RATE } from '@/lib/stripe'
import { getPaymentOptionById } from '@/lib/payment-models'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Create Stripe Checkout Session for Gallery Payment
 * POST /api/stripe/gallery-checkout
 *
 * Supports both billing modes:
 * - all_in_one: Single invoice with shoot fee + storage combined
 * - storage_only: Just the storage package fee
 *
 * IMPORTANT: Client sees ONE total - no itemization. Clean and professional.
 *
 * Body:
 * {
 *   galleryId: string
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
    const { galleryId } = body

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Missing required field: galleryId' },
        { status: 400 }
      )
    }

    // 3. Get gallery with all pricing details
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select(`
        id,
        gallery_name,
        photographer_id,
        client_id,
        payment_option_id,
        billing_mode,
        shoot_fee,
        storage_fee,
        total_amount,
        payment_status
      `)
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // 4. Check if already paid
    if (gallery.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'This gallery has already been paid for' },
        { status: 400 }
      )
    }

    // 5. SECURITY: Verify user is the client for this gallery
    if (gallery.client_id) {
      const { data: clientRecord, error: clientError } = await supabase
        .from('clients')
        .select('id, user_id, email')
        .eq('id', gallery.client_id)
        .single()

      if (clientError || !clientRecord) {
        console.error('[GalleryCheckout] Client record not found:', galleryId)
        return NextResponse.json(
          { error: 'Client record not found' },
          { status: 404 }
        )
      }

      const isLinkedByUserId = clientRecord.user_id === user.id
      const isLinkedByEmail = clientRecord.email?.toLowerCase() === user.email?.toLowerCase()

      if (!isLinkedByUserId && !isLinkedByEmail) {
        console.warn(
          `[GalleryCheckout] SECURITY: User ${user.id} tried to pay for gallery ${galleryId} ` +
          `but is not the assigned client`
        )
        return NextResponse.json(
          { error: 'You are not authorized to pay for this gallery' },
          { status: 403 }
        )
      }

      // Link by user_id if matched by email
      if (!isLinkedByUserId && isLinkedByEmail) {
        await supabase
          .from('clients')
          .update({ user_id: user.id })
          .eq('id', gallery.client_id)
        console.log(`[GalleryCheckout] Linked client ${gallery.client_id} to user ${user.id}`)
      }
    }

    // 6. Get photographer info
    const { data: photographer, error: photographerError } = await supabase
      .from('user_profiles')
      .select('id, full_name, stripe_account_id')
      .eq('id', gallery.photographer_id)
      .single()

    if (photographerError || !photographer) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 })
    }

    // 7. Get or create Stripe customer
    const stripe = getStripeClient()

    const { data: userData } = await supabase
      .from('user_profiles')
      .select('email, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    const userEmail = userData?.email || user.email || ''
    const userName = userData?.full_name || undefined
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

      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // 8. Calculate payment amounts (all in cents)
    const totalAmountCents = gallery.total_amount || 0
    const shootFeeCents = gallery.shoot_fee || 0
    const storageFeeCents = gallery.storage_fee || 0

    // Shoot Only galleries have no upfront payment
    if (gallery.payment_option_id === 'shoot_only' && totalAmountCents === 0) {
      // No payment needed - mark as paid and return success
      await supabase
        .from('photo_galleries')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', galleryId)

      return NextResponse.json({
        success: true,
        message: 'Shoot Only gallery - no payment required',
        redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/client/gallery/${galleryId}?payment=success`,
      })
    }

    if (totalAmountCents === 0) {
      return NextResponse.json(
        { error: 'Gallery has no payment amount set' },
        { status: 400 }
      )
    }

    // 9. Get payment option details
    const paymentOption = getPaymentOptionById(gallery.payment_option_id || '')

    // 10. Calculate revenue split
    // Storage commission: 50% of storage fee goes to photographer
    const storageCommissionCents = Math.round(storageFeeCents * PHOTOGRAPHER_COMMISSION_RATE)
    // Photographer receives: full shoot fee + storage commission
    const photographerPayoutCents = shootFeeCents + storageCommissionCents
    // PhotoVault receives: storage fee minus commission
    const photovaultRevenueCents = storageFeeCents - storageCommissionCents

    // 11. Create checkout session
    // Client sees ONE line item - "Photography Services" with the total amount
    // No itemization of shoot fee vs storage - clean and professional

    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment for upfront amount
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: totalAmountCents,
            product_data: {
              name: 'Photography Services',
              description: gallery.gallery_name || 'Photo Gallery',
              // Don't show itemization - just the gallery name
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'gallery_payment',
        galleryId: gallery.id,
        photographerId: photographer.id,
        clientId: user.id,
        billingMode: gallery.billing_mode,
        paymentOptionId: gallery.payment_option_id || '',
        shootFeeCents: shootFeeCents.toString(),
        storageFeeCents: storageFeeCents.toString(),
        photographerPayoutCents: photographerPayoutCents.toString(),
        photovaultRevenueCents: photovaultRevenueCents.toString(),
      },
      // If photographer has Stripe Connect, set up transfer
      ...(photographer.stripe_account_id && {
        payment_intent_data: {
          // Don't use destination charges - we'll do a separate transfer
          // This gives us more control over timing and split
          metadata: {
            galleryId: gallery.id,
            photographerId: photographer.id,
            photographerStripeAccountId: photographer.stripe_account_id,
            photographerPayoutCents: photographerPayoutCents.toString(),
          },
        },
      }),
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/gallery/${galleryId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/gallery/${galleryId}?payment=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    // 12. Store checkout session ID on gallery
    await supabase
      .from('photo_galleries')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', galleryId)

    console.log(
      `[GalleryCheckout] Created session ${session.id} for gallery ${galleryId}`,
      {
        total: totalAmountCents,
        shootFee: shootFeeCents,
        storageFee: storageFeeCents,
        photographerPayout: photographerPayoutCents,
        photovaultRevenue: photovaultRevenueCents,
      }
    )

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      amount: totalAmountCents,
      currency: 'usd',
    })

  } catch (error) {
    const err = error as Error
    console.error('[GalleryCheckout] Error:', err)

    return NextResponse.json(
      { error: 'Failed to create checkout session', message: err.message },
      { status: 500 }
    )
  }
}
