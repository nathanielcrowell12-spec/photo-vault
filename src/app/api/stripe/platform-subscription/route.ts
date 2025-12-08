import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getStripeClient, createPlatformSubscription, getSubscription } from '@/lib/stripe'
import Stripe from 'stripe'

// Extended type for Stripe Subscription with period fields
interface SubscriptionWithPeriods extends Stripe.Subscription {
  current_period_start: number
  current_period_end: number
  trial_end: number | null
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Create platform subscription for photographer
 * POST /api/stripe/platform-subscription
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a photographer - check both user_profiles and photographers table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    // Also check if photographer record exists
    const { data: photographerCheck, error: photographerCheckError } = await supabase
      .from('photographers')
      .select('id')
      .eq('id', user.id)
      .single()

    console.log('[Platform Subscription] User verification:', {
      userId: user.id,
      userEmail: user.email,
      profile: profile ? { user_type: profile.user_type } : null,
      profileError: profileError?.message,
      photographerExists: !!photographerCheck,
      photographerCheckError: photographerCheckError?.message,
    })

    // If photographer record exists, allow access even if user_profiles.user_type is not set correctly
    const isPhotographer = photographerCheck || (profile && profile.user_type === 'photographer')

    if (!isPhotographer) {
      if (profileError) {
        console.error('[Platform Subscription] Error fetching user profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to verify user profile', details: profileError.message },
          { status: 500 }
        )
      }

      if (!profile) {
        console.error('[Platform Subscription] User profile not found for user:', user.id)
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }

      console.warn('[Platform Subscription] User is not a photographer:', {
        userId: user.id,
        userType: profile.user_type,
        photographerRecordExists: !!photographerCheck,
      })
      return NextResponse.json(
        { error: 'Only photographers can create platform subscriptions', userType: profile.user_type },
        { status: 403 }
      )
    }

    // Check if photographer already has a subscription
    // If photographer record doesn't exist, create it first
    let photographerData: { 
      stripe_platform_subscription_id: string | null
      platform_subscription_status: string | null
      platform_subscription_trial_end?: string | null
      platform_subscription_current_period_start?: string | null
      platform_subscription_current_period_end?: string | null
    } | null = null

    const { data: photographer, error: photographerFetchError } = await supabase
      .from('photographers')
      .select('stripe_platform_subscription_id, platform_subscription_status, platform_subscription_trial_end, platform_subscription_current_period_start, platform_subscription_current_period_end')
      .eq('id', user.id)
      .single()

    // If photographer record doesn't exist, create it
    if (photographerFetchError && photographerFetchError.code === 'PGRST116') {
      console.log('[Platform Subscription] Photographer record not found, creating it...')
      const { data: newPhotographer, error: createError } = await supabase
        .from('photographers')
        .insert({ id: user.id })
        .select('stripe_platform_subscription_id, platform_subscription_status, platform_subscription_trial_end, platform_subscription_current_period_start, platform_subscription_current_period_end')
        .single()

      if (createError) {
        console.error('[Platform Subscription] Error creating photographer record:', createError)
        return NextResponse.json(
          { error: 'Failed to create photographer record', details: createError.message },
          { status: 500 }
        )
      }

      photographerData = newPhotographer
    } else if (photographerFetchError) {
      console.error('[Platform Subscription] Error fetching photographer:', photographerFetchError)
      return NextResponse.json(
        { error: 'Failed to fetch photographer data', details: photographerFetchError.message },
        { status: 500 }
      )
    } else {
      photographerData = photographer
    }

    // If subscription exists and is active/trialing, return existing subscription
    if (photographerData?.stripe_platform_subscription_id && 
        (photographerData.platform_subscription_status === 'active' || 
         photographerData.platform_subscription_status === 'trialing')) {
      return NextResponse.json(
        { error: 'Photographer already has an active subscription' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    console.log('[Platform Subscription] Customer lookup:', {
      stripeCustomerId: userProfile?.stripe_customer_id,
      userProfileFound: !!userProfile,
      userProfileError: userProfileError?.message,
    })

    // Create subscription
    let subscription: SubscriptionWithPeriods
    try {
      subscription = await createPlatformSubscription({
        customerId: userProfile?.stripe_customer_id || undefined,
        photographerId: user.id,
        email: user.email || '',
      }) as unknown as SubscriptionWithPeriods
    } catch (error) {
      const err = error as Error
      console.error('[Platform Subscription] Error creating Stripe subscription:', err)
      return NextResponse.json(
        { 
          error: 'Failed to create subscription', 
          message: err.message,
          details: err.stack 
        },
        { status: 500 }
      )
    }

    // Log subscription details for debugging
    console.log('[Platform Subscription] Subscription created:', {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
    })

    // Store subscription ID in photographers table
    const { error: updateError } = await supabase
      .from('photographers')
      .update({
        stripe_platform_subscription_id: subscription.id,
        platform_subscription_status: subscription.status === 'trialing' ? 'trialing' : 'active',
        platform_subscription_trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        platform_subscription_current_period_start: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : new Date().toISOString(),
        platform_subscription_current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Platform Subscription] Error updating photographer:', updateError)
      // Don't fail - subscription is created in Stripe, we can update later
    }

    // Update user_profiles with Stripe customer ID if not set
    if (subscription.customer && !userProfile?.stripe_customer_id) {
      await supabase
        .from('user_profiles')
        .update({
          stripe_customer_id: typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer.id,
        })
        .eq('id', user.id)
    }

    // Update user_profiles payment_status
    await supabase
      .from('user_profiles')
      .update({
        payment_status: subscription.status === 'trialing' ? 'active' : 'active',
        subscription_start_date: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : new Date().toISOString(),
        subscription_end_date: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        currentPeriodStart: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : new Date().toISOString(),
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      },
    })
  } catch (error) {
    const err = error as Error
    console.error('[Platform Subscription] Error creating subscription:', err)
    return NextResponse.json(
      { error: 'Failed to create subscription', message: err.message },
      { status: 500 }
    )
  }
}

/**
 * Get photographer's platform subscription
 * GET /api/stripe/platform-subscription
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get photographer subscription data
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select(`
        stripe_platform_subscription_id,
        platform_subscription_status,
        platform_subscription_trial_end,
        platform_subscription_current_period_start,
        platform_subscription_current_period_end
      `)
      .eq('id', user.id)
      .single()

    // If photographer record doesn't exist, return null (not an error)
    // This can happen if photographer profile wasn't created during signup
    if (photographerError || !photographer) {
      console.warn('[Platform Subscription] Photographer record not found for user:', user.id)
      return NextResponse.json({
        success: true,
        data: null,
      })
    }

    // If no subscription exists, return null
    if (!photographer?.stripe_platform_subscription_id) {
      return NextResponse.json({
        success: true,
        data: null,
      })
    }

    // Get latest subscription details from Stripe
    const stripe = getStripeClient()
    const subscription = await getSubscription(photographer.stripe_platform_subscription_id) as unknown as SubscriptionWithPeriods

    // Get payment method if available
    let paymentMethod = null
    if (subscription.default_payment_method) {
      const pm = typeof subscription.default_payment_method === 'string'
        ? await stripe.paymentMethods.retrieve(subscription.default_payment_method)
        : subscription.default_payment_method
      
      if (pm && 'card' in pm) {
        paymentMethod = {
          type: pm.type,
          last4: pm.card?.last4 || '',
          brand: pm.card?.brand || '',
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: photographer?.platform_subscription_status || subscription.status,
        trialEnd: photographer?.platform_subscription_trial_end || 
                 (subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null),
        currentPeriodStart: photographer?.platform_subscription_current_period_start ||
                          (subscription.current_period_start
                            ? new Date(subscription.current_period_start * 1000).toISOString()
                            : new Date().toISOString()),
        currentPeriodEnd: photographer?.platform_subscription_current_period_end ||
                         (subscription.current_period_end
                            ? new Date(subscription.current_period_end * 1000).toISOString()
                            : null),
        nextBillingDate: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000).toISOString() 
          : null,
        paymentMethod,
      },
    })
  } catch (error) {
    const err = error as Error
    console.error('[Platform Subscription] Error fetching subscription:', err)
    return NextResponse.json(
      { error: 'Failed to fetch subscription', message: err.message },
      { status: 500 }
    )
  }
}

