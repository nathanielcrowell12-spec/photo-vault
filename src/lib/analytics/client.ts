/**
 * Client-side PostHog Analytics
 *
 * Use for engagement events that are nice-to-have but not business-critical.
 * For critical funnel events (signup, payment, churn), use server.ts instead.
 *
 * Ad blockers block 30%+ of client-side events!
 */
import posthog from 'posthog-js'

let initialized = false

/**
 * Initialize PostHog client-side tracking
 * Called once in PostHogProvider
 */
export function initPostHog() {
  if (initialized || typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    console.warn('[Analytics] NEXT_PUBLIC_POSTHOG_KEY not set, skipping PostHog initialization')
    return
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',

    // Automatic tracking
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,

    // Privacy defaults - be respectful
    respect_dnt: true,
    disable_session_recording: true, // Enable later if needed
    persistence: 'localStorage', // Not cookies

    // Performance & debugging
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') {
        // Easier debugging in dev - shows events in console
        ph.debug()
      }
    },
  })

  initialized = true
}

/**
 * Identify a user after authentication
 * Call this immediately after login/signup
 */
export function identifyUser(
  userId: string,
  properties: {
    user_type: 'photographer' | 'client' | 'admin' | 'secondary'
    signup_date: string
    stripe_connected?: boolean
    subscription_tier?: string
  }
) {
  if (typeof window === 'undefined' || !initialized) return
  posthog.identify(userId, properties)
}

/**
 * Track a custom event (client-side)
 *
 * Use for engagement events only. For critical events, use trackServerEvent.
 *
 * @example
 * trackEvent('gallery_viewed', { gallery_id: '123', photographer_id: '456' })
 */
export function trackEvent<T extends Record<string, unknown>>(
  eventName: string,
  properties?: T
) {
  if (typeof window === 'undefined' || !initialized) return
  posthog.capture(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Reset analytics identity on logout
 * Call this before signing out
 */
export function resetAnalytics() {
  if (typeof window === 'undefined' || !initialized) return
  posthog.reset()
}

/**
 * Check if PostHog is initialized
 */
export function isAnalyticsInitialized(): boolean {
  return initialized
}

// Export the raw posthog instance for advanced use cases
export { posthog }
