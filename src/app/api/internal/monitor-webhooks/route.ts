import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email/email-service'

/**
 * Webhook Failure Monitor
 *
 * Checks for webhook failures in last hour and sends alerts.
 * Protected by CRON_SECRET header - only Vercel Cron should call this.
 *
 * Run schedule: Every 15 minutes via Vercel Cron
 *
 * Thresholds (Conservative - per user approval):
 * - Webhook failures: 10+ per hour triggers alert
 * - Deduplication: Only 1 alert per hour per issue type
 */

// Conservative threshold: 10 failures per hour
const WEBHOOK_FAILURE_THRESHOLD = 10
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nathaniel.crowell12@gmail.com'

// Track last alert to prevent spam (in-memory for serverless, resets on cold start)
// For production, consider using Supabase or Redis for persistence
let lastAlertSentAt: Date | null = null
const ALERT_COOLDOWN_MS = 60 * 60 * 1000 // 1 hour

export async function GET(request: NextRequest) {
  // Verify request is from Vercel Cron or has valid secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow if CRON_SECRET matches OR if request comes from Vercel Cron (no auth needed)
  // Vercel Cron requests include a specific header we can check
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  if (!isVercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Monitor] Unauthorized access attempt to webhook monitor')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Query for failures in last hour
    const { data: failures, error: queryError } = await supabase
      .from('webhook_logs')
      .select('id, event_type, error_message, processed_at')
      .eq('status', 'failed')
      .gte('processed_at', oneHourAgo)
      .order('processed_at', { ascending: false })

    if (queryError) {
      console.error('[Monitor] Failed to query webhook_logs:', queryError)

      // Alert about monitoring failure
      await EmailService.sendAlertEmail({
        to: ADMIN_EMAIL,
        subject: 'PhotoVault: Webhook Monitoring Failed',
        body: `
          <h2>Monitoring System Error</h2>
          <p>The webhook monitoring system encountered an error while querying the database.</p>
          <p><strong>Error:</strong> ${queryError.message}</p>
          <p>This means webhook failures may not be detected until the issue is resolved.</p>
        `,
        alertType: 'monitoring_failure',
        severity: 'critical',
      })

      return NextResponse.json(
        { success: false, error: 'Database query failed', details: queryError.message },
        { status: 500 }
      )
    }

    const failureCount = failures?.length || 0

    // Check if we should send an alert
    if (failureCount >= WEBHOOK_FAILURE_THRESHOLD) {
      // Deduplication: Don't send if we sent an alert recently
      const now = new Date()
      const shouldSendAlert = !lastAlertSentAt ||
        (now.getTime() - lastAlertSentAt.getTime()) > ALERT_COOLDOWN_MS

      if (shouldSendAlert) {
        console.warn(`[Monitor] ALERT: ${failureCount} webhook failures in last hour (threshold: ${WEBHOOK_FAILURE_THRESHOLD})`)

        // Group failures by event type
        const failuresByType: Record<string, number> = {}
        failures?.forEach(f => {
          failuresByType[f.event_type] = (failuresByType[f.event_type] || 0) + 1
        })

        // Build failure summary
        const failureSummary = Object.entries(failuresByType)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => `<li><strong>${type}:</strong> ${count} failures</li>`)
          .join('')

        // Get sample error messages (first 3)
        const sampleErrors = failures?.slice(0, 3).map(f => `
          <li>
            <strong>${f.event_type}</strong> at ${new Date(f.processed_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST<br>
            <span style="color: #dc2626;">Error: ${f.error_message || 'No error message'}</span>
          </li>
        `).join('') || ''

        await EmailService.sendAlertEmail({
          to: ADMIN_EMAIL,
          subject: `PhotoVault: ${failureCount} Webhook Failures Detected`,
          body: `
            <h2>Webhook Failure Alert</h2>
            <p><strong>${failureCount} webhooks failed in the last hour.</strong></p>
            <p>Threshold: ${WEBHOOK_FAILURE_THRESHOLD} failures/hour</p>

            <h3>Failures by Type:</h3>
            <ul>${failureSummary}</ul>

            <h3>Recent Errors (Sample):</h3>
            <ul>${sampleErrors}</ul>

            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/logs" style="color: #2563eb;">View Full Webhook Logs</a></p>
          `,
          alertType: 'webhook_failure',
          severity: failureCount >= WEBHOOK_FAILURE_THRESHOLD * 2 ? 'critical' : 'high',
        })

        lastAlertSentAt = now
        console.log(`[Monitor] Alert email sent to ${ADMIN_EMAIL}`)

        return NextResponse.json({
          success: true,
          alert_sent: true,
          failure_count: failureCount,
          threshold: WEBHOOK_FAILURE_THRESHOLD,
          failures_by_type: failuresByType,
        })
      } else {
        // Alert cooldown active
        const cooldownRemaining = Math.ceil(
          (ALERT_COOLDOWN_MS - (now.getTime() - lastAlertSentAt!.getTime())) / 1000 / 60
        )
        console.log(`[Monitor] ${failureCount} failures but alert cooldown active (${cooldownRemaining}min remaining)`)

        return NextResponse.json({
          success: true,
          alert_sent: false,
          reason: 'cooldown_active',
          cooldown_remaining_minutes: cooldownRemaining,
          failure_count: failureCount,
          threshold: WEBHOOK_FAILURE_THRESHOLD,
        })
      }
    }

    // All good, no alert needed
    console.log(`[Monitor] Webhook check OK: ${failureCount} failures in last hour (threshold: ${WEBHOOK_FAILURE_THRESHOLD})`)

    return NextResponse.json({
      success: true,
      alert_sent: false,
      failure_count: failureCount,
      threshold: WEBHOOK_FAILURE_THRESHOLD,
      status: 'healthy',
    })

  } catch (error: any) {
    console.error('[Monitor] Unexpected error in webhook monitor:', error)

    // Try to alert about the monitoring failure
    try {
      await EmailService.sendAlertEmail({
        to: ADMIN_EMAIL,
        subject: 'PhotoVault: Webhook Monitoring Crashed',
        body: `
          <h2>Monitoring System Crashed</h2>
          <p>The webhook monitoring system encountered an unexpected error.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Stack:</strong></p>
          <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px; overflow-x: auto;">${error.stack || 'No stack trace'}</pre>
        `,
        alertType: 'monitoring_failure',
        severity: 'critical',
      })
    } catch (emailError) {
      console.error('[Monitor] Failed to send monitoring failure alert:', emailError)
    }

    return NextResponse.json(
      { success: false, error: 'Monitoring check failed', details: error.message },
      { status: 500 }
    )
  }
}
