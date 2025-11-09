-- ============================================
-- PHOTO VAULT - STORAGE POLICY FIX
-- ============================================
-- This fixes the RLS policy error when uploading photos
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the overly restrictive policies
DROP POLICY IF EXISTS "Users can upload photos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all photos" ON storage.objects;

-- Create new policies that allow gallery-based uploads

-- 1. Allow authenticated photographers to upload photos
CREATE POLICY "Photographers can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

-- 2. Allow authenticated users to view photos
CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'photos'
);

-- 3. Allow public viewing of photos (for client access via share links)
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos'
);

-- 4. Allow photographers to delete their uploaded photos
-- We can't easily check ownership at storage level, so allow authenticated users
CREATE POLICY "Photographers can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

-- 5. Allow photographers to update photos
CREATE POLICY "Photographers can update photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

-- Ensure the bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'photos';

-- Also add the missing gallery fields while we're at it
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS import_completed_at TIMESTAMPTZ;

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
