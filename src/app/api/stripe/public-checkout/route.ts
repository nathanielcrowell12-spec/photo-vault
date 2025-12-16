import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { getStripeClient } from '@/lib/stripe'

// Force dynamic rendering to prevent module evaluation during build
export const dynamic = 'force-dynamic'

/**
 * Public Stripe Checkout for Unauthenticated Clients
 * POST /api/stripe/public-checkout
 *
 * Uses Stripe Connect DESTINATION CHARGES:
 * - Money goes DIRECTLY to photographer's Express account
 * - PhotoVault gets its cut via application_fee_amount
 * - Stripe handles 2-day settlement automatically
 * - No manual payout cron jobs needed
 *
 * Body:
 * {
 *   galleryId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { galleryId } = body

    if (!galleryId) {
      return NextResponse.json(
        { error: 'Missing required field: galleryId' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const supabase = createServiceRoleClient()

    // 1. Fetch gallery with pricing info
    const { data: gallery, error: galleryError } = await supabase
      .from('photo_galleries')
      .select(`
        id,
        gallery_name,
        photographer_id,
        client_id,
        total_amount,
        shoot_fee,
        storage_fee,
        billing_mode,
        payment_option_id
      `)
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      console.error('[PublicCheckout] Gallery not found:', galleryId, galleryError)
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // 2. Get client info if exists
    let clientEmail: string | null = null
    let clientName: string | null = null

    if (gallery.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('email, name')
        .eq('id', gallery.client_id)
        .single()

      if (client) {
        clientEmail = client.email
        clientName = client.name
      }
    }

    // 3. Get photographer info from user_profiles
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('id', gallery.photographer_id)
      .single()

    // 4. Get photographer's Stripe Connect account from photographers table
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id, stripe_connect_account_id, stripe_connect_status')
      .eq('id', gallery.photographer_id)
      .single()

    const photographerId = gallery.photographer_id
    const photographerName = userProfile?.full_name || 'Your Photographer'

    // 5. Check if photographer has Stripe Connect set up
    // CRITICAL: Block payment if photographer can't receive money
    if (!photographer?.stripe_connect_account_id || photographer.stripe_connect_status !== 'active') {
      console.error('[PublicCheckout] Photographer missing Stripe Connect:', {
        photographerId,
        hasAccountId: !!photographer?.stripe_connect_account_id,
        status: photographer?.stripe_connect_status
      })

      // TODO: Send email to photographer notifying them to connect Stripe

      return NextResponse.json({
        error: 'Payment setup incomplete',
        message: 'The photographer needs to complete their payment setup before you can pay. They have been notified.',
        code: 'PHOTOGRAPHER_STRIPE_MISSING',
      }, { status: 400 })
    }

    // 6. Determine pricing and fee split
    const totalAmountCents = gallery.total_amount || 10000 // Default $100
    const shootFeeCents = gallery.shoot_fee || 0
    const storageFeeCents = gallery.storage_fee || totalAmountCents // Default to total if no breakdown

    // DESTINATION CHARGE FEE MODEL:
    // - PhotoVault sets application_fee_amount = 50% of storage fee
    // - Photographer receives: shoot_fee + 50% of storage_fee (full amount, no deductions)
    // - PhotoVault receives: application_fee_amount MINUS Stripe fees (~2.9% + $0.30)
    // - PhotoVault absorbs ALL Stripe processing fees to protect photographer earnings
    // - Example: $100 storage → Photographer gets $50, PhotoVault gets ~$47 after Stripe fees
    const photovaultFeeCents = Math.round(storageFeeCents * 0.5)

    console.log('[PublicCheckout] Fee breakdown:', {
      totalAmount: totalAmountCents,
      shootFee: shootFeeCents,
      storageFee: storageFeeCents,
      photovaultFee: photovaultFeeCents,
      photographerGross: totalAmountCents - photovaultFeeCents,
    })

    // 7. Create Stripe Checkout Session with DESTINATION CHARGE
    const stripe = getStripeClient()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: clientEmail || undefined,
      customer_creation: 'always',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Photography Services',
              description: gallery.gallery_name || 'Photo Gallery',
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      // DESTINATION CHARGE: Money goes directly to photographer
      payment_intent_data: {
        application_fee_amount: photovaultFeeCents, // PhotoVault's cut (guaranteed)
        transfer_data: {
          destination: photographer.stripe_connect_account_id, // Photographer's Express account
        },
        metadata: {
          galleryId: gallery.id,
          photographerId: photographerId,
          clientId: gallery.client_id || '',
          clientEmail: clientEmail || '',
          galleryName: gallery.gallery_name,
          isPublicCheckout: 'true',
          // Fee breakdown for webhook recording
          totalAmount: totalAmountCents.toString(),
          shootFee: shootFeeCents.toString(),
          storageFee: storageFeeCents.toString(),
          photovaultFee: photovaultFeeCents.toString(),
        },
      },
      metadata: {
        galleryId: gallery.id,
        photographerId: photographerId,
        clientId: gallery.client_id || '',
        clientEmail: clientEmail || '',
        clientName: clientName || '',
        galleryName: gallery.gallery_name,
        isPublicCheckout: 'true',
        totalAmount: totalAmountCents.toString(),
        shootFee: shootFeeCents.toString(),
        storageFee: storageFeeCents.toString(),
        photovaultFee: photovaultFeeCents.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/gallery/${galleryId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/gallery/${galleryId}?payment=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    console.log(`[PublicCheckout] Created session ${session.id} for gallery ${galleryId}`)
    console.log(`[PublicCheckout] Destination charge: $${photovaultFeeCents/100} to PhotoVault, rest to photographer ${photographer.stripe_connect_account_id}`)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    const err = error as Error
    console.error('[PublicCheckout] Error:', err)

    return NextResponse.json(
      { error: 'Failed to create checkout session', message: err.message },
      { status: 500 }
    )
  }
}
