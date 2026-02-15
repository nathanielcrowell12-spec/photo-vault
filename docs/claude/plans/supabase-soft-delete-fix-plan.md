# Supabase Soft-Delete Fix Plan

**Date:** 2026-02-14
**Author:** Supabase Expert Agent
**Status:** Ready for review

---

## Summary

Gallery soft-delete is completely broken. When users click "Delete Gallery," the gallery is **permanently hard-deleted** from the database. The "Recently Deleted" page always shows empty because the required database columns (`status`, `deleted_at`) were never added to the `photo_galleries` table.

**Root Causes:**
1. The migration file `database/soft-delete-fixed.sql` was never executed against the production database, AND it targets the wrong table name (`galleries` instead of `photo_galleries`).
2. The "Recently Deleted" page queries by `status = 'deleted'` and `deleted_at`, but those columns do not exist. Error: `column photo_galleries.deleted_at does not exist`.
3. Gallery listing components (`GalleryGrid.tsx`, photographer galleries, etc.) do not filter by `status`, so once the column exists, soft-deleted galleries would still appear in normal views.

**Fix Strategy:** Application-level filtering only. We will NOT modify existing RLS policies because:
- RLS policy changes are high-risk and could break existing access patterns.
- The existing `soft-delete-fixed.sql` tried to drop and recreate RLS policies on the wrong table (`galleries`) which would have broken the app.
- Application-level `.eq('status', 'active')` filters are safer, testable, and reversible.

---

## Phase 1: Database Migration

### Migration SQL (ready to paste into Supabase SQL Editor)

```sql
-- ============================================================================
-- PhotoVault Soft-Delete Migration for photo_galleries
-- Target: photo_galleries (NOT galleries)
-- Date: 2026-02-14
-- ============================================================================

-- ==========================================================
-- STEP 1: Add columns to photo_galleries
-- ==========================================================
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Set all existing rows to 'active' (safety net for any rows inserted
-- between column add and default taking effect - unlikely but defensive)
UPDATE photo_galleries SET status = 'active' WHERE status IS NULL;

-- ==========================================================
-- STEP 2: Add index on status for query performance
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_photo_galleries_status
ON photo_galleries (status);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_deleted_at
ON photo_galleries (deleted_at)
WHERE deleted_at IS NOT NULL;

-- ==========================================================
-- STEP 3: Create the soft-delete trigger function
-- Uses SECURITY DEFINER so the trigger can UPDATE the row
-- even though the original operation was a DELETE.
-- The trigger intercepts DELETE, converts it to an UPDATE
-- setting status='deleted' and deleted_at=NOW(), then
-- returns NULL to cancel the actual DELETE.
-- ==========================================================
CREATE OR REPLACE FUNCTION soft_delete_gallery()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Mark the gallery as deleted instead of actually deleting it
    UPDATE photo_galleries
    SET status = 'deleted', deleted_at = NOW()
    WHERE id = OLD.id;

    -- Return NULL to prevent the actual DELETE from proceeding
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================
-- STEP 4: Create BEFORE DELETE trigger on photo_galleries
-- ==========================================================
DROP TRIGGER IF EXISTS handle_soft_delete_gallery ON photo_galleries;

CREATE TRIGGER handle_soft_delete_gallery
BEFORE DELETE ON photo_galleries
FOR EACH ROW
EXECUTE FUNCTION soft_delete_gallery();

-- ==========================================================
-- STEP 5: Create function for permanent deletion (cron job)
-- This function permanently deletes galleries (and their photos)
-- that have been soft-deleted for more than 30 days.
--
-- IMPORTANT: This function disables the soft-delete trigger
-- temporarily so the DELETE actually removes the row.
-- ==========================================================
CREATE OR REPLACE FUNCTION permanent_delete_old_galleries()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Disable the soft-delete trigger temporarily
    ALTER TABLE photo_galleries DISABLE TRIGGER handle_soft_delete_gallery;

    -- Delete photos from both tables for expired galleries
    DELETE FROM gallery_photos
    WHERE gallery_id IN (
        SELECT id FROM photo_galleries
        WHERE status = 'deleted'
        AND deleted_at < NOW() - INTERVAL '30 days'
    );

    DELETE FROM photos
    WHERE gallery_id IN (
        SELECT id FROM photo_galleries
        WHERE status = 'deleted'
        AND deleted_at < NOW() - INTERVAL '30 days'
    );

    -- Now permanently delete the galleries
    DELETE FROM photo_galleries
    WHERE status = 'deleted'
    AND deleted_at < NOW() - INTERVAL '30 days';

    -- Re-enable the soft-delete trigger
    ALTER TABLE photo_galleries ENABLE TRIGGER handle_soft_delete_gallery;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================
-- STEP 6: Verification queries (run after migration)
-- ==========================================================
-- Verify columns exist:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'photo_galleries'
-- AND column_name IN ('status', 'deleted_at');

-- Verify trigger exists:
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE event_object_table = 'photo_galleries';

-- Verify all existing rows are 'active':
-- SELECT status, count(*) FROM photo_galleries GROUP BY status;
```

### What This Migration Does NOT Do (And Why)

1. **Does NOT modify RLS policies.** Existing RLS policies on `photo_galleries` check `photographer_id`, `user_id`, and `client_id` for access. They do not filter by `status`. After this migration, RLS will still allow access to both active and deleted galleries. We handle the filtering in application code. This is safer because:
   - Modifying RLS policies could lock users out of their galleries if done incorrectly.
   - Application-level filters are easily testable and reversible.
   - The old migration (`soft-delete-fixed.sql`) tried to modify RLS on the wrong table.

2. **Does NOT add soft-delete to `gallery_photos` or `photos`.** Photos are not individually soft-deleted. When a gallery is soft-deleted, the photos remain linked to it. When the gallery is restored, photos are still there. When the gallery is permanently deleted (30-day cron), photos are deleted with it. This is simpler and avoids cascading status columns.

3. **Does NOT add soft-delete to the `galleries` table.** The `galleries` table (24 rows) is a separate alternate table that is not used by the current delete flow. The delete API route targets `photo_galleries` exclusively.

---

## Phase 2: Application Code Changes

### Priority 1 (Critical) -- Gallery Listing Filters

These files display galleries to users and MUST filter out soft-deleted galleries. Without these changes, deleted galleries will still appear in normal views.

#### File 1: `src/components/GalleryGrid.tsx`

**What:** Main gallery grid used by client dashboard. Queries `photo_galleries` directly.

**Changes needed at 3 locations:**

Location A -- Photographer query (line ~107):
```typescript
// BEFORE:
.eq('photographer_id', userId)
.order('created_at', { ascending: false })

// AFTER:
.eq('photographer_id', userId)
.eq('status', 'active')
.order('created_at', { ascending: false })
```

Location B -- Client query with client_id (line ~162):
```typescript
// BEFORE:
.or(`client_id.in.(${clientIds.join(',')}),user_id.eq.${userId}`)
.order('created_at', { ascending: false })

// AFTER:
.or(`client_id.in.(${clientIds.join(',')}),user_id.eq.${userId}`)
.eq('status', 'active')
.order('created_at', { ascending: false })
```

Location C -- Client query without client records (line ~172):
```typescript
// BEFORE:
.eq('user_id', userId)
.is('photographer_id', null)
.order('created_at', { ascending: false })

// AFTER:
.eq('user_id', userId)
.is('photographer_id', null)
.eq('status', 'active')
.order('created_at', { ascending: false })
```

#### File 2: `src/app/photographer/galleries/page.tsx`

**What:** Photographer's gallery management page. Has two query paths: search API and direct fallback.

Change A -- Direct query fallback (`fetchGalleriesDirect`, line ~177):
```typescript
// BEFORE:
.eq('photographer_id', user.id)
.order('created_at', { ascending: false })

// AFTER:
.eq('photographer_id', user.id)
.eq('status', 'active')
.order('created_at', { ascending: false })
```

Change B -- The search API route also needs filtering (see File 5 below).

#### File 3: `src/app/api/client/stats/route.ts`

**What:** Client dashboard stats (gallery count, photo count, recent galleries). Must exclude deleted galleries from counts and recent list.

Change A -- Gallery count query (line ~33):
```typescript
// BEFORE:
.in('client_id', clientIds)

// AFTER:
.in('client_id', clientIds)
.eq('status', 'active')
```

Change B -- Gallery IDs for photo count (line ~43):
```typescript
// BEFORE:
.in('client_id', clientIds)

// AFTER:
.in('client_id', clientIds)
.eq('status', 'active')
```

Change C -- Recent galleries query (line ~72):
```typescript
// BEFORE:
.in('client_id', clientIds)
.order('created_at', { ascending: false })

// AFTER:
.in('client_id', clientIds)
.eq('status', 'active')
.order('created_at', { ascending: false })
```

#### File 4: `src/app/api/client/timeline/route.ts`

**What:** Client timeline view. Must exclude deleted galleries.

Change (line ~84):
```typescript
// BEFORE:
.in('client_id', clientIds)

// AFTER:
.in('client_id', clientIds)
.eq('status', 'active')
```

#### File 5: `src/app/api/photographer/galleries/search/route.ts`

**What:** Photographer gallery search API. Uses an RPC function `search_galleries`.

The `search_galleries` database function needs to be updated to filter by status. Since we cannot see the function definition in the schema catalog, we have two options:

**Option A (Preferred):** Modify the `search_galleries` RPC function to add a `WHERE status = 'active'` filter. This would be an additional SQL migration:

```sql
-- If the search_galleries function exists, update it to filter by status.
-- You'll need to check the current function definition first:
-- SELECT prosrc FROM pg_proc WHERE proname = 'search_galleries';
-- Then add: AND status = 'active' to its WHERE clause.
```

**Option B (Fallback):** Filter results in the API route after the RPC call:
```typescript
// After line 48, add:
const activeGalleries = (galleries || []).filter(
  (g: { status?: string }) => g.status !== 'deleted'
)
// Then use activeGalleries instead of galleries for the rest of the function.
```

#### File 6: `src/app/api/photographer/galleries/filter-options/route.ts`

**What:** Provides filter dropdown options (years, locations, people) for the photographer gallery page.

Change (line ~17):
```typescript
// BEFORE:
.eq('photographer_id', user.id)

// AFTER:
.eq('photographer_id', user.id)
.eq('status', 'active')
```

#### File 7: `src/app/api/photographer/stats/route.ts`

**What:** Photographer dashboard stats. Gallery count should exclude deleted.

Change (line ~36):
```typescript
// BEFORE:
.eq('photographer_id', user.id)

// AFTER:
.eq('photographer_id', user.id)
.eq('status', 'active')
```

#### File 8: `src/app/api/family/shared-galleries/route.ts`

**What:** Family shared galleries. Must not show deleted galleries to family members.

Change A -- Query by client_id (line ~111):
```typescript
// BEFORE:
.in('client_id', accountIds)
.eq('is_family_shared', true)

// AFTER:
.in('client_id', accountIds)
.eq('is_family_shared', true)
.eq('status', 'active')
```

Change B -- Query by user_id (line ~129):
```typescript
// BEFORE:
.in('user_id', accountIds)
.eq('is_family_shared', true)

// AFTER:
.in('user_id', accountIds)
.eq('is_family_shared', true)
.eq('status', 'active')
```

### Priority 2 -- Already Working (Verify Only)

#### File 9: `src/app/client/deleted/page.tsx`

**What:** Recently Deleted page. Already correctly queries `.eq('status', 'deleted')`.

**No code changes needed.** This file was already patched in a previous session to use the `user_id` fallback pattern. Once the database columns exist, it will work.

#### File 10: `src/app/api/galleries/[id]/route.ts`

**What:** DELETE handler (triggers soft-delete) and POST handler (restores).

**No code changes needed.** The DELETE handler issues `.delete()` which the trigger intercepts. The POST handler already calls `.update({ status: 'active', deleted_at: null })` for restoration.

### Priority 3 -- Lower Risk (Should Still Be Updated)

These files query `photo_galleries` but for specific gallery IDs or non-listing purposes. They are lower risk but should be reviewed:

| File | Risk | Notes |
|------|------|-------|
| `src/app/gallery/[galleryId]/page.tsx` | Low | Single gallery view by ID. A user could still view a deleted gallery directly via URL. Consider adding a `.eq('status', 'active')` check or showing a "This gallery has been deleted" message. |
| `src/app/api/gallery/[galleryId]/route.ts` | Low | Gallery detail API. Similar to above. |
| `src/app/api/client/favorites/route.ts` | Low | Favorites query. Deleted gallery photos could appear in favorites. Should filter by gallery status. |
| `src/app/api/stripe/webhook/route.ts` | None | Payment processing. Should process payments for any gallery status. |
| `src/app/api/v1/upload/prepare/route.ts` | None | Desktop upload. Creates new galleries, not affected. |
| `src/app/api/v1/upload/process-chunked/route.ts` | None | Desktop upload processing. Not affected. |

---

## Phase 3: Testing Steps

### 3.1 Post-Migration Verification (Database)

Run these queries in Supabase SQL Editor after applying the migration:

```sql
-- 1. Verify columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'photo_galleries'
AND column_name IN ('status', 'deleted_at');
-- Expected: 2 rows (status TEXT default 'active', deleted_at TIMESTAMPTZ)

-- 2. Verify all existing galleries are 'active'
SELECT status, count(*) FROM photo_galleries GROUP BY status;
-- Expected: 1 row: status='active', count=44

-- 3. Verify trigger exists
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'photo_galleries';
-- Expected: handle_soft_delete_gallery, DELETE, BEFORE

-- 4. Verify indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'photo_galleries'
AND indexname LIKE '%status%' OR indexname LIKE '%deleted_at%';
```

### 3.2 Soft-Delete Flow Test

1. **Delete a gallery:** Go to photographer or client dashboard, click Delete on a gallery, confirm.
   - Expected: Gallery disappears from the grid. Toast says "moved to Recently Deleted."
   - Verify in DB: `SELECT status, deleted_at FROM photo_galleries WHERE id = '<gallery_id>'` should show `status='deleted'`, `deleted_at` is set.

2. **Check Recently Deleted page:** Navigate to `/client/deleted`.
   - Expected: The deleted gallery appears with a countdown (30 days).

3. **Restore a gallery:** Click "Restore" on the Recently Deleted page.
   - Expected: Gallery reappears in the main gallery grid.
   - Verify in DB: `status='active'`, `deleted_at=NULL`.

4. **Verify gallery doesn't appear elsewhere:**
   - Client dashboard stats should not count deleted galleries.
   - Timeline should not show deleted galleries.
   - Family shared galleries should not show deleted galleries.
   - Photographer galleries page should not show deleted galleries.
   - Search should not return deleted galleries.

### 3.3 Edge Case Tests

1. **Direct URL access to deleted gallery:** Navigate to `/gallery/<deleted-gallery-id>`.
   - Current behavior: Gallery will still be visible (no filter on single-gallery view). This is acceptable for Phase 1 but should be addressed in Phase 3 (Priority 3).

2. **Photographer and client both see the gallery disappear:** If photographer deletes, client should not see it. If client deletes, photographer should not see it.

3. **Gallery with active subscription:** Attempting to delete should fail with a 409 error (FK constraint on `subscriptions` table). This already works via the FK constraint.

---

## Gotchas and Warnings

### 1. The `galleries` table is NOT `photo_galleries`
The schema catalog confirms these are DIFFERENT tables:
- `photo_galleries` (44 rows): Photographer-created galleries for clients. This is the PRIMARY gallery table. **All changes in this plan target this table.**
- `galleries` (24 rows): User-owned galleries with a different structure. This table is NOT affected by this fix.

### 2. The old migration `soft-delete-fixed.sql` must NOT be run
The file `database/soft-delete-fixed.sql` references `galleries` (wrong table) everywhere and modifies RLS policies dangerously. It should be considered obsolete. Do NOT run it.

### 3. Foreign key constraints protect against accidental deletion
The `subscriptions` table has a FK to `photo_galleries.id`. If a gallery has an active subscription, the DELETE will fail with a 23503 FK violation error. The API route already handles this (returns 409). The soft-delete trigger will never fire in this case because the FK check happens before the trigger.

### 4. Previously deleted galleries are gone forever
Any galleries deleted before this migration was applied were hard-deleted. There is no way to recover them. The `photo_count` on remaining galleries is still accurate, but the actual gallery rows are gone.

### 5. The `gallery_photos` table has no RLS
Per the schema catalog, `gallery_photos` has NO RLS. This means the service role client and the browser client can both access it without RLS restrictions. Photos are not individually soft-deleted; they remain attached to the gallery.

### 6. The `search_galleries` RPC function
This function is defined in the database and may need its own migration to add a `status = 'active'` filter. If the function is not updated, the fallback Option B (filter in JS) should be used. Check the function definition with:
```sql
SELECT prosrc FROM pg_proc WHERE proname = 'search_galleries';
```

### 7. The permanent deletion cron job is NOT set up
The `permanent_delete_old_galleries()` function is created by this migration, but no cron job or edge function calls it yet. This needs to be set up separately (Supabase pg_cron or an Edge Function on a schedule). Until then, soft-deleted galleries will remain indefinitely (which is safe but consumes storage).

### 8. Order of operations matters
1. Apply the database migration FIRST.
2. THEN deploy the application code changes.
3. If code is deployed before the migration, queries with `.eq('status', 'active')` will fail because the column does not exist yet.

If deploying in a zero-downtime manner is critical, the code changes should use a defensive pattern:
```typescript
// Defensive: only add status filter if the column exists
// This is NOT recommended long-term but can be used during rollout
```
In practice, since this is a single Supabase project with a Next.js deploy on Vercel, the recommended approach is:
1. Run the SQL migration in Supabase SQL Editor (takes seconds).
2. Immediately push the code changes to Vercel.
3. The brief window where old code runs against new schema is safe (old code does `.select('*')` which will now include `status='active'` in results, but won't filter -- galleries will still appear, which is the current behavior).

---

## Files Summary

| File | Change Type | Priority |
|------|------------|----------|
| **Database: New migration SQL** | Add `status`, `deleted_at`, trigger, indexes | P0 |
| `src/components/GalleryGrid.tsx` | Add `.eq('status', 'active')` at 3 locations | P1 |
| `src/app/photographer/galleries/page.tsx` | Add `.eq('status', 'active')` in direct query | P1 |
| `src/app/api/client/stats/route.ts` | Add `.eq('status', 'active')` at 3 locations | P1 |
| `src/app/api/client/timeline/route.ts` | Add `.eq('status', 'active')` at 1 location | P1 |
| `src/app/api/photographer/galleries/search/route.ts` | Filter deleted from search results | P1 |
| `src/app/api/photographer/galleries/filter-options/route.ts` | Add `.eq('status', 'active')` at 1 location | P1 |
| `src/app/api/photographer/stats/route.ts` | Add `.eq('status', 'active')` at 1 location | P1 |
| `src/app/api/family/shared-galleries/route.ts` | Add `.eq('status', 'active')` at 2 locations | P1 |
| `src/app/client/deleted/page.tsx` | No changes needed (already correct) | -- |
| `src/app/api/galleries/[id]/route.ts` | No changes needed (already correct) | -- |
| `src/app/gallery/[galleryId]/page.tsx` | Consider adding deleted gallery handling | P3 |
| `src/app/api/client/favorites/route.ts` | Consider filtering by gallery status | P3 |

**Total application files to modify: 8**
**Total new database objects: 2 columns, 2 indexes, 2 functions, 1 trigger**
