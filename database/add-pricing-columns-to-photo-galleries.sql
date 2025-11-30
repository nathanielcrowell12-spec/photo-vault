-- ============================================================================
-- SIMPLE FIX: Add pricing columns to photo_galleries
-- ============================================================================
-- This is a simplified migration that ONLY adds the missing columns.
-- No data migration - any galleries in the old 'galleries' table will need
-- to be recreated through the UI.
-- ============================================================================

-- Payment option and billing mode
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS payment_option_id VARCHAR(50) DEFAULT NULL;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(20) DEFAULT 'storage_only';

-- Pricing in cents
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS shoot_fee INTEGER DEFAULT 0;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS storage_fee INTEGER DEFAULT 0;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0;

-- Payment status and Stripe references
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255) DEFAULT NULL;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) DEFAULT NULL;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;

-- Gallery expiration and download tracking
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS gallery_expires_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS download_tracking_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS total_photos_to_download INTEGER DEFAULT 0;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS photos_downloaded INTEGER DEFAULT 0;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS all_photos_downloaded BOOLEAN DEFAULT FALSE;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS download_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Reactivation tracking
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(50) DEFAULT NULL;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS reactivation_count INTEGER DEFAULT 0;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS last_reactivation_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS original_payment_option_id VARCHAR(50) DEFAULT NULL;

-- Gallery status for workflow
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS gallery_status VARCHAR(20) DEFAULT 'draft';

-- User ID for client linking
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT NULL;

-- ============================================================================
-- Add indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_photo_galleries_payment_status ON photo_galleries(payment_status);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_payment_option ON photo_galleries(payment_option_id);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_expires_at ON photo_galleries(gallery_expires_at);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_is_archived ON photo_galleries(is_archived);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_gallery_status ON photo_galleries(gallery_status);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_user_id ON photo_galleries(user_id);

-- ============================================================================
-- Update RLS policies to allow insert/update with new columns
-- ============================================================================

-- Ensure photographers can insert galleries
DROP POLICY IF EXISTS "Photographers can create galleries" ON photo_galleries;
CREATE POLICY "Photographers can create galleries"
  ON photo_galleries
  FOR INSERT
  WITH CHECK (photographer_id = auth.uid());

-- Ensure photographers can update their galleries
DROP POLICY IF EXISTS "Photographers can update their galleries" ON photo_galleries;
CREATE POLICY "Photographers can update their galleries"
  ON photo_galleries
  FOR UPDATE
  USING (photographer_id = auth.uid())
  WITH CHECK (photographer_id = auth.uid());

-- Photographers can view their own galleries
DROP POLICY IF EXISTS "Photographers can view their galleries" ON photo_galleries;
CREATE POLICY "Photographers can view their galleries"
  ON photo_galleries
  FOR SELECT
  USING (photographer_id = auth.uid());

-- Clients can view galleries assigned to them
DROP POLICY IF EXISTS "Clients can view their galleries" ON photo_galleries;
CREATE POLICY "Clients can view their galleries"
  ON photo_galleries
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all galleries" ON photo_galleries;
CREATE POLICY "Admins can manage all galleries"
  ON photo_galleries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- ============================================================================
-- DONE - photo_galleries now has all pricing columns
-- ============================================================================
--
-- The code has been updated to use photo_galleries instead of galleries.
-- Any galleries created in the old 'galleries' table will need to be
-- recreated through the UI.
--
-- ============================================================================
