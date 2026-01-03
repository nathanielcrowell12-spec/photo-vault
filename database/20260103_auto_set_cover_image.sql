-- ============================================================================
-- AUTO-SET COVER IMAGE TRIGGER
-- ============================================================================
--
-- Purpose: Automatically set cover_image_url when first photo is inserted
--
-- Problem: 12 upload flows exist, only 3 set cover_image_url. This trigger
-- centralizes the logic so ALL flows get cover images automatically.
--
-- Tables affected:
-- - photos -> photo_galleries (canonical path)
-- - gallery_photos -> galleries (legacy path, still in use)
--
-- Run this: Via Supabase SQL Editor
-- Date: 2026-01-03
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the trigger function with SECURITY DEFINER
-- ============================================================================

-- Drop existing function if it exists (clean slate)
DROP FUNCTION IF EXISTS set_gallery_cover_image() CASCADE;

-- Create function with SECURITY DEFINER to bypass RLS
-- This allows the trigger to update galleries even when the inserting user
-- doesn't have direct UPDATE permission (e.g., client uploads)
CREATE OR REPLACE FUNCTION set_gallery_cover_image()
RETURNS TRIGGER
SECURITY DEFINER  -- Critical: bypasses RLS for cross-user updates
SET search_path = public  -- Security best practice with SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_cover_url TEXT;
  v_current_cover TEXT;
BEGIN
  -- Determine the best URL to use as cover image
  -- Different tables have different column names
  IF TG_TABLE_NAME = 'photos' THEN
    -- photos table: thumbnail_url, full_url, original_url, medium_url
    v_cover_url := COALESCE(
      NULLIF(NEW.thumbnail_url, ''),
      NULLIF(NEW.full_url, ''),
      NULLIF(NEW.original_url, ''),
      NULLIF(NEW.medium_url, '')
    );
  ELSIF TG_TABLE_NAME = 'gallery_photos' THEN
    -- gallery_photos table: thumbnail_url, photo_url
    v_cover_url := COALESCE(
      NULLIF(NEW.thumbnail_url, ''),
      NULLIF(NEW.photo_url, '')
    );
  ELSE
    -- Unknown table, exit gracefully
    RETURN NEW;
  END IF;

  -- If we don't have a usable URL, exit early
  IF v_cover_url IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update the appropriate gallery table
  IF TG_TABLE_NAME = 'photos' THEN
    -- photos -> photo_galleries (canonical)

    -- First check if gallery already has a real cover (fast path)
    SELECT cover_image_url INTO v_current_cover
    FROM photo_galleries
    WHERE id = NEW.gallery_id;

    -- Only update if cover is NULL or is a placeholder
    IF v_current_cover IS NULL
       OR v_current_cover = ''
       OR v_current_cover = '/images/placeholder-family.svg'
       OR v_current_cover LIKE '/images/placeholder%' THEN

      UPDATE photo_galleries
      SET cover_image_url = v_cover_url
      WHERE id = NEW.gallery_id;
    END IF;

  ELSIF TG_TABLE_NAME = 'gallery_photos' THEN
    -- gallery_photos -> galleries (legacy)

    SELECT cover_image_url INTO v_current_cover
    FROM galleries
    WHERE id = NEW.gallery_id;

    IF v_current_cover IS NULL
       OR v_current_cover = ''
       OR v_current_cover = '/images/placeholder-family.svg'
       OR v_current_cover LIKE '/images/placeholder%' THEN

      UPDATE galleries
      SET cover_image_url = v_cover_url
      WHERE id = NEW.gallery_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_gallery_cover_image() TO authenticated;
GRANT EXECUTE ON FUNCTION set_gallery_cover_image() TO service_role;

-- ============================================================================
-- STEP 2: Create triggers for both photo tables
-- ============================================================================

-- Trigger for photos table (canonical path -> photo_galleries)
DROP TRIGGER IF EXISTS set_cover_on_photo_insert ON photos;
CREATE TRIGGER set_cover_on_photo_insert
  AFTER INSERT ON photos
  FOR EACH ROW
  EXECUTE FUNCTION set_gallery_cover_image();

-- Trigger for gallery_photos table (legacy path -> galleries)
-- Only create if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_photos'
  ) THEN
    DROP TRIGGER IF EXISTS set_cover_on_gallery_photo_insert ON gallery_photos;
    CREATE TRIGGER set_cover_on_gallery_photo_insert
      AFTER INSERT ON gallery_photos
      FOR EACH ROW
      EXECUTE FUNCTION set_gallery_cover_image();
    RAISE NOTICE 'Created trigger on gallery_photos table';
  ELSE
    RAISE NOTICE 'gallery_photos table does not exist, skipping trigger';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Fix existing galleries with NULL or placeholder covers
-- ============================================================================

-- Fix photo_galleries (canonical)
UPDATE photo_galleries pg
SET cover_image_url = (
  SELECT COALESCE(
    NULLIF(p.thumbnail_url, ''),
    NULLIF(p.full_url, ''),
    NULLIF(p.original_url, '')
  )
  FROM photos p
  WHERE p.gallery_id = pg.id
  ORDER BY p.created_at ASC
  LIMIT 1
)
WHERE (
  cover_image_url IS NULL
  OR cover_image_url = ''
  OR cover_image_url = '/images/placeholder-family.svg'
  OR cover_image_url LIKE '/images/placeholder%'
)
AND EXISTS (
  SELECT 1 FROM photos WHERE gallery_id = pg.id
);

-- Fix galleries (legacy) if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'galleries'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_photos'
  ) THEN
    UPDATE galleries g
    SET cover_image_url = (
      SELECT COALESCE(
        NULLIF(gp.thumbnail_url, ''),
        NULLIF(gp.photo_url, '')
      )
      FROM gallery_photos gp
      WHERE gp.gallery_id = g.id
      ORDER BY gp.created_at ASC
      LIMIT 1
    )
    WHERE (
      g.cover_image_url IS NULL
      OR g.cover_image_url = ''
      OR g.cover_image_url = '/images/placeholder-family.svg'
      OR g.cover_image_url LIKE '/images/placeholder%'
    )
    AND EXISTS (
      SELECT 1 FROM gallery_photos WHERE gallery_id = g.id
    );
    RAISE NOTICE 'Fixed existing galleries in legacy galleries table';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create partial index for performance (optional but recommended)
-- ============================================================================

-- Index for photo_galleries with NULL cover (helps trigger performance)
CREATE INDEX IF NOT EXISTS idx_photo_galleries_null_cover
  ON photo_galleries(id)
  WHERE cover_image_url IS NULL;

-- Index for galleries with NULL cover (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'galleries'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_galleries_null_cover
      ON galleries(id)
      WHERE cover_image_url IS NULL;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION: Check how many galleries were fixed
-- ============================================================================

DO $$
DECLARE
  v_fixed_count INTEGER;
  v_remaining_null INTEGER;
BEGIN
  -- Count galleries that still have NULL covers (should be 0 if they have photos)
  SELECT COUNT(*) INTO v_remaining_null
  FROM photo_galleries pg
  WHERE (pg.cover_image_url IS NULL OR pg.cover_image_url = '')
  AND EXISTS (SELECT 1 FROM photos WHERE gallery_id = pg.id);

  RAISE NOTICE 'Galleries with NULL cover but have photos: %', v_remaining_null;

  IF v_remaining_null > 0 THEN
    RAISE WARNING 'Some galleries still have NULL covers - investigate manually';
  ELSE
    RAISE NOTICE 'SUCCESS: All galleries with photos now have cover images';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
--
-- To disable these triggers:
--
-- DROP TRIGGER IF EXISTS set_cover_on_photo_insert ON photos;
-- DROP TRIGGER IF EXISTS set_cover_on_gallery_photo_insert ON gallery_photos;
-- DROP FUNCTION IF EXISTS set_gallery_cover_image() CASCADE;
--
-- ============================================================================
