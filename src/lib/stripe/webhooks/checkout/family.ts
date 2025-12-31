/**
 * Family Takeover Handler
 *
 * Handles: checkout.session.completed with type === 'family_takeover'
 * Processes family account takeover where secondary becomes billing owner
 */
import { logger } from '@/lib/logger'
import type { WebhookContext, HandlerResult, CheckoutSession, CheckoutSessionMetadata } from '../types'

/**
 * Handle family account takeover checkout
 */
export async function handleFamilyTakeover(
  session: CheckoutSession,
  ctx: WebhookContext
): Promise<HandlerResult> {
  const metadata = (session.metadata || {}) as CheckoutSessionMetadata

  logger.info(`[Webhook] Processing family takeover for account: ${metadata.account_id}`)

  // Dynamic import to avoid circular dependencies
  const { completeTakeover } = await import('@/lib/server/family-takeover-service')

  await completeTakeover(
    ctx.supabase,
    {
      account_id: metadata.account_id || '',
      secondary_id: metadata.secondary_id || '',
      takeover_type: (metadata.takeover_type as 'full_primary' | 'billing_only') || 'billing_only',
      reason: metadata.reason || '',
      reason_text: metadata.reason_text || '',
      new_payer_user_id: metadata.new_payer_user_id || '',
      previous_primary_id: metadata.previous_primary_id || '',
    },
    session.subscription as string
  )

  return {
    success: true,
    message: `Family takeover completed for account ${metadata.account_id} by secondary ${metadata.secondary_id}`,
  }
}
