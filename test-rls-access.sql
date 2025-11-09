-- Test if the current authenticated user can see the photos (this uses RLS)
SELECT COUNT(*) as visible_photos_with_rls
FROM gallery_photos
WHERE gallery_id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';

-- Check what user is currently authenticated
SELECT auth.uid() as current_user_id;

-- Check the gallery ownership
SELECT
    g.id,
    g.gallery_name,
    g.photographer_id,
    g.client_id,
    g.photo_count
FROM galleries g
WHERE g.id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';
