/**
 * Commission Service - Core business logic for commission creation and management
 * CORRECTED: Uses flat 50% commission rate, not tiered
 */

import { createServerSupabaseClient } from '../supabase'
import { PHOTOGRAPHER_COMMISSION_RATE } from '../stripe'

export interface CreateCommissionParams {
  photographerId: string
  clientId: string
  clientPaymentId: string
  paymentAmountCents: number
  paymentDate: Date
  periodStart: Date
  periodEnd: Date
  commissionType: 'upfront' | 'recurring' | 'reactivation'
}

/**
 * Calculate commission amount (flat 50% rate)
 */
export function calculateCommissionAmount(paymentAmountCents: number): number {
  return Math.round(paymentAmountCents * PHOTOGRAPHER_COMMISSION_RATE)
}

/**
 * Calculate scheduled payout date (14 days from payment)
 */
export function calculateScheduledPayoutDate(paymentDate: Date): Date {
  const payoutDate = new Date(paymentDate)
  payoutDate.setDate(payoutDate.getDate() + 14)
  return payoutDate
}

/**
 * Check if client is in grace period (within 90 days of last payment)
 */
export function isInGracePeriod(lastPaymentDate: Date): boolean {
  const now = new Date()
  const daysSincePayment = (now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
  return daysSincePayment < 90
}

/**
 * Check if photographer should be suspended (90+ days overdue)
 */
export function shouldSuspendPhotographer(lastPaymentAttempt: Date): boolean {
  const now = new Date()
  const daysSincePayment = (now.getTime() - lastPaymentAttempt.getTime()) / (1000 * 60 * 60 * 24)
  return daysSincePayment >= 90
}

/**
 * Create commission record when client makes payment
 */
export async function createCommission(params: CreateCommissionParams): Promise<{
  success: boolean
  commissionId?: string
  error?: string
}> {
  const supabase = createServerSupabaseClient()

  try {
    // Calculate commission amount (flat 50% rate)
    const commissionAmountCents = calculateCommissionAmount(params.paymentAmountCents)

    // Calculate scheduled payout date (payment date + 14 days)
    const scheduledPayoutDate = calculateScheduledPayoutDate(params.paymentDate)

    // Insert commission record
    const { data, error } = await supabase
      .from('commission_payments')
      .insert({
        photographer_id: params.photographerId,
        client_payment_id: params.clientPaymentId,
        commission_amount: (commissionAmountCents / 100).toFixed(2), // Convert cents to dollars
        payment_period_start: params.periodStart.toISOString().split('T')[0],
        payment_period_end: params.periodEnd.toISOString().split('T')[0],
        status: 'pending',
        scheduled_payout_date: scheduledPayoutDate.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating commission:', error)
      return { success: false, error: error.message }
    }

    console.log(`[Commission] Created commission ${data.id} for photographer ${params.photographerId}: $${commissionAmountCents / 100} (50% of $${params.paymentAmountCents / 100})`)

    return { success: true, commissionId: data.id }

  } catch (error) {
    const err = error as Error
    console.error('[Commission] Unexpected error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Process a scheduled payout (called by cron job)
 */
export async function processScheduledPayout(commissionId: string): Promise<{
  success: boolean
  transferId?: string
  error?: string
}> {
  const supabase = createServerSupabaseClient()

  try {
    // Get commission details with photographer info
    const { data: commission, error: fetchError } = await supabase
      .from('commission_payments')
      .select(`
        *,
        photographers!inner (
          id,
          cms_integration_id
        )
      `)
      .eq('id', commissionId)
      .single()

    if (fetchError || !commission) {
      return { success: false, error: 'Commission not found' }
    }

    // Check if photographer has Stripe Connect account
    const stripeAccountId = commission.photographers?.cms_integration_id

    if (!stripeAccountId) {
      console.warn(`[Payout] Photographer ${commission.photographer_id} has no Stripe Connect account`)
      return { success: false, error: 'No Stripe Connect account' }
    }

    // Transfer to photographer via Stripe Connect
    const { stripe } = await import('../stripe')
    const transfer = await stripe.transfers.create({
      amount: Math.round(parseFloat(commission.commission_amount) * 100), // Convert to cents
      currency: 'usd',
      destination: stripeAccountId,
      metadata: {
        commission_id: commissionId,
        photographer_id: commission.photographer_id,
        payout_type: 'commission'
      }
    })

    // Mark commission as paid
    const { error: updateError } = await supabase
      .from('commission_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        cms_payment_id: transfer.id // Store Stripe transfer ID
      })
      .eq('id', commissionId)

    if (updateError) {
      console.error('[Payout] Error updating commission status:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`[Payout] Successfully paid commission ${commissionId}: $${commission.commission_amount} to photographer ${commission.photographer_id}`)

    return { success: true, transferId: transfer.id }

  } catch (error) {
    const err = error as Error
    console.error('[Payout] Error processing payout:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get photographer's pending commissions
 */
export async function getPhotographerPendingCommissions(photographerId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('commission_payments')
    .select('*')
    .eq('photographer_id', photographerId)
    .eq('status', 'pending')
    .order('scheduled_payout_date', { ascending: true })

  if (error) {
    console.error('Error fetching pending commissions:', error)
    return []
  }

  return data || []
}

/**
 * Get photographer's commission history
 */
export async function getPhotographerCommissionHistory(
  photographerId: string,
  limit: number = 50
) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('commission_payments')
    .select('*')
    .eq('photographer_id', photographerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching commission history:', error)
    return []
  }

  return data || []
}
