-- Count photos in gallery_photos for this gallery
SELECT COUNT(*) as photo_count
FROM gallery_photos
WHERE gallery_id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';

-- Also check if there are ANY photos in gallery_photos at all
SELECT COUNT(*) as total_photos_in_table
FROM gallery_photos;

-- List all galleries that have photos
SELECT gallery_id, COUNT(*) as photo_count
FROM gallery_photos
GROUP BY gallery_id;
