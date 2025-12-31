/**
 * Cron Job: Suspend Photographers After 90 Days Overdue
 * Runs daily to suspend photographer accounts with 90+ days unpaid
 *
 * Trigger: Vercel Cron or external scheduler
 * Schedule: Every day at 4:00 AM UTC
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Find photographers overdue 90+ days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: overduePhotographers, error: fetchError } = await supabase
      .from('photographers')
      .select('id, last_platform_payment_attempt, platform_subscription_status')
      .in('platform_subscription_status', ['active', 'overdue'])
      .lte('last_platform_payment_attempt', ninetyDaysAgo.toISOString())

    if (fetchError) throw fetchError

    if (!overduePhotographers || overduePhotographers.length === 0) {
      logger.info('[Cron:Suspend] No photographers to suspend')
      return NextResponse.json({
        message: 'No photographers to suspend',
        processed: 0,
        duration_ms: Date.now() - startTime
      })
    }

    logger.info(`[Cron:Suspend] Suspending ${overduePhotographers.length} photographers`)

    // Mark as suspended
    const { error: updateError } = await supabase
      .from('photographers')
      .update({
        platform_subscription_status: 'suspended',
        suspended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', overduePhotographers.map(p => p.id))

    if (updateError) throw updateError

    // TODO: Send suspension notification emails
    logger.info('[Cron:Suspend] TODO: Send suspension emails to photographers')

    const duration = Date.now() - startTime
    logger.info(`[Cron:Suspend] Complete: ${overduePhotographers.length} photographers suspended in ${duration}ms`)

    return NextResponse.json({
      message: 'Photographer suspension complete',
      suspended: overduePhotographers.length,
      photographer_ids: overduePhotographers.map(p => p.id),
      duration_ms: duration
    })

  } catch (error) {
    const err = error as Error
    logger.error('[Cron:Suspend] Error:', err)
    return NextResponse.json(
      { error: 'Photographer suspension failed', message: err.message },
      { status: 500 }
    )
  }
}
