-- Fix RLS policies for gallery_photos table

-- First, check if RLS is enabled on gallery_photos
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'gallery_photos';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own gallery photos" ON gallery_photos;
DROP POLICY IF EXISTS "Photographers can view their gallery photos" ON gallery_photos;
DROP POLICY IF EXISTS "Users can insert their own gallery photos" ON gallery_photos;
DROP POLICY IF EXISTS "Photographers can insert gallery photos" ON gallery_photos;
DROP POLICY IF EXISTS "Users can update their own gallery photos" ON gallery_photos;
DROP POLICY IF EXISTS "Photographers can update their gallery photos" ON gallery_photos;
DROP POLICY IF EXISTS "Users can delete their own gallery photos" ON gallery_photos;
DROP POLICY IF EXISTS "Photographers can delete their gallery photos" ON gallery_photos;

-- Enable RLS on gallery_photos
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Photographers can view photos in galleries they own
CREATE POLICY "Photographers can view their gallery photos" ON gallery_photos
FOR SELECT
USING (
  gallery_id IN (
    SELECT id FROM galleries
    WHERE photographer_id = auth.uid()
  )
);

-- Policy: Clients can view photos in galleries assigned to them
CREATE POLICY "Clients can view their gallery photos" ON gallery_photos
FOR SELECT
USING (
  gallery_id IN (
    SELECT id FROM galleries
    WHERE client_id = auth.uid()
  )
);

-- Policy: Photographers can insert photos to their galleries
CREATE POLICY "Photographers can insert gallery photos" ON gallery_photos
FOR INSERT
WITH CHECK (
  gallery_id IN (
    SELECT id FROM galleries
    WHERE photographer_id = auth.uid()
  )
);

-- Policy: Photographers can update photos in their galleries
CREATE POLICY "Photographers can update their gallery photos" ON gallery_photos
FOR UPDATE
USING (
  gallery_id IN (
    SELECT id FROM galleries
    WHERE photographer_id = auth.uid()
  )
);

-- Policy: Photographers can delete photos from their galleries
CREATE POLICY "Photographers can delete their gallery photos" ON gallery_photos
FOR DELETE
USING (
  gallery_id IN (
    SELECT id FROM galleries
    WHERE photographer_id = auth.uid()
  )
);

-- Check the gallery ownership
SELECT id, gallery_name, client_id, photographer_id, photo_count
FROM galleries
WHERE id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';

-- Check if photos exist in gallery_photos table
SELECT id, gallery_id, photo_url, created_at
FROM gallery_photos
WHERE gallery_id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';
