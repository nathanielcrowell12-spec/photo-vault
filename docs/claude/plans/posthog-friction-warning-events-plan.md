# Story 6.3: Friction & Warning Events - Implementation Plan (REVISED)

**Date:** December 16, 2025
**Status:** Ready for Implementation - Revised to Address QA Concerns
**Dependencies:** Story 6.1 (PostHog foundation) and Story 6.2 (Core journey events) - COMPLETE
**QA Critique:** APPROVED WITH CONCERNS - All 6 concerns addressed in this revision

---

## Revision Summary

This plan has been updated to address all 6 concerns raised by the QA Critic:

1. ✅ **Database function performance** - Added indexes, timeout protection, async tracking
2. ✅ **ErrorBoundary too aggressive** - Multi-level boundaries with navigation preservation
3. ✅ **Upload abandonment race condition** - Completion tracking via ref
4. ✅ **Onboarding abandonment false positives** - Fixed dependency array (CRITICAL)
5. ✅ **Error logs cleanup policy** - Added retention policy documentation
6. ✅ **Rate limiting on error endpoint** - Added DoS protection

---

## Summary

This plan implements **friction and warning events** to track abandonment, errors, support requests, and churn. These events help identify where users struggle and why they leave, enabling product improvements and retention strategies.

**Event Categories:**
1. **Abandonment Events** (client-side with cleanup) - upload_abandoned, payment_abandoned, onboarding_abandoned
2. **Warning Events** (mixed server/client) - error_encountered, support_request_submitted
3. **Churn Events** (server-side ONLY) - photographer_churned, client_churned

---

## Current State Analysis

### Already Defined in `src/types/analytics.ts`

All event types and constants are **already defined** in `analytics.ts`:

**Abandonment Events (lines 191-212):**
- `UploadAbandonedEvent` - photos_uploaded, photos_remaining, time_spent_seconds
- `PaymentAbandonedEvent` - step_abandoned_at, plan_type, time_spent_seconds
- `OnboardingAbandonedEvent` - step_abandoned_at, time_spent_seconds

**Warning Events (lines 214-229):**
- `ErrorEncounteredEvent` - error_type, error_message, page, stack_trace
- `SupportRequestSubmittedEvent` - category, page

**Churn Events (lines 81-87, 149-154):**
- `PhotographerChurnedEvent` - tenure_days, total_revenue_cents, client_count, gallery_count, churn_reason
- `ClientChurnedEvent` - tenure_days, photographer_id, gallery_count, churn_reason

**Conclusion:** Type definitions are complete. No changes needed to `analytics.ts`.

---

## Files Researched

| File | Finding |
|------|---------|
| `src/types/analytics.ts` | All event types already defined |
| `src/hooks/useAnalytics.ts` | `useTrackFlowTime` hook exists (perfect for abandonment tracking) |
| `src/lib/analytics/client.ts` | Client-side `trackEvent` function ready |
| `src/lib/analytics/server.ts` | Server-side `trackServerEvent` function ready |
| `src/app/photographer/upload/page.tsx` | Upload page exists with progress state |
| `src/app/signup/payment/page.tsx` | Payment page exists (simple, needs checkout flow) |
| `src/app/photographers/onboarding/page.tsx` | Onboarding flow with steps |
| `src/app/api/webhooks/stripe/route.ts` | Webhook handles `customer.subscription.deleted` |
| `src/app/layout.tsx` | PostHogProvider wraps entire app, ErrorBoundary missing |
| `database/schema.sql` | No error_logs table exists (need to create) |

---

## Implementation Plan

### Phase 1: Abandonment Events (Client-Side)

#### 1.1 Upload Abandonment (REVISED - Concern #3 Fixed)

**Where:** `src/app/photographer/upload/page.tsx`

**Implementation:**
- Use `useTrackFlowTime` hook to track upload time
- On component unmount, check if upload was incomplete
- Track `upload_abandoned` event with context
- **FIX:** Use completion ref to prevent false positives after successful upload

**Code Changes:**

```typescript
// Add to imports
import { useTrackFlowTime } from '@/hooks/useAnalytics'
import { EVENTS } from '@/types/analytics'

// Add to component state tracking
const endFlow = useTrackFlowTime('upload')
const uploadStartedRef = useRef(false)
const uploadCompletedRef = useRef(false)  // ✅ NEW - Prevent false abandonment
const filesUploadedRef = useRef(0)

// In handleUpload (when upload starts)
uploadStartedRef.current = true

// Track progress during upload loop (line 158-226)
filesUploadedRef.current = i + 1

// Add cleanup effect for abandonment tracking
useEffect(() => {
  return () => {
    // ✅ FIXED - Check completion ref, not uploadProgress state
    if (uploadStartedRef.current && !uploadCompletedRef.current) {
      endFlow('abandoned', {
        gallery_id: undefined, // May not have gallery ID yet
        photos_uploaded: filesUploadedRef.current,
        photos_remaining: files.length - filesUploadedRef.current,
      })
    }
  }
}, [])  // Empty deps - runs only on actual unmount

// On successful completion (line 292)
if (uploadProgress === 100) {
  uploadCompletedRef.current = true  // ✅ NEW - Mark as complete
  endFlow('completed', { gallery_id: gallery.id })
}
```

**Files Modified:**
- `src/app/photographer/upload/page.tsx`

---

#### 1.2 Payment Abandonment

**Where:** Multiple checkout pages (need to identify primary checkout flow)

**Research Finding:** PhotoVault uses Stripe Checkout hosted pages, not custom forms. Client is redirected to Stripe, so abandonment tracking is limited.

**Implementation Strategy:**
1. Track `CLIENT_STARTED_PAYMENT` when user clicks "Subscribe" button (already implemented in Story 6.2)
2. If user returns without completing payment, track `payment_abandoned`
3. Use URL params to detect return without success

**Code Changes:**

Create new hook: `src/hooks/usePaymentAbandonmentTracking.ts`

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics/client'
import { EVENTS } from '@/types/analytics'

/**
 * Track payment abandonment when user returns from Stripe Checkout
 * without completing payment
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

    // User clicked "back" on Stripe Checkout
    if (canceled === 'true' || (sessionId && !searchParams.get('success'))) {
      trackEvent(EVENTS.PAYMENT_ABANDONED, {
        gallery_id: galleryId,
        step_abandoned_at: 'payment_form',
        plan_type: planType,
        time_spent_seconds: 0, // Can't track time spent on Stripe
      })

      hasTrackedRef.current = true
    }
  }, [searchParams, galleryId, planType])
}
```

**Usage in checkout pages:**
- `src/app/gallery/[galleryId]/page.tsx` (client gallery view with subscribe button)
- Any other pages with payment flows

**Files Created:**
- `src/hooks/usePaymentAbandonmentTracking.ts`

**Files Modified:**
- Gallery page (wherever checkout initiates)

---

#### 1.3 Onboarding Abandonment (REVISED - Concern #7 Fixed - CRITICAL)

**Where:** `src/app/photographers/onboarding/page.tsx`

**Implementation:**
- Track when user leaves onboarding flow before completion
- Use cleanup effect to detect abandonment
- **FIX:** Change dependency array to prevent false positives on step changes

**Code Changes:**

```typescript
// Add to imports
import { EVENTS } from '@/types/analytics'
import { trackEvent } from '@/lib/analytics/client'

// Track abandonment on unmount
const onboardingStartTimeRef = useRef<number>(Date.now())
const onboardingCompletedRef = useRef(false)  // ✅ NEW - Track completion

// When onboarding completes (final step)
const handleComplete = () => {
  onboardingCompletedRef.current = true  // ✅ Mark as complete
  // ... existing completion logic
}

useEffect(() => {
  return () => {
    // ✅ FIXED - Empty dependency array, only runs on actual unmount (not step changes)
    // Check completion ref instead of currentStep
    if (!onboardingCompletedRef.current && currentStep > 0) {
      const timeSpent = Math.round((Date.now() - onboardingStartTimeRef.current) / 1000)

      trackEvent(EVENTS.ONBOARDING_ABANDONED, {
        step_abandoned_at: steps[currentStep].title,
        time_spent_seconds: timeSpent,
      })
    }
  }
}, [])  // ✅ CRITICAL FIX - Empty deps (not [currentStep])
```

**Alternative Implementation (if above doesn't work):**

```typescript
// Use beforeunload event instead of cleanup effect
useEffect(() => {
  const handleBeforeUnload = () => {
    if (!onboardingCompletedRef.current && currentStep > 0 && currentStep < steps.length - 1) {
      const timeSpent = Math.round((Date.now() - onboardingStartTimeRef.current) / 1000)

      trackEvent(EVENTS.ONBOARDING_ABANDONED, {
        step_abandoned_at: steps[currentStep].title,
        time_spent_seconds: timeSpent,
      })
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [currentStep])  // Runs on step change to update currentStep reference
```

**Files Modified:**
- `src/app/photographers/onboarding/page.tsx`

---

### Phase 2: Warning Events

#### 2.1 Error Encountered (REVISED - Concerns #2 and #6 Fixed)

**Strategy:**
1. Create multi-level ErrorBoundary components for better UX (Concern #2)
2. Add rate limiting to error endpoint for DoS protection (Concern #6)
3. Track errors to PostHog (client-side when possible)
4. Create fallback error_logs table in Supabase for critical errors

**Implementation:**

**Step 1: Create Base ErrorBoundary Component**

File: `src/components/ErrorBoundary.tsx`

```typescript
'use client'

import React from 'react'
import { trackEvent } from '@/lib/analytics/client'
import { EVENTS } from '@/types/analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  level?: 'root' | 'route' | 'component'  // ✅ NEW - Support multi-level boundaries
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error to PostHog
    trackEvent(EVENTS.ERROR_ENCOUNTERED, {
      error_type: error.name || 'React Error',
      error_message: error.message,
      page: window.location.pathname,
      stack_trace: error.stack,
    })

    // Log to Supabase as fallback (for ad-blocker cases)
    this.logErrorToSupabase(error, errorInfo)

    console.error('Error caught by boundary:', error, errorInfo)
  }

  async logErrorToSupabase(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await fetch('/api/analytics/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: error.name || 'React Error',
          error_message: error.message,
          page: window.location.pathname,
          stack_trace: error.stack,
          component_stack: errorInfo.componentStack,
        }),
      })
    } catch (fallbackError) {
      console.error('Failed to log error to Supabase:', fallbackError)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // ✅ FIXED - Different fallback UI based on boundary level
      if (this.props.level === 'root') {
        // Root-level error - show full page with minimal UI
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle>Something went wrong</CardTitle>
                </div>
                <CardDescription>
                  We've been notified and are looking into it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Error: {this.state.error?.message || 'Unknown error'}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Reload Page
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      }

      // ✅ FIXED - Route/component-level error - show error card (navigation still works)
      return (
        <div className="container py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We've been notified and are looking into it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Error: {this.state.error?.message || 'Unknown error'}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined })
                    window.location.reload()
                  }}
                  className="flex-1"
                >
                  Reload
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Step 2: Create Route-Level Error Boundary Wrapper**

File: `src/components/RouteErrorBoundary.tsx`

```typescript
'use client'

import { ErrorBoundary } from './ErrorBoundary'

interface Props {
  children: React.ReactNode
}

/**
 * Route-level error boundary - preserves navigation on errors
 */
export function RouteErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundary level="route">
      {children}
    </ErrorBoundary>
  )
}
```

**Step 3: Create Error Logging API Route (REVISED - Concern #6 Fixed)**

File: `src/app/api/analytics/error/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { trackServerEvent } from '@/lib/analytics/server'
import { EVENTS } from '@/types/analytics'

export const dynamic = 'force-dynamic'

// ✅ NEW - Simple in-memory rate limiting (per IP)
// For production, use Upstash Redis or Vercel KV
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 errors per minute per IP

/**
 * Simple rate limiting (in-memory)
 * For production, replace with Redis-based rate limiting
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

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

/**
 * Log errors to Supabase fallback table + PostHog (server-side)
 *
 * This ensures critical errors are captured even if PostHog client is blocked
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ NEW - Rate limiting protection
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const supabase = createServerSupabaseClient()
    const body = await request.json()

    let { error_type, error_message, page, stack_trace, component_stack } = body

    // ✅ NEW - Validate and truncate to prevent huge payloads
    const MAX_ERROR_MESSAGE_LENGTH = 1000
    const MAX_STACK_TRACE_LENGTH = 5000

    if (error_message && error_message.length > MAX_ERROR_MESSAGE_LENGTH) {
      error_message = error_message.slice(0, MAX_ERROR_MESSAGE_LENGTH) + '... (truncated)'
    }

    if (stack_trace && stack_trace.length > MAX_STACK_TRACE_LENGTH) {
      stack_trace = stack_trace.slice(0, MAX_STACK_TRACE_LENGTH) + '... (truncated)'
    }

    // Get user if authenticated (optional)
    const { data: { user } } = await supabase.auth.getUser()

    // Track to PostHog (server-side - cannot be blocked)
    if (user) {
      await trackServerEvent(user.id, EVENTS.ERROR_ENCOUNTERED, {
        error_type,
        error_message,
        page,
        stack_trace,
      })
    }

    // Log to error_logs table as fallback
    await supabase.from('error_logs').insert({
      user_id: user?.id || null,
      error_type,
      error_message,
      page,
      stack_trace,
      component_stack,
      user_agent: request.headers.get('user-agent'),
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Error API] Failed to log error:', error)
    // Don't throw - we're already handling an error
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

**Step 4: Create error_logs Table Migration (REVISED - Concern #5 Fixed)**

File: `database/error-logs-table.sql`

```sql
-- Error logs fallback table
-- Captures errors even when PostHog is blocked by ad blockers
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type VARCHAR(255) NOT NULL,
  error_message TEXT NOT NULL,
  page VARCHAR(500),
  stack_trace TEXT,
  component_stack TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ NEW - Indexes for performance and cleanup
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

-- RLS Policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read errors
CREATE POLICY "Admins can view all errors"
  ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Anyone can insert errors (even unauthenticated)
CREATE POLICY "Anyone can log errors"
  ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- ✅ NEW - Data retention policy documentation
COMMENT ON TABLE error_logs IS 'Fallback error logging for when PostHog is blocked by ad blockers. Cleanup policy: Delete errors older than 90 days via scheduled job.';

-- ✅ NEW - Optional: Automated cleanup via pg_cron (if available)
-- Uncomment if Supabase Pro or self-hosted with pg_cron extension:
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-old-error-logs',
  '0 2 * * 0',  -- Every Sunday at 2 AM
  $$DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days'$$
);
*/

-- ✅ NEW - Manual cleanup script for reference
-- Run this periodically if pg_cron is not available:
-- DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
```

**Step 5: Add Multi-Level ErrorBoundaries to Root Layout (REVISED - Concern #2 Fixed)**

Modify `src/app/layout.tsx`:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'

// ✅ FIXED - Multi-level error boundaries
<PostHogProvider>
  <ThemeProvider>
    <AuthProvider>
      <ViewProvider>
        {/* Root-level boundary - catches catastrophic errors only */}
        <ErrorBoundary level="root">
          <div className="flex flex-col min-h-screen bg-background">
            <Navigation />

            {/* Route-level boundary - preserves navigation on route errors */}
            <main className="flex-1">
              <RouteErrorBoundary>
                {children}
              </RouteErrorBoundary>
            </main>

            <Footer />
            <Toaster />
          </div>
        </ErrorBoundary>
      </ViewProvider>
    </AuthProvider>
  </ThemeProvider>
</PostHogProvider>
```

**Step 6: Add Error Tracking to API Routes**

Example pattern for all API routes:

```typescript
export async function POST(request: NextRequest) {
  try {
    // ... existing code
  } catch (error) {
    const err = error as Error

    // Track error server-side
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await trackServerEvent(user.id, EVENTS.ERROR_ENCOUNTERED, {
        error_type: err.name || 'API Error',
        error_message: err.message,
        page: request.url,
        stack_trace: err.stack,
      })
    }

    // Also log to fallback table
    await supabase.from('error_logs').insert({
      user_id: user?.id || null,
      error_type: err.name || 'API Error',
      error_message: err.message,
      page: request.url,
      stack_trace: err.stack,
    })

    console.error('[API Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

**Files Created:**
- `src/components/ErrorBoundary.tsx`
- `src/components/RouteErrorBoundary.tsx`  ✅ NEW
- `src/app/api/analytics/error/route.ts`
- `database/error-logs-table.sql`

**Files Modified:**
- `src/app/layout.tsx`
- API routes (gradually add error tracking)

---

#### 2.2 Support Request Submitted

**Note:** PhotoVault doesn't currently have a support form. This event is defined but not implemented.

**Future Implementation:**
When support form is added, track like this:

```typescript
const handleSubmitSupport = async () => {
  // ... submit support request

  trackEvent(EVENTS.SUPPORT_REQUEST_SUBMITTED, {
    category: selectedCategory, // e.g., 'billing', 'technical', 'general'
    page: window.location.pathname,
  })
}
```

**Files to Create (Future):**
- Support form component
- Support API endpoint

**Skip for now** - mark as "Not Applicable" until support form exists.

---

### Phase 3: Churn Events (Server-Side ONLY) (REVISED - Concern #1 Fixed)

#### 3.1 Photographer Churned

**Where:** `src/app/api/webhooks/stripe/route.ts` in `handleSubscriptionDeleted`

**Implementation:**
- Add database indexes for performance (Concern #1)
- Add timeout protection for stat queries (Concern #1)
- Track churn event with photographer stats

Modify `handleSubscriptionDeleted` function:

```typescript
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
): Promise<string> {
  console.log('[Webhook] Processing customer.subscription.deleted', subscription.id)

  // Get subscription details BEFORE updating
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
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) throw error

  // ✅ REVISED - Track churn event with timeout protection and async execution
  if (subData && subData.user_id) {
    const userType = subData.user_profiles?.user_type
    const signupDate = subData.user_profiles?.created_at

    // Calculate tenure
    const tenureDays = signupDate
      ? Math.round((Date.now() - new Date(signupDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // ✅ NEW - Fire churn tracking asynchronously (don't block webhook response)
    Promise.resolve().then(async () => {
      try {
        if (userType === 'photographer') {
          // ✅ NEW - Timeout protection for stats query (2 second max)
          const statsPromise = supabase
            .rpc('get_photographer_churn_stats', { photographer_id: subData.user_id })
            .single()

          const statsResult = await Promise.race([
            statsPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Stats query timeout')), 2000)
            )
          ]).catch((err) => {
            console.error('[Churn Tracking] Stats query failed or timed out:', err)
            return { data: null }
          })

          const stats = statsResult?.data || {
            total_revenue_cents: 0,
            client_count: 0,
            gallery_count: 0
          }

          await trackServerEvent(subData.user_id, EVENTS.PHOTOGRAPHER_CHURNED, {
            tenure_days: tenureDays,
            total_revenue_cents: stats.total_revenue_cents || 0,
            client_count: stats.client_count || 0,
            gallery_count: stats.gallery_count || 0,
            churn_reason: subscription.cancellation_details?.reason || undefined,
          })

        } else if (userType === 'client') {
          // ✅ NEW - Timeout protection for stats query
          const statsPromise = supabase
            .rpc('get_client_churn_stats', { client_id: subData.user_id })
            .single()

          const statsResult = await Promise.race([
            statsPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Stats query timeout')), 2000)
            )
          ]).catch((err) => {
            console.error('[Churn Tracking] Stats query failed or timed out:', err)
            return { data: null }
          })

          const stats = statsResult?.data || {
            photographer_id: undefined,
            gallery_count: 0
          }

          await trackServerEvent(subData.user_id, EVENTS.CLIENT_CHURNED, {
            tenure_days: tenureDays,
            photographer_id: stats.photographer_id || undefined,
            gallery_count: stats.gallery_count || 0,
            churn_reason: subscription.cancellation_details?.reason || undefined,
          })
        }
      } catch (churnError) {
        // Log to error_logs table but don't fail the webhook
        console.error('[Churn Tracking] Failed to track churn event:', churnError)
        await supabase.from('error_logs').insert({
          user_id: subData.user_id,
          error_type: 'ChurnTrackingError',
          error_message: String(churnError),
          page: '/api/webhooks/stripe',
        })
      }
    })
  }

  return `Subscription ${subscription.id} canceled`
}
```

**Step 2: Create Database Functions for Churn Stats (REVISED - Concern #1 Fixed)**

File: `database/analytics-churn-functions.sql`

```sql
-- ✅ NEW - Add performance indexes FIRST (before creating functions)
CREATE INDEX IF NOT EXISTS idx_commissions_photographer_status
  ON commissions(photographer_id, status);

CREATE INDEX IF NOT EXISTS idx_clients_photographer
  ON clients(photographer_id);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_photographer
  ON photo_galleries(photographer_id);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_client
  ON photo_galleries(client_id);

-- Get photographer churn statistics
CREATE OR REPLACE FUNCTION get_photographer_churn_stats(photographer_id UUID)
RETURNS TABLE (
  total_revenue_cents INTEGER,
  client_count INTEGER,
  gallery_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(c.photographer_amount_cents), 0)::INTEGER AS total_revenue_cents,
    COUNT(DISTINCT cl.id)::INTEGER AS client_count,
    COUNT(DISTINCT pg.id)::INTEGER AS gallery_count
  FROM photographers p
  LEFT JOIN commissions c ON p.id = c.photographer_id AND c.status = 'paid'
  LEFT JOIN clients cl ON p.id = cl.photographer_id
  LEFT JOIN photo_galleries pg ON p.id = pg.photographer_id
  WHERE p.id = photographer_id
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get client churn statistics
CREATE OR REPLACE FUNCTION get_client_churn_stats(client_id UUID)
RETURNS TABLE (
  photographer_id UUID,
  gallery_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.photographer_id,
    COUNT(DISTINCT pg.id)::INTEGER AS gallery_count
  FROM clients cl
  LEFT JOIN photo_galleries pg ON cl.id = pg.client_id
  WHERE cl.id = client_id
  GROUP BY cl.id, cl.photographer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_photographer_churn_stats IS 'Calculate photographer lifetime value and engagement for churn tracking. Optimized with indexes on commissions, clients, and photo_galleries.';
COMMENT ON FUNCTION get_client_churn_stats IS 'Calculate client engagement for churn tracking. Optimized with index on photo_galleries.';
```

**Files Created:**
- `database/analytics-churn-functions.sql`

**Files Modified:**
- `src/app/api/webhooks/stripe/route.ts` (handleSubscriptionDeleted function)

---

## Files Summary

### Files to Create (8)

| File | Purpose |
|------|---------|
| `src/hooks/usePaymentAbandonmentTracking.ts` | Track when users abandon Stripe Checkout |
| `src/components/ErrorBoundary.tsx` | Base error boundary with analytics + multi-level support |
| `src/components/RouteErrorBoundary.tsx` | ✅ NEW - Route-level boundary (preserves navigation) |
| `src/app/api/analytics/error/route.ts` | Server-side error logging endpoint with rate limiting |
| `database/error-logs-table.sql` | Fallback table for critical errors + retention policy |
| `database/analytics-churn-functions.sql` | DB functions for churn stats + performance indexes |

### Files to Modify (5)

| File | Changes |
|------|---------|
| `src/app/photographer/upload/page.tsx` | Add upload abandonment tracking with completion ref (Concern #3 fix) |
| `src/app/photographers/onboarding/page.tsx` | Add onboarding abandonment with correct deps array (Concern #7 fix) |
| `src/app/layout.tsx` | Add multi-level ErrorBoundaries (Concern #2 fix) |
| `src/app/api/webhooks/stripe/route.ts` | Add async churn tracking with timeout protection (Concern #1 fix) |
| Gallery/checkout pages (TBD) | Add usePaymentAbandonmentTracking hook |

---

## Testing Steps

### Test 1: Upload Abandonment
1. Start upload process
2. Leave page mid-upload (close tab or navigate away)
3. Check PostHog Live Events for `upload_abandoned`
4. Verify properties: photos_uploaded, photos_remaining, time_spent_seconds
5. ✅ **NEW** - Verify no false positive if user completes upload then navigates away

### Test 2: Payment Abandonment
1. Click "Subscribe" button
2. In Stripe Checkout, click "Back to PhotoVault"
3. Check PostHog for `payment_abandoned`
4. Verify step_abandoned_at: 'payment_form'

### Test 3: Onboarding Abandonment
1. Start onboarding flow
2. Complete 1-2 steps
3. Navigate away without completing
4. Check PostHog for `onboarding_abandoned`
5. Verify step_abandoned_at matches the step you left on
6. ✅ **NEW** - Verify no false positive on step changes (should only fire on actual unmount)

### Test 4: Error Encountered (Client)
1. Trigger a React error (add `throw new Error('Test')` in a component)
2. Check PostHog for `error_encountered`
3. Check `error_logs` table in Supabase
4. Verify both contain error details
5. ✅ **NEW** - Verify navigation still works (route-level boundary fallback)

### Test 5: Error Encountered (Server)
1. Trigger an API error (e.g., invalid Supabase query)
2. Check PostHog for `error_encountered` from server
3. Check `error_logs` table
4. Verify stack trace is captured

### Test 6: Photographer Churned
1. Create test photographer subscription in Stripe
2. Cancel subscription via Stripe dashboard or API
3. Wait for webhook to fire
4. Check PostHog for `photographer_churned`
5. Verify properties: tenure_days, total_revenue_cents, client_count, gallery_count
6. Check churn_reason if provided
7. ✅ **NEW** - Verify webhook responds within 5 seconds (timeout protection working)

### Test 7: Client Churned
1. Create test client subscription
2. Cancel subscription
3. Check PostHog for `client_churned`
4. Verify properties: tenure_days, photographer_id, gallery_count

### Test 8: Error Endpoint Rate Limiting (NEW - Concern #6)
1. Send 15 POST requests to `/api/analytics/error` rapidly
2. Verify first 10 succeed (200 OK)
3. Verify next 5 fail with 429 (rate limit exceeded)
4. Wait 1 minute, verify rate limit resets

---

## Cross-Skill Dependencies

### Supabase Skill
- Creating `error_logs` table with RLS policies
- Creating database functions for churn stats
- Adding performance indexes (NEW)
- Service role client needed for stat queries

### Stripe Skill
- Webhook handler modification (idempotency already implemented)
- Cancellation reason extraction from `subscription.cancellation_details`
- Understanding subscription lifecycle events

### Next.js Skill
- Error handling in API routes
- Client-side cleanup effects (useEffect unmount)
- Server component vs. client component patterns for error tracking

---

## Gotchas and Warnings

### 1. Abandonment Tracking Accuracy
**Issue:** React unmount effects may not fire if user hard-closes browser tab.

**Mitigation:**
- Track "start" events separately (already done in 6.2)
- Use server-side completion events to backfill abandonment
- Accept 10-20% data loss on hard closes

### 2. Payment Abandonment on Stripe Hosted Checkout
**Issue:** User redirects to Stripe, we lose control. Can't track time spent on Stripe's page.

**Mitigation:**
- Track when user clicks "Subscribe" (start)
- Track when user returns with `?canceled=true` (abandoned)
- Track when payment completes (success)
- Time spent will be 0 for Stripe-hosted pages

### 3. Churn Event Timing
**Issue:** `customer.subscription.deleted` fires when subscription actually ends, not when user cancels.

**Clarification:**
- User clicks "Cancel" → `cancel_at_period_end = true` → subscription continues until period end
- Period ends → `customer.subscription.deleted` fires → churn tracked
- This is CORRECT - user is not churned until they lose access

### 4. Error Logs Table Cleanup (ADDRESSED - Concern #5)
**Issue:** error_logs table can grow unbounded.

**Mitigation (NOW DOCUMENTED):**
- SQL migration includes retention policy documentation
- Optional pg_cron job for automated cleanup
- Manual cleanup script provided for reference

### 5. ErrorBoundary Placement (ADDRESSED - Concern #2)
**Issue:** Single root-level boundary kills entire app on error.

**Mitigation (NOW FIXED):**
- Multi-level error boundaries (root + route)
- Route-level errors preserve navigation
- Users always have a way out

### 6. Database Function Performance (ADDRESSED - Concern #1)
**Issue:** Churn stat queries could slow webhook responses.

**Mitigation (NOW IMPLEMENTED):**
- Added database indexes on photographer_id and status columns
- Async churn tracking (doesn't block webhook response)
- Timeout protection (2 second max per query)
- Fallback to default values if timeout

### 7. Rate Limiting Implementation Note
**Issue:** In-memory rate limiting resets on serverless cold starts.

**Production Recommendation:**
Replace in-memory Map with Redis-based rate limiting:

```typescript
// Recommended for production:
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
})

const { success } = await ratelimit.limit(ip)
```

Current in-memory implementation is acceptable for beta/MVP.

---

## QA Critic Pre-Emptive Responses

### Response to Concern #1: Database Function Performance
**Answer:** ADDRESSED.
- Added indexes on photographer_id, status, client_id
- Churn tracking is now async (doesn't block webhook)
- Added 2-second timeout protection per query
- Fallback to default values if query fails/times out

### Response to Concern #2: ErrorBoundary Too Aggressive
**Answer:** FIXED.
- Implemented multi-level error boundaries (root + route)
- Route-level errors show fallback UI BUT preserve navigation
- Users can always navigate away from errors

### Response to Concern #3: Upload Abandonment Race Condition
**Answer:** FIXED.
- Added `uploadCompletedRef` to track successful completion
- Cleanup effect checks ref instead of uploadProgress state
- No false positives after successful uploads

### Response to Concern #7: Onboarding Abandonment False Positives
**Answer:** FIXED (CRITICAL).
- Changed dependency array from `[currentStep]` to `[]`
- Added `onboardingCompletedRef` to track completion
- Cleanup effect only fires on ACTUAL unmount, not step changes

### Response to Concern #5: Error Logs Retention Policy
**Answer:** DOCUMENTED.
- SQL migration includes retention policy documentation
- Provided pg_cron script for automated cleanup (optional)
- Provided manual cleanup script for reference

### Response to Concern #6: Error Endpoint Rate Limiting
**Answer:** IMPLEMENTED.
- Added in-memory rate limiting (10 errors per minute per IP)
- Added payload validation and truncation (prevent huge stack traces)
- Production recommendation: upgrade to Redis-based rate limiting

---

## Implementation Order

1. **Phase 3.1 FIRST:** Churn tracking (business critical + needs database indexes)
2. **Phase 2.1:** Error tracking infrastructure (ErrorBoundary + fallback table + rate limiting)
3. **Phase 1.1:** Upload abandonment (quick win, high value)
4. **Phase 1.3:** Onboarding abandonment (critical fix for false positives)
5. **Phase 1.2:** Payment abandonment (limited scope due to Stripe Checkout)
6. **Phase 2.2:** Support request tracking (skip until support form exists)

---

## Success Criteria

- [ ] Upload abandonment tracked with photos_uploaded/remaining (no false positives)
- [ ] Onboarding abandonment tracked with step name (no false positives on step changes)
- [ ] Payment abandonment tracked when user returns from Stripe
- [ ] Errors captured by ErrorBoundary (multi-level) and logged to PostHog + Supabase
- [ ] Navigation preserved when route-level errors occur
- [ ] API route errors logged to PostHog + Supabase
- [ ] Error endpoint rate limited (10/min per IP)
- [ ] Photographer churn tracked with LTV metrics (async, timeout-protected)
- [ ] Client churn tracked with photographer context
- [ ] Database indexes added for churn stat queries
- [ ] Error logs table includes retention policy documentation
- [ ] All events appear in PostHog Live Events
- [ ] error_logs table populated for critical errors
- [ ] Tests pass for all 8 scenarios (including rate limiting test)

---

**End of Revised Plan**
