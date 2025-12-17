# Story 6.3: Friction & Warning Events - QA Critique

**Date:** December 16, 2025
**Plan Author:** PostHog Expert
**Reviewer:** QA Critic
**Verdict:** APPROVE WITH CONCERNS

---

## Executive Summary

The implementation plan for Story 6.3 is **technically sound and follows PostHog best practices**, particularly around server-side tracking for critical events and fallback error logging. However, there are **7 significant concerns** that should be addressed during implementation, plus one critical architectural question about database function performance.

**Overall Assessment:** This plan is thorough, well-researched, and aligns with the PostHog skill patterns. The expert correctly identified the limitations of Stripe Checkout for payment abandonment tracking and provided appropriate mitigations. The error fallback system (PostHog + Supabase) follows the skill's guidance exactly.

**Recommendation:** Proceed with implementation, but address the concerns below (especially #1, #2, and #5).

---

## Strengths

### 1. Server-Side Tracking for Critical Events ✅

**Skill Requirement:** "Critical funnel events MUST use server-side tracking" (lines 13-27)

**Plan Implementation:**
- Churn events tracked in Stripe webhook handler (server-side)
- Error events tracked via `/api/analytics/error` endpoint (server-side)
- Includes `$source: 'server'` property (line 303 in skill)

**Verdict:** EXCELLENT. The plan correctly uses server-side tracking for the most critical events (churn, errors from server).

---

### 2. TypeScript Event Schemas Enforced ✅

**Skill Requirement:** "Every event name and its properties are defined here" (line 38)

**Plan Finding:** "All event types and constants are **already defined** in `analytics.ts`" (line 22)

**Verdict:** EXCELLENT. The plan correctly identified that all event schemas already exist and doesn't create duplicates.

---

### 3. Supabase Fallback for Errors ✅

**Skill Requirement:** "Critical errors also go to database" (lines 150-159)

**Plan Implementation:**
- ErrorBoundary logs to both PostHog AND Supabase (lines 296-317)
- API error endpoint writes to `error_logs` table (lines 399-409)
- RLS policies implemented (lines 448-467)

**Verdict:** EXCELLENT. Follows the skill pattern exactly.

---

### 4. Non-Blocking Client-Side Tracking ✅

**Skill Requirement:** "Fire and forget for client-side" (lines 169-174)

**Plan Implementation:**
- Abandonment events use cleanup effects (non-blocking)
- ErrorBoundary tracks errors without blocking render
- All client-side `trackEvent` calls are synchronous (no await)

**Verdict:** GOOD. No user actions are blocked by analytics.

---

### 5. PostHog Flushing in Serverless ✅

**Skill Requirement:** "Flush before process ends (especially in serverless)" (lines 126-135)

**Plan Implementation:**
- Webhook handler calls `trackServerEvent` which internally flushes (skill line 311)
- Error API endpoint uses server-side tracking (which flushes)

**Verdict:** GOOD. Assumes `trackServerEvent` from Story 6.1 handles flushing correctly.

---

## CONCERNS (7)

### Concern #1: Database Functions May Be Slow (CRITICAL)

**Issue:** The plan creates two database functions that perform multi-table joins:

```sql
-- get_photographer_churn_stats (lines 664-683)
-- Joins: photographers, commissions, clients, photo_galleries
-- With aggregations: SUM(), COUNT()

-- get_client_churn_stats (lines 686-701)
-- Joins: clients, photo_galleries
-- With aggregations: COUNT()
```

**Problem:** These functions are called **synchronously in the Stripe webhook handler** (lines 629, 642). If the joins are slow, the webhook response will be delayed.

**Stripe Webhook Requirement:** Must respond within 5 seconds or Stripe will retry.

**Risk:** At scale (100+ photographers with 1000+ clients each), these queries could take multiple seconds. This would:
1. Delay webhook responses (Stripe retry storm)
2. Block other webhook processing
3. Potentially trigger duplicate event tracking

**Severity:** HIGH (could cause webhook failures at scale)

**Recommended Fix:**
1. **Optimize Queries:**
   - Add indexes: `CREATE INDEX idx_commissions_photographer_status ON commissions(photographer_id, status)`
   - Add indexes: `CREATE INDEX idx_clients_photographer ON clients(photographer_id)`
   - Add indexes: `CREATE INDEX idx_photo_galleries_photographer ON photo_galleries(photographer_id)`

2. **Make Churn Tracking Async:**
   Instead of blocking the webhook response, fire churn tracking in background:
   ```typescript
   // In handleSubscriptionDeleted
   // 1. Update subscription status immediately
   // 2. Return success to Stripe
   // 3. Fire churn tracking in background (non-blocking)

   // Option A: Use a separate queue/job (future enhancement)
   // Option B: Fire-and-forget (accept potential data loss if function fails)
   Promise.resolve().then(async () => {
     const stats = await supabase.rpc('get_photographer_churn_stats', ...)
     await trackServerEvent(...)
   }).catch(err => {
     console.error('[Churn Tracking Failed]', err)
     // Log to error_logs table
   })
   ```

3. **Add Timeouts:**
   Wrap stat queries in timeout (e.g., 2 seconds max):
   ```typescript
   const statsPromise = supabase.rpc('get_photographer_churn_stats', ...)
   const stats = await Promise.race([
     statsPromise,
     new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000))
   ]).catch(() => {
     // Use default values if timeout
     return { total_revenue_cents: 0, client_count: 0, gallery_count: 0 }
   })
   ```

**Recommendation:** Either make churn tracking async OR add timeout protection. At minimum, add the database indexes.

---

### Concern #2: ErrorBoundary in Root Layout May Be Too Aggressive

**Issue:** The plan wraps the entire app in a single ErrorBoundary (line 484):

```typescript
<ErrorBoundary>
  <div className="flex flex-col min-h-screen bg-background">
    <Navigation />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
</ErrorBoundary>
```

**Problem:** If ANY component throws an error, the ENTIRE app is replaced with the error fallback UI. This means:
- Navigation bar disappears
- User can't navigate away from error
- User's only option is "Reload Page"

**Example Scenario:**
- User is on gallery page
- Gallery component throws error
- Entire page replaced with error card
- User can't access navigation to go home
- Poor UX

**Severity:** MEDIUM (impacts user experience)

**Recommended Fix:**
Use **multiple error boundaries** at different levels:

```typescript
// Root layout - catch catastrophic errors only
<ErrorBoundary fallback={<CatastrophicErrorPage />}>
  <PostHogProvider>
    <Navigation />
    <main className="flex-1">
      {/* Per-route error boundary */}
      <RouteErrorBoundary>
        {children}
      </RouteErrorBoundary>
    </main>
    <Footer />
  </PostHogProvider>
</ErrorBoundary>

// Per-route error boundary shows error card BUT keeps navigation
function RouteErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="container py-8">
          <Card>
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/')}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
```

This way:
- Route-level errors preserve navigation
- Root-level errors (e.g., AuthProvider crash) show full-page fallback
- User always has a way out

**Alternative:** Keep single boundary but improve fallback UI:
```typescript
// In ErrorBoundary fallback
<div className="min-h-screen bg-background">
  <Navigation /> {/* Keep navigation visible */}
  <div className="flex items-center justify-center p-4">
    <Card>...</Card>
  </div>
</div>
```

**Recommendation:** Use multi-level error boundaries OR preserve navigation in fallback UI.

---

### Concern #3: Upload Abandonment May Fire on Successful Completion

**Issue:** The upload abandonment cleanup effect (lines 109-120) has a race condition:

```typescript
useEffect(() => {
  return () => {
    if (uploadStartedRef.current && uploadProgress < 100) {
      endFlow('abandoned', { ... })
    }
  }
}, [])
```

**Problem:** React cleanup functions fire when:
1. Component unmounts (user navigates away) ✅ CORRECT
2. Component remounts (React Strict Mode, hot reload) ❌ FALSE POSITIVE
3. User completes upload AND THEN navigates away ❌ FALSE POSITIVE

**Scenario 3 Detail:**
- User uploads 100% of photos
- `uploadProgress === 100`, completion event fires (line 123)
- User clicks "View Gallery"
- Component unmounts
- Cleanup effect checks `uploadProgress < 100` → TRUE (state reset on unmount)
- Abandonment event fires ❌ WRONG

**Severity:** MEDIUM (data quality issue)

**Recommended Fix:**
Use a ref to track completion state:

```typescript
const uploadCompletedRef = useRef(false)

// On successful completion
if (uploadProgress === 100) {
  uploadCompletedRef.current = true
  endFlow('completed', { gallery_id: gallery.id })
}

// Cleanup effect
useEffect(() => {
  return () => {
    if (uploadStartedRef.current && !uploadCompletedRef.current) {
      endFlow('abandoned', { ... })
    }
  }
}, [])
```

**Recommendation:** Add completion tracking via ref to prevent false abandonment events.

---

### Concern #4: Payment Abandonment Misses "Plan Selection" Step

**Issue:** The plan only tracks abandonment when user returns from Stripe Checkout (lines 176-182):

```typescript
if (canceled === 'true' || (sessionId && !searchParams.get('success'))) {
  trackEvent(EVENTS.PAYMENT_ABANDONED, {
    step_abandoned_at: 'payment_form',  // Always 'payment_form'
    ...
  })
}
```

**Problem:** The TypeScript event schema defines THREE abandonment points (line 494):

```typescript
step_abandoned_at: 'plan_selection' | 'payment_form' | 'confirmation'
```

But the plan only tracks `payment_form`. This means:
- User views plans, leaves without selecting → NOT TRACKED
- User selects plan, clicks subscribe, abandons Stripe → TRACKED ✅
- User completes payment, closes confirmation page → NOT TRACKED

**Missing Data:** We don't know if users are abandoning at plan selection.

**Severity:** LOW (data incompleteness, not a bug)

**Recommended Enhancement:**
Add plan selection tracking:

```typescript
// On plan selection page
const handlePlanSelect = (plan: string) => {
  setPlanType(plan)
  sessionStorage.setItem('payment_flow_started', Date.now().toString())
}

// On plan selection page unmount
useEffect(() => {
  return () => {
    const flowStarted = sessionStorage.getItem('payment_flow_started')
    const planSelected = planType !== null

    if (flowStarted && planSelected && !paymentCompleted) {
      trackEvent(EVENTS.PAYMENT_ABANDONED, {
        step_abandoned_at: 'plan_selection',
        plan_type: planType,
        time_spent_seconds: Math.round((Date.now() - parseInt(flowStarted)) / 1000)
      })
    }
  }
}, [])
```

**Recommendation:** Add plan selection abandonment tracking for completeness, or remove `plan_selection` from TypeScript schema if not needed.

---

### Concern #5: Error Logs Table Has No Data Retention Policy

**Issue:** The `error_logs` table (lines 423-469) has no automatic cleanup:

```sql
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Problem:** Errors accumulate forever. At scale:
- 100 photographers × 10 errors/day = 1000 errors/day
- Over 1 year = 365,000 rows
- Over 5 years = 1.8 million rows

**Impact:**
- Table bloat (disk space)
- Query performance degradation
- Increased backup size

**Severity:** MEDIUM (operational debt)

**Recommended Fix:**
Add data retention policy:

**Option 1: Supabase cron job (if available)**
```sql
-- Delete errors older than 90 days
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-error-logs',
  '0 2 * * 0',  -- Every Sunday at 2 AM
  $$DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days'$$
);
```

**Option 2: Manual cleanup script**
```typescript
// scripts/cleanup-error-logs.ts
import { createAdminClient } from '@/lib/supabase/admin'

const supabase = createAdminClient()
const ninetyDaysAgo = new Date()
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

await supabase
  .from('error_logs')
  .delete()
  .lt('created_at', ninetyDaysAgo.toISOString())
```

**Option 3: Partition table by month (advanced)**
```sql
-- Create partitioned table (requires Supabase Pro or self-hosted)
CREATE TABLE error_logs (
  ...
) PARTITION BY RANGE (created_at);

-- Auto-drop old partitions
```

**Recommendation:** At minimum, document the cleanup requirement in `database/error-logs-table.sql`. Ideally, implement Option 1 or 2.

---

### Concern #6: Missing `$source: 'server'` Property in Some Server Events

**Issue:** The PostHog skill requires server events to include `$source: 'server'` (line 305):

```typescript
properties: {
  ...properties,
  $source: 'server',
  timestamp: new Date().toISOString(),
}
```

**Plan Implementation:**
- Error API endpoint uses `trackServerEvent` (line 390) ✅
- Webhook handler uses `trackServerEvent` (lines 632, 644) ✅

**Assumption Check:** Does `trackServerEvent` from Story 6.1 include `$source: 'server'`?

**Verification Needed:** Read `src/lib/analytics/server.ts` to confirm.

**Severity:** LOW (if Story 6.1 implemented correctly, this is already handled)

**Recommended Action:** Before implementation, verify that `trackServerEvent` includes `$source: 'server'` property. If not, add it:

```typescript
// In trackServerEvent
client.capture({
  distinctId: userId,
  event: eventName,
  properties: {
    ...properties,
    $source: 'server',  // Add this
    timestamp: new Date().toISOString(),
  },
})
```

**Recommendation:** Verify during implementation. If missing, add to `trackServerEvent` function.

---

### Concern #7: Onboarding Abandonment Fires on Every Step Change

**Issue:** The onboarding abandonment effect (lines 221-233) runs on EVERY step change:

```typescript
useEffect(() => {
  return () => {
    if (currentStep > 0 && currentStep < steps.length - 1) {
      trackEvent(EVENTS.ONBOARDING_ABANDONED, { ... })
    }
  }
}, [currentStep])  // Re-runs when currentStep changes
```

**Problem:** User moves from Step 1 → Step 2 → Step 3:
1. User on Step 1
2. User clicks "Next" → Step 2
3. Cleanup effect fires (currentStep was 1) → `onboarding_abandoned` tracked ❌
4. New effect registered for Step 2
5. User clicks "Next" → Step 3
6. Cleanup effect fires (currentStep was 2) → `onboarding_abandoned` tracked AGAIN ❌

**Result:** Every step transition fires abandonment event (FALSE POSITIVES).

**Severity:** HIGH (data corruption - abandonment events when user is actively progressing)

**Recommended Fix:**
Only track abandonment on ACTUAL unmount (not step changes):

```typescript
const onboardingStartTimeRef = useRef<number>(Date.now())
const startingStepRef = useRef<number>(currentStep)

useEffect(() => {
  // Only track abandonment when component UNMOUNTS (not when step changes)
  return () => {
    // Check if user is navigating AWAY from onboarding (not just changing steps)
    const isActualUnmount = !window.location.pathname.includes('/onboarding')

    if (isActualUnmount && currentStep > 0 && currentStep < steps.length - 1) {
      const timeSpent = Math.round((Date.now() - onboardingStartTimeRef.current) / 1000)

      trackEvent(EVENTS.ONBOARDING_ABANDONED, {
        step_abandoned_at: steps[currentStep].title,
        time_spent_seconds: timeSpent,
      })
    }
  }
}, [])  // Empty deps - only runs on actual unmount
```

**Alternative Fix:**
Use `beforeunload` event instead of cleanup effect:

```typescript
useEffect(() => {
  const handleBeforeUnload = () => {
    if (currentStep > 0 && currentStep < steps.length - 1) {
      trackEvent(EVENTS.ONBOARDING_ABANDONED, { ... })
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [currentStep])
```

**Recommendation:** Fix the dependency array to prevent false positives. This is CRITICAL for data quality.

---

## Edge Cases

### Edge Case 1: User Refreshes Page Mid-Upload

**Scenario:**
- User uploads 50% of photos
- User refreshes page
- Upload state lost

**Current Behavior:** Abandonment event fires (CORRECT)

**Concern:** Is this the desired behavior? Or should we persist upload state in localStorage?

**Recommendation:** Current behavior is acceptable. Refresh = abandonment is valid.

---

### Edge Case 2: Multiple Tabs Open

**Scenario:**
- User has gallery page open in Tab 1
- User opens payment page in Tab 2
- User closes Tab 2 (payment abandonment fires)
- User completes payment in Tab 1

**Current Behavior:**
- Abandonment event tracked (Tab 2 closed)
- Completion event tracked (Tab 1 completes)

**Concern:** Both events fire for same user/session.

**Impact:** Low - PostHog funnels will show completion, so abandonment is ignored in funnel analysis.

**Recommendation:** Acceptable edge case. Don't add complexity to handle multi-tab scenarios.

---

### Edge Case 3: Error Logs Table Grows Unbounded (Covered in Concern #5)

Already addressed above.

---

## Security Review

### RLS Policy: "Anyone can log errors" (line 463)

```sql
CREATE POLICY "Anyone can log errors"
  ON error_logs
  FOR INSERT
  WITH CHECK (true);
```

**Concern:** Unauthenticated users can insert unlimited errors.

**Attack Vector:**
- Malicious bot sends thousands of POST requests to `/api/analytics/error`
- error_logs table fills with junk data
- DoS attack (disk space, query performance)

**Severity:** MEDIUM (DoS risk)

**Recommended Mitigation:**
1. **Rate Limiting:** Add rate limit to `/api/analytics/error` endpoint:
   ```typescript
   // Use Vercel edge config or Upstash Redis for rate limiting
   import { Ratelimit } from '@upstash/ratelimit'

   const ratelimit = new Ratelimit({
     redis: ...,
     limiter: Ratelimit.slidingWindow(10, '1 m'),  // 10 errors per minute per IP
   })

   const { success } = await ratelimit.limit(request.ip)
   if (!success) {
     return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
   }
   ```

2. **Request Validation:** Validate error data (prevent huge stack traces):
   ```typescript
   const MAX_ERROR_MESSAGE_LENGTH = 1000
   const MAX_STACK_TRACE_LENGTH = 5000

   if (error_message.length > MAX_ERROR_MESSAGE_LENGTH) {
     error_message = error_message.slice(0, MAX_ERROR_MESSAGE_LENGTH) + '... (truncated)'
   }
   ```

3. **IP-Based Throttling:** Track IPs with excessive error submissions, block after threshold.

**Recommendation:** Add rate limiting to `/api/analytics/error` endpoint before production.

---

## Performance Review

### Database Function Query Complexity (Already covered in Concern #1)

See Concern #1 for detailed analysis and recommendations.

---

## Testing Gaps

The plan includes 7 test scenarios (lines 741-787). Missing tests:

### Test 8: ErrorBoundary Doesn't Catch Async Errors

**Why Important:** The plan's "Expected Concern 5" acknowledges this (lines 904-922), but no test validates the mitigation.

**Test Case:**
```typescript
// Add to test suite
it('should track async errors manually', async () => {
  const handleAsyncError = async () => {
    try {
      await fetch('/api/broken')
    } catch (error) {
      trackEvent(EVENTS.ERROR_ENCOUNTERED, { ... })
    }
  }

  await handleAsyncError()

  // Verify error was tracked to PostHog
  expect(posthogMock.capture).toHaveBeenCalledWith(EVENTS.ERROR_ENCOUNTERED, ...)
})
```

**Recommendation:** Add test for async error handling pattern.

---

### Test 9: Churn Event Deduplication

**Why Important:** Ensure webhook idempotency prevents duplicate churn events.

**Test Case:**
```typescript
it('should not track churn twice on webhook retry', async () => {
  const subscriptionDeleted = createStripeEvent('customer.subscription.deleted', ...)

  // First webhook call
  await POST({ body: subscriptionDeleted })

  // Retry (same event ID)
  await POST({ body: subscriptionDeleted })

  // Verify churn event only tracked once
  expect(trackServerEventMock).toHaveBeenCalledTimes(1)
})
```

**Recommendation:** Add idempotency test for churn tracking.

---

### Test 10: Error Logs Table Rate Limiting

**Why Important:** Validate DoS protection.

**Test Case:**
```typescript
it('should rate limit error submissions', async () => {
  const requests = Array(20).fill(null).map(() =>
    fetch('/api/analytics/error', { method: 'POST', body: ... })
  )

  const responses = await Promise.all(requests)
  const rateLimited = responses.filter(r => r.status === 429)

  expect(rateLimited.length).toBeGreaterThan(0)
})
```

**Recommendation:** Add rate limiting test if mitigation is implemented.

---

## Technical Debt Assessment

### New Debt Introduced:

1. **error_logs table cleanup** - Manual or automated cleanup needed (Concern #5)
2. **Multi-level error boundaries** - Root-level boundary is too aggressive (Concern #2)
3. **Payment abandonment** - Limited visibility into Stripe Checkout (acknowledged in plan)
4. **Database function performance** - May need optimization at scale (Concern #1)

### Debt Paid Off:

1. **Error tracking fallback** - PostHog skill requirement now satisfied
2. **Churn event tracking** - Critical retention metric now available
3. **Friction visibility** - Can now measure abandonment funnel

**Net Debt Score:** +1 (slight increase, but manageable)

---

## Alignment with User Philosophy

### "He HATES band-aid fixes" - Is this a band-aid?

**NO.** This is a proper implementation because:

1. **Server-side tracking for critical events** - Not a quick fix, it's the RIGHT way
2. **Supabase fallback for errors** - Redundancy is good engineering, not a hack
3. **TypeScript event schemas** - Type safety prevents future bugs
4. **Database functions for churn stats** - Encapsulates business logic properly

**However:** Concern #1 (database function performance) could become a band-aid if not addressed. The plan should add indexes PROACTIVELY, not reactively after performance degrades.

**Verdict:** This plan aligns with Nate's philosophy of "done right the first time."

---

## Final Recommendations

### Must Address Before Implementation:

1. **Fix Concern #7** (onboarding abandonment false positives) - Data corruption risk
2. **Fix Concern #3** (upload abandonment race condition) - Data quality issue
3. **Add database indexes for Concern #1** (churn query performance) - Scalability

### Should Address During Implementation:

4. **Implement Concern #2** (multi-level error boundaries) - Better UX
5. **Add Concern #5** (error logs cleanup policy) - Operational hygiene

### Optional Enhancements:

6. **Concern #4** (plan selection abandonment) - Data completeness
7. **Security mitigation** (rate limiting on error endpoint) - DoS protection

---

## Verdict: APPROVE WITH CONCERNS

**This plan is approved for implementation** with the following conditions:

1. **Before starting:** Fix Concern #7 (onboarding abandonment)
2. **During implementation:** Add database indexes (Concern #1)
3. **Before claiming complete:** Verify all 7 test scenarios pass + Test 9 (idempotency)

**Top 3 Concerns to Address:**

| Priority | Concern | Impact | Fix Complexity |
|----------|---------|--------|----------------|
| 🔴 HIGH | #7 - Onboarding abandonment false positives | Data corruption | LOW (change deps array) |
| 🟡 MEDIUM | #1 - Database function performance | Webhook failures at scale | MEDIUM (add indexes + timeout) |
| 🟡 MEDIUM | #2 - ErrorBoundary too aggressive | Poor UX on errors | MEDIUM (multi-level boundaries) |

**Estimated Implementation Time:**
- Original plan: 6-8 hours
- With concern fixes: 8-10 hours
- With all optional enhancements: 12-14 hours

**Quality Score:** 8/10 (would be 9/10 if Concern #7 fixed proactively)

---

**End of Critique**
