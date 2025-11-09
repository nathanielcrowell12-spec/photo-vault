-- Delete the "stuff" gallery
-- Gallery ID: d6074b32-31ef-4d1d-b47b-b0a3dc4da701

-- First, delete any photo records (there shouldn't be any, but just in case)
DELETE FROM gallery_photos WHERE gallery_id = 'd6074b32-31ef-4d1d-b47b-b0a3dc4da701';

-- Delete the gallery record
DELETE FROM galleries WHERE id = 'd6074b32-31ef-4d1d-b47b-b0a3dc4da701';

-- Note: You'll also need to manually delete the files from Supabase Storage
-- Go to Storage > gallery-photos > d6074b32-31ef-4d1d-b47b-b0a3dc4da701 folder
-- and delete the entire folder
