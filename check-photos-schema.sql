-- Check the schema of the photos table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'photos'
ORDER BY ordinal_position;

-- Check the schema of gallery_photos table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gallery_photos'
ORDER BY ordinal_position;

-- List all photo-related tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%photo%' OR table_name LIKE '%image%' OR table_name LIKE '%gallery%')
ORDER BY table_name;

-- Try to find any photos for this gallery in the photos table
SELECT *
FROM photos
WHERE gallery_id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4'
LIMIT 5;
