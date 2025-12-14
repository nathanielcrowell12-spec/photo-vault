/**
 * Analytics Module Index
 *
 * Re-exports for convenient imports:
 *
 * Client-side (browser):
 *   import { trackEvent, identifyUser } from '@/lib/analytics'
 *
 * Server-side (API routes, webhooks):
 *   import { trackServerEvent } from '@/lib/analytics/server'
 */

// Client-side exports (for 'use client' components)
export {
  initPostHog,
  identifyUser,
  trackEvent,
  resetAnalytics,
  isAnalyticsInitialized,
  posthog,
} from './client'

// Re-export event constants and types
export { EVENTS, type EventName } from '@/types/analytics'
