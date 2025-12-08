/**
 * Subscription Access Control Utilities for PhotoVault
 * SERVER-ONLY - Manages gallery access based on subscription status and payment state
 * 
 * Note: This file uses server-only imports. Do not import into client components.
 * For client-side access control, use access-control.ts instead.
 */

import { createServiceRoleClient } from '@/lib/supabase-server'

export interface AccessCheckResult {
  hasAccess: boolean
  reason?: 'active' | 'paid_upfront' | 'suspended' | 'no_subscription' | 'expired' | 'unpaid'
  suspendedAt?: Date
  updatePaymentUrl?: string
}

/**
 * Check if a user has access to a specific gallery
 * This checks both upfront payments and subscription-based access
 * SERVER-ONLY - Do not use in client components
 */
export async function checkGalleryAccess(
  galleryId: string,
  userId?: string
): Promise<AccessCheckResult> {
  const supabase = createServiceRoleClient()

  // First, check if gallery is paid upfront (one-time payment)
  const { data: gallery } = await supabase
    .from('photo_galleries')
    .select('payment_status, paid_at')
    .eq('id', galleryId)
    .single()

  // If gallery was paid upfront, access is granted
  if (gallery?.payment_status === 'paid' && gallery?.paid_at) {
    return {
      hasAccess: true,
      reason: 'paid_upfront'
    }
  }

  // If no user ID provided, and gallery isn't paid upfront, no access
  if (!userId) {
    return {
      hasAccess: false,
      reason: 'unpaid',
      updatePaymentUrl: `/gallery/${galleryId}` // Redirect to gallery page to pay
    }
  }

  // Check for subscription-based access
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, access_suspended, access_suspended_at, current_period_end')
    .eq('gallery_id', galleryId)
    .eq('user_id', userId)
    .single()

  // No subscription found
  if (!subscription) {
    return {
      hasAccess: false,
      reason: 'no_subscription',
      updatePaymentUrl: `/gallery/${galleryId}`
    }
  }

  // Check if access is suspended due to failed payments
  if (subscription.access_suspended) {
    return {
      hasAccess: false,
      reason: 'suspended',
      suspendedAt: subscription.access_suspended_at ? new Date(subscription.access_suspended_at) : undefined,
      updatePaymentUrl: '/client/billing'
    }
  }

  // Check if subscription is expired
  if (subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end)
    if (periodEnd < new Date()) {
      return {
        hasAccess: false,
        reason: 'expired',
        updatePaymentUrl: '/client/billing'
      }
    }
  }

  // Check subscription status
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return {
      hasAccess: true,
      reason: 'active'
    }
  }

  // past_due status - still allow access during grace period (48 hours)
  if (subscription.status === 'past_due') {
    return {
      hasAccess: true, // Access continues during grace period
      reason: 'active'
    }
  }

  // Any other status (canceled, unpaid, incomplete)
  return {
    hasAccess: false,
    reason: 'unpaid',
    updatePaymentUrl: '/client/billing'
  }
}

/**
 * Check if a subscription is suspended
 * Quick utility for checking just the suspension status
 * SERVER-ONLY
 */
export async function isSubscriptionAccessSuspended(
  subscriptionId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('subscriptions')
    .select('access_suspended')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  return data?.access_suspended === true
}

/**
 * Get all suspended subscriptions
 * Useful for admin dashboards and reporting
 * SERVER-ONLY
 */
export async function getSuspendedSubscriptions(): Promise<any[]> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      user_id,
      gallery_id,
      stripe_subscription_id,
      access_suspended_at,
      payment_failure_count,
      last_payment_failure_at,
      user_profiles!subscriptions_user_id_fkey(full_name),
      photo_galleries!subscriptions_gallery_id_fkey(gallery_name)
    `)
    .eq('access_suspended', true)
    .order('access_suspended_at', { ascending: false })

  if (error) {
    console.error('[SubscriptionAccess] Error fetching suspended subscriptions:', error)
    return []
  }

  return data || []
}

/**
 * Manually suspend access (for admin use)
 * SERVER-ONLY
 */
export async function suspendSubscriptionAccess(
  subscriptionId: string,
  reason?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({
      access_suspended: true,
      access_suspended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('[SubscriptionAccess] Error suspending access:', error)
    return false
  }

  console.log(`[SubscriptionAccess] Access suspended for subscription ${subscriptionId}${reason ? `: ${reason}` : ''}`)
  return true
}

/**
 * Manually restore access (for admin use)
 * SERVER-ONLY
 */
export async function restoreSubscriptionAccess(
  subscriptionId: string,
  reason?: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('subscriptions')
    .update({
      access_suspended: false,
      access_suspended_at: null,
      payment_failure_count: 0,
      last_payment_failure_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('[SubscriptionAccess] Error restoring access:', error)
    return false
  }

  console.log(`[SubscriptionAccess] Access restored for subscription ${subscriptionId}${reason ? `: ${reason}` : ''}`)
  return true
}


