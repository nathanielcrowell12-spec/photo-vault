# Implementation Plan: Billing Page Bugs

**Date:** 2026-03-14
**Reporter:** Nate (4 bugs on `/client/billing`)
**Skill Reference:** supabase, stripe (database + webhook changes)

---

## Problem Statement

The `/client/billing` page has 4 bugs:

1. **No payment history shown** — Nate paid $8 last month but billing page shows nothing
2. **"UNKNOWN GALLERY"** — Subscription shows "UNKNOWN GALLERY" instead of plan name
3. **Dead "View Gallery" button** — Button does nothing (links to `/gallery/null`)
4. **Slow page load** — Multiple sequential queries, silent RLS failures

---

## Root Cause Analysis

### Bug 1: No Payment History

**Table:** `payment_history` — has columns: `id`, `stripe_invoice_id`, `stripe_subscription_id`, `amount_paid_cents`, `currency`, `status`, `paid_at`, `created_at`

**Problem:** No `user_id` column. RLS policies only allow:
- `admin` SELECT (via `user_profiles.user_type = 'admin'`)
- `service_role` ALL

The page queries from browser (anon key + auth JWT). Client users match neither policy → 0 rows returned.

**Also:** The page doesn't filter by `user_id` at all (line 155-159 of `page.tsx`) — it relies entirely on RLS, but there's no client RLS policy.

**Fix:**
1. Add `user_id` column to `payment_history` (nullable, FK to `auth.users`)
2. Backfill from `subscriptions` table via `stripe_subscription_id` join
3. Add RLS policy: clients can read their own payment history
4. Update webhook (`invoice.ts` lines 122-134 and 357-364) to write `user_id`
5. Add `.eq('user_id', user.id)` filter on the page query (defense in depth)

### Bug 2: "UNKNOWN GALLERY"

**Data:** Nate's subscription: `gallery_id: null`, `status: 'active'`, `plan_type: null`

This is a **direct monthly subscription** (no photographer, no gallery). The enrichment code (page.tsx lines 126-150) does:
```
photo_galleries.eq('id', null) → returns nothing → fallback "Unknown Gallery"
```

**Fix:**
- If `gallery_id` is null, show "PhotoVault Monthly" as the plan name
- Skip photographer lookup for direct subscriptions
- Show "Direct subscription" instead of "by Unknown"

### Bug 3: Dead View Gallery Button

**Code:** Line 522-527 — `<Link href={/gallery/${sub.gallery_id}}>` where `gallery_id` is null.

**Fix:**
- Hide "View Gallery" button when `gallery_id` is null
- For direct subscriptions, show "Go to Dashboard" button instead

### Bug 4: Slow Page Load

**Code:** Lines 126-150 — for each subscription, runs:
1. `photo_galleries.select().eq('id', gallery_id).single()` (sequential)
2. `photographers.select().eq('id', photographer_id).single()` (sequential)

With N subscriptions → 2N+2 total queries (subscriptions + payment_history + 2 per sub).

**Fix:**
- Move enrichment to a single query with joins on the subscriptions query
- Use `.select('*, photo_galleries(gallery_name, photographer_id, photographers(business_name))')` pattern
- Or handle enrichment in a server-side API route (preferred — avoids exposing join logic to client)

---

## Implementation Steps

### Step 1: Database Migration — Add `user_id` to `payment_history`

```sql
-- Add user_id column
ALTER TABLE payment_history ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Backfill from subscriptions
UPDATE payment_history ph
SET user_id = s.user_id
FROM subscriptions s
WHERE ph.stripe_subscription_id = s.stripe_subscription_id;

-- Add RLS policy for clients to read their own payment history
CREATE POLICY "Clients can view own payment history"
  ON payment_history FOR SELECT
  USING (user_id = auth.uid());

-- Index for performance
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
```

### Step 2: Update Webhook — Write `user_id` on Payment Insert

**File:** `src/lib/stripe/webhooks/invoice.ts`

In `handlePaymentSucceeded` (line 122-134): Add `user_id` from the subscription lookup (already fetched at line 41-45 as `previousState.user_id`).

In `handlePaymentFailed` (line 357-364): Add `user_id` from the subscription lookup (fetched at line 369-373 as `subData.user_id`).

### Step 3: Fix Page — Handle Direct Subscriptions + Payment History Filter

**File:** `src/app/client/billing/page.tsx`

Changes:
1. **Payment history query (line 155):** Add `.eq('user_id', user.id)` filter
2. **Subscription enrichment (lines 126-150):**
   - If `gallery_id` is null → set `gallery_name: 'PhotoVault Monthly'`, `photographer_name: null`
   - Skip gallery/photographer lookups for null `gallery_id`
3. **Subscription card rendering (line 502):**
   - If `gallery_id` is null, show "PhotoVault Monthly" with different subtitle (no photographer)
   - Hide "View Gallery" button when `gallery_id` is null
   - Show "Go to Dashboard" link instead
4. **Optimize enrichment:** Batch gallery lookups or use joined query

### Step 4: Optimize Queries (Performance)

Replace N+1 pattern with single Supabase join query for subscriptions:

```typescript
const { data: subData } = await supabase
  .from('subscriptions')
  .select(`
    id, stripe_subscription_id, status, current_period_start,
    current_period_end, cancel_at_period_end, gallery_id,
    last_payment_failure_at, payment_failure_count,
    access_suspended, access_suspended_at,
    photo_galleries (
      gallery_name,
      photographers (business_name)
    )
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

This replaces 2N+1 queries with 1 query.

---

## Existing Code to Reference

| File | Purpose |
|------|---------|
| `src/app/client/billing/page.tsx` | Billing page (all 4 bugs) |
| `src/lib/stripe/webhooks/invoice.ts` | Webhook that writes payment_history |
| `src/app/api/stripe/create-direct-subscription/route.ts` | Creates subscriptions with `gallery_id: null` |
| `src/app/api/client/billing/route.ts` | Unused API route (dead code — page queries Supabase directly) |

---

## Testing Plan

1. **Migration:** Verify `user_id` column exists and backfill populated
2. **RLS:** Verify client can read own payment history but not others'
3. **Direct subscription display:** Shows "PhotoVault Monthly" not "UNKNOWN GALLERY"
4. **View Gallery hidden:** No button for direct subscriptions
5. **Payment history visible:** Nate's $8 payment shows up
6. **Performance:** Single page load makes ≤3 queries (subscriptions join, payment_history, auth)

---

## Risk Assessment

- **Migration risk:** Low — adding nullable column + backfill is non-destructive
- **RLS risk:** Medium — must verify new policy doesn't over-expose data. Using `auth.uid()` match is the standard Supabase pattern.
- **Webhook risk:** Low — adding a field to insert, not changing existing logic
- **UI risk:** Low — conditional display based on `gallery_id` null check
