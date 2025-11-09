-- Get a sample photo to see its structure
SELECT *
FROM gallery_photos
WHERE gallery_id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4'
LIMIT 1;

-- Also verify the gallery record
SELECT id, gallery_name, photographer_id, client_id, photo_count
FROM galleries
WHERE id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';
