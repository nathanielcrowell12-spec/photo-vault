/**
 * Client Conversion Service
 *
 * Handles conversion of Direct Monthly clients to photographer-associated clients
 * when they book a shoot with a PhotoVault photographer.
 *
 * Flow:
 * 1. Direct/Orphaned client ($8/mo, 100% PhotoVault) books shoot with photographer
 * 2. Photographer creates gallery for client
 * 3. This service:
 *    - Updates client record with primary_photographer_id
 *    - Changes client_type to 'photographer_referred'
 *    - Swaps Stripe subscription from Direct Monthly to Client Monthly (50/50)
 *    - Logs the conversion
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getStripeClient } from '@/lib/stripe'
import { logger } from '@/lib/logger'

// Price IDs from environment
const STRIPE_PRICE_DIRECT_MONTHLY = process.env.STRIPE_PRICE_DIRECT_MONTHLY!
const STRIPE_PRICE_CLIENT_MONTHLY = process.env.STRIPE_PRICE_CLIENT_MONTHLY!

export interface ConversionResult {
  success: boolean
  converted: boolean
  message: string
  oldClientType?: string
  newClientType?: string
  stripeSwapped?: boolean
}

/**
 * Check if a client needs conversion (is direct/orphaned)
 */
export async function checkClientNeedsConversion(clientId: string): Promise<{
  needsConversion: boolean
  clientType: string | null
  isOrphaned: boolean
  primaryPhotographerId: string | null
}> {
  const supabase = await createServerSupabaseClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('client_type, is_orphaned, primary_photographer_id')
    .eq('id', clientId)
    .single()

  if (error || !client) {
    return {
      needsConversion: false,
      clientType: null,
      isOrphaned: false,
      primaryPhotographerId: null
    }
  }

  const needsConversion =
    client.client_type === 'direct_signup' ||
    client.client_type === 'orphaned' ||
    client.is_orphaned === true ||
    client.primary_photographer_id === null

  return {
    needsConversion,
    clientType: client.client_type,
    isOrphaned: client.is_orphaned,
    primaryPhotographerId: client.primary_photographer_id
  }
}

/**
 * Convert a direct/orphaned client to a photographer-associated client
 * This is called when a photographer creates a gallery for an existing client
 */
export async function convertDirectClientToPhotographer(
  clientId: string,
  photographerId: string,
  galleryId?: string
): Promise<ConversionResult> {
  const supabase = await createServerSupabaseClient()

  try {
    // 1. Check if conversion is needed
    const checkResult = await checkClientNeedsConversion(clientId)

    if (!checkResult.needsConversion) {
      return {
        success: true,
        converted: false,
        message: 'Client already has a primary photographer - no conversion needed',
        oldClientType: checkResult.clientType || undefined,
        newClientType: checkResult.clientType || undefined,
        stripeSwapped: false
      }
    }

    // 2. Call the database function to update client record
    const { data: conversionData, error: conversionError } = await supabase
      .rpc('convert_direct_client_to_photographer', {
        p_client_id: clientId,
        p_photographer_id: photographerId,
        p_gallery_id: galleryId || null
      })

    if (conversionError) {
      logger.error('[ClientConversion] Database conversion error:', conversionError)
      return {
        success: false,
        converted: false,
        message: `Database error: ${conversionError.message}`
      }
    }

    const dbResult = conversionData?.[0]

    if (!dbResult?.success) {
      return {
        success: false,
        converted: false,
        message: dbResult?.message || 'Unknown database error'
      }
    }

    // 3. Swap Stripe subscription if client has one
    let stripeSwapped = false
    if (dbResult.old_stripe_subscription_id) {
      try {
        stripeSwapped = await swapSubscriptionPrice(
          dbResult.old_stripe_subscription_id,
          STRIPE_PRICE_DIRECT_MONTHLY,
          STRIPE_PRICE_CLIENT_MONTHLY
        )

        if (stripeSwapped) {
          logger.info(`[ClientConversion] Swapped subscription ${dbResult.old_stripe_subscription_id} from Direct to Client Monthly`)
        }
      } catch (stripeError) {
        logger.error('[ClientConversion] Stripe swap error:', stripeError)
        // Don't fail the conversion if Stripe swap fails - log it for manual fix
      }
    }

    return {
      success: true,
      converted: true,
      message: dbResult.message,
      oldClientType: dbResult.old_client_type,
      newClientType: 'photographer_referred',
      stripeSwapped
    }

  } catch (error) {
    logger.error('[ClientConversion] Unexpected error:', error)
    return {
      success: false,
      converted: false,
      message: error instanceof Error ? error.message : 'Unexpected error'
    }
  }
}

/**
 * Swap a Stripe subscription from one price to another
 * Used to swap from Direct Monthly (100% PV) to Client Monthly (50/50)
 */
async function swapSubscriptionPrice(
  subscriptionId: string,
  oldPriceId: string,
  newPriceId: string
): Promise<boolean> {
  const stripe = getStripeClient()

  try {
    // Get the current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      logger.info(`[ClientConversion] Subscription ${subscriptionId} is not active (${subscription.status}), skipping swap`)
      return false
    }

    // Find the subscription item with the old price
    const itemToUpdate = subscription.items.data.find(
      item => item.price.id === oldPriceId
    )

    if (!itemToUpdate) {
      logger.info(`[ClientConversion] Subscription ${subscriptionId} does not have price ${oldPriceId}, may already be converted`)
      return false
    }

    // Update the subscription item to the new price
    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: itemToUpdate.id,
          price: newPriceId
        }
      ],
      metadata: {
        ...subscription.metadata,
        converted_from: 'direct_monthly',
        converted_to: 'client_monthly',
        converted_at: new Date().toISOString()
      },
      proration_behavior: 'none' // Don't prorate - same price, just different revenue split
    })

    return true

  } catch (error) {
    logger.error('[ClientConversion] Stripe subscription swap failed:', error)
    throw error
  }
}

/**
 * Get conversion status for a client
 * Useful for displaying in admin dashboard
 */
export async function getClientConversionHistory(clientId: string): Promise<{
  currentType: string | null
  isOrphaned: boolean
  primaryPhotographerId: string | null
  conversionHistory: Array<{
    date: string
    previousPhotographer: string | null
    newPhotographer: string | null
    reason: string
    notes: string
  }>
}> {
  const supabase = await createServerSupabaseClient()

  // Get current client status
  const { data: client } = await supabase
    .from('clients')
    .select('client_type, is_orphaned, primary_photographer_id')
    .eq('id', clientId)
    .single()

  // Get conversion history
  const { data: history } = await supabase
    .from('photographer_succession_log')
    .select(`
      succession_date,
      previous_primary_photographer_id,
      new_primary_photographer_id,
      succession_reason,
      notes
    `)
    .eq('client_id', clientId)
    .order('succession_date', { ascending: false })

  return {
    currentType: client?.client_type || null,
    isOrphaned: client?.is_orphaned || false,
    primaryPhotographerId: client?.primary_photographer_id || null,
    conversionHistory: (history || []).map(h => ({
      date: h.succession_date,
      previousPhotographer: h.previous_primary_photographer_id,
      newPhotographer: h.new_primary_photographer_id,
      reason: h.succession_reason,
      notes: h.notes
    }))
  }
}
