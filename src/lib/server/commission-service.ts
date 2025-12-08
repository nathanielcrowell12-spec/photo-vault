/**
 * Commission Service - SIMPLIFIED
 *
 * With Stripe Connect DESTINATION CHARGES, this service is now just for RECORD-KEEPING.
 * Stripe handles all money movement automatically:
 * - Money goes directly to photographer via destination charge
 * - PhotoVault gets its cut via application_fee_amount
 * - Stripe handles 2-day settlement to photographer's bank
 * - No cron jobs, no manual transfers, no pending queues
 *
 * This service now only:
 * - Queries commission records for dashboards/reports
 * - Calculates commission splits (for display purposes)
 */

import { createServerSupabaseClient, createServiceRoleClient } from '../supabase-server'
import { PHOTOGRAPHER_COMMISSION_RATE } from '../stripe'

export interface Commission {
  id: string
  photographer_id: string
  gallery_id: string
  client_email: string
  amount_cents: number
  total_paid_cents: number
  shoot_fee_cents: number
  storage_fee_cents: number
  photovault_commission_cents: number
  payment_type: 'upfront' | 'monthly' | 'reactivation'
  stripe_payment_intent_id: string
  stripe_transfer_id: string | null
  status: 'paid' | 'refunded'
  paid_at: string
  created_at: string
}

/**
 * Calculate PhotoVault's fee (50% of storage fee)
 * This is used when creating checkout sessions
 */
export function calculatePhotovaultFee(storageFeeCents: number): number {
  return Math.round(storageFeeCents * (1 - PHOTOGRAPHER_COMMISSION_RATE))
}

/**
 * Calculate photographer's gross (shoot fee + 50% of storage fee)
 * Stripe fees are deducted from this automatically
 */
export function calculatePhotographerGross(
  shootFeeCents: number,
  storageFeeCents: number
): number {
  const storageCommission = Math.round(storageFeeCents * PHOTOGRAPHER_COMMISSION_RATE)
  return shootFeeCents + storageCommission
}

/**
 * Get photographer's commission history (all commissions - no more "pending")
 */
export async function getPhotographerCommissions(
  photographerId: string,
  limit: number = 50
): Promise<Commission[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('photographer_id', photographerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[Commission] Error fetching commissions:', error)
    return []
  }

  return (data || []) as Commission[]
}

/**
 * Get commission totals for photographer dashboard
 */
export async function getPhotographerCommissionTotals(photographerId: string): Promise<{
  totalEarnings: number
  upfrontEarnings: number
  monthlyEarnings: number
  transactionCount: number
}> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('commissions')
    .select('amount_cents, payment_type')
    .eq('photographer_id', photographerId)

  if (error) {
    console.error('[Commission] Error fetching totals:', error)
    return {
      totalEarnings: 0,
      upfrontEarnings: 0,
      monthlyEarnings: 0,
      transactionCount: 0,
    }
  }

  const commissions = data || []

  const totalEarnings = commissions.reduce((sum, c) => sum + c.amount_cents, 0)
  const upfrontEarnings = commissions
    .filter(c => c.payment_type === 'upfront')
    .reduce((sum, c) => sum + c.amount_cents, 0)
  const monthlyEarnings = commissions
    .filter(c => c.payment_type === 'monthly')
    .reduce((sum, c) => sum + c.amount_cents, 0)

  return {
    totalEarnings: totalEarnings / 100, // Convert to dollars
    upfrontEarnings: upfrontEarnings / 100,
    monthlyEarnings: monthlyEarnings / 100,
    transactionCount: commissions.length,
  }
}

/**
 * Get recent commissions for photographer (for dashboard widget)
 */
export async function getRecentCommissions(
  photographerId: string,
  limit: number = 5
): Promise<Commission[]> {
  return getPhotographerCommissions(photographerId, limit)
}

/**
 * Get commission by ID
 */
export async function getCommissionById(commissionId: string): Promise<Commission | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('id', commissionId)
    .single()

  if (error) {
    console.error('[Commission] Error fetching commission:', error)
    return null
  }

  return data as Commission
}

/**
 * Get commission by Stripe payment intent (for webhook deduplication)
 */
export async function getCommissionByPaymentIntent(
  paymentIntentId: string
): Promise<Commission | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('[Commission] Error fetching commission by payment intent:', error)
  }

  return data as Commission | null
}

// ============================================================
// DEPRECATED FUNCTIONS - These are no longer needed with
// destination charges, but kept for backwards compatibility
// during migration
// ============================================================

/**
 * @deprecated No longer needed - Stripe handles payouts automatically
 */
export function calculateScheduledPayoutDate(paymentDate: Date): Date {
  console.warn('[Commission] calculateScheduledPayoutDate is deprecated - Stripe handles payouts automatically')
  const payoutDate = new Date(paymentDate)
  payoutDate.setDate(payoutDate.getDate() + 2) // Stripe's 2-day settlement
  return payoutDate
}

/**
 * @deprecated No longer needed - Stripe handles payouts automatically
 */
export async function processScheduledPayout(commissionId: string): Promise<{
  success: boolean
  error?: string
}> {
  console.warn('[Commission] processScheduledPayout is deprecated - Stripe handles payouts via destination charges')
  return {
    success: false,
    error: 'Manual payouts are deprecated. Stripe handles transfers via destination charges.',
  }
}

/**
 * @deprecated Use getPhotographerCommissions instead - all commissions are "paid" now
 */
export async function getPhotographerPendingCommissions(photographerId: string) {
  console.warn('[Commission] getPhotographerPendingCommissions is deprecated - all commissions are paid immediately via destination charges')
  return []
}

/**
 * @deprecated Use getPhotographerCommissions instead
 */
export async function getPhotographerCommissionHistory(
  photographerId: string,
  limit: number = 50
) {
  return getPhotographerCommissions(photographerId, limit)
}

/**
 * @deprecated Commission calculation now happens in checkout routes
 */
export function calculateCommissionAmount(paymentAmountCents: number): number {
  console.warn('[Commission] calculateCommissionAmount is deprecated - use calculatePhotographerGross instead')
  return Math.round(paymentAmountCents * PHOTOGRAPHER_COMMISSION_RATE)
}
