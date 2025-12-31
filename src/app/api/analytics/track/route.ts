/**
 * Server-side Analytics Tracking API
 *
 * This endpoint allows client components to trigger server-side tracking
 * for critical events that must not be blocked by ad blockers.
 *
 * Used for: signup, payment, churn events
 */
import { NextRequest, NextResponse } from 'next/server'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS, type EventName } from '@/types/analytics'
import { logger } from '@/lib/logger'

// Allowlist of events that can be tracked via this endpoint
const ALLOWED_EVENTS: EventName[] = [
  EVENTS.PHOTOGRAPHER_SIGNED_UP,
  EVENTS.CLIENT_CREATED_ACCOUNT,
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, eventName, properties } = body

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      )
    }

    if (!eventName || typeof eventName !== 'string') {
      return NextResponse.json(
        { error: 'eventName is required and must be a string' },
        { status: 400 }
      )
    }

    // Only allow specific events for security
    if (!ALLOWED_EVENTS.includes(eventName as EventName)) {
      logger.warn(`[AnalyticsTrack] Blocked tracking of unauthorized event: ${eventName}`)
      return NextResponse.json(
        { error: 'Event not allowed via this endpoint' },
        { status: 403 }
      )
    }

    // Track the event server-side
    await trackServerEvent(userId, eventName, properties || {})

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[AnalyticsTrack] Error tracking event:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}
