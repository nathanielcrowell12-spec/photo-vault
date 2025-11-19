-- =====================================================
-- PhotoVault Desktop App - Complete Setup Script
-- =====================================================
-- Run this ONCE in your Supabase SQL Editor
-- This will set up everything needed for desktop uploads
-- =====================================================

-- STEP 1: Create gallery-imports bucket for chunked uploads
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-imports', 'gallery-imports', false)
ON CONFLICT (id) DO NOTHING;

-- STEP 2: Storage policies for gallery-imports bucket
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can upload to gallery-imports" ON storage.objects;
DROP POLICY IF EXISTS "Service role can read gallery-imports" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete gallery-imports" ON storage.objects;

-- Allow service role to upload chunks
CREATE POLICY "Service role can upload to gallery-imports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-imports'
);

-- Allow service role to read chunks
CREATE POLICY "Service role can read gallery-imports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'gallery-imports'
);

-- Allow service role to delete chunks after processing
CREATE POLICY "Service role can delete gallery-imports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery-imports'
);

-- Make bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'gallery-imports';

-- STEP 3: Ensure galleries table has required columns
-- =====================================================

-- Add is_imported column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'galleries' AND column_name = 'is_imported'
  ) THEN
    ALTER TABLE galleries ADD COLUMN is_imported BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add import_completed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'galleries' AND column_name = 'import_completed_at'
  ) THEN
    ALTER TABLE galleries ADD COLUMN import_completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- STEP 4: Create atomic photo count increment function
-- =====================================================

-- Drop existing function if it exists (to ensure clean update)
DROP FUNCTION IF EXISTS increment_gallery_photo_count(UUID, INTEGER);

-- Create the function
CREATE OR REPLACE FUNCTION increment_gallery_photo_count(
  gallery_id UUID,
  count_increment INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE galleries
  SET photo_count = COALESCE(photo_count, 0) + count_increment
  WHERE id = gallery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_gallery_photo_count(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_gallery_photo_count(UUID, INTEGER) TO service_role;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- You can now use the PhotoVault Desktop app to upload
-- both individual photos and ZIP files.
--
-- Photo counts will be tracked accurately and atomically.
-- =====================================================
