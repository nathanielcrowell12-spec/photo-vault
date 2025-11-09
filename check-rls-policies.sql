-- Check RLS policies on gallery_photos table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'gallery_photos'
ORDER BY policyname;

-- Test if the photographer can actually see the photos (this uses RLS)
-- Run this as the authenticated user
SELECT COUNT(*) as visible_photos
FROM gallery_photos
WHERE gallery_id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';

-- Check the gallery ownership again to confirm
SELECT
    g.id,
    g.gallery_name,
    g.photographer_id,
    g.client_id,
    g.photo_count,
    (SELECT auth.uid()) as current_user_id
FROM galleries g
WHERE g.id = '060ab36b-1dbf-4b19-b1c0-f6aa1bb570f4';
