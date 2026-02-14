-- Migration: Add medium_url column to gallery_photos table
-- Purpose: Store pre-generated 1200px JPEG URL for slideshow/lightbox viewing
-- Context: Part of thumbnail generation at upload time (cost optimization)
-- Note: The `photos` table already has `medium_url` since original schema.
--        Only `gallery_photos` needs it added for web-uploaded photos.

ALTER TABLE gallery_photos
ADD COLUMN IF NOT EXISTS medium_url TEXT;

COMMENT ON COLUMN gallery_photos.medium_url IS
  'Pre-generated 1200px wide JPEG for slideshow/lightbox viewing. NULL for legacy photos.';
