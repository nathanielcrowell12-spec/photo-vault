-- Temporarily disable RLS to check if photos exist
ALTER TABLE gallery_photos DISABLE ROW LEVEL SECURITY;

-- Now check if photos exist
SELECT id, gallery_id, photo_url, original_filename, created_at
FROM gallery_photos
WHERE gallery_id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4'
LIMIT 5;

-- Re-enable RLS
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
