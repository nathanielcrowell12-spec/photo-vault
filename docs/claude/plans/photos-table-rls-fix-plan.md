# Photos Table RLS Fix Plan

**Issue:** Favorite toggle fails with "Photo not found" - RLS blocks client access to `photos` table
**Date:** 2026-01-03
**Status:** Ready for Implementation

---

## Executive Summary

The favorite toggle API returns 404 "Photo not found" even though the photo exists in the database. Both queries return `null` with no error, which is the signature of **RLS blocking access** (not a missing record).

**Root Cause:** The `photos` table has RLS policies that check `client_id = auth.uid()` directly, but `photo_galleries.client_id` references a **client record UUID**, not the user's `auth.uid()`. Clients are linked indirectly: `auth.uid()` -> `clients.user_id` -> `clients.id` = `photo_galleries.client_id`.

---

## Current State Analysis

### The Problem Chain

```
1. Client betaclient2 logs in
   - auth.uid() = 2562e80b-1e7e-4c70-a53e-2031b4fa295e

2. Client clicks "favorite" on photo
   - photo_id = 3107f6f3-5f9a-4f85-b975-fe66c3bd0d1b
   - Photo is in `photos` table (NOT gallery_photos)
   - photo.gallery_id = 5dbd9363-e521-4c96-9d42-90872b3c2bcc

3. API queries photos table with client's auth context
   - SELECT id, gallery_id, is_favorite FROM photos WHERE id = '3107f6f3...'

4. RLS policy checks if client can access
   - Current policy: "Clients can view photos in assigned galleries"
   - Policy USING: gallery_id IN (SELECT id FROM photo_galleries WHERE client_id = auth.uid())
   - This checks if client_id = auth.uid() directly

5. The check fails because:
   - photo_galleries.client_id = 2d6aaed4-9edb-477d-9197-278590a1ff0d (client record ID)
   - auth.uid() = 2562e80b-1e7e-4c70-a53e-2031b4fa295e (user ID)
   - These are DIFFERENT IDs!

6. RLS returns empty result, API sees null, returns 404
```

### Existing RLS Policies on `photos` Table

From `photo-galleries-rls-policies.sql` (lines 40-57):

```sql
-- Policy: Photographers can manage photos in their galleries
CREATE POLICY "Photographers can manage photos in own galleries"
ON photos
FOR ALL
USING (
  gallery_id IN (
    SELECT id FROM photo_galleries WHERE photographer_id = auth.uid()
  )
);

-- Policy: Clients can view photos in their galleries (BROKEN!)
CREATE POLICY "Clients can view photos in assigned galleries"
ON photos
FOR SELECT
USING (
  gallery_id IN (
    SELECT id FROM photo_galleries WHERE client_id = auth.uid()
  )
);
```

**The Bug:** `client_id = auth.uid()` is WRONG because:
- `photo_galleries.client_id` is a FK to `clients.id`
- `clients.id` is NOT the same as the user's `auth.uid()`
- The correct check is: `client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())`

### Comparison with Fixed `photo_galleries` RLS

From `consolidate-photo-galleries-migration.sql` (lines 252-261):

```sql
-- Clients can view galleries assigned to them (CORRECT PATTERN)
CREATE POLICY "Clients can view their galleries"
  ON photo_galleries
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );
```

This is the correct pattern that the `photos` table needs!

---

## SQL Queries to Verify (Run in Supabase SQL Editor)

Before applying the fix, run these queries to confirm the diagnosis:

```sql
-- 1. Check current RLS policies on photos table
SELECT policyname, cmd, qual::text as using_clause, with_check::text as with_check_clause
FROM pg_policies WHERE tablename = 'photos';

-- 2. Check current RLS policies on gallery_photos table (for comparison)
SELECT policyname, cmd, qual::text as using_clause, with_check::text as with_check_clause
FROM pg_policies WHERE tablename = 'gallery_photos';

-- 3. Verify the photo exists and its gallery relationships
SELECT
  p.id as photo_id,
  p.gallery_id,
  p.is_favorite,
  pg.client_id,
  pg.photographer_id,
  pg.user_id as gallery_user_id,
  c.user_id as client_user_id,
  c.name as client_name
FROM photos p
JOIN photo_galleries pg ON pg.id = p.gallery_id
LEFT JOIN clients c ON c.id = pg.client_id
WHERE p.id = '3107f6f3-5f9a-4f85-b975-fe66c3bd0d1b';

-- 4. Test if client should have access per correct RLS logic
SELECT
  CASE
    WHEN pg.user_id = '2562e80b-1e7e-4c70-a53e-2031b4fa295e' THEN 'YES - gallery direct user_id'
    WHEN pg.photographer_id = '2562e80b-1e7e-4c70-a53e-2031b4fa295e' THEN 'YES - photographer'
    WHEN c.user_id = '2562e80b-1e7e-4c70-a53e-2031b4fa295e' THEN 'YES - client via clients.user_id'
    ELSE 'NO ACCESS - policy mismatch'
  END as should_have_access,
  pg.client_id as gallery_client_id,
  c.user_id as client_user_id,
  '2562e80b-1e7e-4c70-a53e-2031b4fa295e' as auth_uid
FROM photos p
JOIN photo_galleries pg ON pg.id = p.gallery_id
LEFT JOIN clients c ON c.id = pg.client_id
WHERE p.id = '3107f6f3-5f9a-4f85-b975-fe66c3bd0d1b';

-- 5. Test the WRONG policy logic (current)
SELECT EXISTS (
  SELECT 1 FROM photo_galleries
  WHERE id = '5dbd9363-e521-4c96-9d42-90872b3c2bcc'
  AND client_id = '2562e80b-1e7e-4c70-a53e-2031b4fa295e'  -- This is auth.uid(), will return FALSE
) as wrong_policy_passes;

-- 6. Test the CORRECT policy logic (proposed fix)
SELECT EXISTS (
  SELECT 1 FROM photo_galleries
  WHERE id = '5dbd9363-e521-4c96-9d42-90872b3c2bcc'
  AND client_id IN (
    SELECT id FROM clients WHERE user_id = '2562e80b-1e7e-4c70-a53e-2031b4fa295e'
  )
) as correct_policy_passes;
```

**Expected Results:**
- Query 5 (wrong policy): FALSE
- Query 6 (correct policy): TRUE

---

## The Fix

### Migration SQL: `fix-photos-table-rls-for-clients.sql`

```sql
-- ============================================================================
-- FIX: Photos Table RLS Policies for Client Access
-- ============================================================================
-- Date: 2026-01-03
--
-- PROBLEM:
-- The existing "Clients can view photos in assigned galleries" policy uses:
--   client_id = auth.uid()
-- But photo_galleries.client_id references clients.id, NOT auth.uid().
-- Clients are linked indirectly: auth.uid() -> clients.user_id -> clients.id
--
-- SOLUTION:
-- Update the policy to properly traverse the FK relationship:
--   client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
--
-- This also adds UPDATE permission for clients (needed for favorite toggle).
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing broken policies
-- ============================================================================

DROP POLICY IF EXISTS "Clients can view photos in assigned galleries" ON photos;
DROP POLICY IF EXISTS "Clients can update photos in assigned galleries" ON photos;

-- ============================================================================
-- STEP 2: Create corrected SELECT policy for clients
-- ============================================================================
-- Pattern: auth.uid() -> clients.user_id -> clients.id = photo_galleries.client_id

CREATE POLICY "Clients can view photos in assigned galleries"
ON photos
FOR SELECT
TO authenticated
USING (
  gallery_id IN (
    SELECT pg.id
    FROM photo_galleries pg
    WHERE
      -- Direct user_id match (for self-uploaded galleries)
      pg.user_id = (SELECT auth.uid())
      OR
      -- Client relationship match (photographer assigned client to gallery)
      pg.client_id IN (
        SELECT id FROM clients WHERE user_id = (SELECT auth.uid())
      )
  )
);

-- ============================================================================
-- STEP 3: Create UPDATE policy for clients (needed for favorite toggle)
-- ============================================================================

CREATE POLICY "Clients can update photos in assigned galleries"
ON photos
FOR UPDATE
TO authenticated
USING (
  gallery_id IN (
    SELECT pg.id
    FROM photo_galleries pg
    WHERE
      pg.user_id = (SELECT auth.uid())
      OR
      pg.client_id IN (
        SELECT id FROM clients WHERE user_id = (SELECT auth.uid())
      )
  )
)
WITH CHECK (
  gallery_id IN (
    SELECT pg.id
    FROM photo_galleries pg
    WHERE
      pg.user_id = (SELECT auth.uid())
      OR
      pg.client_id IN (
        SELECT id FROM clients WHERE user_id = (SELECT auth.uid())
      )
  )
);

-- ============================================================================
-- STEP 4: Verify photographer policy still exists and is correct
-- ============================================================================
-- The existing photographer policy is correct, but let's ensure it exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'photos'
    AND policyname = 'Photographers can manage photos in own galleries'
  ) THEN
    -- Recreate if missing
    CREATE POLICY "Photographers can manage photos in own galleries"
    ON photos
    FOR ALL
    TO authenticated
    USING (
      gallery_id IN (
        SELECT id FROM photo_galleries WHERE photographer_id = (SELECT auth.uid())
      )
    );
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add admin policy if missing
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all photos" ON photos;
CREATE POLICY "Admins can manage all photos"
ON photos
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = (SELECT auth.uid())
    AND user_type = 'admin'
  )
);

-- ============================================================================
-- STEP 6: Ensure RLS is enabled
-- ============================================================================

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Add performance index (if not exists)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- ============================================================================
-- VERIFICATION: Test the fix
-- ============================================================================
-- Run this after applying the migration to verify it works:
/*
-- Impersonate betaclient2
SELECT set_config('request.jwt.claims',
  '{"sub": "2562e80b-1e7e-4c70-a53e-2031b4fa295e", "role": "authenticated"}',
  true);
SET ROLE authenticated;

-- This should now return the photo
SELECT id, gallery_id, is_favorite
FROM photos
WHERE id = '3107f6f3-5f9a-4f85-b975-fe66c3bd0d1b';

-- Reset
RESET ROLE;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
```

---

## Also Fix: `gallery_photos` Table (if needed)

The `gallery_photos` table may have the same issue. Check and fix if necessary:

```sql
-- Check current gallery_photos policies
SELECT policyname, cmd, qual::text as using_clause
FROM pg_policies WHERE tablename = 'gallery_photos';

-- If policies reference `galleries` table (old), update to use photo_galleries
-- Note: gallery_photos.gallery_id may still FK to `galleries` (old table)
-- If so, that's a separate FK migration issue

-- For now, ensure the RLS pattern is correct for whichever table it references
DROP POLICY IF EXISTS "Users can view photos from own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Users can update photos in own galleries" ON gallery_photos;

CREATE POLICY "Users can view photos from own galleries"
ON gallery_photos
FOR SELECT
TO authenticated
USING (
  gallery_id IN (
    SELECT id FROM galleries WHERE user_id = (SELECT auth.uid())
  )
  OR
  gallery_id IN (
    SELECT id FROM galleries
    WHERE photographer_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can update photos in own galleries"
ON gallery_photos
FOR UPDATE
TO authenticated
USING (
  gallery_id IN (
    SELECT id FROM galleries WHERE user_id = (SELECT auth.uid())
  )
  OR
  gallery_id IN (
    SELECT id FROM galleries
    WHERE photographer_id = (SELECT auth.uid())
  )
);
```

---

## Testing Steps

### 1. Pre-Fix Verification

Run the diagnostic queries (Section 3) and confirm:
- Query 5 returns FALSE (broken policy)
- Query 6 returns TRUE (fix would work)

### 2. Apply the Migration

```sql
-- Run the migration SQL from Step 4
```

### 3. Post-Fix Verification

```sql
-- Impersonate the client
SELECT set_config('request.jwt.claims',
  '{"sub": "2562e80b-1e7e-4c70-a53e-2031b4fa295e", "role": "authenticated"}',
  true);
SET ROLE authenticated;

-- Query should now return the photo
SELECT id, gallery_id, is_favorite
FROM photos
WHERE id = '3107f6f3-5f9a-4f85-b975-fe66c3bd0d1b';

-- Update should work
UPDATE photos
SET is_favorite = NOT is_favorite
WHERE id = '3107f6f3-5f9a-4f85-b975-fe66c3bd0d1b';

-- Verify update worked
SELECT id, is_favorite
FROM photos
WHERE id = '3107f6f3-5f9a-4f85-b975-fe66c3bd0d1b';

RESET ROLE;
```

### 4. UI Verification

1. Log in as betaclient2
2. Navigate to the "shared galleries" gallery
3. Click the favorite heart on any photo
4. Verify:
   - No error toast
   - Heart icon toggles state
   - Page refresh shows persisted state

---

## Why This Fix Is Correct

### The Correct FK Relationship Chain

```
auth.uid() (user's login ID)
    |
    v
clients.user_id (FK to auth.users)
    |
    v
clients.id (client record ID)
    |
    v
photo_galleries.client_id (FK to clients)
    |
    v
photos.gallery_id (FK to photo_galleries)
```

### The Correct RLS Pattern

```sql
-- WRONG (what was there):
WHERE client_id = auth.uid()  -- Compares client.id to user.id - NEVER matches!

-- RIGHT (the fix):
WHERE client_id IN (SELECT id FROM clients WHERE user_id = (SELECT auth.uid()))
-- Translates to: Find galleries where the assigned client's user_id matches my auth.uid()
```

### Performance Considerations

1. `(SELECT auth.uid())` is wrapped in a subquery to cache the value per statement
2. `idx_clients_user_id` index added to speed up the subquery
3. The subquery `SELECT id FROM clients WHERE user_id = ...` is small (1-3 clients per user typically)

---

## Files Modified

| File | Change |
|------|--------|
| Database | New RLS policies on `photos` table |
| `database/fix-photos-table-rls-for-clients.sql` | New migration file (to be created) |

## Files Unmodified

| File | Reason |
|------|--------|
| `src/app/api/photos/[id]/favorite/route.ts` | API code is correct, RLS was blocking |

---

## Rollback Plan

If the fix causes issues:

```sql
-- Remove new policies
DROP POLICY IF EXISTS "Clients can view photos in assigned galleries" ON photos;
DROP POLICY IF EXISTS "Clients can update photos in assigned galleries" ON photos;

-- Restore original (broken) policy
CREATE POLICY "Clients can view photos in assigned galleries"
ON photos
FOR SELECT
USING (
  gallery_id IN (
    SELECT id FROM photo_galleries WHERE client_id = auth.uid()
  )
);
```

---

## Checklist

- [ ] Run diagnostic queries to confirm diagnosis
- [ ] Apply migration SQL in Supabase SQL Editor
- [ ] Test with role impersonation in SQL Editor
- [ ] Test favorite toggle in UI as betaclient2
- [ ] Verify photographer access still works
- [ ] Create `database/fix-photos-table-rls-for-clients.sql` file for version control
