/**
 * Cron Job: Deactivate Inactive Clients After 90 Days
 * Runs daily to mark clients as deactivated if they haven't paid in 90+ days
 *
 * Trigger: Vercel Cron or external scheduler
 * Schedule: Every day at 3:00 AM UTC
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Find clients inactive for 90+ days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: inactiveClients, error: fetchError } = await supabase
      .from('clients')
      .select('id, email, photographer_id, last_payment_attempt')
      .eq('status', 'inactive')
      .lte('last_payment_attempt', ninetyDaysAgo.toISOString())

    if (fetchError) throw fetchError

    if (!inactiveClients || inactiveClients.length === 0) {
      logger.info('[Cron:Deactivate] No clients to deactivate')
      return NextResponse.json({
        message: 'No clients to deactivate',
        processed: 0,
        duration_ms: Date.now() - startTime
      })
    }

    logger.info(`[Cron:Deactivate] Deactivating ${inactiveClients.length} clients`)

    // Mark as deactivated
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        status: 'deactivated',
        updated_at: new Date().toISOString()
      })
      .in('id', inactiveClients.map(c => c.id))

    if (updateError) throw updateError

    const duration = Date.now() - startTime
    logger.info(`[Cron:Deactivate] Complete: ${inactiveClients.length} clients deactivated in ${duration}ms`)

    return NextResponse.json({
      message: 'Client deactivation complete',
      deactivated: inactiveClients.length,
      client_ids: inactiveClients.map(c => c.id),
      duration_ms: duration
    })

  } catch (error) {
    const err = error as Error
    logger.error('[Cron:Deactivate] Error:', err)
    return NextResponse.json(
      { error: 'Client deactivation failed', message: err.message },
      { status: 500 }
    )
  }
}
