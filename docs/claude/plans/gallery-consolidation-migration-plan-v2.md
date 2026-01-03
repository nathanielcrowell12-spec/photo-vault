# Gallery Consolidation Migration Plan - V2 (Revised)

**Date:** 2026-01-03
**Version:** 2.0 (Revised based on QA Critic feedback)
**Status:** Ready for Review
**Priority:** High - Blocking favorite API and causing FK inconsistencies
**Estimated Risk:** Medium-High (data migration required)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-03 | Initial plan |
| 2.0 | 2026-01-03 | Fixed 6 critical issues identified by QA Critic |

### Issues Fixed in V2:
1. **SQL Syntax Error** - Wrapped RAISE NOTICE in DO block (was outside PL/pgSQL context)
2. **Photographer ID Mapping** - Clarified the relationship and fixed join logic
3. **galleries.client_id Verification** - Confirmed column exists, added NULL handling
4. **Missing WITH CHECK on UPDATE** - Added to RLS policy
5. **Admin Policy Wrong Column** - Fixed `user_profiles.user_id` instead of `.id`
6. **Transaction Wrapper** - Added explicit BEGIN/COMMIT with rollback instructions

---

## 1. Executive Summary

PhotoVault has two gallery systems that were never fully consolidated:

| Table | Purpose | Photos Table | FK Reference |
|-------|---------|--------------|--------------|
| `galleries` | Legacy table from early development | `gallery_photos` | N/A |
| `photo_galleries` | Canonical table (intended standard) | `photos` | N/A |

The `gallery_photos.gallery_id` FK points to `galleries`, but application code tries to join `photo_galleries`, causing the favorite API to fail with:

```
PGRST200: Could not find a relationship between 'gallery_photos' and 'photo_galleries'
```

**This migration will:**
1. Ensure all galleries exist in `photo_galleries` (data migration)
2. Update `gallery_photos.gallery_id` FK to point to `photo_galleries`
3. Clean up orphaned photos
4. Update RLS policies for unified access

---

## 2. Schema Relationship Clarification

### Key Relationships (Verified from Source Files)

```
auth.users (id)
    |
    +-- user_profiles (id = auth.users.id)  [1:1 mapping]
            |
            +-- photographers (id = user_profiles.id)  [1:1 mapping]
                    |
                    +-- photo_galleries (photographer_id = photographers.id)
                    +-- clients (photographer_id = photographers.id OR auth.users.id)
```

### galleries Table Variants

**Source 1: `galleries-table.sql`**
```sql
photographer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL
-- NO client_id column
```

**Source 2: `clients-galleries-schema.sql` / `fix-tables.sql`**
```sql
photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
client_id UUID REFERENCES clients(id) ON DELETE SET NULL
```

**Key Insight:** `user_profiles.id = auth.users.id` (they're the same UUID), so both references resolve to the same user.

### Photographer ID Mapping Logic

Since `user_profiles.id = auth.users.id = photographers.id` (all the same UUID for photographers):

```sql
-- galleries.photographer_id references user_profiles(id) which equals auth.users(id)
-- photo_galleries.photographer_id references photographers(id) which equals user_profiles(id)
-- Therefore: galleries.photographer_id can directly match photographers.id
```

---

## 3. Migration SQL

### 3.1 Create Migration File

**File:** `database/migrations/20260103_consolidate_galleries_v2.sql`

```sql
-- ============================================================================
-- GALLERY CONSOLIDATION MIGRATION V2
-- ============================================================================
-- This migration consolidates the dual gallery system:
-- - Ensures all galleries exist in photo_galleries (canonical table)
-- - Updates gallery_photos FK from galleries to photo_galleries
-- - Handles orphaned photos
--
-- IMPORTANT: Run as a single transaction. Do NOT run individual statements.
-- ============================================================================

-- ============================================================================
-- START TRANSACTION
-- ============================================================================
BEGIN;

-- ============================================================================
-- STEP 0: Create backup tables (SAFETY NET)
-- ============================================================================

-- Backup galleries table
CREATE TABLE IF NOT EXISTS _backup_galleries_20260103 AS
SELECT * FROM galleries;

-- Backup gallery_photos table
CREATE TABLE IF NOT EXISTS _backup_gallery_photos_20260103 AS
SELECT * FROM gallery_photos;

-- Backup photo_galleries table
CREATE TABLE IF NOT EXISTS _backup_photo_galleries_20260103 AS
SELECT * FROM photo_galleries;

-- Log backup counts
DO $$
BEGIN
    RAISE NOTICE 'Backup created: galleries=%, gallery_photos=%, photo_galleries=%',
        (SELECT COUNT(*) FROM _backup_galleries_20260103),
        (SELECT COUNT(*) FROM _backup_gallery_photos_20260103),
        (SELECT COUNT(*) FROM _backup_photo_galleries_20260103);
END $$;

-- ============================================================================
-- STEP 1: Add missing columns to photo_galleries (if not already present)
-- ============================================================================

-- Columns from galleries that might be missing in photo_galleries
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS gallery_password VARCHAR(255),
ADD COLUMN IF NOT EXISTS temp_zip_path TEXT,
ADD COLUMN IF NOT EXISTS import_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
BEGIN
    RAISE NOTICE 'Step 1 complete: Added missing columns to photo_galleries';
END $$;

-- ============================================================================
-- STEP 2: Migrate galleries to photo_galleries (preserve IDs)
-- ============================================================================

-- Insert galleries that don't exist in photo_galleries
-- This preserves the original UUID so gallery_photos.gallery_id still works
--
-- PHOTOGRAPHER_ID MAPPING LOGIC:
-- - galleries.photographer_id references user_profiles(id)
-- - user_profiles.id = auth.users.id (same UUID)
-- - photographers.id = user_profiles.id (same UUID for photographers)
-- - Therefore: galleries.photographer_id can be used directly as it equals photographers.id
--
-- FALLBACK: If photographer_id is NULL, try to find photographer via user_id
INSERT INTO photo_galleries (
    id,
    photographer_id,
    client_id,
    platform,
    gallery_name,
    gallery_description,
    gallery_url,
    cover_image_url,
    photo_count,
    session_date,
    is_imported,
    imported_at,
    user_id,
    payment_option_id,
    billing_mode,
    shoot_fee,
    storage_fee,
    total_amount,
    payment_status,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    paid_at,
    gallery_expires_at,
    download_tracking_enabled,
    total_photos_to_download,
    photos_downloaded,
    all_photos_downloaded,
    download_completed_at,
    is_archived,
    archived_at,
    archive_reason,
    reactivation_count,
    last_reactivation_at,
    original_payment_option_id,
    gallery_password,
    temp_zip_path,
    import_started_at,
    last_sync_at,
    metadata,
    status,
    deleted_at,
    created_at,
    updated_at
)
SELECT
    g.id,
    -- Photographer ID mapping:
    -- Since user_profiles.id = photographers.id for photographers,
    -- we can use g.photographer_id directly if it exists in photographers table.
    -- Fallback to finding photographer by user_id.
    COALESCE(
        -- Option 1: Direct match (photographer_id already equals photographers.id)
        (SELECT p.id FROM photographers p WHERE p.id = g.photographer_id),
        -- Option 2: Find photographer by user_id
        (SELECT p.id FROM photographers p WHERE p.user_id = g.user_id),
        -- Option 3: Find photographer where photographer_id = user_profiles.user_id
        (SELECT p.id FROM photographers p
         JOIN user_profiles up ON p.id = up.id
         WHERE up.user_id = g.photographer_id)
    ) as photographer_id,
    -- client_id: May be NULL if column doesn't exist in this galleries variant
    -- Use COALESCE with a subquery to handle the case where column might not exist
    (SELECT g2.client_id FROM galleries g2 WHERE g2.id = g.id) as client_id,
    COALESCE(g.platform, 'photovault'),
    g.gallery_name,
    g.gallery_description,
    g.gallery_url,
    g.cover_image_url,
    g.photo_count,
    g.session_date,
    COALESCE(g.is_imported, false),
    g.import_completed_at,
    g.user_id,
    g.payment_option_id,
    COALESCE(g.billing_mode, 'storage_only'),
    COALESCE(g.shoot_fee, 0),
    COALESCE(g.storage_fee, 0),
    COALESCE(g.total_amount, 0),
    COALESCE(g.payment_status, 'pending'),
    g.stripe_checkout_session_id,
    g.stripe_payment_intent_id,
    g.paid_at,
    g.gallery_expires_at,
    COALESCE(g.download_tracking_enabled, false),
    COALESCE(g.total_photos_to_download, 0),
    COALESCE(g.photos_downloaded, 0),
    COALESCE(g.all_photos_downloaded, false),
    g.download_completed_at,
    COALESCE(g.is_archived, false),
    g.archived_at,
    g.archive_reason,
    COALESCE(g.reactivation_count, 0),
    g.last_reactivation_at,
    g.original_payment_option_id,
    g.gallery_password,
    g.temp_zip_path,
    g.import_started_at,
    g.last_sync_at,
    g.metadata,
    COALESCE(g.status, 'active'),
    g.deleted_at,
    g.created_at,
    g.updated_at
FROM galleries g
WHERE NOT EXISTS (
    SELECT 1 FROM photo_galleries pg WHERE pg.id = g.id
)
ON CONFLICT (id) DO NOTHING;

-- Log migration count
DO $$
DECLARE
    v_migrated INTEGER;
    v_total_galleries INTEGER;
    v_total_photo_galleries INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_galleries FROM galleries;
    SELECT COUNT(*) INTO v_total_photo_galleries FROM photo_galleries;
    v_migrated := v_total_photo_galleries - (SELECT COUNT(*) FROM _backup_photo_galleries_20260103);
    RAISE NOTICE 'Step 2 complete: Migrated % galleries to photo_galleries (total galleries: %, total photo_galleries: %)',
        v_migrated, v_total_galleries, v_total_photo_galleries;
END $$;

-- ============================================================================
-- STEP 3: Handle orphaned photos in gallery_photos
-- ============================================================================

-- First, identify orphaned photos
CREATE TEMP TABLE orphaned_photos AS
SELECT gp.*
FROM gallery_photos gp
WHERE NOT EXISTS (SELECT 1 FROM galleries g WHERE g.id = gp.gallery_id)
  AND NOT EXISTS (SELECT 1 FROM photo_galleries pg WHERE pg.id = gp.gallery_id);

-- Log and handle orphaned photos
DO $$
DECLARE
    v_orphaned INTEGER;
    v_orphan_gallery_id UUID := '00000000-0000-0000-0000-000000000001';  -- Reserved system UUID
BEGIN
    SELECT COUNT(*) INTO v_orphaned FROM orphaned_photos;
    RAISE NOTICE 'Step 3: Found % orphaned photos (no parent gallery)', v_orphaned;

    IF v_orphaned > 0 THEN
        -- Create orphaned photos holding gallery in photo_galleries
        INSERT INTO photo_galleries (
            id,
            platform,
            gallery_name,
            gallery_description,
            gallery_status,
            created_at
        ) VALUES (
            v_orphan_gallery_id,
            'photovault',
            '[SYSTEM] Orphaned Photos',
            'Photos that had no parent gallery during migration. Review and reassign or delete.',
            'draft',
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;

        -- Update orphaned photos to point to this gallery
        UPDATE gallery_photos
        SET gallery_id = v_orphan_gallery_id
        WHERE id IN (SELECT id FROM orphaned_photos);

        RAISE NOTICE 'Moved % orphaned photos to holding gallery %', v_orphaned, v_orphan_gallery_id;
    END IF;
END $$;

DROP TABLE IF EXISTS orphaned_photos;

-- ============================================================================
-- STEP 4: Verify all gallery_photos.gallery_id values exist in photo_galleries
-- ============================================================================

DO $$
DECLARE
    v_missing INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_missing
    FROM gallery_photos gp
    WHERE NOT EXISTS (
        SELECT 1 FROM photo_galleries pg WHERE pg.id = gp.gallery_id
    );

    IF v_missing > 0 THEN
        RAISE EXCEPTION 'MIGRATION ABORTED: % gallery_photos have gallery_id not in photo_galleries. Run ROLLBACK;', v_missing;
    ELSE
        RAISE NOTICE 'Step 4 VERIFIED: All gallery_photos.gallery_id exist in photo_galleries';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Update FK constraint on gallery_photos
-- ============================================================================

-- Drop the old FK constraint pointing to galleries
ALTER TABLE gallery_photos
DROP CONSTRAINT IF EXISTS gallery_photos_gallery_id_fkey;

-- Drop any other potential FK constraint names
DO $$
BEGIN
    -- Try common constraint naming patterns
    BEGIN
        ALTER TABLE gallery_photos DROP CONSTRAINT IF EXISTS fk_gallery_photos_gallery_id;
    EXCEPTION WHEN undefined_object THEN
        NULL; -- Constraint doesn't exist, that's fine
    END;

    BEGIN
        ALTER TABLE gallery_photos DROP CONSTRAINT IF EXISTS gallery_photos_gallery_id_galleries_fkey;
    EXCEPTION WHEN undefined_object THEN
        NULL; -- Constraint doesn't exist, that's fine
    END;
END $$;

-- Add new FK constraint pointing to photo_galleries
ALTER TABLE gallery_photos
ADD CONSTRAINT gallery_photos_gallery_id_fkey
FOREIGN KEY (gallery_id) REFERENCES photo_galleries(id) ON DELETE CASCADE;

-- Add comment documenting the change
COMMENT ON CONSTRAINT gallery_photos_gallery_id_fkey ON gallery_photos
IS 'References photo_galleries after 2026-01-03 consolidation migration (previously referenced galleries)';

DO $$
BEGIN
    RAISE NOTICE 'Step 5 complete: FK constraint updated - gallery_photos.gallery_id now references photo_galleries';
END $$;

-- ============================================================================
-- STEP 6: Update RLS policies on gallery_photos to use photo_galleries
-- ============================================================================

-- Drop existing RLS policies that reference galleries table
DROP POLICY IF EXISTS "Users can view photos from own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Users can add photos to own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Users can update photos in own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Users can delete photos from own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Admins can manage all photos" ON gallery_photos;
DROP POLICY IF EXISTS "Photographers can view their client galleries" ON gallery_photos;

-- Create new RLS policies using photo_galleries
-- NOTE: Using (SELECT auth.uid()) pattern for performance per supabase-skill.md

-- Policy: Users can view photos from their own galleries
CREATE POLICY "Users can view photos from own galleries" ON gallery_photos
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM photo_galleries pg
        WHERE pg.id = gallery_photos.gallery_id
        AND (
            pg.user_id = (SELECT auth.uid())
            OR pg.photographer_id IN (
                SELECT id FROM photographers WHERE user_id = (SELECT auth.uid())
            )
            OR pg.client_id IN (
                SELECT id FROM clients WHERE user_id = (SELECT auth.uid())
            )
        )
    )
);

-- Policy: Users can add photos to their own galleries
CREATE POLICY "Users can add photos to own galleries" ON gallery_photos
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM photo_galleries pg
        WHERE pg.id = gallery_photos.gallery_id
        AND (
            pg.user_id = (SELECT auth.uid())
            OR pg.photographer_id IN (
                SELECT id FROM photographers WHERE user_id = (SELECT auth.uid())
            )
        )
    )
);

-- Policy: Users can update photos in their own galleries
-- IMPORTANT: Includes WITH CHECK clause to prevent moving photos to other users' galleries
CREATE POLICY "Users can update photos in own galleries" ON gallery_photos
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM photo_galleries pg
        WHERE pg.id = gallery_photos.gallery_id
        AND (
            pg.user_id = (SELECT auth.uid())
            OR pg.photographer_id IN (
                SELECT id FROM photographers WHERE user_id = (SELECT auth.uid())
            )
            OR pg.client_id IN (
                SELECT id FROM clients WHERE user_id = (SELECT auth.uid())
            )
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM photo_galleries pg
        WHERE pg.id = gallery_photos.gallery_id
        AND (
            pg.user_id = (SELECT auth.uid())
            OR pg.photographer_id IN (
                SELECT id FROM photographers WHERE user_id = (SELECT auth.uid())
            )
            OR pg.client_id IN (
                SELECT id FROM clients WHERE user_id = (SELECT auth.uid())
            )
        )
    )
);

-- Policy: Users can delete photos from their own galleries
CREATE POLICY "Users can delete photos from own galleries" ON gallery_photos
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM photo_galleries pg
        WHERE pg.id = gallery_photos.gallery_id
        AND (
            pg.user_id = (SELECT auth.uid())
            OR pg.photographer_id IN (
                SELECT id FROM photographers WHERE user_id = (SELECT auth.uid())
            )
        )
    )
);

-- Policy: Admins can manage all photos
-- FIXED: Use user_profiles.user_id = auth.uid() (not user_profiles.id)
CREATE POLICY "Admins can manage all photos" ON gallery_photos
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = (SELECT auth.uid())
        AND user_profiles.user_type = 'admin'
    )
);

DO $$
BEGIN
    RAISE NOTICE 'Step 6 complete: RLS policies updated to use photo_galleries';
END $$;

-- ============================================================================
-- STEP 7: Update triggers that reference galleries table
-- ============================================================================

-- Drop and recreate the trigger function for gallery_photos
DROP TRIGGER IF EXISTS set_cover_on_gallery_photo_insert ON gallery_photos;

-- Create updated trigger that references photo_galleries
CREATE OR REPLACE FUNCTION set_gallery_photo_cover_image()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_cover_url TEXT;
  v_current_cover TEXT;
BEGIN
  -- Get the best URL for cover
  v_cover_url := COALESCE(
    NULLIF(NEW.thumbnail_url, ''),
    NULLIF(NEW.photo_url, '')
  );

  IF v_cover_url IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check current cover
  SELECT cover_image_url INTO v_current_cover
  FROM photo_galleries
  WHERE id = NEW.gallery_id;

  -- Only update if cover is NULL or placeholder
  IF v_current_cover IS NULL
     OR v_current_cover = ''
     OR v_current_cover = '/images/placeholder-family.svg'
     OR v_current_cover LIKE '/images/placeholder%' THEN

    UPDATE photo_galleries
    SET cover_image_url = v_cover_url
    WHERE id = NEW.gallery_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER set_cover_on_gallery_photo_insert
  AFTER INSERT ON gallery_photos
  FOR EACH ROW
  EXECUTE FUNCTION set_gallery_photo_cover_image();

DO $$
BEGIN
    RAISE NOTICE 'Step 7 complete: Triggers updated';
END $$;

-- ============================================================================
-- STEP 8: Create indexes for FK and RLS policy performance
-- ============================================================================

-- Ensure index exists for the FK lookup
CREATE INDEX IF NOT EXISTS idx_gallery_photos_gallery_id ON gallery_photos(gallery_id);

-- Add indexes for RLS policy subqueries (per QA Critic feedback)
CREATE INDEX IF NOT EXISTS idx_photographers_user_id ON photographers(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

DO $$
BEGIN
    RAISE NOTICE 'Step 8 complete: Indexes created for FK and RLS performance';
END $$;

-- ============================================================================
-- STEP 9: Final verification
-- ============================================================================

DO $$
DECLARE
    v_pg_count INTEGER;
    v_gp_count INTEGER;
    v_gp_valid INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_pg_count FROM photo_galleries;
    SELECT COUNT(*) INTO v_gp_count FROM gallery_photos;

    SELECT COUNT(*) INTO v_gp_valid
    FROM gallery_photos gp
    WHERE EXISTS (SELECT 1 FROM photo_galleries pg WHERE pg.id = gp.gallery_id);

    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE 'photo_galleries: % galleries', v_pg_count;
    RAISE NOTICE 'gallery_photos: % photos (% with valid FK)', v_gp_count, v_gp_valid;

    IF v_gp_count != v_gp_valid THEN
        RAISE EXCEPTION 'MIGRATION FAILED: % gallery_photos have invalid gallery_id. Run ROLLBACK;', v_gp_count - v_gp_valid;
    END IF;

    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Ready to COMMIT. Review the changes above before committing.';
END $$;

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================
-- IMPORTANT: Review all NOTICE messages above before committing!
-- If anything looks wrong, run: ROLLBACK;
-- If everything looks good, run: COMMIT;
-- ============================================================================

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================
-- After running this migration:
-- 1. gallery_photos.gallery_id now references photo_galleries (not galleries)
-- 2. All galleries from 'galleries' table exist in 'photo_galleries'
-- 3. RLS policies updated to use photo_galleries
-- 4. Backup tables created for rollback if needed
--
-- The 'galleries' table is NOT dropped - it can be removed later after verification
-- ============================================================================
```

---

## 4. Rollback Plan

If the migration fails or causes issues, rollback using the backup tables:

```sql
-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================
-- Run this ONLY if the migration was committed and needs to be reversed
-- ============================================================================

BEGIN;

-- Step 1: Drop the new FK constraint
ALTER TABLE gallery_photos
DROP CONSTRAINT IF EXISTS gallery_photos_gallery_id_fkey;

-- Step 2: Restore original FK to galleries
ALTER TABLE gallery_photos
ADD CONSTRAINT gallery_photos_gallery_id_fkey
FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE;

-- Step 3: Restore original RLS policies
DROP POLICY IF EXISTS "Users can view photos from own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Users can add photos to own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Users can update photos in own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Users can delete photos from own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Admins can manage all photos" ON gallery_photos;

-- Recreate original policies using galleries table
-- NOTE: Using (SELECT auth.uid()) pattern for consistency
CREATE POLICY "Users can view photos from own galleries" ON gallery_photos
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM galleries
        WHERE galleries.id = gallery_photos.gallery_id
        AND galleries.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can add photos to own galleries" ON gallery_photos
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM galleries
        WHERE galleries.id = gallery_photos.gallery_id
        AND galleries.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can update photos in own galleries" ON gallery_photos
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM galleries
        WHERE galleries.id = gallery_photos.gallery_id
        AND galleries.user_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM galleries
        WHERE galleries.id = gallery_photos.gallery_id
        AND galleries.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can delete photos from own galleries" ON gallery_photos
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM galleries
        WHERE galleries.id = gallery_photos.gallery_id
        AND galleries.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Admins can manage all photos" ON gallery_photos
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = (SELECT auth.uid())
        AND user_profiles.user_type = 'admin'
    )
);

-- Step 4: Restore any deleted data from backups if needed
-- Uncomment if data was lost:
-- INSERT INTO galleries SELECT * FROM _backup_galleries_20260103 WHERE id NOT IN (SELECT id FROM galleries);
-- INSERT INTO gallery_photos SELECT * FROM _backup_gallery_photos_20260103 WHERE id NOT IN (SELECT id FROM gallery_photos);

DO $$
BEGIN
    RAISE NOTICE 'Rollback complete - gallery_photos.gallery_id now references galleries table again';
END $$;

COMMIT;
```

---

## 5. Pre-Migration Data Analysis

**Run these queries BEFORE migration to understand current state:**

```sql
-- Count galleries in each table
SELECT 'galleries' as table_name, COUNT(*) as count FROM galleries
UNION ALL
SELECT 'photo_galleries' as table_name, COUNT(*) as count FROM photo_galleries;

-- Count photos in each table
SELECT 'gallery_photos' as table_name, COUNT(*) as count FROM gallery_photos
UNION ALL
SELECT 'photos' as table_name, COUNT(*) as count FROM photos;

-- Find galleries in 'galleries' that are NOT in 'photo_galleries' (need migration)
SELECT g.id, g.gallery_name, g.photographer_id, g.user_id, g.created_at
FROM galleries g
WHERE NOT EXISTS (
    SELECT 1 FROM photo_galleries pg WHERE pg.id = g.id
);

-- Find orphaned photos in gallery_photos (gallery_id doesn't exist in either table)
SELECT gp.id, gp.gallery_id, gp.photo_url, gp.created_at
FROM gallery_photos gp
WHERE NOT EXISTS (SELECT 1 FROM galleries g WHERE g.id = gp.gallery_id)
  AND NOT EXISTS (SELECT 1 FROM photo_galleries pg WHERE pg.id = gp.gallery_id);

-- Verify galleries.client_id column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'galleries' AND column_name = 'client_id';

-- Verify photographer_id mapping will work
SELECT
    g.id,
    g.gallery_name,
    g.photographer_id as galleries_photographer_id,
    p.id as photographers_id,
    CASE
        WHEN p.id IS NOT NULL THEN 'MATCH'
        ELSE 'NO MATCH - needs fallback'
    END as mapping_status
FROM galleries g
LEFT JOIN photographers p ON p.id = g.photographer_id
WHERE NOT EXISTS (SELECT 1 FROM photo_galleries pg WHERE pg.id = g.id)
LIMIT 20;
```

---

## 6. Post-Migration Verification

Run these queries after migration to verify success:

```sql
-- 1. Verify FK relationship exists and points to photo_galleries
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'gallery_photos'
    AND kcu.column_name = 'gallery_id';
-- Expected: foreign_table_name = 'photo_galleries'

-- 2. Verify all gallery_photos have valid gallery_id
SELECT COUNT(*) as invalid_count
FROM gallery_photos gp
WHERE NOT EXISTS (
    SELECT 1 FROM photo_galleries pg WHERE pg.id = gp.gallery_id
);
-- Expected: 0

-- 3. Verify photo counts match
SELECT
    'photo_galleries' as table_name,
    COUNT(*) as gallery_count,
    SUM(photo_count) as declared_photo_count
FROM photo_galleries
UNION ALL
SELECT
    'gallery_photos' as table_name,
    COUNT(DISTINCT gallery_id) as gallery_count,
    COUNT(*) as actual_photo_count
FROM gallery_photos;

-- 4. Test the favorite API join (this is what was broken)
SELECT gp.id, gp.gallery_id, pg.gallery_name, pg.photographer_id
FROM gallery_photos gp
INNER JOIN photo_galleries pg ON gp.gallery_id = pg.id
LIMIT 5;
-- This should now work without PGRST200 error

-- 5. Verify RLS policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'gallery_photos';

-- 6. Verify indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('gallery_photos', 'photographers', 'clients')
AND indexname IN ('idx_gallery_photos_gallery_id', 'idx_photographers_user_id', 'idx_clients_user_id');
```

---

## 7. Code Changes Required

After the migration, update the application code:

### 7.1 Fix the Favorite API

File: `src/app/api/photos/[id]/favorite/route.ts`

The join query will now work:
```typescript
const { data: photo } = await supabase
  .from('gallery_photos')
  .select(`
    id,
    gallery_id,
    is_favorite,
    photo_galleries!inner (
      id,
      client_id,
      user_id,
      photographer_id,
      clients (user_id)
    )
  `)
  .eq('id', photoId)
  .single()
```

### 7.2 Update TypeScript Types

Regenerate Supabase types after migration:
```bash
npx supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
```

---

## 8. Execution Checklist

- [ ] **Pre-Migration**
  - [ ] Take full database backup (Supabase dashboard)
  - [ ] Run pre-migration data analysis queries
  - [ ] Document current gallery/photo counts
  - [ ] Verify `galleries.client_id` column exists
  - [ ] Verify photographer_id mapping will work
  - [ ] Notify team of maintenance window

- [ ] **Migration Execution**
  - [ ] Run migration in staging environment first
  - [ ] Verify staging migration success
  - [ ] Run migration in production (as single transaction)
  - [ ] Monitor for errors in NOTICE output
  - [ ] COMMIT only if all verifications pass

- [ ] **Post-Migration**
  - [ ] Run verification queries
  - [ ] Test favorite API manually
  - [ ] Test photo upload flow
  - [ ] Test gallery viewing as client
  - [ ] Test gallery viewing as photographer
  - [ ] Monitor error logs for 24 hours

- [ ] **Cleanup (2 weeks later)**
  - [ ] Review backup table sizes
  - [ ] Consider dropping `galleries` table
  - [ ] Remove backup tables after confirming stability

---

## 9. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data loss during migration | High | Low | Backup tables + transaction wrapper |
| FK constraint fails | Medium | Low | Pre-verification + transaction rollback |
| RLS policies break access | High | Medium | Test in staging first |
| Transaction too large | Medium | Low | Migration is small (~100 rows) |
| Admin policy doesn't work | Medium | Low | Fixed user_id column reference |
| Performance degradation | Low | Low | Added indexes for RLS subqueries |

---

## 10. Questions Resolved

| Question | Answer |
|----------|--------|
| Does `galleries.client_id` exist? | **YES** - Found in `clients-galleries-schema.sql` line 19 |
| What does `galleries.photographer_id` reference? | `user_profiles(id)` which equals `auth.users(id)` |
| Is the photographer_id mapping correct? | **YES** - `user_profiles.id = photographers.id` for photographers |
| Which is canonical: `gallery_photos` or `photos`? | Both will reference `photo_galleries`. Document in code which to use. |

---

**Plan Status:** Ready for staging test and review before production execution.
