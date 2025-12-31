/**
 * Token Purchase Handler
 *
 * Handles: checkout.session.completed with purchase_type === 'tokens'
 * Adds purchased tokens to user balance
 */
import { logger } from '@/lib/logger'
import type { WebhookContext, HandlerResult, CheckoutSession } from '../types'

/**
 * Handle token purchase checkout
 */
export async function handleTokenPurchase(
  session: CheckoutSession,
  ctx: WebhookContext
): Promise<HandlerResult> {
  const { supabase } = ctx
  const metadata = session.metadata || {}
  const { user_id, tokens } = metadata

  if (!user_id) {
    throw new Error('Missing user_id in token purchase checkout metadata')
  }

  if (!tokens) {
    throw new Error('Missing tokens amount in checkout metadata')
  }

  const tokenAmount = parseInt(tokens)
  logger.info(`[Webhook] Processing token purchase: ${tokenAmount} tokens for user ${user_id}`)

  // Add tokens to user balance using RPC function
  const { error: rpcError } = await supabase.rpc('add_tokens_to_balance', {
    p_user_id: user_id,
    p_tokens: tokenAmount,
    p_payment_intent_id: session.payment_intent,
  })

  if (rpcError) {
    logger.error('[Webhook] RPC error:', rpcError)
    // If RPC doesn't exist, fetch current balance and update directly
    const { data: currentUser } = await supabase
      .from('users')
      .select('token_balance')
      .eq('id', user_id)
      .single()

    const currentBalance = currentUser?.token_balance || 0
    const { error: updateError } = await supabase
      .from('users')
      .update({
        token_balance: currentBalance + tokenAmount,
      })
      .eq('id', user_id)

    if (updateError) {
      throw updateError
    }
  }

  // Record transaction
  await supabase.from('token_transactions').insert({
    user_id,
    transaction_type: 'purchase',
    tokens_amount: tokenAmount,
    stripe_payment_intent_id: session.payment_intent,
    stripe_charge_id: session.payment_intent, // Charge ID is in payment_intent for new API
    amount_paid_cents: session.amount_total,
    currency: session.currency,
    description: `Token purchase - ${tokenAmount} tokens`,
    created_at: new Date().toISOString(),
  })

  return {
    success: true,
    message: `Added ${tokenAmount} tokens to user ${user_id}`,
  }
}
