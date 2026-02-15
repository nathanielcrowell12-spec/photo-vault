-- ============================================================================
-- PhotoVault Soft-Delete Migration for photo_galleries
-- Target: photo_galleries (NOT galleries)
-- Date: 2026-02-14
-- Revised: Uses is_deleted (boolean) per QA Critic review
--          Avoids naming collision with existing gallery_status column
-- ============================================================================

-- ==========================================================
-- STEP 1: Add columns to photo_galleries
-- Uses is_deleted (boolean) instead of status (TEXT) to avoid
-- confusion with the existing gallery_status column.
-- ==========================================================
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ==========================================================
-- STEP 2: Add indexes for query performance
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_photo_galleries_is_deleted
ON photo_galleries (is_deleted);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_deleted_at
ON photo_galleries (deleted_at)
WHERE deleted_at IS NOT NULL;

-- ==========================================================
-- STEP 3: Create the soft-delete trigger function
-- Uses SECURITY DEFINER so the trigger can UPDATE the row
-- even though the original operation was a DELETE.
-- The trigger intercepts DELETE, converts it to an UPDATE
-- setting is_deleted=true and deleted_at=NOW(), then
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
    SET is_deleted = true, deleted_at = NOW()
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
-- STEP 5: Update search_galleries RPC to exclude deleted
-- This function is used by the photographer gallery search.
-- Adding AND NOT g.is_deleted to the WHERE clause.
-- ==========================================================
CREATE OR REPLACE FUNCTION search_galleries(
  p_photographer_id UUID,
  p_search_query TEXT DEFAULT NULL,
  p_event_date_start DATE DEFAULT NULL,
  p_event_date_end DATE DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_people TEXT[] DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL,
  p_photographer_name TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  gallery_name VARCHAR(255),
  gallery_description TEXT,
  event_date DATE,
  location VARCHAR(255),
  people TEXT[],
  event_type VARCHAR(100),
  photographer_name VARCHAR(255),
  notes TEXT,
  photo_count INTEGER,
  created_at TIMESTAMPTZ,
  relevance REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.gallery_name,
    g.gallery_description,
    g.event_date,
    g.location,
    g.people,
    g.event_type,
    g.photographer_name,
    g.notes,
    g.photo_count,
    g.created_at,
    CASE
      WHEN p_search_query IS NOT NULL THEN
        ts_rank(g.search_vector, plainto_tsquery('english', p_search_query))
      ELSE
        1.0
    END AS relevance
  FROM photo_galleries g
  WHERE
    g.photographer_id = p_photographer_id
    AND NOT g.is_deleted
    AND (p_search_query IS NULL OR g.search_vector @@ plainto_tsquery('english', p_search_query))
    AND (p_event_date_start IS NULL OR g.event_date >= p_event_date_start)
    AND (p_event_date_end IS NULL OR g.event_date <= p_event_date_end)
    AND (p_location IS NULL OR g.location ILIKE '%' || p_location || '%')
    AND (p_people IS NULL OR g.people && p_people)
    AND (p_event_type IS NULL OR g.event_type = p_event_type)
    AND (p_photographer_name IS NULL OR g.photographer_name ILIKE '%' || p_photographer_name || '%')
  ORDER BY relevance DESC, g.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION search_galleries TO authenticated;

-- ==========================================================
-- STEP 6: Create function for permanent deletion (cron job)
-- Permanently deletes galleries (and their photos) that have
-- been soft-deleted for more than 30 days.
-- Includes error handling per QA Critic review.
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
        WHERE is_deleted = true
        AND deleted_at < NOW() - INTERVAL '30 days'
    );

    DELETE FROM photos
    WHERE gallery_id IN (
        SELECT id FROM photo_galleries
        WHERE is_deleted = true
        AND deleted_at < NOW() - INTERVAL '30 days'
    );

    -- Now permanently delete the galleries
    DELETE FROM photo_galleries
    WHERE is_deleted = true
    AND deleted_at < NOW() - INTERVAL '30 days';

    -- Re-enable the soft-delete trigger
    ALTER TABLE photo_galleries ENABLE TRIGGER handle_soft_delete_gallery;

EXCEPTION WHEN OTHERS THEN
    -- Ensure trigger is re-enabled even if something fails
    ALTER TABLE photo_galleries ENABLE TRIGGER handle_soft_delete_gallery;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================
-- STEP 7: Verification queries (run after migration)
-- ==========================================================
-- Verify columns exist:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'photo_galleries'
-- AND column_name IN ('is_deleted', 'deleted_at');

-- Verify trigger exists:
-- SELECT trigger_name, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE event_object_table = 'photo_galleries';

-- Verify all existing rows are NOT deleted:
-- SELECT is_deleted, count(*) FROM photo_galleries GROUP BY is_deleted;

-- Verify search_galleries function updated:
-- SELECT prosrc FROM pg_proc WHERE proname = 'search_galleries';
