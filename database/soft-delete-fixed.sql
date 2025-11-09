-- Fixed Soft Delete Migration for PhotoVault
-- This corrects the issues in the original soft-delete-schema.sql

-- Step 1: Add 'status' and 'deleted_at' columns to the 'galleries' table
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Step 2: Add 'status' and 'deleted_at' columns to the 'gallery_photos' table
ALTER TABLE gallery_photos
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Step 3: Update RLS policies to filter out soft-deleted items from normal view
-- Drop old policies
DROP POLICY IF EXISTS "Users can view own galleries" ON galleries;
DROP POLICY IF EXISTS "Users can view photos from own galleries" ON gallery_photos;

-- Create policy for viewing ACTIVE galleries
CREATE POLICY "Users can view own active galleries" ON galleries
    FOR SELECT USING (
        auth.uid() = user_id AND status = 'active'
    );

-- Create policy for viewing DELETED galleries (for Recently Deleted page)
CREATE POLICY "Users can view own deleted galleries" ON galleries
    FOR SELECT USING (
        auth.uid() = user_id AND status = 'deleted'
    );

-- Create policy for viewing ACTIVE photos
CREATE POLICY "Users can view photos from own active galleries" ON gallery_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM galleries
            WHERE galleries.id = gallery_photos.gallery_id
            AND galleries.user_id = auth.uid()
        ) AND status = 'active'
    );

-- Create policy for viewing DELETED photos (for Recently Deleted page)
CREATE POLICY "Users can view photos from own deleted galleries" ON gallery_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM galleries
            WHERE galleries.id = gallery_photos.gallery_id
            AND galleries.user_id = auth.uid()
        ) AND status = 'deleted'
    );

-- Step 4: Create function to handle soft delete for galleries
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

-- Step 5: Create BEFORE DELETE trigger for galleries
-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS handle_soft_delete_gallery ON galleries;

CREATE TRIGGER handle_soft_delete_gallery
BEFORE DELETE ON galleries
FOR EACH ROW
EXECUTE FUNCTION soft_delete_gallery();

-- Update DELETE policy for galleries
DROP POLICY IF EXISTS "Users can delete own galleries" ON galleries;
DROP POLICY IF EXISTS "Users can trigger soft delete on their own galleries" ON galleries;

CREATE POLICY "Users can delete own galleries" ON galleries
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Step 6: Create function to handle soft delete for photos
CREATE OR REPLACE FUNCTION soft_delete_photo()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE gallery_photos
    SET status = 'deleted', deleted_at = NOW()
    WHERE id = OLD.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS handle_soft_delete_photo ON gallery_photos;

CREATE TRIGGER handle_soft_delete_photo
BEFORE DELETE ON gallery_photos
FOR EACH ROW
EXECUTE FUNCTION soft_delete_photo();

-- Update DELETE policy for photos
DROP POLICY IF EXISTS "Users can delete photos from own galleries" ON gallery_photos;
DROP POLICY IF EXISTS "Users can trigger soft delete on their own photos" ON gallery_photos;

CREATE POLICY "Users can delete photos from own galleries" ON gallery_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM galleries
            WHERE galleries.id = gallery_photos.gallery_id
            AND galleries.user_id = auth.uid()
        )
    );

-- Step 7: Add UPDATE policies to allow restoring deleted items
DROP POLICY IF EXISTS "Users can update own galleries" ON galleries;

CREATE POLICY "Users can update own galleries" ON galleries
    FOR UPDATE USING (
        auth.uid() = user_id
    )
    WITH CHECK (
        auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Users can update photos from own galleries" ON gallery_photos;

CREATE POLICY "Users can update photos from own galleries" ON gallery_photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM galleries
            WHERE galleries.id = gallery_photos.gallery_id
            AND galleries.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM galleries
            WHERE galleries.id = gallery_photos.gallery_id
            AND galleries.user_id = auth.uid()
        )
    );

-- Step 8: Create function for permanent deletion (to be called by cron job)
CREATE OR REPLACE FUNCTION permanent_delete_old_items()
RETURNS void AS $$
BEGIN
    -- Permanently delete photos that were soft-deleted more than 30 days ago
    DELETE FROM gallery_photos
    WHERE status = 'deleted'
    AND deleted_at < NOW() - INTERVAL '30 days';

    -- Permanently delete galleries that were soft-deleted more than 30 days ago
    DELETE FROM galleries
    WHERE status = 'deleted'
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Note: Set up a cron job in Supabase Edge Functions to call permanent_delete_old_items() daily
