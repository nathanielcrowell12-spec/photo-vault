/**
 * Server-side PostHog Analytics
 *
 * Use for CRITICAL funnel events that MUST NOT be blocked by ad blockers:
 * - photographer_signed_up
 * - photographer_connected_stripe
 * - client_payment_completed
 * - client_payment_failed
 * - photographer_churned
 * - client_churned
 *
 * These events are tracked from API routes and webhooks.
 */
import { PostHog } from 'posthog-node'
import { logger } from '../logger'

// Singleton for the server-side client
let posthogClient: PostHog | null = null

/**
 * Get or create the PostHog server-side client
 */
function getPostHogClient(): PostHog | null {
  if (!process.env.POSTHOG_API_KEY) {
    logger.warn('[Analytics Server] POSTHOG_API_KEY not set, skipping server-side tracking')
    return null
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      // Important for serverless: flush immediately, don't batch
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return posthogClient
}

/**
 * Track an event server-side (cannot be ad-blocked)
 *
 * Use for critical funnel events only.
 *
 * @example
 * await trackServerEvent(userId, 'client_payment_completed', {
 *   gallery_id: '123',
 *   amount_cents: 10000,
 * })
 */
export async function trackServerEvent(
  userId: string,
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const client = getPostHogClient()
  if (!client) return

  client.capture({
    distinctId: userId,
    event: eventName,
    properties: {
      ...properties,
      $source: 'server', // Distinguish from client events in PostHog
      timestamp: new Date().toISOString(),
    },
  })

  // Important for serverless: flush immediately before the function ends
  await client.flush()
}

/**
 * Identify a user server-side
 *
 * Use when you need to set user properties from the server
 * (e.g., after Stripe Connect completes)
 */
export async function identifyServerUser(
  userId: string,
  properties: Record<string, unknown>
): Promise<void> {
  const client = getPostHogClient()
  if (!client) return

  client.identify({
    distinctId: userId,
    properties,
  })

  await client.flush()
}

/**
 * Shutdown the PostHog client
 *
 * Call this on process shutdown to ensure all events are sent.
 * In serverless (Vercel), this is less important since we flush after each event.
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown()
    posthogClient = null
  }
}
