/**
 * DEPRECATED: Manual Payout Cron Job
 *
 * This cron job is NO LONGER NEEDED.
 *
 * With Stripe Connect DESTINATION CHARGES:
 * - Money goes directly to photographer's Express account at time of payment
 * - Stripe handles 2-day settlement to photographer's bank automatically
 * - No manual transfers, no payout queues, no cron jobs needed
 *
 * This endpoint is kept as a stub to prevent 404 errors if the cron is still scheduled.
 * It will log a deprecation warning and return success.
 *
 * TODO: Remove this file once vercel.json cron configuration is updated
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.warn('[Cron:Payouts] DEPRECATED: This cron job is no longer needed.')
  console.warn('[Cron:Payouts] Stripe destination charges handle payouts automatically.')
  console.warn('[Cron:Payouts] Remove this cron from vercel.json and delete this file.')

  return NextResponse.json({
    message: 'DEPRECATED: Payouts are now handled automatically by Stripe destination charges',
    action: 'Remove this cron job from vercel.json',
    info: 'With destination charges, money goes directly to photographer at payment time. Stripe handles 2-day settlement.',
    processed: 0,
  })
}
