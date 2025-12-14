/**
 * React Hooks for Analytics
 *
 * Client-side only hooks for tracking user behavior.
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { trackEvent, identifyUser, resetAnalytics } from '@/lib/analytics/client'
import type { EventName, EventPropertiesMap } from '@/types/analytics'

/**
 * Track page view with duration on unmount
 *
 * @example
 * // In a page component:
 * usePageView('gallery_detail', { gallery_id: '123' })
 */
export function usePageView(
  pageName: string,
  properties?: Record<string, unknown>
) {
  const startTimeRef = useRef<number>(Date.now())
  const hasTrackedRef = useRef<boolean>(false)

  useEffect(() => {
    // Track page view on mount (only once)
    if (!hasTrackedRef.current) {
      trackEvent(`${pageName}_viewed`, {
        ...properties,
        page_name: pageName,
      })
      hasTrackedRef.current = true
      startTimeRef.current = Date.now()
    }

    // Track page leave with duration on unmount
    return () => {
      const durationSeconds = Math.round(
        (Date.now() - startTimeRef.current) / 1000
      )

      trackEvent(`${pageName}_left`, {
        ...properties,
        page_name: pageName,
        duration_seconds: durationSeconds,
      })
    }
  }, [pageName]) // Only re-run if pageName changes
  // Don't include properties in deps to avoid duplicate tracking
}

/**
 * Track a typed event
 *
 * @example
 * const track = useTrackEvent()
 * track(EVENTS.GALLERY_VIEWED, { gallery_id: '123', photographer_id: '456' })
 */
export function useTrackEvent() {
  return useCallback(
    <E extends EventName>(
      eventName: E,
      properties: E extends keyof EventPropertiesMap
        ? Omit<EventPropertiesMap[E], 'timestamp' | 'session_id' | 'user_id'>
        : Record<string, unknown>
    ) => {
      trackEvent(eventName, properties as Record<string, unknown>)
    },
    []
  )
}

/**
 * Get the raw trackEvent function (untyped)
 *
 * Use useTrackEvent() for typed tracking when possible.
 */
export function useTrackEventRaw() {
  return trackEvent
}

/**
 * Get the identify function for manual user identification
 *
 * Usually you don't need this - AuthContext handles identification.
 */
export function useIdentify() {
  return identifyUser
}

/**
 * Get the reset function for logout
 *
 * Usually you don't need this - AuthContext handles reset.
 */
export function useResetAnalytics() {
  return resetAnalytics
}

/**
 * Track funnel step completion
 *
 * @example
 * const trackStep = useTrackFunnelStep('onboarding')
 * trackStep('stripe_connect', { connected: true })
 */
export function useTrackFunnelStep(funnelName: string) {
  return useCallback(
    (stepName: string, properties?: Record<string, unknown>) => {
      trackEvent(`${funnelName}_${stepName}`, {
        ...properties,
        funnel: funnelName,
        step: stepName,
      })
    },
    [funnelName]
  )
}

/**
 * Track time spent in a flow (e.g., checkout, upload)
 *
 * Returns a function to call when the flow completes or is abandoned.
 *
 * @example
 * const endFlow = useTrackFlowTime('checkout')
 * // ... user completes checkout
 * endFlow('completed', { plan: 'annual' })
 * // Or if abandoned:
 * endFlow('abandoned', { step: 'payment_form' })
 */
export function useTrackFlowTime(flowName: string) {
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [flowName])

  return useCallback(
    (outcome: 'completed' | 'abandoned', properties?: Record<string, unknown>) => {
      const durationSeconds = Math.round(
        (Date.now() - startTimeRef.current) / 1000
      )

      trackEvent(`${flowName}_${outcome}`, {
        ...properties,
        flow: flowName,
        time_spent_seconds: durationSeconds,
      })
    },
    [flowName]
  )
}
