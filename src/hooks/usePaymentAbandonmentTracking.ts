'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/client'
import { EVENTS } from '@/types/analytics'

/**
 * Track payment abandonment when user returns from Stripe Checkout
 * without completing payment.
 *
 * Usage:
 * ```tsx
 * usePaymentAbandonmentTracking(galleryId, 'annual')
 * ```
 *
 * This hook detects when:
 * - User returns with ?canceled=true (clicked "back" on Stripe)
 * - User returns with session_id but no success indicator
 *
 * Note: Since PhotoVault uses Stripe's hosted checkout, we can't track
 * time spent on the payment form - that happens on Stripe's domain.
 *
 * Created: December 16, 2025 (Story 6.3)
 */
export function usePaymentAbandonmentTracking(
  galleryId?: string,
  planType?: 'annual' | 'monthly' | '6month'
) {
  const searchParams = useSearchParams()
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    // Don't track twice
    if (hasTrackedRef.current) return

    // Check if user is returning from Stripe (but not success)
    const canceled = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')
    const success = searchParams.get('success')

    // User clicked "back" on Stripe Checkout
    if (canceled === 'true') {
      trackEvent(EVENTS.PAYMENT_ABANDONED, {
        gallery_id: galleryId,
        step_abandoned_at: 'payment_form',
        plan_type: planType,
        time_spent_seconds: 0, // Can't track time spent on Stripe's domain
      })

      hasTrackedRef.current = true
      return
    }

    // User returned with session ID but no success - might be abandonment
    // (This can happen if they used browser back button without clicking Stripe's back)
    if (sessionId && success !== 'true') {
      trackEvent(EVENTS.PAYMENT_ABANDONED, {
        gallery_id: galleryId,
        step_abandoned_at: 'payment_form',
        plan_type: planType,
        time_spent_seconds: 0,
      })

      hasTrackedRef.current = true
    }
  }, [searchParams, galleryId, planType])
}

/**
 * Track when payment flow starts (before redirecting to Stripe)
 * Call this before redirecting to Stripe Checkout.
 *
 * Usage:
 * ```tsx
 * const trackPaymentStart = useTrackPaymentStart()
 *
 * const handleSubscribe = () => {
 *   trackPaymentStart(galleryId, 'annual')
 *   // redirect to Stripe...
 * }
 * ```
 */
export function useTrackPaymentStart() {
  const trackedRef = useRef<Set<string>>(new Set())

  return (galleryId?: string, planType?: string) => {
    const key = `${galleryId}-${planType}`

    // Prevent duplicate tracking for same gallery/plan combo
    if (trackedRef.current.has(key)) return

    trackEvent(EVENTS.CLIENT_STARTED_PAYMENT, {
      gallery_id: galleryId,
      plan_type: planType,
    })

    trackedRef.current.add(key)
  }
}
