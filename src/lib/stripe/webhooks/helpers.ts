/**
 * Stripe Webhook Helpers
 *
 * Shared utility functions for webhook processing:
 * - Stripe client initialization
 * - Idempotency checking and marking
 * - Webhook logging
 */
import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { logger } from '@/lib/logger'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Lazy initialize Stripe client to avoid build-time errors
 */
export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  })
}

/**
 * Check if an event has already been processed (idempotency)
 * Returns true if already processed, false if new
 */
export async function checkIdempotency(
  supabase: SupabaseClient,
  eventId: string
): Promise<boolean> {
  const { data: alreadyProcessed } = await supabase
    .from('processed_webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single()

  return !!alreadyProcessed
}

/**
 * Mark an event as processed (for idempotency)
 * Call this ONLY after successful handler execution
 */
export async function markProcessed(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string
): Promise<void> {
  await supabase.from('processed_webhook_events').insert({
    stripe_event_id: eventId,
    event_type: eventType,
    processed_at: new Date().toISOString(),
  })
}

/**
 * Log successful webhook processing
 */
export async function logWebhookResult(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string,
  resultMessage: string,
  processingTimeMs: number
): Promise<void> {
  await supabase.from('webhook_logs').insert({
    event_id: eventId,
    event_type: eventType,
    status: 'success',
    processing_time_ms: processingTimeMs,
    result_message: resultMessage,
    processed_at: new Date().toISOString(),
  })
}

/**
 * Log webhook processing error
 */
export async function logWebhookError(
  error: Error,
  processingTimeMs: number
): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    await supabase.from('webhook_logs').insert({
      event_type: 'error',
      status: 'failed',
      error_message: error.message,
      stack_trace: error.stack,
      processing_time_ms: processingTimeMs,
      processed_at: new Date().toISOString(),
    })
  } catch (logError) {
    logger.error('[Webhook] Failed to log error:', logError)
  }
}
