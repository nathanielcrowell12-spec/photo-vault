import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email/email-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

// Notification milestones in months
const NOTIFICATION_MILESTONES = [3, 4, 5, 5.5]

// Grace period is 6 months
const GRACE_PERIOD_MONTHS = 6

/**
 * GET /api/cron/grace-period-notifications
 * 
 * Daily cron job that sends escalating grace period notifications to secondaries
 * when a primary account has payment failures.
 * 
 * Milestones:
 * - 3 months: "Attention Needed" (3 months remaining)
 * - 4 months: "Reminder" (2 months remaining)
 * - 5 months: "URGENT" (1 month remaining)
 * - 5.5 months: "FINAL NOTICE" (2 weeks remaining)
 * 
 * Called by Vercel Cron at midnight UTC daily.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Allow both Bearer token and Vercel's internal cron header
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !hasValidSecret) {
    console.error('[Grace Period Cron] Unauthorized request')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const supabase = createServiceRoleClient()
    const now = new Date()

    console.log('[Grace Period Cron] Starting grace period notification check...')

    // Query subscriptions in grace period (payment failed but not yet suspended)
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        last_payment_failure_at,
        grace_notifications_sent,
        gallery_id
      `)
      .not('last_payment_failure_at', 'is', null)
      .eq('access_suspended', false)
      .in('status', ['past_due', 'unpaid'])

    if (subError) {
      console.error('[Grace Period Cron] Error fetching subscriptions:', subError)
      throw subError
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Grace Period Cron] No subscriptions in grace period')
      return NextResponse.json({
        success: true,
        message: 'No subscriptions in grace period',
        processed: 0
      })
    }

    console.log(`[Grace Period Cron] Found ${subscriptions.length} subscriptions in grace period`)

    let totalNotificationsSent = 0
    let accountsProcessed = 0

    for (const subscription of subscriptions) {
      const failureDate = new Date(subscription.last_payment_failure_at)
      const monthsElapsed = (now.getTime() - failureDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
      
      // Get existing notifications sent
      const notificationsSent = subscription.grace_notifications_sent || {}

      // Check each milestone
      for (const milestone of NOTIFICATION_MILESTONES) {
        // Skip if we haven't reached this milestone yet
        if (monthsElapsed < milestone) continue

        // Skip if we've already sent this notification
        const milestoneKey = milestone.toString()
        if (notificationsSent[milestoneKey]) continue

        // Get account info
        const { data: primaryProfile } = await supabase
          .from('user_profiles')
          .select('id, full_name, family_sharing_enabled')
          .eq('id', subscription.user_id)
          .single()

        // Skip if family sharing not enabled
        if (!primaryProfile?.family_sharing_enabled) {
          console.log(`[Grace Period Cron] Skipping ${subscription.user_id} - family sharing not enabled`)
          continue
        }

        // Get accepted secondaries for this account
        const { data: secondaries, error: secError } = await supabase
          .from('secondaries')
          .select('id, name, email, relationship')
          .eq('account_id', subscription.user_id)
          .eq('status', 'accepted')

        if (secError) {
          console.error(`[Grace Period Cron] Error fetching secondaries for ${subscription.user_id}:`, secError)
          continue
        }

        if (!secondaries || secondaries.length === 0) {
          console.log(`[Grace Period Cron] No secondaries for account ${subscription.user_id}`)
          continue
        }

        // Count galleries for this account
        const { count: galleryCount } = await supabase
          .from('photo_galleries')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', subscription.user_id)

        const monthsRemaining = GRACE_PERIOD_MONTHS - milestone
        const helpPayLink = `${process.env.NEXT_PUBLIC_SITE_URL}/family/takeover?account=${subscription.user_id}`

        // Send notification to each secondary
        for (const secondary of secondaries) {
          try {
            await EmailService.sendGracePeriodAlertEmail({
              secondaryName: secondary.name,
              secondaryEmail: secondary.email,
              primaryName: primaryProfile.full_name || 'Account Holder',
              galleryCount: galleryCount || 0,
              monthsRemaining: monthsRemaining,
              helpPayLink: helpPayLink
            })

            totalNotificationsSent++
            console.log(`[Grace Period Cron] Sent ${milestone}-month notification to ${secondary.email} for account ${subscription.user_id}`)
          } catch (emailError) {
            console.error(`[Grace Period Cron] Error sending email to ${secondary.email}:`, emailError)
          }
        }

        // Record that we sent this milestone notification
        notificationsSent[milestoneKey] = now.toISOString()

        // Update subscription with sent notification
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            grace_notifications_sent: notificationsSent,
            updated_at: now.toISOString()
          })
          .eq('id', subscription.id)

        if (updateError) {
          console.error(`[Grace Period Cron] Error updating notification status:`, updateError)
        }
      }

      accountsProcessed++
    }

    const processingTime = Date.now() - startTime

    console.log(`[Grace Period Cron] Complete. Processed ${accountsProcessed} accounts, sent ${totalNotificationsSent} notifications in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      message: `Processed ${accountsProcessed} accounts`,
      notifications_sent: totalNotificationsSent,
      processing_time_ms: processingTime
    })

  } catch (error) {
    console.error('[Grace Period Cron] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

