-- ============================================================================
-- CONSOLIDATION MIGRATION: Add pricing columns to photo_galleries
-- ============================================================================
--
-- This migration adds the All-In-One pricing columns to photo_galleries,
-- making it the SINGLE canonical gallery table for the entire system.
--
-- BACKGROUND:
-- - photo_galleries: Original table, used by imports, desktop uploader, photos FK
-- - galleries: Newer table, used by web UI gallery creation
-- - This caused foreign key errors when web-created galleries tried to add photos
--
-- SOLUTION:
-- - Add all pricing columns from 'galleries' to 'photo_galleries'
-- - Update web UI code to use 'photo_galleries' instead of 'galleries'
-- - photos table FK already points to photo_galleries - no change needed
--
-- Run this AFTER: schema.sql, payment-model-migration.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Add pricing/billing columns to photo_galleries
-- ============================================================================

-- Payment option and billing mode
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS payment_option_id VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(20) DEFAULT 'storage_only'
  CHECK (billing_mode IN ('storage_only', 'all_in_one'));

-- Pricing in cents
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS shoot_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0;

-- Payment status and Stripe references
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'expired')),
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL;

-- Gallery expiration and download tracking
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS gallery_expires_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS download_tracking_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_photos_to_download INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS photos_downloaded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS all_photos_downloaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS download_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Reactivation tracking
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(50) DEFAULT NULL
  CHECK (archive_reason IN ('expired', 'download_complete', 'non_payment', 'manual')),
ADD COLUMN IF NOT EXISTS reactivation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reactivation_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS original_payment_option_id VARCHAR(50) DEFAULT NULL;

-- Gallery status for workflow
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS gallery_status VARCHAR(20) DEFAULT 'draft'
  CHECK (gallery_status IN ('draft', 'ready', 'delivered', 'archived'));

-- User ID for client linking (from galleries table)
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN photo_galleries.payment_option_id IS 'Storage package: year_package, six_month_package, six_month_trial, shoot_only, ongoing_monthly';
COMMENT ON COLUMN photo_galleries.billing_mode IS 'storage_only = photographer bills separately; all_in_one = single combined invoice';
COMMENT ON COLUMN photo_galleries.shoot_fee IS 'Photographer session fee in cents (e.g., 250000 = $2500)';
COMMENT ON COLUMN photo_galleries.storage_fee IS 'Storage package price in cents from payment_option';
COMMENT ON COLUMN photo_galleries.total_amount IS 'Total client pays in cents (shoot_fee + storage_fee for all_in_one)';
COMMENT ON COLUMN photo_galleries.gallery_expires_at IS 'When gallery access ends (for trial/shoot-only packages)';
COMMENT ON COLUMN photo_galleries.download_tracking_enabled IS 'TRUE for shoot_only galleries to track download completion';
COMMENT ON COLUMN photo_galleries.gallery_status IS 'Workflow status: draft, ready, delivered, archived';

-- ============================================================================
-- STEP 3: Create/update indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_photo_galleries_payment_status ON photo_galleries(payment_status);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_payment_option ON photo_galleries(payment_option_id);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_expires_at ON photo_galleries(gallery_expires_at);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_is_archived ON photo_galleries(is_archived);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_gallery_status ON photo_galleries(gallery_status);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_user_id ON photo_galleries(user_id);

-- ============================================================================
-- STEP 4: Update photo_downloads to reference photo_galleries (if exists)
-- ============================================================================

-- Check if photo_downloads exists and references galleries, update to photo_galleries
-- This handles the case where photo_downloads was created for galleries table
DO $$
BEGIN
  -- If photo_downloads exists but references wrong table, we need to handle it
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'photo_downloads'
  ) THEN
    -- Drop and recreate with correct reference
    DROP TABLE IF EXISTS photo_downloads CASCADE;
  END IF;
END $$;

-- Recreate photo_downloads with correct FK to photo_galleries
CREATE TABLE IF NOT EXISTS photo_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES photo_galleries(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  downloaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  download_type VARCHAR(20) DEFAULT 'individual' CHECK (download_type IN ('individual', 'bulk', 'zip')),
  ip_address INET,
  user_agent TEXT,
  UNIQUE (gallery_id, photo_id, downloaded_by)
);

CREATE INDEX IF NOT EXISTS idx_photo_downloads_gallery_id ON photo_downloads(gallery_id);
CREATE INDEX IF NOT EXISTS idx_photo_downloads_downloaded_at ON photo_downloads(downloaded_at);

-- Enable RLS
ALTER TABLE photo_downloads ENABLE ROW LEVEL SECURITY;

-- Photographers can view downloads for their galleries
DROP POLICY IF EXISTS "Photographers can view their download stats" ON photo_downloads;
CREATE POLICY "Photographers can view their download stats"
  ON photo_downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM photo_galleries g
      WHERE g.id = photo_downloads.gallery_id
      AND g.photographer_id = auth.uid()
    )
  );

-- Clients/users can insert their own downloads
DROP POLICY IF EXISTS "Users can insert their downloads" ON photo_downloads;
CREATE POLICY "Users can insert their downloads"
  ON photo_downloads
  FOR INSERT
  WITH CHECK (downloaded_by = auth.uid());

-- ============================================================================
-- STEP 5: Create gallery_payment_transactions for photo_galleries
-- ============================================================================

-- Drop if exists to recreate with correct FK
DROP TABLE IF EXISTS gallery_payment_transactions CASCADE;

CREATE TABLE gallery_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES photo_galleries(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Payment details
  payment_option_id VARCHAR(50) NOT NULL,
  billing_mode VARCHAR(20) NOT NULL,

  -- Amounts in cents
  shoot_fee INTEGER NOT NULL DEFAULT 0,
  storage_fee INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,

  -- Commission split (calculated at payment time)
  photographer_commission INTEGER NOT NULL DEFAULT 0,
  photovault_revenue INTEGER NOT NULL DEFAULT 0,
  photographer_payout INTEGER NOT NULL DEFAULT 0,
  stripe_fees INTEGER NOT NULL DEFAULT 0,

  -- Stripe references
  stripe_checkout_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  transfer_completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_gallery_payments_gallery_id ON gallery_payment_transactions(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_payments_photographer_id ON gallery_payment_transactions(photographer_id);
CREATE INDEX IF NOT EXISTS idx_gallery_payments_status ON gallery_payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_gallery_payments_paid_at ON gallery_payment_transactions(paid_at);

-- Enable RLS
ALTER TABLE gallery_payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Photographers can view their transactions" ON gallery_payment_transactions;
CREATE POLICY "Photographers can view their transactions"
  ON gallery_payment_transactions
  FOR SELECT
  USING (photographer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all transactions" ON gallery_payment_transactions;
CREATE POLICY "Admins can view all transactions"
  ON gallery_payment_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- ============================================================================
-- STEP 6: Update RLS policies for photo_galleries new columns
-- ============================================================================

-- Ensure photographers can update their galleries (including new pricing columns)
DROP POLICY IF EXISTS "Photographers can update their galleries" ON photo_galleries;
CREATE POLICY "Photographers can update their galleries"
  ON photo_galleries
  FOR UPDATE
  USING (photographer_id = auth.uid())
  WITH CHECK (photographer_id = auth.uid());

-- Ensure photographers can insert galleries
DROP POLICY IF EXISTS "Photographers can create galleries" ON photo_galleries;
CREATE POLICY "Photographers can create galleries"
  ON photo_galleries
  FOR INSERT
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

-- Admins can view all galleries
DROP POLICY IF EXISTS "Admins can view all galleries" ON photo_galleries;
CREATE POLICY "Admins can view all galleries"
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
-- STEP 7: Helper functions for photo_galleries
-- ============================================================================

-- Calculate gallery expiration based on payment option
CREATE OR REPLACE FUNCTION calculate_photo_gallery_expiration(
  p_payment_option_id VARCHAR(50),
  p_paid_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN CASE p_payment_option_id
    WHEN 'year_package' THEN p_paid_at + INTERVAL '12 months'
    WHEN 'six_month_package' THEN p_paid_at + INTERVAL '6 months'
    WHEN 'six_month_trial' THEN p_paid_at + INTERVAL '6 months'
    WHEN 'shoot_only' THEN p_paid_at + INTERVAL '90 days'
    ELSE NULL -- Ongoing monthly has no fixed expiration
  END;
END;
$$ LANGUAGE plpgsql;

-- Check download completion for photo_galleries
CREATE OR REPLACE FUNCTION check_photo_gallery_download_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_gallery photo_galleries%ROWTYPE;
  v_unique_downloads INTEGER;
BEGIN
  SELECT * INTO v_gallery FROM photo_galleries WHERE id = NEW.gallery_id;

  IF v_gallery.payment_option_id = 'shoot_only' AND v_gallery.download_tracking_enabled THEN
    SELECT COUNT(DISTINCT photo_id) INTO v_unique_downloads
    FROM photo_downloads
    WHERE gallery_id = NEW.gallery_id;

    UPDATE photo_galleries
    SET
      photos_downloaded = v_unique_downloads,
      all_photos_downloaded = (v_unique_downloads >= v_gallery.total_photos_to_download),
      download_completed_at = CASE
        WHEN v_unique_downloads >= v_gallery.total_photos_to_download THEN NOW()
        ELSE NULL
      END
    WHERE id = NEW.gallery_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_photo_gallery_download_completion ON photo_downloads;
CREATE TRIGGER check_photo_gallery_download_completion
  AFTER INSERT ON photo_downloads
  FOR EACH ROW
  EXECUTE FUNCTION check_photo_gallery_download_completion();

-- ============================================================================
-- STEP 8: Migrate data from galleries to photo_galleries (if any exists)
-- ============================================================================

-- This copies any galleries from 'galleries' table to 'photo_galleries'
-- Note: galleries table has different columns than photo_galleries
-- We only copy the columns that exist in galleries table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'galleries') THEN
    -- Insert galleries that don't already exist in photo_galleries
    -- Using only columns that exist in the galleries table
    INSERT INTO photo_galleries (
      id,
      photographer_id,
      client_id,
      platform,
      gallery_name,
      gallery_description,
      cover_image_url,
      photo_count,
      session_date,
      payment_option_id,
      billing_mode,
      shoot_fee,
      storage_fee,
      total_amount,
      payment_status,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      paid_at,
      gallery_expires_at,
      download_tracking_enabled,
      total_photos_to_download,
      photos_downloaded,
      all_photos_downloaded,
      user_id,
      created_at,
      updated_at
    )
    SELECT
      g.id,
      g.photographer_id,
      g.client_id,
      'photovault',  -- galleries table doesn't have platform column
      g.gallery_name,
      g.gallery_description,
      g.cover_image_url,
      g.photo_count,
      g.session_date,
      g.payment_option_id,
      g.billing_mode,
      g.shoot_fee,
      g.storage_fee,
      g.total_amount,
      g.payment_status,
      g.stripe_checkout_session_id,
      g.stripe_payment_intent_id,
      g.paid_at,
      g.gallery_expires_at,
      COALESCE(g.download_tracking_enabled, FALSE),
      COALESCE(g.total_photos_to_download, 0),
      COALESCE(g.photos_downloaded, 0),
      COALESCE(g.all_photos_downloaded, FALSE),
      g.user_id,
      g.created_at,
      g.updated_at
    FROM galleries g
    WHERE NOT EXISTS (
      SELECT 1 FROM photo_galleries pg WHERE pg.id = g.id
    );

    RAISE NOTICE 'Migrated galleries from galleries table to photo_galleries';
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- photo_galleries is now the SINGLE canonical gallery table with:
-- - All original import/CMS fields (platform, platform_gallery_id, cms_gallery_id, etc.)
-- - All pricing fields (payment_option_id, billing_mode, shoot_fee, storage_fee, total_amount)
-- - All payment tracking (payment_status, stripe_*, paid_at)
-- - All download tracking (download_tracking_enabled, photos_downloaded, etc.)
-- - All archive/reactivation fields
--
-- The photos table FK already points to photo_galleries - no change needed.
-- Update all code to use 'photo_galleries' instead of 'galleries'.
--
-- ============================================================================
