/**
 * Cron Job: Process Scheduled Commission Payouts
 * Runs daily to pay out commissions that are due (scheduled_payout_date <= today)
 *
 * Trigger: Vercel Cron or external scheduler
 * Schedule: Every day at 2:00 AM UTC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { processScheduledPayout } from '@/lib/server/commission-service'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret (prevent unauthorized access)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get all pending commissions due for payout today or earlier
    const { data: dueCommissions, error } = await supabase
      .from('commission_payments')
      .select('id, photographer_id, commission_amount, scheduled_payout_date')
      .eq('status', 'pending')
      .lte('scheduled_payout_date', new Date().toISOString())
      .order('scheduled_payout_date', { ascending: true })

    if (error) throw error

    if (!dueCommissions || dueCommissions.length === 0) {
      console.log('[Cron:Payouts] No commissions due for payout')
      return NextResponse.json({
        message: 'No commissions due',
        processed: 0,
        duration_ms: Date.now() - startTime
      })
    }

    console.log(`[Cron:Payouts] Processing ${dueCommissions.length} commission payouts`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each commission
    for (const commission of dueCommissions) {
      const result = await processScheduledPayout(commission.id)

      if (result.success) {
        results.success++
      } else {
        results.failed++
        results.errors.push(`Commission ${commission.id}: ${result.error}`)
      }
    }

    const duration = Date.now() - startTime
    console.log(`[Cron:Payouts] Complete: ${results.success} paid, ${results.failed} failed in ${duration}ms`)

    return NextResponse.json({
      message: 'Payout processing complete',
      total_due: dueCommissions.length,
      successful: results.success,
      failed: results.failed,
      errors: results.errors,
      duration_ms: duration
    })

  } catch (error) {
    const err = error as Error
    console.error('[Cron:Payouts] Error:', err)
    return NextResponse.json(
      { error: 'Payout processing failed', message: err.message },
      { status: 500 }
    )
  }
}
