# Plan Critique: Photos Table RLS Fix

**Plan Reviewed:** photos-table-rls-fix-plan.md
**Skill Reference:** supabase-skill.md
**Date:** 2026-01-03
**Reviewer:** QA Critic Expert

---

## Summary Verdict

**APPROVE WITH CONCERNS**

The plan correctly identifies the root cause (FK mismatch in RLS policy) and proposes the right fix pattern matching `supabase-skill.md`. However, there are several gaps that could cause issues: incomplete `gallery_photos` table handling, missing `WITH CHECK` on photographer policy recreation, potential UPDATE policy security considerations, and one inconsistency in the rollback plan.

---

## Critical Issues (Must Fix)

### 1. The `gallery_photos` Table Section Is Incomplete and Risky

**Location:** Lines 333-379

The plan mentions "Also Fix: gallery_photos Table (if needed)" but this section is half-baked:

- It references the OLD `galleries` table (not `photo_galleries`)
- It provides SQL but says "Note: gallery_photos.gallery_id may still FK to `galleries` (old table)"
- It doesn't verify the actual current state

**Problem:** The API at line 486 says it already "tries both tables" - meaning `gallery_photos` is actively being queried. If `gallery_photos` has broken RLS too, the plan only fixes HALF the problem.

**Fix Required:**
1. Add diagnostic queries to check `gallery_photos` RLS policies BEFORE implementation
2. Either confirm gallery_photos doesn't need fixes OR include proper fix SQL
3. Do NOT reference the old `galleries` table - verify the actual FK target

### 2. Photographer Policy Recreation Missing WITH CHECK

**Location:** Lines 265-275

```sql
CREATE POLICY "Photographers can manage photos in own galleries"
ON photos
FOR ALL
TO authenticated
USING (
  gallery_id IN (
    SELECT id FROM photo_galleries WHERE photographer_id = (SELECT auth.uid())
  )
);
```

**Problem:** Per `supabase-skill.md` line 165-170, `FOR ALL` policies need BOTH `USING` and `WITH CHECK`:

```sql
CREATE POLICY "users_own_data" ON user_data
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
```

Without `WITH CHECK`, photographers can INSERT/UPDATE photos but the policy only validates the gallery ownership - not that they're setting correct values on the inserted row.

**Fix Required:** Add `WITH CHECK` clause matching the `USING` clause.

---

## Concerns (Should Address)

### 3. UPDATE Policy May Be Too Permissive

**Location:** Lines 223-250

The plan adds an UPDATE policy for clients on the `photos` table:

```sql
CREATE POLICY "Clients can update photos in assigned galleries"
ON photos
FOR UPDATE
...
```

**Concern:** This allows clients to UPDATE any column on photos, not just `is_favorite`. A malicious or buggy client could:
- Change `filename`, `original_url`, `thumbnail_url`
- Modify metadata they shouldn't touch

**Better pattern:** Create a database function for favorite toggle that only updates `is_favorite`:

```sql
CREATE OR REPLACE FUNCTION toggle_photo_favorite(p_photo_id uuid)
RETURNS boolean AS $$
DECLARE
  new_value boolean;
BEGIN
  UPDATE photos
  SET is_favorite = NOT is_favorite
  WHERE id = p_photo_id
  RETURNING is_favorite INTO new_value;
  RETURN new_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Recommendation:** Consider if UPDATE policy is intentionally broad or if a SECURITY DEFINER function would be safer. Document the decision either way.

### 4. Secondary Users Not Addressed

**Location:** Missing from plan

The business model mentions `user_type = 'secondary'` (see CLAUDE.md). These are likely additional client users who can access galleries.

**Question:** Can secondary users favorite photos? If so, the RLS policy needs to account for them:

```sql
OR pg.client_id IN (
  SELECT client_id FROM secondary_users WHERE user_id = (SELECT auth.uid())
)
```

**Recommendation:** Verify secondary user requirements and either:
1. Add them to the policy, or
2. Document that secondary users cannot favorite (and why)

### 5. No Explicit Transaction/Atomic Behavior

**Location:** Lines 189-298

The migration drops policies then creates new ones. If the creation fails, the table is left in a broken state (no policies = no access for anyone except admins).

**Recommendation:** Wrap in a transaction with error handling:

```sql
BEGIN;
  -- drops
  -- creates
COMMIT;
-- If any error occurs, Postgres auto-rollbacks
```

The SQL editor usually runs as a transaction, but making it explicit is safer documentation.

---

## Minor Notes (Consider)

### 6. Rollback Plan Restores the BROKEN Policy

**Location:** Lines 494-508

```sql
-- Restore original (broken) policy
CREATE POLICY "Clients can view photos in assigned galleries"
ON photos
FOR SELECT
USING (
  gallery_id IN (
    SELECT id FROM photo_galleries WHERE client_id = auth.uid()  -- STILL BROKEN!
  )
);
```

**Problem:** This restores the broken policy that uses `auth.uid()` directly instead of `(SELECT auth.uid())`.

**Fix:** If you ever need to rollback, at least use the cached auth.uid() pattern. But honestly, rolling back to a broken policy defeats the purpose - perhaps document "rollback means clients can't access photos (back to broken state)" instead.

### 7. Hardcoded Test UUIDs

**Location:** Lines 23-40, 101-157, 309-324, 400-422

The plan uses specific UUIDs for betaclient2. This is fine for verification but:

**Recommendation:** Add a note that these are DEV/TEST UUIDs and production verification should use actual user UUIDs from the database.

### 8. Missing Comment on `idx_clients_user_id`

**Location:** Line 304

```sql
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
```

**Nice to have:** Add a comment explaining this index is for RLS performance:

```sql
COMMENT ON INDEX idx_clients_user_id IS 'Performance index for RLS policies that check client access via user_id';
```

---

## What the Plan Gets Right

1. **Root Cause Analysis is Excellent** - Lines 19-44 clearly explain the problem chain with specific IDs

2. **Follows supabase-skill.md Patterns Correctly:**
   - Uses `(SELECT auth.uid())` instead of bare `auth.uid()` (performance best practice, lines 77-79 of skill)
   - Adds index for RLS policy column (line 304, matches skill line 471-486)
   - Properly structures multi-condition USING clauses with OR

3. **Comprehensive Diagnostic Queries** - Lines 98-162 provide excellent before/after verification

4. **Good Documentation of FK Chain** - Lines 439-454 clearly explain the relationship model

5. **Matches Existing Working Pattern** - Lines 79-94 correctly identify that `photo_galleries` RLS is already fixed and uses it as the template

6. **Adds Admin Policy** - Lines 280-292 ensure admins aren't locked out

7. **Includes Post-Fix Verification Steps** - Lines 385-433 provide clear testing procedures

---

## Recommendation

**Proceed with implementation after addressing:**

1. **MUST FIX:** Add `WITH CHECK` to photographer policy recreation (5 min fix)
2. **MUST FIX:** Add diagnostic query for `gallery_photos` table current state; decide if it needs fixing
3. **SHOULD ADDRESS:** Document decision on UPDATE policy breadth vs. SECURITY DEFINER function
4. **SHOULD ADDRESS:** Verify secondary user access requirements

The core fix (client RLS policy correction) is sound and well-documented. The issues above are edge cases and best practices that should be addressed before deployment to prevent future debugging sessions.

---

## Quick Reference: Minimum Changes to Plan

```sql
-- Fix #1: Add WITH CHECK to photographer policy
CREATE POLICY "Photographers can manage photos in own galleries"
ON photos
FOR ALL
TO authenticated
USING (
  gallery_id IN (
    SELECT id FROM photo_galleries WHERE photographer_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  gallery_id IN (
    SELECT id FROM photo_galleries WHERE photographer_id = (SELECT auth.uid())
  )
);

-- Fix #2: Add diagnostic for gallery_photos
SELECT policyname, cmd, qual::text as using_clause
FROM pg_policies WHERE tablename = 'gallery_photos';

-- Check what table gallery_photos.gallery_id references
SELECT
  tc.table_name, kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'gallery_photos'
  AND tc.constraint_type = 'FOREIGN KEY';
```
