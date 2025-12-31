import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getStripeClient } from '@/lib/stripe'
import { logger } from '@/lib/logger'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Create Stripe SetupIntent for adding a payment method
 * POST /api/stripe/setup-intent
 *
 * Used by photographers and clients to add their payment method
 * for subscription payments.
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

    // 2. Get or create Stripe customer
    const stripe = getStripeClient()

    // Check user_profiles for existing stripe_customer_id
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email, full_name, user_type')
      .eq('id', user.id)
      .single()

    let customerId = userData?.stripe_customer_id

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData?.email || user.email || '',
        name: userData?.full_name || undefined,
        metadata: {
          userId: user.id,
          userType: userData?.user_type || 'unknown',
        },
      })

      customerId = customer.id

      // Save customer ID to user_profiles
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // 3. Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        userId: user.id,
        userType: userData?.user_type || 'unknown',
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    })

  } catch (error) {
    const err = error as Error
    logger.error('[SetupIntent] Error:', err)

    return NextResponse.json(
      { error: 'Failed to create setup intent', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Get customer's saved payment methods
 * GET /api/stripe/setup-intent
 */
export async function GET() {
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

    // 2. Get stripe_customer_id
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!userData?.stripe_customer_id) {
      return NextResponse.json({ paymentMethods: [] })
    }

    // 3. Get payment methods from Stripe
    const stripe = getStripeClient()
    const paymentMethods = await stripe.paymentMethods.list({
      customer: userData.stripe_customer_id,
      type: 'card',
    })

    // 4. Get default payment method
    const customer = await stripe.customers.retrieve(userData.stripe_customer_id)
    const defaultPaymentMethodId =
      typeof customer !== 'string' && !customer.deleted
        ? customer.invoice_settings?.default_payment_method
        : null

    return NextResponse.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPaymentMethodId,
      })),
    })

  } catch (error) {
    const err = error as Error
    logger.error('[SetupIntent] Error fetching payment methods:', err)

    return NextResponse.json(
      { error: 'Failed to fetch payment methods', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Set default payment method
 * PUT /api/stripe/setup-intent
 * Body: { paymentMethodId: string }
 */
export async function PUT(request: NextRequest) {
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
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing paymentMethodId' },
        { status: 400 }
      )
    }

    // 3. Get stripe_customer_id
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 400 }
      )
    }

    // 4. Set as default payment method
    const stripe = getStripeClient()
    await stripe.customers.update(userData.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    const err = error as Error
    logger.error('[SetupIntent] Error setting default payment method:', err)

    return NextResponse.json(
      { error: 'Failed to set default payment method', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Delete a payment method
 * DELETE /api/stripe/setup-intent
 * Body: { paymentMethodId: string }
 */
export async function DELETE(request: NextRequest) {
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
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing paymentMethodId' },
        { status: 400 }
      )
    }

    // 3. Detach payment method from customer
    const stripe = getStripeClient()
    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })

  } catch (error) {
    const err = error as Error
    logger.error('[SetupIntent] Error deleting payment method:', err)

    return NextResponse.json(
      { error: 'Failed to delete payment method', message: err.message },
      { status: 500 }
    )
  }
}
