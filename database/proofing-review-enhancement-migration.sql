-- Proofing Review Enhancement Migration
-- Date: 2026-03-27
-- Purpose: Add sort_position to photos, acknowledge columns to proofing_submissions,
--          and has_proofing_changes flag to photo_galleries

-- 1. Add sort_position to photos for explicit ordering (preserves chronological order through replacements)
ALTER TABLE photos ADD COLUMN IF NOT EXISTS sort_position integer;

-- 2. Backfill positions from created_at order
WITH numbered AS (
  SELECT id, gallery_id,
    ROW_NUMBER() OVER (PARTITION BY gallery_id ORDER BY created_at ASC) as pos
  FROM photos
)
UPDATE photos SET sort_position = numbered.pos
FROM numbered WHERE photos.id = numbered.id;

-- 3. Add acknowledge columns to proofing_submissions
ALTER TABLE proofing_submissions
  ADD COLUMN IF NOT EXISTS photographer_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

-- 4. Add denormalized proofing-changes flag to photo_galleries
ALTER TABLE photo_galleries
  ADD COLUMN IF NOT EXISTS has_proofing_changes boolean;
