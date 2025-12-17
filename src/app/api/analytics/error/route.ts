/**
 * Error Logging API Endpoint
 *
 * Logs errors to Supabase fallback table + PostHog (server-side)
 * This ensures critical errors are captured even if PostHog client is blocked by ad blockers
 *
 * Features:
 * - In-memory rate limiting (10 errors per minute per IP)
 * - Payload validation and truncation
 * - Server-side PostHog tracking for authenticated users
 *
 * Created: December 16, 2025 (Story 6.3)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiting (per IP)
// For production, consider using Upstash Redis or Vercel KV
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 errors per minute per IP

// Payload limits
const MAX_ERROR_MESSAGE_LENGTH = 1000
const MAX_STACK_TRACE_LENGTH = 5000

/**
 * Simple rate limiting (in-memory)
 * For production, replace with Redis-based rate limiting
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  // Clean up old entries periodically (simple garbage collection)
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key)
      }
    }
  }

  if (!record || now > record.resetAt) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limit exceeded
  }

  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting protection
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const supabase = createServerSupabaseClient()
    const body = await request.json()

    let { error_type, error_message, page, stack_trace, component_stack } = body

    // Validate required fields
    if (!error_type || !error_message) {
      return NextResponse.json(
        { error: 'error_type and error_message are required' },
        { status: 400 }
      )
    }

    // Truncate to prevent huge payloads
    if (error_message && error_message.length > MAX_ERROR_MESSAGE_LENGTH) {
      error_message = error_message.slice(0, MAX_ERROR_MESSAGE_LENGTH) + '... (truncated)'
    }

    if (stack_trace && stack_trace.length > MAX_STACK_TRACE_LENGTH) {
      stack_trace = stack_trace.slice(0, MAX_STACK_TRACE_LENGTH) + '... (truncated)'
    }

    if (component_stack && component_stack.length > MAX_STACK_TRACE_LENGTH) {
      component_stack = component_stack.slice(0, MAX_STACK_TRACE_LENGTH) + '... (truncated)'
    }

    // Get user if authenticated (optional)
    const { data: { user } } = await supabase.auth.getUser()

    // Track to PostHog (server-side - cannot be blocked)
    if (user) {
      await trackServerEvent(user.id, EVENTS.ERROR_ENCOUNTERED, {
        error_type,
        error_message,
        page: page || 'unknown',
        stack_trace: stack_trace || undefined,
      })
    }

    // Log to error_logs table as fallback
    const { error: insertError } = await supabase.from('error_logs').insert({
      user_id: user?.id || null,
      error_type,
      error_message,
      page: page || null,
      stack_trace: stack_trace || null,
      component_stack: component_stack || null,
      user_agent: request.headers.get('user-agent') || null,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('[Error API] Failed to insert error log:', insertError)
      // Don't throw - still return success for PostHog tracking
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Error API] Failed to log error:', error)
    // Don't throw - we're already handling an error
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
