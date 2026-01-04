# Beta Tester System - QA Critic Review

**Reviewed:** January 4, 2026
**Reviewer:** QA Critic Expert
**Plans Reviewed:**
1. `stripe-beta-coupon-plan.md` - Stripe coupon and webhook handling
2. `supabase-beta-migration-plan.md` - Database migration

**Original Spec:** `docs/BETA-TESTER-SYSTEM-SPEC.md`

---

## VERDICT: NEEDS REVISION

The plans are largely well-structured and follow skill patterns correctly, but contain several issues that must be addressed before implementation. Most critically, there is a **table mismatch** between plans that will cause the webhook handler to fail, and the email retrieval logic has a fundamental flaw.

---

## Executive Summary

| Category | Stripe Plan | Supabase Plan |
|----------|-------------|---------------|
| Completeness | 8/10 | 9/10 |
| Correctness | 6/10 | 8/10 |
| Codebase Consistency | 7/10 | 9/10 |
| Edge Cases | 7/10 | 8/10 |
| Security | 9/10 | 9/10 |

**Critical Issues:** 2
**Major Issues:** 3
**Minor Issues:** 5

---

## CRITICAL ISSUES (Must Fix Before Implementation)

### CRITICAL-1: Table Mismatch Between Plans

**Location:** `stripe-beta-coupon-plan.md` lines 159-189 vs `supabase-beta-migration-plan.md`

**Problem:** The Stripe plan's webhook handler references `user_profiles` for `stripe_customer_id` lookup (line 159), but then updates `photographer_profiles` (line 179). However:

1. The Supabase plan confirms the migration was applied to the `photographers` table (NOT `photographer_profiles`)
2. The `stripe_customer_id` column exists on `user_profiles` (verified via database query)
3. The beta columns exist on `photographers` (verified via database query)

**Current Code Flow (Stripe Plan):**
```typescript
// Line 159-167: Query user_profiles for stripe_customer_id
const { data: userProfile } = await supabase
  .from('user_profiles')
  .select('id, full_name, user_type')
  .eq('stripe_customer_id', stripeCustomerId)
  .single()

// Line 179-186: Update photographer_profiles (WRONG TABLE!)
const { error: updateError } = await supabase
  .from('photographer_profiles')  // <-- WRONG! Should be 'photographers'
  .update({
    is_beta_tester: true,
    beta_start_date: new Date().toISOString(),
    price_locked_at: BETA_LOCKED_PRICE,
  })
  .eq('user_id', userProfile.id)
```

**Fix Required:** Change line 179 from `'photographer_profiles'` to `'photographers'`. The `photographers` table has:
- `id` = user's UUID (same as `user_profiles.id`)
- `is_beta_tester`, `beta_start_date`, `price_locked_at` columns

```typescript
// CORRECT:
const { error: updateError } = await supabase
  .from('photographers')  // <-- CORRECT TABLE
  .update({
    is_beta_tester: true,
    beta_start_date: new Date().toISOString(),
    price_locked_at: BETA_LOCKED_PRICE,
  })
  .eq('id', userProfile.id)  // Note: 'id' not 'user_id'
```

---

### CRITICAL-2: Invalid Query to auth.users Table

**Location:** `stripe-beta-coupon-plan.md` lines 193-198

**Problem:** The plan attempts to query `auth.users` directly via Supabase client:

```typescript
const { data: authUser, error: authError } = await supabase
  .from('auth.users')  // <-- INVALID - auth schema not accessible this way
  .select('email')
  .eq('id', userProfile.id)
  .single()
```

**Why This Fails:** The `auth` schema is not exposed through the Supabase client's `.from()` method. This query will return an error like "relation 'auth.users' does not exist".

**Fix Required:** Use one of these approaches:

**Option A (Recommended): Get email from user_profiles**
```typescript
// user_profiles likely has email - check schema and use it
const { data: userProfile } = await supabase
  .from('user_profiles')
  .select('id, full_name, user_type, email')  // Add email to select
  .eq('stripe_customer_id', stripeCustomerId)
  .single()
```

**Option B: Use Stripe customer email (current fallback)**
The existing fallback to Stripe customer email (lines 202-210) is correct and should be the primary approach if user_profiles doesn't have email.

**Option C: Use RPC function**
If auth.users access is truly needed, create a SECURITY DEFINER function.

---

## MAJOR ISSUES (Should Fix Before Implementation)

### MAJOR-1: Spec vs Plan Table Discrepancy

**Location:** Original spec `BETA-TESTER-SYSTEM-SPEC.md` Part 2.1

**Problem:** The original spec says to add columns to `photographer_profiles`:

```sql
ALTER TABLE photographer_profiles
ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT FALSE,
```

But the Supabase plan correctly identifies that the migration was applied to `photographers` table. The spec should be updated to match reality, or this discrepancy should be documented.

**Impact:** Future developers may be confused about which table to query.

**Fix Required:** Either:
1. Update the spec to reference `photographers` table, OR
2. Add a note in both plans explaining the discrepancy and why `photographers` is correct

---

### MAJOR-2: Missing Webhook Event Registration Check

**Location:** `stripe-beta-coupon-plan.md` - Missing from Part 7 Checklist

**Problem:** The plan mentions adding `customer.discount.created` to the webhook handler, but doesn't verify that this event type is enabled in the Stripe webhook endpoint configuration.

**Why This Matters:** If the event isn't enabled in Stripe Dashboard, the webhook will never fire.

**Fix Required:** Add to pre-implementation checklist:
```markdown
### Stripe Webhook Configuration
- [ ] Go to Stripe Dashboard > Developers > Webhooks
- [ ] Select the production webhook endpoint
- [ ] Click "Select events" and enable `customer.discount.created`
- [ ] Save changes
```

---

### MAJOR-3: Email Template Not Following Codebase Pattern

**Location:** `stripe-beta-coupon-plan.md` Part 3.1

**Problem:** The plan creates a new file `src/lib/email/beta-templates.ts`, but examining the codebase shows email templates are organized by category:
- `critical-templates.ts` - High-priority transactional emails
- `revenue-templates.ts` - Payment/subscription emails
- `engagement-templates.ts` - User engagement emails
- `family-templates.ts` - Family account emails

A beta welcome email fits the "critical" category (onboarding a new user type).

**Fix Required:** Either:
1. Add the template to `critical-templates.ts` instead of creating a new file, OR
2. If keeping separate file, justify in the plan why this deserves its own file

---

## MINOR ISSUES (Nice to Fix)

### MINOR-1: Hardcoded "1 of 15" in Email Template

**Location:** `stripe-beta-coupon-plan.md` line 471

```html
<span class="badge">1 of 15 Founding Photographers</span>
```

**Problem:** The number is hardcoded. If you onboard 20 beta testers (30 max redemptions), this becomes inaccurate.

**Fix:** Either remove the number or make it dynamic:
```typescript
// Fetch count from database
const { count } = await supabase
  .from('photographers')
  .select('*', { count: 'exact', head: true })
  .eq('is_beta_tester', true)
```

---

### MINOR-2: Logger Import Pattern

**Location:** `stripe-beta-coupon-plan.md` line 114

```typescript
import { logger } from '@/lib/logger'
```

**Verification Needed:** Confirm this import path matches the actual logger location in the codebase. The existing webhook handlers use this path, so it's likely correct.

---

### MINOR-3: Missing Type Export in types.ts Update

**Location:** `stripe-beta-coupon-plan.md` Part 2.4

```typescript
export type Discount = Stripe.Discount
```

**Problem:** This is correct, but the plan should also mention updating the `CheckoutSessionMetadata` interface if any beta-related metadata needs to be added. Currently not needed, but good to document the decision.

---

### MINOR-4: Coupon Redemption Tracking

**Location:** `stripe-beta-coupon-plan.md` - Not addressed

**Problem:** The plan doesn't include a way to track coupon redemption count in the PhotoVault database. While Stripe tracks `max_redemptions` vs actual redemptions, having this in your own database would allow:
- Admin dashboard visibility
- Quick queries without Stripe API calls
- Historical tracking after coupon expires

**Suggestion:** Consider adding a `beta_testers_count` materialized view or adding redemption count to admin metrics.

---

### MINOR-5: Test Coverage Not Specified

**Location:** Both plans

**Problem:** Neither plan specifies what tests to write. Per the Three Iron Laws:
> NO CODE WITHOUT A FAILING TEST FIRST

**Fix Required:** Add test specifications:
```typescript
// src/lib/stripe/webhooks/__tests__/discount.test.ts
describe('handleDiscountCreated', () => {
  it('should mark photographer as beta tester when PHOTOVAULT_BETA_2026 applied')
  it('should ignore non-beta coupons')
  it('should handle missing customer ID gracefully')
  it('should handle non-photographer users gracefully')
  it('should send welcome email on success')
  it('should log error but not fail if email send fails')
})
```

---

## CORRECTNESS: Skill Pattern Compliance

### Stripe Skill Compliance

| Pattern | Compliance | Notes |
|---------|------------|-------|
| Idempotency | PASS | Uses existing `checkIdempotency` from helpers |
| Webhook signature verification | PASS | Inherits from existing route.ts |
| Error handling | PASS | Logs errors, returns success to prevent retries |
| Stripe ID storage | PARTIAL | Doesn't store coupon application event ID |
| Fast webhook response | PASS | Email is fire-and-forget |

### Supabase Skill Compliance

| Pattern | Compliance | Notes |
|---------|------------|-------|
| RLS enabled | PASS | Existing table has RLS |
| Indexed columns | PASS | Partial index on `is_beta_tester` |
| Type safety | WARN | Recommends regenerating types but doesn't enforce |
| Service role for webhooks | PASS | Uses service role client |

---

## EDGE CASES ANALYSIS

### Handled Edge Cases

1. **Non-beta coupon applied** - Correctly ignores and returns success
2. **Non-photographer uses beta coupon** - Logs warning, returns success
3. **Email send failure** - Fire-and-forget with error logging
4. **Duplicate webhook** - Handled by existing idempotency system

### Unhandled Edge Cases

1. **Photographer record doesn't exist in `photographers` table**
   - User exists in `user_profiles` with `user_type = 'photographer'`
   - But no row in `photographers` table (incomplete onboarding?)
   - Current code will silently fail the update
   - **Recommendation:** Add check and create row if missing, or log error

2. **Coupon applied before photographer onboarding complete**
   - What if someone applies the coupon before completing Stripe Connect?
   - The photographer record might not exist yet
   - **Recommendation:** Document expected onboarding sequence

3. **Coupon removed/deleted mid-subscription**
   - If admin removes coupon from customer, what happens?
   - Should we listen to `customer.discount.deleted`?
   - **Recommendation:** Not critical for beta, but document decision

---

## SECURITY ANALYSIS

### Positive Security Aspects

1. Uses service role client for webhook processing (bypasses RLS appropriately)
2. Doesn't expose beta status modification to client-side code
3. Validates coupon ID before processing
4. Verifies user_type before granting beta status

### Security Recommendations

1. **Rate limit consideration:** If someone tries to brute-force coupon codes, what happens? Not critical since coupon is manually applied, but worth noting.

2. **Audit logging:** Consider logging beta tester enrollment to a separate audit table for compliance/tracking.

---

## PERFORMANCE ANALYSIS

### Positive Performance Aspects

1. Partial index on `is_beta_tester` (only indexes TRUE values)
2. Email sent asynchronously (fire-and-forget)
3. Single database query for user lookup

### Performance Recommendations

1. The `user_profiles` lookup and `photographers` update could potentially be combined into a single RPC function for atomicity and performance.

---

## IMPLEMENTATION ORDER RECOMMENDATION

Based on the critique, here's the corrected implementation order:

1. **Fix Critical Issues First**
   - Update webhook handler to use `photographers` table (not `photographer_profiles`)
   - Fix email retrieval to not query `auth.users` directly

2. **Database (ALREADY DONE)**
   - Migration already applied per Supabase plan verification

3. **Write Tests** (per Three Iron Laws)
   - Create `discount.test.ts` with test cases

4. **Stripe Coupon Creation**
   - Use CLI commands as specified

5. **Webhook Handler Implementation**
   - Create `discount.ts` with corrected code
   - Update `index.ts` to route to handler

6. **Email Template**
   - Add to `critical-templates.ts` or create `beta-templates.ts`
   - Update `email-service.ts`

7. **Enable Webhook Event in Stripe Dashboard**
   - Enable `customer.discount.created` event

8. **End-to-End Testing**
   - Follow testing steps in both plans

---

## REQUIRED CHANGES BEFORE APPROVAL

### Must Fix (Blocking)

1. [ ] Change `photographer_profiles` to `photographers` in webhook handler
2. [ ] Change `.eq('user_id', ...)` to `.eq('id', ...)` for photographers table
3. [ ] Remove direct `auth.users` query, use user_profiles.email or Stripe customer email
4. [ ] Add step to enable `customer.discount.created` in Stripe webhook settings

### Should Fix (Recommended)

5. [ ] Add test specifications to plan
6. [ ] Document table name discrepancy vs original spec
7. [ ] Consider adding template to `critical-templates.ts` instead of new file

### Nice to Have

8. [ ] Remove or make dynamic "1 of 15" text
9. [ ] Add coupon redemption tracking consideration

---

## CONCLUSION

The plans demonstrate good understanding of the existing codebase patterns and follow most skill guidelines correctly. However, the critical table mismatch issue would cause the webhook to fail silently (update would succeed on wrong table), and the `auth.users` query would throw an error.

Once the critical issues are fixed, the plans should be ready for implementation.

**Verdict: NEEDS REVISION**

---

*Critique generated by QA Critic Expert following Stripe and Supabase skill patterns.*
