import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getStripeClient } from '@/lib/stripe'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Handle Stripe Connect OAuth callback
 * GET /api/stripe/connect/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.redirect(
        new URL('/photographers/settings?stripe=error', request.url)
      )
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/auth/login?redirect=/photographers/settings', request.url)
      )
    }

    // Exchange authorization code for account ID
    const stripe = getStripeClient()
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code!,
    })

    const accountId = response.stripe_user_id

    if (!accountId) {
      return NextResponse.redirect(
        new URL('/photographers/settings?stripe=error', request.url)
      )
    }

    // Get account details
    const account = await stripe.accounts.retrieve(accountId)

    // Update photographer record
    await supabase
      .from('photographers')
      .update({
        stripe_connect_account_id: accountId,
        stripe_connect_status: account.details_submitted ? 'active' : 'pending',
        can_receive_payouts: account.payouts_enabled || false,
        bank_account_verified: account.details_submitted || false,
        stripe_connect_onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.redirect(
      new URL('/photographers/settings?stripe=success', request.url)
    )
  } catch (error) {
    const err = error as Error
    console.error('[Stripe Connect] Error handling callback:', err)
    return NextResponse.redirect(
      new URL('/photographers/settings?stripe=error', request.url)
    )
  }
}



