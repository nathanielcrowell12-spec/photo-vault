-- Migration to add soft delete functionality to galleries and photos

-- Step 1: Add 'status' and 'deleted_at' columns to the 'galleries' table
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Step 2: Add 'status' and 'deleted_at' columns to the 'gallery_photos' table
ALTER TABLE gallery_photos
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Step 3: Update RLS policies to filter out soft-deleted items from normal view

-- Update policy for users to view their own galleries
DROP POLICY IF EXISTS "Users can view own galleries" ON galleries;
CREATE POLICY "Users can view own galleries" ON galleries
    FOR SELECT USING (
        auth.uid() = user_id AND status = 'active'
    );

-- Update policy for users to view photos from their own galleries
DROP POLICY IF EXISTS "Users can view photos from own galleries" ON gallery_photos;
CREATE POLICY "Users can view photos from own galleries" ON gallery_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM galleries
            WHERE galleries.id = gallery_photos.gallery_id
            AND galleries.user_id = auth.uid()
        ) AND status = 'active'
    );

-- Step 4: Create a new function to handle the soft delete
CREATE OR REPLACE FUNCTION soft_delete_gallery()
RETURNS TRIGGER AS $$
BEGIN
    -- When a gallery is "deleted", also "delete" all its photos
    UPDATE gallery_photos
    SET status = 'deleted', deleted_at = NOW()
    WHERE gallery_id = OLD.id;

    -- Now, "delete" the gallery itself
    UPDATE galleries
    SET status = 'deleted', deleted_at = NOW()
    WHERE id = OLD.id;

    -- Prevent the actual DELETE operation from proceeding
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop the old DELETE policy and create a trigger to replace it
DROP POLICY IF EXISTS "Users can delete own galleries" ON galleries;

CREATE TRIGGER handle_soft_delete_gallery
INSTEAD OF DELETE ON galleries
FOR EACH ROW
EXECUTE FUNCTION soft_delete_gallery();

-- We need a policy that allows the delete operation to trigger the function
CREATE POLICY "Users can trigger soft delete on their own galleries" ON galleries
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Step 6: Do the same for individual photos
CREATE OR REPLACE FUNCTION soft_delete_photo()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE gallery_photos
    SET status = 'deleted', deleted_at = NOW()
    WHERE id = OLD.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS "Users can delete photos from own galleries" ON gallery_photos;

CREATE TRIGGER handle_soft_delete_photo
INSTEAD OF DELETE ON gallery_photos
FOR EACH ROW
EXECUTE FUNCTION soft_delete_photo();

CREATE POLICY "Users can trigger soft delete on their own photos" ON gallery_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM galleries
            WHERE galleries.id = OLD.gallery_id
            AND galleries.user_id = auth.uid()
        )
    );

-- Note: A cron job will be needed to handle permanent deletion of items where 'deleted_at' is older than 30 days.
-- This can be set up later using Supabase Edge Functions.
