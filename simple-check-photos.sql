-- Simple check: List all tables with "photo" or "gallery" in the name
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%photo%'
ORDER BY table_name;

-- Check if photos exist in gallery_photos table (without RLS)
SELECT COUNT(*) as photo_count
FROM gallery_photos
WHERE gallery_id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';

-- Check photos table structure
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'photos'
ORDER BY ordinal_position;
