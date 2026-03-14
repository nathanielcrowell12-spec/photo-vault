/**
 * ONE-TIME backfill: Pull invoice history from Stripe and insert into payment_history
 *
 * DELETE THIS FILE after running successfully.
 *
 * Usage: GET /api/admin/backfill-payment-history (must be logged in as admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabase as supabaseServiceRole } from '@/lib/supabase'
import { getStripeClient } from '@/lib/stripe'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Use session-based client for auth check only
    const authClient = await createServerSupabaseClient()

    // Auth check - must be admin
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Use service role client for data operations (bypasses RLS)
    const supabase = supabaseServiceRole
    const stripe = getStripeClient()

    // Get all subscriptions from our database (service role bypasses RLS)
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, user_id')

    if (subError || !subscriptions?.length) {
      return NextResponse.json({
        error: 'No subscriptions found',
        detail: subError?.message
      }, { status: 404 })
    }

    const results: any[] = []

    for (const sub of subscriptions) {
      if (!sub.stripe_subscription_id) continue

      try {
        // Fetch all invoices for this subscription from Stripe
        const invoices = await stripe.invoices.list({
          subscription: sub.stripe_subscription_id,
          limit: 100,
        })

        for (const invoice of invoices.data) {
          // Check if already exists
          const { data: existing } = await supabase
            .from('payment_history')
            .select('id')
            .eq('stripe_invoice_id', invoice.id)
            .single()

          if (existing) {
            results.push({ invoice: invoice.id, status: 'already_exists' })
            continue
          }

          const isPaid = invoice.status === 'paid'
          const paidAt = invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : (isPaid ? new Date(invoice.created * 1000).toISOString() : null)

          const { error: insertError } = await supabase
            .from('payment_history')
            .insert({
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: sub.stripe_subscription_id,
              user_id: sub.user_id,
              amount_paid_cents: invoice.amount_paid || 0,
              currency: invoice.currency || 'usd',
              status: isPaid ? 'succeeded' : 'failed',
              paid_at: paidAt,
              created_at: new Date(invoice.created * 1000).toISOString(),
            })

          if (insertError) {
            results.push({ invoice: invoice.id, status: 'error', error: insertError.message })
          } else {
            results.push({
              invoice: invoice.id,
              status: 'inserted',
              amount: invoice.amount_paid,
              paid: isPaid,
              date: paidAt,
            })
          }
        }
      } catch (stripeError: any) {
        results.push({
          subscription: sub.stripe_subscription_id,
          status: 'stripe_error',
          error: stripeError.message
        })
      }
    }

    logger.info(`[Backfill] Payment history backfill complete: ${results.length} invoices processed`)

    return NextResponse.json({
      success: true,
      processed: results.length,
      inserted: results.filter(r => r.status === 'inserted').length,
      already_existed: results.filter(r => r.status === 'already_exists').length,
      errors: results.filter(r => r.status === 'error' || r.status === 'stripe_error').length,
      details: results,
    })
  } catch (error: any) {
    logger.error('[Backfill] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
