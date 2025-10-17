-- Create storage buckets for photos
-- Run this in Supabase SQL Editor

-- Create photos bucket for original photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create thumbnails bucket for compressed thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket

-- Allow authenticated users to upload photos to their own folders
CREATE POLICY "Users can upload photos to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own photos
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can access all photos
CREATE POLICY "Admins can access all photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'photos' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.user_type = 'admin'
  )
);

-- Storage policies for thumbnails bucket

-- Allow authenticated users to upload thumbnails to their own folders
CREATE POLICY "Users can upload thumbnails to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own thumbnails
CREATE POLICY "Users can view own thumbnails"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own thumbnails
CREATE POLICY "Users can delete own thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can access all thumbnails
CREATE POLICY "Admins can access all thumbnails"
ON storage.objects FOR ALL
USING (
  bucket_id = 'thumbnails' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.user_type = 'admin'
  )
);

-- Make buckets publicly accessible (authenticated users only)
UPDATE storage.buckets
SET public = true
WHERE id IN ('photos', 'thumbnails');

