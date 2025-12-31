import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { getStripeClient } from '@/lib/stripe'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'
import { calculateTimeFromSignup } from '@/lib/analytics/helpers'
import { logger } from '@/lib/logger'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Handle Stripe Connect Express account return
 * GET /api/stripe/connect/callback
 *
 * NOTE: Express accounts use Account Links, not OAuth.
 * When the user completes onboarding, they're redirected here.
 * We just need to verify their account status - no code exchange needed.
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
      return NextResponse.redirect(
        new URL('/login?redirect=/photographers/settings', request.url)
      )
    }

    // Use service role client for database queries (bypasses RLS)
    const adminClient = createServiceRoleClient()

    // Get photographer's Stripe Connect account ID from database
    const { data: photographer, error: photographerError } = await adminClient
      .from('photographers')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single()

    if (photographerError || !photographer?.stripe_connect_account_id) {
      logger.error('[StripeConnect] No account ID found for photographer:', user.id)
      return NextResponse.redirect(
        new URL('/photographers/settings?stripe=error&reason=no_account', request.url)
      )
    }

    // Get account details from Stripe to verify onboarding status
    const stripe = getStripeClient()
    const account = await stripe.accounts.retrieve(photographer.stripe_connect_account_id)

    // Update photographer record with current account status
    const { error: updateError } = await adminClient
      .from('photographers')
      .update({
        stripe_connect_status: account.details_submitted ? 'active' : 'pending',
        can_receive_payouts: account.payouts_enabled || false,
        bank_account_verified: account.details_submitted || false,
        stripe_connect_onboarded_at: account.details_submitted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      logger.error('[StripeConnect] Error updating photographer:', updateError)
    }

    // Redirect based on onboarding completion
    if (account.details_submitted) {
      // Track Stripe Connect completion (server-side - critical event)
      try {
        // Get photographer signup date for time calculation
        const { data: photographerData } = await adminClient
          .from('photographers')
          .select('created_at, stripe_connect_onboarded_at')
          .eq('id', user.id)
          .single()

        // Check if this is the first connection (onboarded_at was just set, check if it was previously null)
        // We check by seeing if we just set it in the update above (updateError was null and details_submitted is true)
        const wasFirstConnection = !updateError

        const timeFromSignup = calculateTimeFromSignup(photographerData?.created_at)

        await trackServerEvent(user.id, EVENTS.PHOTOGRAPHER_CONNECTED_STRIPE, {
          time_from_signup_seconds: timeFromSignup ?? 0,
          is_first_connection: wasFirstConnection,
        })
      } catch (trackError) {
        logger.error('[StripeConnect] Error tracking Stripe Connect:', trackError)
        // Don't block redirect if tracking fails
      }

      return NextResponse.redirect(
        new URL('/photographers/settings?stripe=success', request.url)
      )
    } else {
      // Onboarding not complete - they may have cancelled or there was an issue
      return NextResponse.redirect(
        new URL('/photographers/settings?stripe=incomplete', request.url)
      )
    }
  } catch (error) {
    const err = error as Error
    logger.error('[StripeConnect] Error handling callback:', err)
    return NextResponse.redirect(
      new URL('/photographers/settings?stripe=error', request.url)
    )
  }
}



