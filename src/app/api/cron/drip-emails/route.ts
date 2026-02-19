import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email/email-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min — may process many emails on busy days

const MAX_BATCH_SIZE = 50 // Process at most 50 emails per run
const MAX_RETRIES = 3

// ============================================================================
// Progress line variants for photographer Day 7 email
// ============================================================================
function getPhotographerProgressLine(
  stripeConnected: boolean,
  hasGalleries: boolean,
  hasInvitedClients: boolean
): string {
  if (!stripeConnected && !hasGalleries) {
    return "It's been a week since you signed up. You haven't connected Stripe or uploaded a gallery yet -- but it's not too late to get rolling."
  }
  if (stripeConnected && !hasGalleries) {
    return "You've got Stripe connected -- nice. Now let's get your first gallery uploaded so you can start earning."
  }
  if (hasGalleries && !hasInvitedClients) {
    return "You've uploaded a gallery -- great start. The next step is sending that delivery link to your client."
  }
  return "You're fully set up and already ahead of most photographers on the platform. Here's why that matters."
}

// ============================================================================
// Status message variants for photographer Day 14 email
// ============================================================================
function getPhotographerStatusMessage(
  allStepsDone: boolean,
  hasCommission: boolean
): string {
  if (allStepsDone && hasCommission) {
    return "You've already earned your first commission. That's exactly how this is supposed to work. Every client you add from here builds on that foundation."
  }
  if (allStepsDone) {
    return "You've done everything right -- Stripe connected, gallery uploaded, client invited. Once they pay, your first commission will appear in your dashboard."
  }
  return "I noticed you haven't finished setting up yet. No pressure -- but the sooner you connect Stripe and upload a gallery, the sooner the commission math starts working for you. Reply if you're stuck on anything."
}

// ============================================================================
// GET /api/cron/drip-emails
//
// Hourly cron job. Processes pending drip emails:
// 1. Picks up pending/failed emails where scheduled_for <= now()
// 2. Marks them 'sending' (prevents double-send from overlapping runs)
// 3. Evaluates send conditions (skip if action already completed)
// 4. Sends via EmailService
// 5. Updates status to sent/skipped/failed
// ============================================================================
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Auth: match grace-period-notifications pattern
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !hasValidSecret) {
    logger.error('[Drip Cron] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()
    const now = new Date().toISOString()

    // 1. Fetch pending emails ready to send (with sequence data)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('drip_emails')
      .select(`
        id,
        sequence_id,
        step_number,
        template_name,
        retry_count,
        drip_sequences!inner (
          id,
          user_id,
          sequence_name,
          suppressed,
          unsubscribe_token,
          metadata
        )
      `)
      .or(`status.eq.pending,and(status.eq.failed,retry_count.lt.${MAX_RETRIES})`)
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(MAX_BATCH_SIZE)

    if (fetchError) throw fetchError

    if (!pendingEmails || pendingEmails.length === 0) {
      logger.info('[Drip Cron] No pending emails to process')
      return NextResponse.json({ processed: 0, duration: Date.now() - startTime })
    }

    logger.info(`[Drip Cron] Processing ${pendingEmails.length} emails`)

    let sent = 0
    let skipped = 0
    let failed = 0

    for (const email of pendingEmails) {
      const sequence = (email as any).drip_sequences
      if (!sequence) continue

      // Skip if sequence is suppressed (user unsubscribed)
      if (sequence.suppressed) {
        await supabase
          .from('drip_emails')
          .update({ status: 'skipped', skipped_at: now, skip_reason: 'sequence_suppressed' })
          .eq('id', email.id)
        skipped++
        continue
      }

      // Mark as 'sending' to prevent double-send
      const { error: lockError } = await supabase
        .from('drip_emails')
        .update({ status: 'sending' })
        .eq('id', email.id)
        .in('status', ['pending', 'failed'])

      if (lockError) {
        logger.error(`[Drip Cron] Failed to lock email ${email.id}:`, lockError)
        continue
      }

      try {
        const result = await processEmail(supabase, email, sequence)

        if (result.skipped) {
          await supabase
            .from('drip_emails')
            .update({ status: 'skipped', skipped_at: now, skip_reason: result.skipReason })
            .eq('id', email.id)
          skipped++
        } else if (result.sent) {
          await supabase
            .from('drip_emails')
            .update({ status: 'sent', sent_at: now })
            .eq('id', email.id)
          sent++
        }
      } catch (sendError: any) {
        const newRetryCount = email.retry_count + 1
        const newStatus = newRetryCount >= MAX_RETRIES ? 'dead' : 'failed'

        await supabase
          .from('drip_emails')
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            skip_reason: newStatus === 'dead' ? `Max retries exceeded: ${sendError.message}` : null,
          })
          .eq('id', email.id)

        failed++
        logger.error(`[Drip Cron] Failed to send email ${email.id} (retry ${newRetryCount}):`, sendError)
      }
    }

    // Check if any sequences are fully complete
    await markCompletedSequences(supabase)

    const duration = Date.now() - startTime
    logger.info(`[Drip Cron] Done: ${sent} sent, ${skipped} skipped, ${failed} failed (${duration}ms)`)

    return NextResponse.json({ sent, skipped, failed, duration })
  } catch (error: any) {
    logger.error('[Drip Cron] Fatal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ============================================================================
// PROCESS INDIVIDUAL EMAIL
// ============================================================================

interface ProcessResult {
  sent?: boolean
  skipped?: boolean
  skipReason?: string
}

async function processEmail(
  supabase: ReturnType<typeof createServiceRoleClient>,
  email: any,
  sequence: any
): Promise<ProcessResult> {
  const userId = sequence.user_id
  const metadata = sequence.metadata || {}
  const unsubscribeToken = sequence.unsubscribe_token

  // Get user email from auth
  const { data: userData } = await supabase.auth.admin.getUserById(userId)
  const userEmail = userData?.user?.email
  if (!userEmail) {
    return { skipped: true, skipReason: 'no_user_email' }
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const userName = profile?.full_name || metadata.photographerName || metadata.clientName || 'there'

  // ---- PHOTOGRAPHER TEMPLATES ----

  if (email.template_name === 'photographer_stripe_nudge') {
    // Check: is Stripe already connected?
    const { data: photographer } = await supabase
      .from('photographers')
      .select('stripe_connect_status')
      .eq('user_id', userId)
      .single()

    if (photographer?.stripe_connect_status === 'active') {
      return { skipped: true, skipReason: 'stripe_already_connected' }
    }

    await EmailService.sendPhotographerStripeNudgeEmail({
      photographerName: userName,
      photographerEmail: userEmail,
      unsubscribeToken,
    })
    return { sent: true }
  }

  if (email.template_name === 'photographer_gallery_nudge') {
    // Check: does photographer have any galleries?
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id, stripe_connect_status')
      .eq('user_id', userId)
      .single()

    if (photographer) {
      const { count } = await supabase
        .from('photo_galleries')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographer.id)

      if (count && count > 0) {
        return { skipped: true, skipReason: 'has_galleries' }
      }
    }

    await EmailService.sendPhotographerGalleryNudgeEmail({
      photographerName: userName,
      photographerEmail: userEmail,
      stripeConnected: photographer?.stripe_connect_status === 'active',
      unsubscribeToken,
    })
    return { sent: true }
  }

  if (email.template_name === 'photographer_passive_income_math') {
    // Gather progress for dynamic copy
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id, stripe_connect_status')
      .eq('user_id', userId)
      .single()

    const stripeConnected = photographer?.stripe_connect_status === 'active'

    let hasGalleries = false
    let hasInvitedClients = false
    if (photographer) {
      const { count: galleryCount } = await supabase
        .from('photo_galleries')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographer.id)

      hasGalleries = (galleryCount || 0) > 0

      // Check if any galleries have a consumer_id (client invited)
      if (hasGalleries) {
        const { count: clientCount } = await supabase
          .from('photo_galleries')
          .select('id', { count: 'exact', head: true })
          .eq('photographer_id', photographer.id)
          .not('consumer_id', 'is', null)

        hasInvitedClients = (clientCount || 0) > 0
      }
    }

    const progressLine = getPhotographerProgressLine(stripeConnected, hasGalleries, hasInvitedClients)

    await EmailService.sendPhotographerPassiveIncomeMathEmail({
      photographerName: userName,
      photographerEmail: userEmail,
      progressLine,
      unsubscribeToken,
    })
    return { sent: true }
  }

  if (email.template_name === 'photographer_founder_checkin') {
    // Gather status for dynamic message
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id, stripe_connect_status')
      .eq('user_id', userId)
      .single()

    const stripeConnected = photographer?.stripe_connect_status === 'active'

    let hasGalleries = false
    let hasInvitedClients = false
    let hasCommission = false

    if (photographer) {
      const { count: galleryCount } = await supabase
        .from('photo_galleries')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographer.id)

      hasGalleries = (galleryCount || 0) > 0

      if (hasGalleries) {
        const { count: clientCount } = await supabase
          .from('photo_galleries')
          .select('id', { count: 'exact', head: true })
          .eq('photographer_id', photographer.id)
          .not('consumer_id', 'is', null)

        hasInvitedClients = (clientCount || 0) > 0
      }

      // Check for any commissions
      const { count: commissionCount } = await supabase
        .from('commissions')
        .select('id', { count: 'exact', head: true })
        .eq('photographer_id', photographer.id)

      hasCommission = (commissionCount || 0) > 0
    }

    const allStepsDone = stripeConnected && hasGalleries && hasInvitedClients
    const statusMessage = getPhotographerStatusMessage(allStepsDone, hasCommission)

    await EmailService.sendPhotographerFounderCheckinEmail({
      photographerName: userName,
      photographerEmail: userEmail,
      statusMessage,
      unsubscribeToken,
    })
    return { sent: true }
  }

  // ---- CLIENT TEMPLATES ----

  if (email.template_name === 'client_getting_started') {
    const photographerName = metadata.photographerName || 'your photographer'

    await EmailService.sendClientGettingStartedEmail({
      clientName: userName,
      clientEmail: userEmail,
      photographerName,
      unsubscribeToken,
    })
    return { sent: true }
  }

  if (email.template_name === 'client_why_storage_matters') {
    const photographerName = metadata.photographerName || 'your photographer'

    await EmailService.sendClientWhyStorageMattersEmail({
      clientName: userName,
      clientEmail: userEmail,
      photographerName,
      unsubscribeToken,
    })
    return { sent: true }
  }

  if (email.template_name === 'client_more_photographers') {
    await EmailService.sendClientMorePhotographersEmail({
      clientName: userName,
      clientEmail: userEmail,
      unsubscribeToken,
    })
    return { sent: true }
  }

  // Unknown template
  return { skipped: true, skipReason: `unknown_template: ${email.template_name}` }
}

// ============================================================================
// MARK COMPLETED SEQUENCES
// ============================================================================

async function markCompletedSequences(
  supabase: ReturnType<typeof createServiceRoleClient>
) {
  // Find sequences where all emails are sent/skipped/dead (none pending/sending/failed)
  const { data: sequences } = await supabase
    .from('drip_sequences')
    .select('id')
    .is('completed_at', null)
    .eq('suppressed', false)

  if (!sequences) return

  for (const seq of sequences) {
    const { count: pendingCount } = await supabase
      .from('drip_emails')
      .select('id', { count: 'exact', head: true })
      .eq('sequence_id', seq.id)
      .in('status', ['pending', 'sending', 'failed'])

    if (pendingCount === 0) {
      await supabase
        .from('drip_sequences')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', seq.id)
    }
  }
}
