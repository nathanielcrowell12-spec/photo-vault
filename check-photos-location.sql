-- Check if photos exist in the 'photos' table
SELECT id, gallery_id, photo_url, created_at
FROM photos
WHERE gallery_id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';

-- Also check all tables that might contain photos
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%photo%' OR table_name LIKE '%image%' OR table_name LIKE '%gallery%')
ORDER BY table_name;
