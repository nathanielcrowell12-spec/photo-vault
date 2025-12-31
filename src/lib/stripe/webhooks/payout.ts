/**
 * Payout Webhook Handler
 *
 * Handles: payout.created
 * Records photographer payouts from Stripe Connect
 */
import { logger } from '@/lib/logger'
import type { WebhookContext, HandlerResult, Payout } from './types'

/**
 * Handle photographer payout (Stripe Connect)
 */
export async function handlePayoutCreated(
  payout: Payout,
  ctx: WebhookContext
): Promise<HandlerResult> {
  logger.info('[Webhook] Processing payout.created', payout.id)

  const { supabase } = ctx

  // Get photographer by Stripe Connect account ID
  const { data: photographer, error: photoError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_connect_account_id', payout.destination)
    .single()

  if (photoError || !photographer) {
    logger.warn(
      `[Webhook] Photographer not found for Stripe Connect account: ${payout.destination}`
    )
    return {
      success: true,
      message: `Payout ${payout.id} created but photographer not found in database`,
    }
  }

  // Record payout
  const { error: insertError } = await supabase.from('payouts').insert({
    photographer_id: photographer.id,
    stripe_payout_id: payout.id,
    amount_cents: payout.amount,
    currency: payout.currency,
    status: payout.status,
    arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
    description: payout.description || 'Photographer earnings payout',
    created_at: new Date().toISOString(),
  })

  if (insertError) {
    throw insertError
  }

  return {
    success: true,
    message: `Payout ${payout.id} created for photographer ${photographer.id}`,
  }
}
