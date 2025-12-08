-- ============================================================================
-- MIGRATION: Add Gallery Metadata Search System
-- ============================================================================
-- Description: Adds metadata fields and PostgreSQL full-text search to photo_galleries
-- Author: Supabase Expert Agent
-- Date: December 7, 2025
-- Fixed: Using trigger instead of generated column for tsvector (immutability issue)
-- ============================================================================

-- ============================================================================
-- PART 1: Add Metadata Columns
-- ============================================================================

-- Event date (when photos were taken - may differ from session_date)
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS event_date DATE DEFAULT NULL;

-- Location (where photos were taken)
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT NULL;

-- People in the photos (array of names)
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS people TEXT[] DEFAULT '{}';

-- Event type (wedding, birthday, family, portrait, etc.)
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) DEFAULT NULL;

-- Photographer name (who took the photos - may differ from account owner)
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS photographer_name VARCHAR(255) DEFAULT NULL;

-- Free-form notes
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- JSONB for flexible future metadata (tags, custom fields, etc.)
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Search vector column (will be updated by trigger)
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================================================
-- PART 2: Trigger Function for Search Vector
-- ============================================================================

-- Function to update search_vector on insert/update
CREATE OR REPLACE FUNCTION update_gallery_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.gallery_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.gallery_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'A') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW.people, '{}'), ' ')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.event_type, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.photographer_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.notes, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_gallery_search_vector ON photo_galleries;
CREATE TRIGGER trg_update_gallery_search_vector
  BEFORE INSERT OR UPDATE ON photo_galleries
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_search_vector();

-- ============================================================================
-- PART 3: Backfill existing rows
-- ============================================================================

-- Update existing rows to populate search_vector
UPDATE photo_galleries SET
  search_vector =
    setweight(to_tsvector('english', coalesce(gallery_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(gallery_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'A') ||
    setweight(to_tsvector('english', array_to_string(coalesce(people, '{}'), ' ')), 'A') ||
    setweight(to_tsvector('english', coalesce(event_type, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(photographer_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(notes, '')), 'C')
WHERE search_vector IS NULL;

-- ============================================================================
-- PART 4: Indexes for Performance
-- ============================================================================

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_photo_galleries_search_vector
ON photo_galleries USING GIN (search_vector);

-- B-tree indexes for exact-match filters
CREATE INDEX IF NOT EXISTS idx_photo_galleries_event_date
ON photo_galleries (event_date);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_location
ON photo_galleries (location);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_event_type
ON photo_galleries (event_type);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_photographer_name
ON photo_galleries (photographer_name);

-- GIN index for JSONB metadata
CREATE INDEX IF NOT EXISTS idx_photo_galleries_metadata
ON photo_galleries USING GIN (metadata);

-- GIN index for people array
CREATE INDEX IF NOT EXISTS idx_photo_galleries_people
ON photo_galleries USING GIN (people);

-- ============================================================================
-- PART 5: Auto-Suggest Materialized View
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS gallery_metadata_suggestions;

CREATE MATERIALIZED VIEW gallery_metadata_suggestions AS
SELECT
  'location' AS field_type,
  location AS value,
  COUNT(*) AS usage_count,
  MAX(created_at) AS last_used
FROM photo_galleries
WHERE location IS NOT NULL AND location != ''
GROUP BY location

UNION ALL

SELECT
  'event_type' AS field_type,
  event_type AS value,
  COUNT(*) AS usage_count,
  MAX(created_at) AS last_used
FROM photo_galleries
WHERE event_type IS NOT NULL AND event_type != ''
GROUP BY event_type

UNION ALL

SELECT
  'photographer_name' AS field_type,
  photographer_name AS value,
  COUNT(*) AS usage_count,
  MAX(created_at) AS last_used
FROM photo_galleries
WHERE photographer_name IS NOT NULL AND photographer_name != ''
GROUP BY photographer_name

UNION ALL

SELECT
  'people' AS field_type,
  unnest(people) AS value,
  COUNT(*) AS usage_count,
  MAX(created_at) AS last_used
FROM photo_galleries
WHERE people IS NOT NULL AND array_length(people, 1) > 0
GROUP BY unnest(people);

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_metadata_suggestions_field_value
ON gallery_metadata_suggestions (field_type, value);

CREATE INDEX IF NOT EXISTS idx_metadata_suggestions_usage
ON gallery_metadata_suggestions (field_type, usage_count DESC);

-- ============================================================================
-- PART 6: Refresh Function for Materialized View
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_gallery_metadata_suggestions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW gallery_metadata_suggestions;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_gallery_metadata_suggestions() TO authenticated;

-- ============================================================================
-- PART 7: Search Helper Function
-- ============================================================================

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

-- ============================================================================
-- PART 8: Comments
-- ============================================================================

COMMENT ON COLUMN photo_galleries.event_date IS 'Date when photos were taken';
COMMENT ON COLUMN photo_galleries.location IS 'Location where photos were taken';
COMMENT ON COLUMN photo_galleries.people IS 'Array of names of people in the photos';
COMMENT ON COLUMN photo_galleries.event_type IS 'Type of event (wedding, birthday, family, portrait, etc.)';
COMMENT ON COLUMN photo_galleries.photographer_name IS 'Name of photographer who took the photos';
COMMENT ON COLUMN photo_galleries.notes IS 'Free-form notes about the gallery';
COMMENT ON COLUMN photo_galleries.metadata IS 'Flexible JSONB for future custom metadata';
COMMENT ON COLUMN photo_galleries.search_vector IS 'Auto-updated tsvector for full-text search';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
