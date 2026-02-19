/**
 * Drip Email Enrollment Service
 *
 * Enrolls users into drip sequences and schedules emails.
 * Uses INSERT ON CONFLICT DO NOTHING for idempotent enrollment.
 */

import { logger } from '../logger'
import { createServiceRoleClient } from '../supabase-server'

// ============================================================================
// SEQUENCE DEFINITIONS
// ============================================================================

interface DripStep {
  stepNumber: number
  templateName: string
  delayDays: number
}

const PHOTOGRAPHER_POST_SIGNUP_STEPS: DripStep[] = [
  { stepNumber: 1, templateName: 'photographer_stripe_nudge', delayDays: 1 },
  { stepNumber: 2, templateName: 'photographer_gallery_nudge', delayDays: 3 },
  { stepNumber: 3, templateName: 'photographer_passive_income_math', delayDays: 7 },
  { stepNumber: 4, templateName: 'photographer_founder_checkin', delayDays: 14 },
]

const CLIENT_POST_PAYMENT_STEPS: DripStep[] = [
  { stepNumber: 1, templateName: 'client_getting_started', delayDays: 1 },
  { stepNumber: 2, templateName: 'client_why_storage_matters', delayDays: 3 },
  { stepNumber: 3, templateName: 'client_more_photographers', delayDays: 7 },
]

// ============================================================================
// ENROLLMENT FUNCTIONS
// ============================================================================

/**
 * Enroll a photographer in the post-signup drip sequence.
 * Call this after sending the welcome email.
 *
 * Idempotent: safe to call multiple times for the same user.
 * Uses ON CONFLICT DO NOTHING to prevent duplicates.
 */
export async function enrollPhotographerDrip(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<{ enrolled: boolean; error?: string }> {
  return enrollInSequence(userId, 'photographer_post_signup', PHOTOGRAPHER_POST_SIGNUP_STEPS, metadata)
}

/**
 * Enroll a client in the post-payment drip sequence.
 * Call this after the first successful payment.
 *
 * Idempotent: only enrolls once per client (not per gallery purchase).
 */
export async function enrollClientDrip(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<{ enrolled: boolean; error?: string }> {
  return enrollInSequence(userId, 'client_post_payment', CLIENT_POST_PAYMENT_STEPS, metadata)
}

// ============================================================================
// CORE ENROLLMENT LOGIC
// ============================================================================

async function enrollInSequence(
  userId: string,
  sequenceName: string,
  steps: DripStep[],
  metadata?: Record<string, unknown>
): Promise<{ enrolled: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()
    const now = new Date()

    // Insert sequence record (ON CONFLICT = already enrolled, skip)
    const { data: sequence, error: seqError } = await supabase
      .from('drip_sequences')
      .insert({
        user_id: userId,
        sequence_name: sequenceName,
        current_step: 0,
        metadata: metadata || {},
      })
      .select('id, unsubscribe_token')
      .single()

    if (seqError) {
      // Unique constraint violation = already enrolled
      if (seqError.code === '23505') {
        logger.info(`[Drip] User ${userId} already enrolled in ${sequenceName}, skipping`)
        return { enrolled: false }
      }
      throw seqError
    }

    // Schedule all emails in the sequence
    const emailRecords = steps.map((step) => {
      const scheduledFor = new Date(now)
      scheduledFor.setDate(scheduledFor.getDate() + step.delayDays)
      // Send at 10am UTC (roughly morning in US timezones)
      scheduledFor.setUTCHours(10, 0, 0, 0)

      return {
        sequence_id: sequence.id,
        step_number: step.stepNumber,
        template_name: step.templateName,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
      }
    })

    const { error: emailError } = await supabase
      .from('drip_emails')
      .insert(emailRecords)

    if (emailError) throw emailError

    logger.info(`[Drip] Enrolled user ${userId} in ${sequenceName} — ${steps.length} emails scheduled`)
    return { enrolled: true }
  } catch (error: any) {
    logger.error(`[Drip] Failed to enroll user ${userId} in ${sequenceName}:`, error)
    return { enrolled: false, error: error.message }
  }
}
