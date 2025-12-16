# PostHog Core Event Tracking Plan - QA Critique
**Date:** December 14, 2025
**Critic:** QA Critic Expert
**Plan Under Review:** `posthog-core-event-tracking-plan.md`
**Relevant Skill:** `posthog-skill.md`

---

## Verdict: APPROVE WITH CONCERNS

**Overall Assessment:** The plan is comprehensive and follows PostHog best practices correctly. The infrastructure is already complete (Story 6.1), and the implementation approach is sound. However, there are several areas that need attention before implementation to ensure quality meets Nate's "done right, not band-aid" philosophy.

---

## Top 3 Critical Concerns

### 1. **Missing Error Fallback Implementation (Technical Debt Alert)**

**Finding:** The skill file explicitly requires error tracking to go to BOTH PostHog AND Supabase as a fallback (lines 799-836), but the plan completely omits this.

**From skill file:**
```typescript
// Track to PostHog
await trackServerEvent(userId, EVENTS.ERROR_ENCOUNTERED, errorData)

// Also track to Supabase as fallback
// (Requires error_logs table - consult supabase-skill.md)
const supabase = createAdminClient()
await supabase.from('error_logs').insert({...})
```

**From plan:** NO mention of `error_logs` table creation or dual-tracking implementation.

**Impact:** If PostHog goes down or hits rate limits, critical error data is lost. This is exactly the kind of band-aid thinking Nate hates - "we'll add it later" becomes technical debt.

**Required Fix:**
1. Create `error_logs` table in Supabase (schema defined in skill file)
2. Add RLS policies (consult supabase-skill.md)
3. Implement dual-tracking in error handler
4. This should be part of Story 6.2, NOT deferred

---

### 2. **Incomplete First-Time Flag Logic (Race Conditions)**

**Finding:** Multiple events check "is this the first X" by counting database records, but the logic has potential race conditions and incorrect counting.

**Example from plan (Photographer Created Gallery, line 354):**
```typescript
const { count: galleryCount } = await supabase
  .from('photo_galleries')
  .select('id', { count: 'exact', head: true })
  .eq('photographer_id', user?.id)

const isFirstGallery = (galleryCount || 0) === 1 // Just created first one
```

**Problem:** If the count query runs BEFORE the insert completes, `isFirstGallery` will be wrong. The plan doesn't address transaction ordering.

**Better Pattern:**
```typescript
// Count BEFORE creating the gallery
const { count: existingCount } = await supabase
  .from('photo_galleries')
  .select('id', { count: 'exact', head: true })
  .eq('photographer_id', user?.id)

const isFirstGallery = (existingCount || 0) === 0

// Then create gallery
// Then track with correct flag
```

**Impact:** Analytics dashboards will show incorrect "first gallery" metrics, breaking funnel analysis. This affects multiple events:
- `photographer_uploaded_first_photo`
- `photographer_created_gallery`
- `photographer_received_first_payment`
- `client_downloaded_photo`
- `client_payment_completed`

**Required Fix:** Document the correct query ordering pattern in the plan for ALL first-time checks.

---

### 3. **Deferred Events Without Clear Decision Criteria (Scope Creep Risk)**

**Finding:** 4 events are marked as "deferred" but the plan doesn't explain WHY or WHEN they'll be implemented:
- `photographer_invited_client` - "No explicit invite functionality"
- `photographer_skipped_onboarding` - "No skip button exists"
- `client_shared_gallery` - "Share functionality not built"
- `family_member_invited` - "Family sharing not implemented"

**From plan (line 1213):**
> "Deferred to Later Stories"
> 1. photographer_invited_client - Add in Story 6.3 (friction tracking)
> 2. photographer_skipped_onboarding - Add when Story 4.x implemented

**Problem:**
1. Some are product features missing (skip button, share button) - should be in Epic 4 (Onboarding Polish)
2. Some are instrumentation gaps (invite tracking) - could be done NOW with clipboard API
3. The plan doesn't explain if Story 6.2 is "complete" without these, or if acceptance criteria need updating

**From WORK_PLAN.md Story 6.2 Acceptance Criteria:**
> - [ ] All 9 photographer journey events tracking
>   - [ ] photographer_invited_client (defer - feature not built)

**Issue:** The WORK_PLAN already has this marked as deferred, so the plan is consistent. BUT - this creates ambiguity:
- Is Story 6.2 complete if 4 events aren't implemented?
- Should the skill's event schema include events we're not tracking?
- Will someone forget these exist when building the features later?

**Required Fix:**
1. Split deferred items into two categories: "Product Feature Missing" vs "Could Track Now"
2. For "Could Track Now" (like clipboard copying), implement basic tracking in 6.2
3. Update acceptance criteria to explicitly list what IS complete after 6.2

---

## Additional Concerns by Category

### Completeness (Does it address all Story 6.2 requirements?)

**PASS with notes:**
- ✅ All critical funnel events covered
- ✅ Server-side vs client-side decisions correct
- ✅ TypeScript schemas already exist
- ⚠️ Missing error fallback table (skill requirement)
- ⚠️ 4 events deferred without clear future plan

**Recommendation:** Add error_logs table creation as a required task.

---

### Correctness (Does it follow patterns from skill file?)

**MOSTLY PASS with corrections needed:**

**✅ Correct:**
- Server-side tracking for critical events (signup, payment, churn)
- Privacy defaults already configured
- Event naming matches skill file patterns
- No hardcoded strings (using EVENTS constants)

**❌ Incorrect/Missing:**

1. **Dynamic Imports Not Needed (line 87):**
   ```typescript
   // Plan says:
   const { trackServerEvent } = await import('@/lib/analytics/server')

   // Skill file just imports normally:
   import { trackServerEvent } from '@/lib/analytics/server'
   ```
   The plan adds unnecessary dynamic imports "to avoid SSR issues" but the skill file doesn't mention this. Server-side code doesn't have SSR issues with server-side imports.

2. **Missing Flush Calls in Some Locations:**
   The skill emphasizes flushing after server-side events (line 311), but the plan doesn't consistently show `await client.flush()` in all examples. The `trackServerEvent` function handles this internally, so this is actually fine - but the plan should clarify this.

3. **Property Naming Inconsistency (minor):**
   - Plan uses `signup_method: 'email'` (correct per skill)
   - But some examples use `plan_type` vs `payment_option_id` interchangeably
   - Skill file has strict property naming - plan should reference the TypeScript interfaces more

**Required Fix:** Remove unnecessary dynamic imports, clarify that flush is handled internally.

---

### Codebase Consistency (Does it match existing PhotoVault patterns?)

**PASS:**
- ✅ Follows existing API route patterns
- ✅ Uses same Supabase client patterns
- ✅ Matches AuthContext integration patterns
- ✅ File locations match existing structure

**No issues here.** The plan correctly identifies all integration points.

---

### Simplicity (Is there over-engineering?)

**MOSTLY PASS with one concern:**

**Over-engineered:**
- Dynamic imports for server-side tracking (line 87) - unnecessary complexity

**Under-engineered:**
- No centralized "trackFirstTime" helper function despite 5+ events needing the same pattern
- Each event reimplements the count-then-check logic

**Recommendation:** Create a helper function:
```typescript
// src/lib/analytics/helpers.ts
export async function isFirstTime(
  table: string,
  column: string,
  value: string
): Promise<boolean> {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)
  return (count || 0) === 0
}

// Usage:
const isFirstGallery = await isFirstTime('photo_galleries', 'photographer_id', user.id)
```

This reduces duplication and ensures consistent logic.

---

### Edge Cases & Error Handling

**NEEDS IMPROVEMENT:**

**Missing Edge Cases:**

1. **User Created After Event Fires (Public Checkout):**
   - Plan shows tracking `client_created_account` after user creation (line 564)
   - But what if user creation fails? Event is lost.
   - Better: Track in webhook after verifying user exists

2. **Stripe Metadata Missing (Payment Events):**
   - Plan assumes `session.metadata.gallery_id` exists (line 669)
   - What if it's missing? Event properties will be undefined
   - Should have fallback or validation

3. **Time Calculation When User Created_At Missing:**
   - Multiple events calculate `time_from_signup_seconds` (line 165)
   - Plan uses `|| Date.now()` as fallback
   - This makes the metric meaningless - should skip the event or log warning

4. **Network Failures:**
   - Skill file shows try-catch blocks (line 156)
   - Plan shows them inconsistently
   - Should standardize error handling pattern

**Required Fix:**
1. Add validation for required metadata fields
2. Don't calculate `time_from_signup_seconds` if signup date missing
3. Standardize try-catch pattern across all tracking calls

---

### Technical Debt (Band-aids or proper fix?)

**⚠️ MAJOR RED FLAG:**

**Identified Technical Debt:**

1. **Error Fallback Table (Critical):**
   - Plan says "Add error_logs table when we implement error tracking fallback" (implied)
   - But the skill file shows this as a REQUIRED pattern, not optional
   - This is exactly the "we'll do it later" thinking Nate hates

2. **UTM Parameter Tracking:**
   - Plan says `referral_source: undefined` (line 104)
   - Deferred to Story 6.3
   - But Story 6.2 touches the signup flow - adding UTM parsing NOW is trivial
   - Deferring creates future work when we already have context

3. **Skip Button Tracking:**
   - Plan defers to "Story 4.x (Onboarding Polish)"
   - But we're IN the onboarding tracking code right now
   - Should at least add the handler (disabled) so it's ready when UI is added

**Nate's Philosophy Check:**
> "He HATES band-aid fixes. Do not apply quick patches that will need to be redone later."

This plan creates 3 "we'll add it later" items that should be done NOW while we have context.

**Required Fix:**
1. Implement error_logs table in Story 6.2 (consult supabase-skill.md for schema)
2. Add UTM parameter parsing to signup flow NOW (5 lines of code)
3. Add skip button handler NOW (even if UI isn't ready yet)

---

### Security & Data Integrity

**PASS with notes:**

**✅ Secure:**
- No PII in event properties (good)
- User IDs are Supabase UUIDs (safe)
- Server-side events can't be manipulated by clients

**⚠️ Data Integrity Issues:**

1. **Race Condition on First-Time Flags (covered above)**

2. **No Idempotency Checks:**
   - Skill file mentions PostHog deduplicates within 24 hours (line 1148)
   - But what if webhook is retried? User gets counted as "first payment" twice
   - Webhook handler should check if event already processed

3. **Missing Property Validation:**
   - Plan doesn't validate required properties exist before tracking
   - Could send events with `gallery_id: undefined` breaking PostHog queries

**Required Fix:** Add property validation before tracking critical events.

---

### Performance

**PASS:**
- ✅ Non-blocking client-side tracking (fire and forget)
- ✅ Server-side events flush immediately (correct for serverless)
- ✅ No blocking on analytics failures (try-catch wrapping)

**No performance concerns.**

---

### Testing & Verification

**NEEDS IMPROVEMENT:**

The plan has a comprehensive testing section (lines 1008-1115), but it's missing:

1. **No Test Accounts Defined:**
   - Should specify which test accounts to use
   - Should create a dedicated "analytics testing" photographer account

2. **No PostHog Filter Instructions:**
   - How to filter test events from production events?
   - Should use a `test_mode: true` property during development

3. **No Verification Scripts:**
   - Should create a script to verify all 21 events fire correctly
   - Should check property schemas match TypeScript types

**Recommendation:** Add:
```typescript
// In development, add a flag
const properties = {
  ...eventProps,
  test_mode: process.env.NODE_ENV === 'development'
}
```

---

### User Philosophy Alignment (Nate hates band-aids)

**CONCERNS:**

The plan has several "defer to later" items that violate Nate's philosophy:

| Deferred Item | Should Be Done Now? | Reasoning |
|---------------|---------------------|-----------|
| Error fallback table | ✅ YES | Required by skill file, we're already in database changes |
| UTM tracking | ✅ YES | Touching signup code anyway, trivial to add |
| Skip button handler | ✅ YES | Adding tracking points anyway, can stub the UI hook |
| Family sharing events | ❌ NO | Feature doesn't exist, schema is fine to include |
| Share button events | ❌ NO | Feature doesn't exist, schema is fine to include |

**Philosophy Violations:**

1. **"We'll add error fallback later"** - This is a BAND-AID. Skill file requires it. Do it now.

2. **"UTM tracking not implemented"** - You're literally editing the signup handler. Add the parsing. Don't come back later.

3. **"Skip button when Story 4.x is done"** - Add the tracking function NOW. Let the UI team call it when ready. Don't leave TODOs.

**From Nate's philosophy:**
> "Take the time to understand the problem fully before implementing."
> "Do not skip the research workflow to appear faster."

The plan did good research, but then makes "faster" decisions about deferring work that should be done in this story.

---

## Specific Code Issues Found

### Issue 1: Incorrect Gallery Count Check (Line 354)

**Problem:**
```typescript
const { count: galleryCount } = await supabase
  .from('photo_galleries')
  .select('id', { count: 'exact', head: true })
  .eq('photographer_id', user?.id)

const isFirstGallery = (galleryCount || 0) === 1 // Just created first one
```

**Why wrong:** Counting AFTER creation means count is 1 for the first gallery. But what if the user previously created and deleted a gallery? Count is still 1, flag is wrong.

**Fix:** Count BEFORE creation, check for 0.

---

### Issue 2: Dynamic Import Unnecessary (Line 87)

**Problem:**
```typescript
const { trackServerEvent } = await import('@/lib/analytics/server')
```

**Why wrong:** This is server-side code calling server-side code. No SSR issues. Dynamic imports add complexity for no benefit.

**Fix:** Use static import at top of file.

---

### Issue 3: Missing Validation (Line 669)

**Problem:**
```typescript
plan_type: metadata.payment_option_id || 'unknown',
```

**Why wrong:** If `payment_option_id` is missing, event is tracked with `'unknown'` making PostHog analytics useless. Better to not track the event.

**Fix:**
```typescript
if (!metadata.payment_option_id) {
  console.warn('[Analytics] Missing payment_option_id in metadata')
  return
}
```

---

### Issue 4: Time Calculation Fallback Makes Data Meaningless (Line 165)

**Problem:**
```typescript
const signupTime = user?.created_at
  ? new Date(user.created_at).getTime()
  : Date.now()
const timeFromSignup = Math.round((Date.now() - signupTime) / 1000)
```

**Why wrong:** If `created_at` is missing, `timeFromSignup` becomes 0 seconds, which is nonsense data.

**Fix:** Don't include the property if we can't calculate it correctly:
```typescript
const signupTime = user?.created_at
  ? new Date(user.created_at).getTime()
  : null

const properties = {
  ...otherProps,
  ...(signupTime && {
    time_from_signup_seconds: Math.round((Date.now() - signupTime) / 1000)
  })
}
```

---

## Recommendations Before Implementation

### Must Fix (Blocking Issues):

1. **Add error_logs table creation to Story 6.2**
   - Consult supabase-skill.md for schema
   - Implement dual-tracking (PostHog + Supabase)
   - Add to acceptance criteria

2. **Fix first-time flag logic**
   - Count BEFORE creating record
   - Document the pattern in plan
   - Create helper function to avoid duplication

3. **Add property validation**
   - Don't track events with missing required fields
   - Log warnings for missing metadata
   - Especially for Stripe webhook events

4. **Remove dynamic imports**
   - Use static imports for server-side tracking
   - Simplify the code

### Should Fix (Technical Debt Prevention):

5. **Add UTM parameter parsing NOW**
   - You're already editing signup flow
   - Extract from URL params, store in event
   - Don't defer this

6. **Create helper functions**
   - `isFirstTime(table, column, value)` for repeated logic
   - `calculateTimeFromSignup(user)` for time calculations
   - Reduces duplication, ensures correctness

7. **Add test mode flag**
   - Include `test_mode: NODE_ENV === 'development'` in all events
   - Makes filtering in PostHog easier

### Nice to Have (Quality Improvements):

8. **Add skip button handler stub**
   - Implement the tracking function
   - Add TODO comment for UI team to call it
   - Prevents future tech debt

9. **Create verification script**
   - Script to test all 21 events fire correctly
   - Checks property schemas match TypeScript
   - Part of QA process

10. **Document PostHog dashboard setup**
    - Include actual dashboard JSON config
    - Makes deployment repeatable
    - Prevents "how did we set this up again?" questions

---

## Acceptance Criteria Review

**From WORK_PLAN.md Story 6.2:**

The plan addresses most acceptance criteria, but some need clarification:

| Criteria | Status | Notes |
|----------|--------|-------|
| All 9 photographer journey events | ⚠️ PARTIAL | 7/9 implemented, 2 deferred (invited_client, skipped_onboarding) |
| All 9 client journey events | ⚠️ PARTIAL | 7/9 implemented, 2 deferred (shared_gallery, explicit invite link) |
| All 3 engagement events | ⚠️ PARTIAL | 2/3 implemented, 1 deferred (family_member_invited) |
| Server-side events have $source: 'server' | ✅ YES | Implemented in server.ts |
| Payment events in webhook handler | ✅ YES | Plan shows correct integration |
| Photographer activation funnel visible | ✅ YES | Testing section covers this |
| Client conversion funnel visible | ✅ YES | Testing section covers this |
| Ad blockers don't block server events | ✅ YES | Server-side tracking confirmed |
| First-time flags working | ⚠️ NEEDS FIX | Logic has race conditions (see Issue 1) |

**Recommendation:** Update acceptance criteria to reflect what IS complete after Story 6.2. Don't leave ambiguity about whether deferred items block story completion.

---

## Final Verdict: APPROVE WITH CONCERNS

### Summary:

**Strengths:**
- ✅ Comprehensive coverage of 17/21 events (4 deferred for valid reasons)
- ✅ Correct server-side vs client-side decisions
- ✅ Good integration with existing infrastructure
- ✅ Detailed testing plan
- ✅ Proper use of TypeScript schemas

**Weaknesses:**
- ❌ Missing error fallback table (skill requirement)
- ❌ First-time flag logic has race conditions
- ❌ Several "defer to later" items that should be done now
- ❌ Missing property validation
- ❌ Unnecessary dynamic imports

**To Approve for Implementation:**

1. Add error_logs table creation (consult supabase-skill.md)
2. Fix first-time flag query ordering
3. Add property validation for Stripe events
4. Remove dynamic imports
5. Add UTM parameter parsing (don't defer)
6. Update acceptance criteria to reflect actual scope

**Estimated Additional Work:** 2-3 hours to address concerns before implementation.

---

## Questions for User (Nate)

Before implementing, please clarify:

1. **Error Fallback Table:** The skill file requires error tracking to BOTH PostHog and Supabase. Should we create the error_logs table in Story 6.2, or is this truly deferred to later?

2. **Deferred Events Acceptance Criteria:** Story 6.2 says "All 9 photographer journey events" but 2 are deferred. Should the acceptance criteria be updated to "7/9 events (2 deferred due to missing features)" to be clear?

3. **UTM Tracking:** The plan defers UTM parameter parsing to Story 6.3, but we're already touching the signup flow. Should we add this now (5 minutes of work) or truly defer it?

4. **Skip Button:** Should we implement the tracking handler now (even though UI doesn't exist yet), or wait until Epic 4 when the UI is built?

---

**Critique Completed:** December 14, 2025
**Reviewer:** QA Critic Expert
**Next Step:** Address blocking issues, then proceed with implementation
