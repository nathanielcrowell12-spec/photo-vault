# Supabase Beta Tester System - Implementation Plan

**Created:** January 4, 2026
**Author:** Supabase Expert Agent
**Related Spec:** `docs/BETA-TESTER-SYSTEM-SPEC.md`
**Status:** ALREADY IMPLEMENTED (Verification Plan)

---

## Executive Summary

After analyzing the database, I discovered that **the migration has already been applied**. The `photographers` table already contains all three beta tester columns with proper indexes and comments. This plan documents what was implemented and provides verification/testing steps.

---

## Part 1: Database Current State (VERIFIED)

### 1.1 Existing Columns in `photographers` Table

The following columns already exist:

| Column | Type | Default | Nullable | Comment |
|--------|------|---------|----------|---------|
| `is_beta_tester` | BOOLEAN | FALSE | YES | "True if photographer is a founding/beta tester" |
| `beta_start_date` | TIMESTAMPTZ | NULL | YES | "When they joined the beta program" |
| `price_locked_at` | NUMERIC | NULL | YES | "Their locked platform fee rate (e.g., 22.00) - immune to future price increases" |

### 1.2 Existing Index

```sql
CREATE INDEX idx_photographer_beta_tester
ON public.photographers USING btree (is_beta_tester)
WHERE (is_beta_tester = true)
```

This partial index optimizes queries for beta testers only.

### 1.3 Migration Record

The migration was applied as version `20260104181654` with name `add_beta_tester_fields`.

---

## Part 2: Table Clarification

### 2.1 Two Photographer Tables

The codebase has **two** photographer-related tables:

| Table | Purpose | Beta Fields? |
|-------|---------|--------------|
| `photographers` | Business/billing data (Stripe, commissions, platform subscription) | **YES** - has beta columns |
| `photographer_profiles` | Public profile data (username, bio, profile image) | No - has `is_founding_member` (different purpose) |

The spec referenced `photographer_profiles`, but the correct table is `photographers` since beta tester status relates to billing/subscription logic.

### 2.2 Relationship

- `photographers.id` = `user_profiles.id` (1:1 relationship via user ID)
- `photographer_profiles.user_id` = `user_profiles.id`

The `is_founding_member` on `photographer_profiles` is for display purposes (badge), while `is_beta_tester` on `photographers` controls billing logic.

---

## Part 3: RLS Policy Analysis

### 3.1 Current RLS Policies on `photographers`

| Policy Name | Command | Logic |
|-------------|---------|-------|
| "Photographers can view own data" | ALL | `auth.uid() = id` |
| "Photographers can insert own data" | INSERT | `auth.uid() = id` |
| "Clients can view own photographer data" | SELECT | Complex join through galleries |

### 3.2 RLS Considerations for Beta Fields

The current policies are **appropriate**:

1. **Photographer can read** their own `is_beta_tester`, `beta_start_date`, `price_locked_at` (via "view own data" policy)
2. **Photographer cannot modify** these fields directly (the ALL policy allows viewing, but updates from client-side would need to pass `auth.uid() = id` check)
3. **Webhook/service role** bypasses RLS entirely and can update these fields

**No RLS changes needed.** The design is correct:
- Photographers see their own beta status
- Only webhooks (using service role) can set these fields
- Clients can see basic photographer info but beta fields are safe

---

## Part 4: TypeScript Type Updates

### 4.1 Current State

No TypeScript files currently reference `is_beta_tester`, `beta_start_date`, or `price_locked_at`. The types in `src/lib/supabase.ts` are outdated and don't match the actual database schema.

### 4.2 Recommended Type Updates

**Option A: Generate Fresh Types (Recommended)**

Run the Supabase CLI to regenerate types:

```bash
npx supabase gen types typescript --project-id gqmycgopitxpjkxzrnyv > src/types/database.generated.ts
```

**Option B: Manual Updates**

If manually maintaining types, add to the photographers interface:

```typescript
// In src/types/photographer.ts (create if doesn't exist)
export interface Photographer {
  id: string;
  // ... existing fields ...

  // Beta tester fields
  is_beta_tester: boolean;
  beta_start_date: string | null;  // ISO 8601 timestamp
  price_locked_at: number | null;  // e.g., 22.00

  // Platform subscription fields (existing)
  platform_subscription_status: string | null;
  stripe_platform_subscription_id: string | null;
  // ... etc
}
```

### 4.3 Where Types Are Used

Files that may need updates when consuming beta tester data:

| File | Reason |
|------|--------|
| `src/app/photographer/dashboard/page.tsx` | Display Founding Photographer badge |
| `src/app/photographer/settings/page.tsx` | Show beta status section |
| `src/app/api/webhooks/stripe/route.ts` | Handle coupon events |
| New: `src/components/photographer/PhotographerBadge.tsx` | Badge component |

---

## Part 5: Verification Queries

### 5.1 Verify Columns Exist

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'photographers'
  AND column_name IN ('is_beta_tester', 'beta_start_date', 'price_locked_at');
```

Expected: 3 rows returned.

### 5.2 Verify Index Exists

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'photographers'
  AND indexname = 'idx_photographer_beta_tester';
```

Expected: 1 row with partial index definition.

### 5.3 Verify Column Comments

```sql
SELECT
  c.column_name,
  pgd.description as column_comment
FROM information_schema.columns c
LEFT JOIN pg_catalog.pg_statio_all_tables st ON c.table_name = st.relname
LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid
  AND pgd.objsubid = c.ordinal_position
WHERE c.table_name = 'photographers'
  AND c.column_name IN ('is_beta_tester', 'beta_start_date', 'price_locked_at');
```

Expected: 3 rows with appropriate comments.

### 5.4 Verify Migration Record

```sql
SELECT * FROM supabase_migrations.schema_migrations
WHERE name LIKE '%beta%';
```

Expected: 1 row for `add_beta_tester_fields`.

---

## Part 6: Testing Steps

### 6.1 Database Tests

```sql
-- Test 1: Create a test beta tester
UPDATE photographers
SET
  is_beta_tester = true,
  beta_start_date = NOW(),
  price_locked_at = 22.00
WHERE id = 'TEST_PHOTOGRAPHER_ID';

-- Verify
SELECT id, is_beta_tester, beta_start_date, price_locked_at
FROM photographers
WHERE id = 'TEST_PHOTOGRAPHER_ID';

-- Test 2: Query beta testers (should use index)
EXPLAIN ANALYZE
SELECT * FROM photographers WHERE is_beta_tester = true;

-- Test 3: Rollback test data
UPDATE photographers
SET
  is_beta_tester = false,
  beta_start_date = NULL,
  price_locked_at = NULL
WHERE id = 'TEST_PHOTOGRAPHER_ID';
```

### 6.2 API Tests (Future Implementation)

When webhook handler is implemented:

1. Simulate `customer.discount.created` event with `PHOTOVAULT_BETA_2026` coupon
2. Verify photographer record is updated
3. Verify welcome email is triggered

---

## Part 7: Rollback Plan

If rollback is ever needed:

```sql
-- Migration: rollback_beta_tester_fields
-- WARNING: Only run if beta system needs to be completely removed

-- Drop index first
DROP INDEX IF EXISTS idx_photographer_beta_tester;

-- Remove columns
ALTER TABLE photographers
DROP COLUMN IF EXISTS is_beta_tester,
DROP COLUMN IF EXISTS beta_start_date,
DROP COLUMN IF EXISTS price_locked_at;

-- Remove migration record (if needed)
DELETE FROM supabase_migrations.schema_migrations
WHERE name = 'add_beta_tester_fields';
```

**Note:** Rollback should only be done if:
1. No photographers have been marked as beta testers
2. The feature is being completely abandoned
3. There are no webhook handlers depending on these fields

---

## Part 8: Original Migration (For Reference)

This is what was applied:

```sql
-- Migration: add_beta_tester_fields
-- Applied: 2026-01-04 18:16:54

ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS beta_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS price_locked_at DECIMAL(10,2);

-- Index for quick beta tester lookups
CREATE INDEX IF NOT EXISTS idx_photographer_beta_tester
ON photographers(is_beta_tester)
WHERE is_beta_tester = TRUE;

COMMENT ON COLUMN photographers.is_beta_tester IS 'True if photographer is a founding/beta tester';
COMMENT ON COLUMN photographers.beta_start_date IS 'When they joined the beta program';
COMMENT ON COLUMN photographers.price_locked_at IS 'Their locked platform fee rate (e.g., 22.00) - immune to future price increases';
```

---

## Part 9: Next Steps

Since the database migration is complete, the remaining work is:

1. **Stripe Coupon Creation** - Create `PHOTOVAULT_BETA_2026` coupon via CLI
2. **Webhook Handler Update** - Add `customer.discount.created` handler
3. **TypeScript Types** - Regenerate or manually add types
4. **UI Components** - Create Founding Photographer badge
5. **Dashboard Integration** - Display badge and beta status
6. **Email Template** - Create beta welcome email via Resend

---

## Appendix: Full Photographers Table Schema

For reference, the complete `photographers` table structure:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID (PK) | Same as user_profiles.id |
| `business_license` | VARCHAR | Business info |
| `tax_id` | VARCHAR | Tax info |
| `bank_account_info` | JSONB | Banking details |
| `cms_integration_id` | VARCHAR | CMS integration |
| `cms_system` | VARCHAR | CMS platform name |
| `commission_rate` | NUMERIC | Default 50.00 |
| `total_commission_earned` | NUMERIC | Lifetime earnings |
| `monthly_commission` | NUMERIC | Current month |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last update |
| `platform_subscription_status` | VARCHAR | 'active', 'overdue', etc. |
| `suspended_at` | TIMESTAMPTZ | If suspended |
| `deleted_at` | TIMESTAMPTZ | Soft delete |
| `last_platform_payment_attempt` | TIMESTAMPTZ | Payment tracking |
| `stripe_connect_account_id` | VARCHAR | Connect account |
| `stripe_connect_status` | VARCHAR | Connect status |
| `stripe_connect_onboarded_at` | TIMESTAMPTZ | Onboarding date |
| `bank_account_verified` | BOOLEAN | Verification status |
| `can_receive_payouts` | BOOLEAN | Payout eligibility |
| `next_payout_date` | DATE | Scheduled payout |
| `pending_balance` | NUMERIC | Pending funds |
| `available_balance` | NUMERIC | Available funds |
| `stripe_platform_subscription_id` | VARCHAR | Platform sub ID |
| `platform_subscription_trial_end` | TIMESTAMPTZ | Trial end |
| `platform_subscription_current_period_start` | TIMESTAMPTZ | Period start |
| `platform_subscription_current_period_end` | TIMESTAMPTZ | Period end |
| **`is_beta_tester`** | BOOLEAN | **Beta flag** |
| **`beta_start_date`** | TIMESTAMPTZ | **Beta start** |
| **`price_locked_at`** | NUMERIC | **Locked price** |

---

**END OF PLAN**

*Database work is complete. Proceed with Stripe coupon, webhook handler, and UI components.*
