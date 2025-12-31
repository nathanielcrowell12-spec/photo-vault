import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getStripeClient } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// Monthly subscription price (same as regular client)
const MONTHLY_SUBSCRIPTION_CENTS = 800 // $8/month

interface TakeoverEligibility {
  eligible: boolean
  error?: string
  accountId?: string
  primaryName?: string
  primaryEmail?: string
  galleryCount?: number
  accountStatus?: 'grace_period' | 'suspended' | 'active'
  monthsOverdue?: number
  secondaryId?: string
  relationship?: string
  alreadyTakenOver?: boolean
  currentBillingPayer?: string
}

/**
 * GET /api/family/takeover
 * Check if user is eligible to take over an account
 * 
 * Query: ?account=<account_id>
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account')

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing account parameter' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // Check if user is an accepted secondary on this account
    const { data: secondary, error: secondaryError } = await serviceSupabase
      .from('secondaries')
      .select('id, relationship, status, is_billing_payer')
      .eq('account_id', accountId)
      .eq('secondary_user_id', user.id)
      .single()

    if (secondaryError || !secondary) {
      return NextResponse.json({
        eligible: false,
        error: 'You are not a designated family member on this account'
      } as TakeoverEligibility)
    }

    if (secondary.status !== 'accepted') {
      return NextResponse.json({
        eligible: false,
        error: 'Your family membership has not been accepted or has been revoked'
      } as TakeoverEligibility)
    }

    // Check if someone else is already the billing payer
    const { data: existingPayer } = await serviceSupabase
      .from('secondaries')
      .select('name')
      .eq('account_id', accountId)
      .eq('is_billing_payer', true)
      .neq('secondary_user_id', user.id)
      .single()

    if (existingPayer) {
      return NextResponse.json({
        eligible: false,
        error: `Another family member (${existingPayer.name}) has already taken over billing`,
        alreadyTakenOver: true,
        currentBillingPayer: existingPayer.name
      } as TakeoverEligibility)
    }

    // Get primary account info
    const { data: primary, error: primaryError } = await serviceSupabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('id', accountId)
      .single()

    if (primaryError || !primary) {
      return NextResponse.json({
        eligible: false,
        error: 'Account not found'
      } as TakeoverEligibility)
    }

    // Check subscription status
    const { data: subscriptions } = await serviceSupabase
      .from('subscriptions')
      .select('status, access_suspended, last_payment_failure_at, cancel_at_period_end')
      .eq('user_id', accountId)
      .order('created_at', { ascending: false })
      .limit(1)

    const subscription = subscriptions?.[0]
    
    // Determine account status
    let accountStatus: 'grace_period' | 'suspended' | 'active' = 'active'
    let monthsOverdue = 0

    if (subscription?.access_suspended) {
      accountStatus = 'suspended'
      // Calculate months since suspension (rough estimate)
      if (subscription.last_payment_failure_at) {
        const failureDate = new Date(subscription.last_payment_failure_at)
        const now = new Date()
        monthsOverdue = Math.floor((now.getTime() - failureDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
      }
    } else if (subscription?.cancel_at_period_end || subscription?.status === 'past_due') {
      accountStatus = 'grace_period'
      if (subscription.last_payment_failure_at) {
        const failureDate = new Date(subscription.last_payment_failure_at)
        const now = new Date()
        monthsOverdue = Math.floor((now.getTime() - failureDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
      }
    }

    // For now, allow takeover even on active accounts (for testing)
    // In production, you might want to restrict this
    // if (accountStatus === 'active') {
    //   return NextResponse.json({
    //     eligible: false,
    //     error: 'This account is currently active and doesn\'t need assistance'
    //   } as TakeoverEligibility)
    // }

    // Count galleries
    const { count: galleryCount } = await serviceSupabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', accountId)

    return NextResponse.json({
      eligible: true,
      accountId,
      primaryName: primary.full_name || 'Account Holder',
      primaryEmail: primary.email,
      galleryCount: galleryCount || 0,
      accountStatus,
      monthsOverdue,
      secondaryId: secondary.id,
      relationship: secondary.relationship
    } as TakeoverEligibility)

  } catch (error) {
    logger.error('[Takeover GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/family/takeover
 * Process the account takeover
 * 
 * Body: {
 *   accountId: string,
 *   takeoverType: 'full_primary' | 'billing_only',
 *   reason?: 'death' | 'financial' | 'health' | 'other',
 *   reasonText?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { accountId, takeoverType, reason, reasonText } = body

    // Validate required fields
    if (!accountId || !takeoverType) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, takeoverType' },
        { status: 400 }
      )
    }

    if (!['full_primary', 'billing_only'].includes(takeoverType)) {
      return NextResponse.json(
        { error: 'Invalid takeoverType. Must be "full_primary" or "billing_only"' },
        { status: 400 }
      )
    }

    if (reason && !['death', 'financial', 'health', 'other'].includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceRoleClient()

    // Re-validate eligibility (race condition protection)
    const { data: secondary, error: secondaryError } = await serviceSupabase
      .from('secondaries')
      .select('id, name, email, relationship, status')
      .eq('account_id', accountId)
      .eq('secondary_user_id', user.id)
      .eq('status', 'accepted')
      .single()

    if (secondaryError || !secondary) {
      return NextResponse.json(
        { error: 'You are not eligible to take over this account' },
        { status: 403 }
      )
    }

    // Check if someone else already took over (race condition)
    const { data: existingPayer } = await serviceSupabase
      .from('secondaries')
      .select('name')
      .eq('account_id', accountId)
      .eq('is_billing_payer', true)
      .single()

    if (existingPayer) {
      return NextResponse.json(
        { error: `Another family member (${existingPayer.name}) has already taken over` },
        { status: 409 }
      )
    }

    // Get primary account info
    const { data: primary } = await serviceSupabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('id', accountId)
      .single()

    if (!primary) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Get new payer's profile
    const { data: newPayerProfile } = await serviceSupabase
      .from('user_profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    // Count galleries for confirmation email
    const { count: galleryCount } = await serviceSupabase
      .from('photo_galleries')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', accountId)

    // Create Stripe checkout session for the takeover payment
    const stripe = getStripeClient()

    // Get or create Stripe customer for the secondary
    let stripeCustomerId = newPayerProfile?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: newPayerProfile?.email || user.email || secondary.email,
        name: newPayerProfile?.full_name || secondary.name,
        metadata: {
          user_id: user.id,
          takeover_from: accountId,
        },
      })
      stripeCustomerId = customer.id

      // Save customer ID
      await serviceSupabase
        .from('user_profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PhotoVault Family Takeover',
              description: `Take over billing for ${primary.full_name || 'family account'} - ${galleryCount || 0} galleries`,
            },
            unit_amount: MONTHLY_SUBSCRIPTION_CENTS,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/family/takeover?success=true&account=${accountId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/family/takeover?account=${accountId}&cancelled=true`,
      metadata: {
        type: 'family_takeover',
        account_id: accountId,
        secondary_id: secondary.id,
        takeover_type: takeoverType,
        reason: reason || 'not_specified',
        reason_text: reasonText || '',
        new_payer_user_id: user.id,
        previous_primary_id: primary.id,
      },
    })

    logger.info(`[Takeover] Created checkout session for user ${user.id} to take over account ${accountId}`)

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      message: 'Redirecting to payment...',
    })

  } catch (error) {
    logger.error('[Takeover POST] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Note: completeTakeover helper moved to @/lib/server/family-takeover-service.ts
// to avoid Next.js API route export restrictions

