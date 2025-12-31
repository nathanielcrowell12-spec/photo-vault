/**
 * Subscription Webhook Handlers
 *
 * Handles: customer.subscription.created, updated, deleted
 * Manages subscription lifecycle and churn tracking
 */
import { logger } from '@/lib/logger'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'
import type { WebhookContext, HandlerResult, Subscription } from './types'

/**
 * Handle subscription creation
 */
export async function handleSubscriptionCreated(
  subscription: Subscription,
  ctx: WebhookContext
): Promise<HandlerResult> {
  logger.info('[Webhook] Processing customer.subscription.created', subscription.id)

  const { supabase } = ctx
  const customerId = subscription.customer as string

  // Get user by Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (userError || !user) {
    throw new Error(`User not found for Stripe customer: ${customerId}`)
  }

  // Extract plan info from metadata or subscription items
  const planType = subscription.metadata?.plan_type || 'unknown'

  // Get billing period from first subscription item (all items share the same billing period)
  const firstItem = subscription.items.data[0]
  const currentPeriodStart = firstItem?.current_period_start
  const currentPeriodEnd = firstItem?.current_period_end

  // Create subscription record
  const { error: insertError } = await supabase.from('subscriptions').insert({
    user_id: user.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status,
    plan_type: planType,
    current_period_start: currentPeriodStart
      ? new Date(currentPeriodStart * 1000).toISOString()
      : new Date().toISOString(),
    current_period_end: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : new Date().toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (insertError) throw insertError

  return {
    success: true,
    message: `Created subscription ${subscription.id} for user ${user.id}`,
  }
}

/**
 * Handle subscription updates
 */
export async function handleSubscriptionUpdated(
  subscription: Subscription,
  ctx: WebhookContext
): Promise<HandlerResult> {
  logger.info('[Webhook] Processing customer.subscription.updated', subscription.id)

  const { supabase } = ctx

  // Get billing period from first subscription item (all items share the same billing period)
  const firstItem = subscription.items.data[0]
  const currentPeriodStart = firstItem?.current_period_start
  const currentPeriodEnd = firstItem?.current_period_end

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: currentPeriodStart
        ? new Date(currentPeriodStart * 1000).toISOString()
        : undefined,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : undefined,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) throw error

  return {
    success: true,
    message: `Subscription ${subscription.id} updated`,
  }
}

/**
 * Handle subscription cancellation
 * Includes churn tracking with LTV metrics (Story 6.3)
 */
export async function handleSubscriptionDeleted(
  subscription: Subscription,
  ctx: WebhookContext
): Promise<HandlerResult> {
  logger.info('[Webhook] Processing customer.subscription.deleted', subscription.id)

  const { supabase } = ctx

  // Get subscription details BEFORE updating (to get user_id and user_type)
  const { data: subData } = await supabase
    .from('subscriptions')
    .select(`
      *,
      user_profiles!subscriptions_user_id_fkey(user_type, created_at)
    `)
    .eq('stripe_subscription_id', subscription.id)
    .single()

  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) throw error

  // Track churn event asynchronously (don't block webhook response)
  if (subData && subData.user_id) {
    const userType = subData.user_profiles?.user_type
    const signupDate = subData.user_profiles?.created_at

    // Calculate tenure
    const tenureDays = signupDate
      ? Math.round((Date.now() - new Date(signupDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // Fire churn tracking asynchronously with timeout protection
    Promise.resolve().then(async () => {
      try {
        if (userType === 'photographer') {
          // Get photographer stats with timeout protection (2 second max)
          const statsPromise = supabase
            .rpc('get_photographer_churn_stats', { p_photographer_id: subData.user_id })
            .single()

          const statsResult = await Promise.race([
            statsPromise,
            new Promise<{ data: null }>((resolve) =>
              setTimeout(() => resolve({ data: null }), 2000)
            ),
          ]).catch((err: Error) => {
            logger.error('[Churn Tracking] Stats query failed or timed out:', err)
            return { data: null }
          })

          const stats = (
            statsResult as {
              data: {
                total_revenue_cents?: number
                client_count?: number
                gallery_count?: number
              } | null
            }
          )?.data || {
            total_revenue_cents: 0,
            client_count: 0,
            gallery_count: 0,
          }

          await trackServerEvent(subData.user_id, EVENTS.PHOTOGRAPHER_CHURNED, {
            tenure_days: tenureDays,
            total_revenue_cents: stats.total_revenue_cents || 0,
            client_count: stats.client_count || 0,
            gallery_count: stats.gallery_count || 0,
            churn_reason: subscription.cancellation_details?.reason || undefined,
          })

          logger.info('[Churn Tracking] Photographer churn tracked:', subData.user_id)
        } else if (userType === 'client') {
          // Get client stats with timeout protection
          const statsPromise = supabase
            .rpc('get_client_churn_stats', { p_client_id: subData.user_id })
            .single()

          const statsResult = await Promise.race([
            statsPromise,
            new Promise<{ data: null }>((resolve) =>
              setTimeout(() => resolve({ data: null }), 2000)
            ),
          ]).catch((err: Error) => {
            logger.error('[Churn Tracking] Stats query failed or timed out:', err)
            return { data: null }
          })

          const stats = (
            statsResult as {
              data: { photographer_id?: string; gallery_count?: number } | null
            }
          )?.data || {
            photographer_id: undefined,
            gallery_count: 0,
          }

          await trackServerEvent(subData.user_id, EVENTS.CLIENT_CHURNED, {
            tenure_days: tenureDays,
            photographer_id: stats.photographer_id || undefined,
            gallery_count: stats.gallery_count || 0,
            churn_reason: subscription.cancellation_details?.reason || undefined,
          })

          logger.info('[Churn Tracking] Client churn tracked:', subData.user_id)
        }
      } catch (churnError) {
        // Log to error_logs table but don't fail the webhook
        logger.error('[Churn Tracking] Failed to track churn event:', churnError)
        try {
          await supabase.from('error_logs').insert({
            user_id: subData.user_id,
            error_type: 'ChurnTrackingError',
            error_message: String(churnError),
            page: '/api/webhooks/stripe',
          })
        } catch (logError) {
          logger.error('[Churn Tracking] Failed to log error:', logError)
        }
      }
    })
  }

  return {
    success: true,
    message: `Subscription ${subscription.id} canceled`,
  }
}
