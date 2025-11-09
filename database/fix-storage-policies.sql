-- Fix storage policies for photo uploads
-- This fixes the "new row violates row-level security policy" error

-- First, drop existing restrictive policies on photos bucket
DROP POLICY IF EXISTS "Users can upload photos to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can access all photos" ON storage.objects;

-- Create more permissive policies for authenticated users

-- Allow authenticated users to upload photos (for photographer uploads)
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to view photos
CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete photos they uploaded
CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update photos
CREATE POLICY "Authenticated users can update photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated'
);

-- Make photos bucket public for viewing
UPDATE storage.buckets
SET public = true
WHERE id = 'photos';
