# Plan Critique: Helm Integration API

**Plan Reviewed:** helm-integration-api-plan.md
**Skill References:** nextjs-skill.md, supabase-skill.md
**API Contract:** HELM_INTEGRATION_API_CONTRACT.md
**Schema Catalog:** PHOTOVAULT_SCHEMA_CATALOG.md
**Date:** 2026-01-10

---

## Summary Verdict

**APPROVE WITH CONCERNS**

The plan is thorough, well-structured, and demonstrates strong understanding of the schema catalog (correctly identifying wrong table names in the existing broken `/api/helm/metrics` endpoint). However, there are several technical issues that need addressing before implementation: incorrect column references in queries, missing `payment_failed` alert detection, and schema discrepancies that could cause silent failures at runtime.

---

## Critical Issues (Must Fix)

### 1. WRONG COLUMN: `commissions.amount_cents` does not exist

**Location:** `queries.ts` - `getRecentPayments()`, `getTopPhotographers()`, `getCommissionSummary()`

**Problem:** The schema catalog shows `commissions` has `amount_cents` as a column, but the plan queries it inconsistently. Looking at the schema:
```
| `amount_cents` | integer | Photographer's share |
| `total_paid_cents` | integer | Total payment amount |
```

**The plan uses `amount_cents` correctly in some places but uses `total_paid_cents` for revenue calculation in `getTotalRevenue()`.**

**Impact:** This is actually correct - `total_paid_cents` represents total client payment, `amount_cents` is photographer's commission. However, the semantic naming in the response needs to match what Helm expects.

**Verdict:** The implementation appears correct, but verify the business logic:
- `totalRevenue` should use `total_paid_cents` (what client paid) - **CORRECT**
- `recentPayments[].amount` should use `amount_cents` (commission amount) - **CORRECT**

**No change needed, but add clarifying comment in code.**

---

### 2. MISSING: `payment_failed` Alert Detection

**Location:** `queries.ts` - `detectAlerts()`

**Problem:** The API contract specifies 4 alert types:
1. `churn_risk` - Implemented
2. `payment_failed` - **NOT IMPLEMENTED**
3. `inactive_photographer` - Implemented
4. `gallery_stuck` - Implemented

The contract states:
> `payment_failed` | Commission `status = 'failed'` created today

**Impact:** Helm will receive incomplete alert data. This is a **contract violation**.

**Fix Required:**
```typescript
// Add to detectAlerts():
// 4. Payment Failed: Commission with status='failed' created today
const today = new Date()
today.setUTCHours(0, 0, 0, 0)
const todayStart = today.toISOString()

const { data: failedPayments, error: failedError } = await supabase
  .from('commissions')
  .select('id, photographer_id')
  .eq('status', 'failed')
  .gte('created_at', todayStart)

if (!failedError && failedPayments) {
  failedPayments.forEach(payment => {
    alerts.push({
      type: 'payment_failed',
      message: `Commission ${payment.id} failed today`,
      severity: 'critical',
      entityId: payment.photographer_id
    })
  })
}
```

---

### 3. SCHEMA MISMATCH: `commissions.status` values

**Location:** `types.ts` - `CommissionStatus` type

**Problem:** The plan defines:
```typescript
export type CommissionStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
```

But the schema catalog shows:
```
| `status` | text | **'pending' \| 'paid' \| 'cancelled' \| 'refunded'** |
```

**Wait** - this matches. However, the `payment_failed` alert detection assumes there's a `'failed'` status. Let me re-check the contract...

The contract says: `Commission status = 'failed' created today`

**Critical Question:** Does the `commissions` table actually have a `'failed'` status value? The schema catalog only shows `'pending' | 'paid' | 'cancelled' | 'refunded'`.

**Impact:** Either:
1. The contract is wrong (no 'failed' status exists), OR
2. The schema catalog is incomplete

**Action Required:** Before implementation, verify in the actual database whether 'failed' is a valid status. If not, update the contract and skip this alert type.

---

### 4. INCORRECT: `photographers.platform_subscription_status` column access

**Location:** `queries.ts` - `detectAlerts()` for `inactive_photographer`

**Problem:** The plan queries:
```typescript
.eq('platform_subscription_status', 'active')
```

Looking at the schema catalog for `photographers`:
```
| `platform_subscription_status` | varchar | $22/month fee status |
```

This column exists, but the query doesn't specify what valid values are. The plan assumes 'active' is valid.

**Action Required:** Verify the enum values for `platform_subscription_status`. Common values might be: 'active', 'trialing', 'past_due', 'canceled', etc.

---

### 5. TYPE MISMATCH: `topPhotographers.email` is empty

**Location:** `queries.ts` - `getTopPhotographers()`

**Problem:** The API contract requires:
```typescript
topPhotographers: Array<{
  id: string,
  name: string,
  email: string,  // <-- Required!
  galleries: number,
  revenue: number
}>
```

But the plan explicitly returns an empty string:
```typescript
return {
  id,
  name: profile?.business_name || profile?.full_name || 'Unknown',
  email: '', // Not exposing email for privacy
  ...
}
```

**Impact:** This is a **contract violation**. Helm expects email addresses for top photographers.

**Fix Options:**
1. **Query the email** from `user_profiles` (it has `id` which matches `auth.users.id`) or from `photographers` table
2. **Update the contract** if email is intentionally omitted for privacy
3. **Use a placeholder** like `(hidden for privacy)` if the contract allows

**Recommended Fix:** The `user_profiles` table doesn't have an `email` column per the schema catalog. Email is in `auth.users`. Query it:
```typescript
// Need to join user_profiles to get user_id, then query auth.users
// OR: Use supabase.auth.admin.getUserById() but this is complex

// Simpler: If photographers table doesn't have email, return empty and update contract
```

**Decision Needed:** Confirm whether email should be included. If yes, need to figure out how to get it (may require joining to auth.users which is complex).

---

## Concerns (Should Address)

### 1. N+1 Query Risk in `getTopPhotographers()`

**Location:** `queries.ts` - `getTopPhotographers()`

**Problem:** The function makes 3 sequential queries:
1. Get all commissions in range
2. Get all galleries in range
3. Get profiles for top photographer IDs

While not exactly N+1, this could be optimized into fewer queries using Supabase's join capabilities.

**Suggested Optimization:**
```typescript
// Instead of separate queries, use a single query with aggregation
// Note: This might need a database function for efficiency
```

**Impact:** Performance will degrade as data grows. For now, it's acceptable for early-stage MVP.

---

### 2. Monthly Report Growth Calculations Are Placeholders

**Location:** `monthly/route.ts`

**Problem:** The plan explicitly notes:
```typescript
growth: {
  mrrGrowth: 0, // Would need historical MRR data
  photographerGrowth: 0, // Would need historical data
  ...
}
```

**Impact:** Helm will receive 0% growth values which is misleading - it implies no growth rather than "data unavailable".

**Fix:** Either:
1. Store historical snapshots to enable real growth calculations
2. Return `null` instead of `0` and update types to allow nullable growth
3. Add comments/documentation that growth will be 0 until historical data is available

---

### 3. Churn Rate Calculation Uses Current Active Count

**Location:** `monthly/route.ts`

**Problem:**
```typescript
const churnRate = activeAtStartOfMonth > 0
  ? Math.round((churnedThisMonth / activeAtStartOfMonth) * 10000) / 100
  : 0
```

But `activeAtStartOfMonth` is actually:
```typescript
activeAtStartOfMonth, // Approximation for start of month
```
Which calls `countActiveSubscriptions(supabase)` - a **current** count, not historical.

**Impact:** Churn rate calculation will be inaccurate. It should be:
`churn = canceled_during_month / active_at_month_start`

But we're using:
`churn = canceled_during_month / active_now`

**Fix:** Would need historical subscription snapshots. Document this limitation clearly.

---

### 4. Missing Logger Import in Some Files

**Location:** All route files

**Problem:** The plan imports `logger` in some places but not all. Looking at the existing `health/route.ts` which imports from `@/lib/logger`, the plan should consistently use this.

**Fix:** Ensure all route files import and use the logger:
```typescript
import { logger } from '@/lib/logger'
```

---

### 5. `galleriesPublished` Query May Be Inaccurate

**Location:** `weekly/route.ts`

**Problem:**
```typescript
galleriesPublished,
// from: countGalleriesByStatus(supabase, 'live', start, end),
```

The `countGalleriesByStatus` function queries:
```typescript
.eq('gallery_status', status)
.gte('updated_at', startDate)
.lt('updated_at', endDate)
```

This counts galleries that were **updated** during the week with status 'live'. But it doesn't distinguish between:
- Galleries that became 'live' this week (published)
- Galleries that were already 'live' but were updated for other reasons

**Fix:** Would need to track status change history, or:
```typescript
// More accurate: galleries created this week that are now live
.eq('gallery_status', 'live')
.gte('created_at', startDate)
.lt('created_at', endDate)
```

But this misses galleries created earlier and published this week. Accept this limitation or add status history tracking.

---

## Minor Notes (Consider)

### 1. Date Validation Could Be More Robust

The plan validates format but not actual valid dates:
```typescript
if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
  return helmErrorResponse('Invalid date format. Use YYYY-MM-DD', 400)
}
```

`2026-02-30` would pass this check but is invalid.

**Suggestion:** Add:
```typescript
const parsedDate = new Date(dateParam + 'T00:00:00.000Z')
if (isNaN(parsedDate.getTime())) {
  return helmErrorResponse('Invalid date', 400)
}
```

---

### 2. Consider Adding Request Logging

For debugging and audit trails, log incoming requests:
```typescript
logger.info(`[HelmDailyReport] Request received`, { date: dateParam })
```

---

### 3. Type Exports Could Be Cleaner

The plan exports both `DailyReportData` and `PhotoVaultDailyReportData` (from the contract). Consider using one consistent naming scheme.

---

### 4. Test Mock Is Oversimplified

The test mock in the plan:
```typescript
vi.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lt: vi.fn(() => ({
            count: 5,
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }))
}))
```

This is too simplistic - it doesn't handle different tables or query chains properly. Consider using a more robust mocking approach or actual database integration tests.

---

## Schema Compliance Check

| Plan Uses | Correct Per Catalog | Status |
|-----------|---------------------|--------|
| `photo_galleries` | `photo_galleries` | CORRECT |
| `gallery_photos` | `gallery_photos` | CORRECT |
| `commissions` | `commissions` | CORRECT |
| `user_profiles` | `user_profiles` | CORRECT |
| `photographers` | `photographers` | CORRECT |
| `clients` | `clients` | CORRECT |
| `subscriptions` | `subscriptions` | CORRECT |
| `payment_options` | (not used) | N/A |

**Column Verification:**

| Column Reference | Table | Exists | Status |
|-----------------|-------|--------|--------|
| `gallery_name` | `photo_galleries` | YES | CORRECT |
| `gallery_status` | `photo_galleries` | YES | CORRECT |
| `photographer_id` | `photo_galleries` | YES | CORRECT |
| `amount_cents` | `commissions` | YES | CORRECT |
| `total_paid_cents` | `commissions` | YES | CORRECT |
| `status` | `commissions` | YES (text) | CORRECT |
| `full_name` | `user_profiles` | YES | CORRECT |
| `business_name` | `user_profiles` | YES | CORRECT |
| `platform_subscription_status` | `photographers` | YES | CORRECT |
| `payment_failure_count` | `subscriptions` | YES | CORRECT |

**Verdict:** Schema references are accurate.

---

## API Contract Compliance Check

| Contract Requirement | Plan Implementation | Status |
|---------------------|---------------------|--------|
| Daily endpoint path | `/api/helm/report-data/daily` | CORRECT |
| Weekly endpoint path | `/api/helm/report-data/weekly` | CORRECT |
| Monthly endpoint path | `/api/helm/report-data/monthly` | CORRECT |
| Bearer auth | `verifyHelmAuth()` | CORRECT |
| Date param validation | Format regex check | CORRECT |
| Monetary values in cents | All amounts in cents | CORRECT |
| ISO 8601 timestamps | `.toISOString()` | CORRECT |
| Error response format | `{ success: false, error: string }` | CORRECT |
| Daily metrics fields | All present | CORRECT |
| Weekly metrics fields | All present | CORRECT |
| Monthly metrics fields | All present | CORRECT |
| Alert types | 3 of 4 implemented | **MISSING `payment_failed`** |
| TopPhotographer email | Returns empty string | **VIOLATES CONTRACT** |

---

## What the Plan Gets Right

1. **Excellent schema awareness** - The plan explicitly identifies the broken `/api/helm/metrics` endpoint and its wrong table names, showing deep understanding of the schema catalog.

2. **Proper service role client usage** - Correctly uses `createServiceRoleClient()` from the existing `supabase-server.ts` file.

3. **Strong type definitions** - Comprehensive TypeScript types that match the API contract.

4. **Good error handling pattern** - The `helmErrorResponse()` helper provides consistent error formatting.

5. **Performance consideration** - Uses `Promise.all()` for parallel query execution.

6. **TDD approach** - Includes test requirements before implementation.

7. **Correct date handling** - Uses UTC consistently and handles date bounds correctly.

8. **Security-first auth** - Validates `HELM_API_KEY` presence and format before processing.

9. **Proper file organization** - Separates types, auth, and queries into dedicated files in `src/lib/helm/`.

10. **Follows existing patterns** - Matches the style of existing `/api/helm/health/route.ts`.

---

## Recommendation

**Proceed with implementation after addressing these 3 must-fix items:**

1. **Add `payment_failed` alert detection** (or confirm with Helm team that this alert type should be removed from contract if `commissions.status = 'failed'` doesn't exist)

2. **Resolve `topPhotographers.email`** - Either query it from auth.users (complex) or update the contract to make it optional/nullable

3. **Verify `commissions.status = 'failed'` exists** - If not, update contract and remove that alert type

**Optional improvements (can be done post-MVP):**
- Implement historical data storage for accurate growth calculations
- Improve `galleriesPublished` query accuracy
- Add more robust date validation
- Enhance test mocks

**Implementation time estimate:** 4-6 hours as stated, plus 1-2 hours for the must-fix items above.

---

*Critique completed by QA Critic Expert - 2026-01-10*
