# Gallery Consolidation Migration Plan

**Date:** 2026-01-03
**Status:** Ready for Review
**Priority:** High - Blocking favorite API and causing FK inconsistencies
**Estimated Risk:** Medium-High (data migration required)

---

## 1. Executive Summary

PhotoVault has two gallery systems that were never fully consolidated:

| Table | Purpose | Photos Table | Photo Count |
|-------|---------|--------------|-------------|
| `galleries` | Legacy table from early development | `gallery_photos` (69 photos) | Unknown |
| `photo_galleries` | Canonical table (intended standard) | `photos` (16 photos) | Unknown |

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

## 2. Current Schema Analysis

### 2.1 `galleries` Table (Legacy)

**Source:** `database/galleries-table.sql` + migrations

```sql
CREATE TABLE galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gallery_name VARCHAR(255) NOT NULL,
    gallery_description TEXT,
    cover_image_url TEXT,
    platform VARCHAR(50) NOT NULL,
    photographer_name VARCHAR(255),
    photographer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    session_date DATE,
    photo_count INTEGER DEFAULT 0,
    gallery_url TEXT,
    gallery_password VARCHAR(255),
    is_imported BOOLEAN DEFAULT false,
    import_started_at TIMESTAMP WITH TIME ZONE,
    import_completed_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Added via migrations:
    temp_zip_path TEXT,
    status TEXT DEFAULT 'active',
    deleted_at TIMESTAMPTZ,
    payment_option_id VARCHAR(50),
    billing_mode VARCHAR(20) DEFAULT 'storage_only',
    shoot_fee INTEGER DEFAULT 0,
    storage_fee INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending',
    stripe_checkout_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    paid_at TIMESTAMPTZ,
    gallery_expires_at TIMESTAMPTZ,
    download_tracking_enabled BOOLEAN DEFAULT FALSE,
    total_photos_to_download INTEGER DEFAULT 0,
    photos_downloaded INTEGER DEFAULT 0,
    all_photos_downloaded BOOLEAN DEFAULT FALSE,
    download_completed_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    archive_reason VARCHAR(50),
    reactivation_count INTEGER DEFAULT 0,
    last_reactivation_at TIMESTAMPTZ,
    original_payment_option_id VARCHAR(50)
);
```

**Key differences from `photo_galleries`:**
- Has `user_id` as NOT NULL (owner) - `photo_galleries` has optional `user_id`
- Has `photographer_id` referencing `user_profiles(id)` - `photo_galleries` references `photographers(id)`
- Has `gallery_password`, `temp_zip_path`, `gallery_url`
- Has soft delete columns (`status`, `deleted_at`)

### 2.2 `photo_galleries` Table (Canonical)

**Source:** `database/schema.sql` + `consolidate-photo-galleries-migration.sql`

```sql
CREATE TABLE photo_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_gallery_id VARCHAR(100),
  gallery_name VARCHAR(255) NOT NULL,
  gallery_description TEXT,
  gallery_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  photo_count INTEGER DEFAULT 0,
  session_date DATE,
  gallery_type VARCHAR(50) DEFAULT 'standard',
  is_imported BOOLEAN DEFAULT FALSE,
  imported_at TIMESTAMP WITH TIME ZONE,
  cms_gallery_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Added via consolidation migration:
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_option_id VARCHAR(50),
  billing_mode VARCHAR(20) DEFAULT 'storage_only',
  shoot_fee INTEGER DEFAULT 0,
  storage_fee INTEGER DEFAULT 0,
  total_amount INTEGER DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending',
  stripe_checkout_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  gallery_expires_at TIMESTAMPTZ,
  download_tracking_enabled BOOLEAN DEFAULT FALSE,
  total_photos_to_download INTEGER DEFAULT 0,
  photos_downloaded INTEGER DEFAULT 0,
  all_photos_downloaded BOOLEAN DEFAULT FALSE,
  download_completed_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  archive_reason VARCHAR(50),
  reactivation_count INTEGER DEFAULT 0,
  last_reactivation_at TIMESTAMPTZ,
  original_payment_option_id VARCHAR(50),
  gallery_status VARCHAR(20) DEFAULT 'draft'
);
```

### 2.3 `gallery_photos` Table

**Source:** `database/galleries-table.sql`

```sql
CREATE TABLE gallery_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,  -- THE PROBLEM!
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    original_filename VARCHAR(255),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    taken_at TIMESTAMP WITH TIME ZONE,
    caption TEXT,
    is_favorite BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.4 `photos` Table

**Source:** `database/schema.sql`

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES photo_galleries(id) ON DELETE CASCADE,  -- Correctly references photo_galleries
  platform_photo_id VARCHAR(100),
  filename VARCHAR(255) NOT NULL,
  original_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  medium_url VARCHAR(500),
  full_url VARCHAR(500),
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  exif_data JSONB,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. Data Migration Requirements

### 3.1 Pre-Migration Data Analysis

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

-- Count gallery_photos per gallery (to understand data distribution)
SELECT
    g.id as gallery_id,
    g.gallery_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM photo_galleries pg WHERE pg.id = g.id)
        THEN 'in_both'
        ELSE 'galleries_only'
    END as location,
    COUNT(gp.id) as photo_count
FROM galleries g
LEFT JOIN gallery_photos gp ON g.id = gp.gallery_id
GROUP BY g.id, g.gallery_name
ORDER BY photo_count DESC;
```

### 3.2 Data Verification Queries

```sql
-- Verify no ID collisions (galleries with same ID in both tables but different data)
SELECT
    g.id,
    g.gallery_name as galleries_name,
    pg.gallery_name as photo_galleries_name,
    g.photographer_id as galleries_photographer,
    pg.photographer_id as pg_photographer
FROM galleries g
INNER JOIN photo_galleries pg ON g.id = pg.id
WHERE g.gallery_name != pg.gallery_name
   OR g.photographer_id != pg.photographer_id;
```

---

## 4. Migration SQL

### 4.1 Create Migration File

**File:** `database/migrations/20260103_consolidate_galleries.sql`

```sql
-- ============================================================================
-- GALLERY CONSOLIDATION MIGRATION
-- ============================================================================
-- This migration consolidates the dual gallery system:
-- - Ensures all galleries exist in photo_galleries (canonical table)
-- - Updates gallery_photos FK from galleries to photo_galleries
-- - Handles orphaned photos
--
-- CRITICAL: Run this in a transaction and verify data before committing
-- ============================================================================

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

-- ============================================================================
-- STEP 2: Migrate galleries to photo_galleries (preserve IDs)
-- ============================================================================

-- Insert galleries that don't exist in photo_galleries
-- This preserves the original UUID so gallery_photos.gallery_id still works
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
    -- Handle photographer_id mapping: galleries.photographer_id references user_profiles
    -- photo_galleries.photographer_id references photographers table
    -- For now, set to NULL and update separately if needed
    COALESCE(
        (SELECT p.id FROM photographers p WHERE p.user_id = g.photographer_id),
        (SELECT p.id FROM photographers p WHERE p.user_id = g.user_id)
    ) as photographer_id,
    g.client_id,
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
BEGIN
    GET DIAGNOSTICS v_migrated = ROW_COUNT;
    RAISE NOTICE 'Migrated % galleries to photo_galleries', v_migrated;
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

-- Log orphaned photos
DO $$
DECLARE
    v_orphaned INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_orphaned FROM orphaned_photos;
    RAISE NOTICE 'Found % orphaned photos (no parent gallery)', v_orphaned;

    -- Option A: Delete orphaned photos (uncomment to use)
    -- DELETE FROM gallery_photos
    -- WHERE id IN (SELECT id FROM orphaned_photos);
    -- RAISE NOTICE 'Deleted % orphaned photos', v_orphaned;

    -- Option B: Move to a special "orphaned" gallery (safer)
    -- This creates a holding gallery for investigation
END $$;

-- Create an orphaned photos holding gallery if there are orphans
DO $$
DECLARE
    v_orphan_count INTEGER;
    v_orphan_gallery_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
BEGIN
    SELECT COUNT(*) INTO v_orphan_count FROM orphaned_photos;

    IF v_orphan_count > 0 THEN
        -- Create orphaned photos gallery in photo_galleries
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

        RAISE NOTICE 'Moved % orphaned photos to holding gallery %', v_orphan_count, v_orphan_gallery_id;
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
        RAISE EXCEPTION 'MIGRATION ABORTED: % gallery_photos have gallery_id not in photo_galleries', v_missing;
    ELSE
        RAISE NOTICE 'VERIFIED: All gallery_photos.gallery_id exist in photo_galleries';
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
    ALTER TABLE gallery_photos DROP CONSTRAINT IF EXISTS fk_gallery_photos_gallery_id;
    ALTER TABLE gallery_photos DROP CONSTRAINT IF EXISTS gallery_photos_gallery_id_galleries_fkey;
EXCEPTION WHEN undefined_object THEN
    -- Constraint doesn't exist, that's fine
    NULL;
END $$;

-- Add new FK constraint pointing to photo_galleries
ALTER TABLE gallery_photos
ADD CONSTRAINT gallery_photos_gallery_id_fkey
FOREIGN KEY (gallery_id) REFERENCES photo_galleries(id) ON DELETE CASCADE;

RAISE NOTICE 'FK constraint updated: gallery_photos.gallery_id now references photo_galleries';

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
CREATE POLICY "Users can update photos in own galleries" ON gallery_photos
FOR UPDATE USING (
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
CREATE POLICY "Admins can manage all photos" ON gallery_photos
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = (SELECT auth.uid())
        AND user_profiles.user_type = 'admin'
    )
);

-- ============================================================================
-- STEP 7: Update triggers that reference galleries table
-- ============================================================================

-- Update the auto-set cover image trigger to only use photo_galleries
-- (The existing trigger handles both tables, but we can simplify it now)

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

-- ============================================================================
-- STEP 8: Create index for FK performance
-- ============================================================================

-- Ensure index exists for the FK lookup
CREATE INDEX IF NOT EXISTS idx_gallery_photos_gallery_id ON gallery_photos(gallery_id);

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

    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'photo_galleries: % galleries', v_pg_count;
    RAISE NOTICE 'gallery_photos: % photos (% with valid FK)', v_gp_count, v_gp_valid;

    IF v_gp_count != v_gp_valid THEN
        RAISE WARNING 'WARNING: % gallery_photos have invalid gallery_id', v_gp_count - v_gp_valid;
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
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

## 5. Rollback Plan

If the migration fails or causes issues, rollback using the backup tables:

```sql
-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

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

-- Recreate original policies (from galleries-table.sql)
CREATE POLICY "Users can view photos from own galleries" ON gallery_photos
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM galleries
        WHERE galleries.id = gallery_photos.gallery_id
        AND galleries.user_id = auth.uid()
    )
);

CREATE POLICY "Users can add photos to own galleries" ON gallery_photos
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM galleries
        WHERE galleries.id = gallery_photos.gallery_id
        AND galleries.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update photos in own galleries" ON gallery_photos
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM galleries
        WHERE galleries.id = gallery_photos.gallery_id
        AND galleries.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete photos from own galleries" ON gallery_photos
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM galleries
        WHERE galleries.id = gallery_photos.gallery_id
        AND galleries.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all photos" ON gallery_photos
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
    )
);

-- Step 4: Restore any deleted data from backups if needed
-- INSERT INTO galleries SELECT * FROM _backup_galleries_20260103 WHERE id NOT IN (SELECT id FROM galleries);
-- INSERT INTO gallery_photos SELECT * FROM _backup_gallery_photos_20260103 WHERE id NOT IN (SELECT id FROM gallery_photos);

RAISE NOTICE 'Rollback complete - gallery_photos.gallery_id now references galleries table again';
```

---

## 6. Post-Migration Verification

Run these queries after migration to verify success:

```sql
-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- 1. Verify FK relationship exists
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

-- 5. Verify RLS policies are working
-- Test as authenticated user (run from application context)
-- SELECT * FROM gallery_photos LIMIT 10;

-- 6. Check for any galleries without photos
SELECT pg.id, pg.gallery_name, pg.created_at
FROM photo_galleries pg
WHERE NOT EXISTS (
    SELECT 1 FROM gallery_photos gp WHERE gp.gallery_id = pg.id
)
AND NOT EXISTS (
    SELECT 1 FROM photos p WHERE p.gallery_id = pg.id
)
ORDER BY pg.created_at DESC;
```

---

## 7. Code Changes Required

After the migration, update the application code:

### 7.1 Fix the Favorite API (Already Planned)

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

### 7.3 Future Cleanup (Optional)

After verifying the migration works in production for 2+ weeks:

1. Consider dropping the `galleries` table
2. Remove any code that references `galleries` directly
3. Clean up backup tables

---

## 8. Execution Checklist

- [ ] **Pre-Migration**
  - [ ] Take full database backup
  - [ ] Run pre-migration data analysis queries
  - [ ] Document current gallery/photo counts
  - [ ] Notify team of maintenance window

- [ ] **Migration Execution**
  - [ ] Run migration in staging environment first
  - [ ] Verify staging migration success
  - [ ] Run migration in production
  - [ ] Monitor for errors

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
| Data loss during migration | High | Low | Backup tables created first |
| FK constraint fails | Medium | Low | Pre-verification query |
| RLS policies break access | High | Medium | Test in staging first |
| Application errors post-migration | Medium | Medium | Phased rollout, rollback plan |
| Performance degradation | Low | Low | Index already exists |

---

## 10. Questions to Resolve Before Execution

1. **What should happen to orphaned photos?**
   - Current plan: Move to holding gallery for review
   - Alternative: Delete them (after backup)

2. **Should we drop the `galleries` table immediately?**
   - Recommendation: No, keep for 2 weeks as safety net
   - The table will still exist but won't be referenced

3. **Are there any external systems querying `galleries` directly?**
   - Need to verify no external integrations use this table

4. **What's the maintenance window availability?**
   - Migration should be quick (<5 minutes) but test in staging first

---

**Plan Status:** Ready for review and approval before execution.
