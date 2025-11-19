-- Add gallery-imports bucket for desktop app uploads
-- This bucket stores chunked file uploads from the PhotoVault Desktop app
-- Run this in Supabase SQL Editor

-- Create gallery-imports bucket for chunked uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-imports', 'gallery-imports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gallery-imports bucket

-- Allow authenticated users (service role) to upload chunks
CREATE POLICY "Service role can upload to gallery-imports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-imports'
);

-- Allow authenticated users (service role) to read chunks
CREATE POLICY "Service role can read gallery-imports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'gallery-imports'
);

-- Allow authenticated users (service role) to delete chunks after processing
CREATE POLICY "Service role can delete gallery-imports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery-imports'
);

-- Make bucket private (only accessible via service role key)
UPDATE storage.buckets
SET public = false
WHERE id = 'gallery-imports';
