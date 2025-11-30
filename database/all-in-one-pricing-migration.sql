-- ============================================================================
-- ALL-IN-ONE DYNAMIC PRICING MIGRATION
-- PhotoVault Phase 2: Combined shoot fee + storage in single invoice
-- ============================================================================
--
-- This migration adds support for photographers to bundle their shoot fee
-- with storage packages, presenting clients with a single total price.
--
-- Run this migration AFTER payment-model-migration.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Add pricing columns to galleries table
-- ============================================================================

-- Add payment/pricing columns to galleries
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS payment_option_id VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(20) DEFAULT 'storage_only'
  CHECK (billing_mode IN ('storage_only', 'all_in_one')),
ADD COLUMN IF NOT EXISTS shoot_fee INTEGER DEFAULT 0,           -- In cents (e.g., 250000 = $2500)
ADD COLUMN IF NOT EXISTS storage_fee INTEGER DEFAULT 0,         -- In cents (from payment option)
ADD COLUMN IF NOT EXISTS total_amount INTEGER DEFAULT 0,        -- In cents (shoot_fee + storage_fee)
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gallery_expires_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS download_tracking_enabled BOOLEAN DEFAULT FALSE;

-- Add download tracking columns for Shoot Only galleries
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS total_photos_to_download INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS photos_downloaded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS all_photos_downloaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS download_completed_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN galleries.payment_option_id IS 'Storage package ID (year_package, six_month_package, six_month_trial, shoot_only)';
COMMENT ON COLUMN galleries.billing_mode IS 'storage_only = photographer bills separately; all_in_one = single invoice';
COMMENT ON COLUMN galleries.shoot_fee IS 'Photographer session fee in cents (e.g., 250000 = $2500)';
COMMENT ON COLUMN galleries.storage_fee IS 'Storage package price in cents (from payment_option)';
COMMENT ON COLUMN galleries.total_amount IS 'Total client pays in cents (shoot_fee + storage_fee)';
COMMENT ON COLUMN galleries.gallery_expires_at IS 'When gallery access ends (for trial/shoot-only)';
COMMENT ON COLUMN galleries.download_tracking_enabled IS 'TRUE for shoot_only galleries to track download completion';

-- ============================================================================
-- STEP 2: Create photo downloads tracking table
-- ============================================================================

CREATE TABLE IF NOT EXISTS photo_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  downloaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  download_type VARCHAR(20) DEFAULT 'individual' CHECK (download_type IN ('individual', 'bulk', 'zip')),
  ip_address INET,
  user_agent TEXT,
  UNIQUE (gallery_id, photo_id, downloaded_by) -- One download per photo per user
);

CREATE INDEX IF NOT EXISTS idx_photo_downloads_gallery_id ON photo_downloads(gallery_id);
CREATE INDEX IF NOT EXISTS idx_photo_downloads_downloaded_at ON photo_downloads(downloaded_at);

COMMENT ON TABLE photo_downloads IS 'Tracks individual photo downloads for Shoot Only galleries';

-- Enable RLS
ALTER TABLE photo_downloads ENABLE ROW LEVEL SECURITY;

-- Photographers can view downloads for their galleries
CREATE POLICY "Photographers can view their download stats"
  ON photo_downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM galleries g
      WHERE g.id = photo_downloads.gallery_id
      AND g.photographer_id = auth.uid()
    )
  );

-- Clients can insert their own downloads (when downloading)
CREATE POLICY "Users can insert their downloads"
  ON photo_downloads
  FOR INSERT
  WITH CHECK (downloaded_by = auth.uid());

-- ============================================================================
-- STEP 3: Create function to check if all photos downloaded
-- ============================================================================

CREATE OR REPLACE FUNCTION check_gallery_download_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_gallery galleries%ROWTYPE;
  v_unique_downloads INTEGER;
BEGIN
  -- Get gallery info
  SELECT * INTO v_gallery FROM galleries WHERE id = NEW.gallery_id;

  -- Only check for shoot_only galleries with download tracking
  IF v_gallery.payment_option_id = 'shoot_only' AND v_gallery.download_tracking_enabled THEN
    -- Count unique photos downloaded (not total downloads)
    SELECT COUNT(DISTINCT photo_id) INTO v_unique_downloads
    FROM photo_downloads
    WHERE gallery_id = NEW.gallery_id;

    -- Update gallery download count
    UPDATE galleries
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

-- Trigger to check download completion after each download
DROP TRIGGER IF EXISTS check_download_completion ON photo_downloads;
CREATE TRIGGER check_download_completion
  AFTER INSERT ON photo_downloads
  FOR EACH ROW
  EXECUTE FUNCTION check_gallery_download_completion();

-- ============================================================================
-- STEP 4: Create function to calculate gallery expiration
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_gallery_expiration(
  p_payment_option_id VARCHAR(50),
  p_paid_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN CASE p_payment_option_id
    WHEN 'year_package' THEN p_paid_at + INTERVAL '12 months'
    WHEN 'six_month_package' THEN p_paid_at + INTERVAL '6 months'
    WHEN 'six_month_trial' THEN p_paid_at + INTERVAL '6 months'
    WHEN 'shoot_only' THEN p_paid_at + INTERVAL '90 days' -- Max 90 days
    ELSE NULL -- Ongoing monthly has no fixed expiration
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Create gallery payment transactions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS gallery_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Payment details
  payment_option_id VARCHAR(50) NOT NULL,
  billing_mode VARCHAR(20) NOT NULL,

  -- Amounts in cents
  shoot_fee INTEGER NOT NULL DEFAULT 0,
  storage_fee INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,

  -- Commission split (calculated at payment time)
  photographer_commission INTEGER NOT NULL DEFAULT 0,  -- Storage commission to photographer
  photovault_revenue INTEGER NOT NULL DEFAULT 0,       -- Storage revenue to PhotoVault
  photographer_payout INTEGER NOT NULL DEFAULT 0,      -- Total to photographer (shoot_fee + commission)
  stripe_fees INTEGER NOT NULL DEFAULT 0,              -- Estimated Stripe fees

  -- Stripe references
  stripe_checkout_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),                     -- Transfer to photographer's connected account

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

COMMENT ON TABLE gallery_payment_transactions IS 'Records all gallery payments with revenue split details';

-- Enable RLS
ALTER TABLE gallery_payment_transactions ENABLE ROW LEVEL SECURITY;

-- Photographers can view their own transactions
CREATE POLICY "Photographers can view their transactions"
  ON gallery_payment_transactions
  FOR SELECT
  USING (photographer_id = auth.uid());

-- Admins can view all transactions
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

-- Only system can insert/update (via service role)
-- No insert/update policies for regular users

-- ============================================================================
-- STEP 6: Add useful views
-- ============================================================================

-- View for photographer's gallery revenue summary
CREATE OR REPLACE VIEW photographer_gallery_revenue AS
SELECT
  g.photographer_id,
  g.id as gallery_id,
  g.gallery_name,
  g.client_id,
  c.name as client_name,
  g.billing_mode,
  g.payment_option_id,
  g.shoot_fee / 100.0 as shoot_fee_dollars,
  g.storage_fee / 100.0 as storage_fee_dollars,
  g.total_amount / 100.0 as total_dollars,
  g.payment_status,
  g.paid_at,
  g.gallery_expires_at,
  g.download_tracking_enabled,
  g.photos_downloaded,
  g.total_photos_to_download,
  g.all_photos_downloaded,
  gpt.photographer_payout / 100.0 as photographer_payout_dollars,
  gpt.photovault_revenue / 100.0 as photovault_revenue_dollars,
  gpt.stripe_fees / 100.0 as stripe_fees_dollars
FROM galleries g
LEFT JOIN clients c ON g.client_id = c.id
LEFT JOIN gallery_payment_transactions gpt ON g.id = gpt.gallery_id AND gpt.status = 'completed'
WHERE g.billing_mode IS NOT NULL;

-- ============================================================================
-- STEP 7: Create helper function for calculating payment split
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_payment_split(
  p_payment_option_id VARCHAR(50),
  p_shoot_fee INTEGER,        -- In cents
  p_storage_fee INTEGER       -- In cents
)
RETURNS TABLE (
  total_amount INTEGER,
  photographer_commission INTEGER,  -- 50% of storage
  photovault_revenue INTEGER,       -- 50% of storage
  photographer_payout INTEGER,      -- shoot_fee + commission
  estimated_stripe_fees INTEGER     -- ~2.9% + 30c
) AS $$
DECLARE
  v_commission_rate NUMERIC := 0.50; -- 50%
  v_total INTEGER;
  v_commission INTEGER;
  v_pv_revenue INTEGER;
  v_payout INTEGER;
  v_stripe_fees INTEGER;
BEGIN
  -- Calculate total
  v_total := p_shoot_fee + p_storage_fee;

  -- Calculate storage commission (50% of storage fee)
  v_commission := FLOOR(p_storage_fee * v_commission_rate);

  -- PhotoVault revenue (storage fee minus commission)
  v_pv_revenue := p_storage_fee - v_commission;

  -- Photographer payout (shoot fee + commission)
  v_payout := p_shoot_fee + v_commission;

  -- Estimated Stripe fees (2.9% + 30c)
  v_stripe_fees := CEIL(v_total * 0.029) + 30;

  RETURN QUERY SELECT v_total, v_commission, v_pv_revenue, v_payout, v_stripe_fees;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM calculate_payment_split('year_package', 250000, 10000);
-- Returns: total=260000, commission=5000, pv_revenue=5000, payout=255000, stripe_fees=~7570

-- ============================================================================
-- STEP 8: Update trigger for updated_at
-- ============================================================================

CREATE TRIGGER update_gallery_payments_updated_at
  BEFORE UPDATE ON gallery_payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: Reactivation flow for expired galleries (including Shoot Only)
-- ============================================================================

-- Add reactivation tracking columns
ALTER TABLE galleries
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archive_reason VARCHAR(50) DEFAULT NULL
  CHECK (archive_reason IN ('expired', 'download_complete', 'non_payment', 'manual')),
ADD COLUMN IF NOT EXISTS reactivation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reactivation_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS original_payment_option_id VARCHAR(50) DEFAULT NULL;

COMMENT ON COLUMN galleries.is_archived IS 'TRUE when gallery is archived/inactive';
COMMENT ON COLUMN galleries.archive_reason IS 'Why gallery was archived: expired, download_complete, non_payment, manual';
COMMENT ON COLUMN galleries.reactivation_count IS 'How many times this gallery has been reactivated';
COMMENT ON COLUMN galleries.original_payment_option_id IS 'Original package before any reactivation (tracks if was shoot_only)';

-- Function to archive a gallery
CREATE OR REPLACE FUNCTION archive_gallery(
  p_gallery_id UUID,
  p_reason VARCHAR(50) DEFAULT 'expired'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE galleries
  SET
    is_archived = TRUE,
    archived_at = NOW(),
    archive_reason = p_reason,
    payment_status = 'expired'
  WHERE id = p_gallery_id
    AND is_archived = FALSE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a gallery can be reactivated
-- Returns info about what's needed for reactivation
CREATE OR REPLACE FUNCTION check_reactivation_eligibility(p_gallery_id UUID)
RETURNS TABLE (
  eligible BOOLEAN,
  gallery_id UUID,
  photographer_id UUID,
  client_id UUID,
  original_payment_option VARCHAR(50),
  was_shoot_only BOOLEAN,
  requires_reactivation_fee BOOLEAN,
  reactivation_fee_cents INTEGER,
  monthly_after_reactivation BOOLEAN,
  archive_reason VARCHAR(50),
  archived_at TIMESTAMPTZ,
  message TEXT
) AS $$
DECLARE
  v_gallery galleries%ROWTYPE;
BEGIN
  -- Get gallery
  SELECT * INTO v_gallery FROM galleries WHERE id = p_gallery_id;

  IF v_gallery.id IS NULL THEN
    RETURN QUERY SELECT
      FALSE,
      p_gallery_id,
      NULL::UUID,
      NULL::UUID,
      NULL::VARCHAR(50),
      FALSE,
      FALSE,
      0,
      FALSE,
      NULL::VARCHAR(50),
      NULL::TIMESTAMPTZ,
      'Gallery not found'::TEXT;
    RETURN;
  END IF;

  -- Check if gallery is archived
  IF NOT v_gallery.is_archived THEN
    RETURN QUERY SELECT
      FALSE,
      v_gallery.id,
      v_gallery.photographer_id,
      v_gallery.client_id,
      v_gallery.payment_option_id,
      v_gallery.payment_option_id = 'shoot_only',
      FALSE,
      0,
      FALSE,
      v_gallery.archive_reason,
      v_gallery.archived_at,
      'Gallery is not archived - no reactivation needed'::TEXT;
    RETURN;
  END IF;

  -- Reactivation flow:
  -- 1. Pay $20 reactivation fee (100% to PhotoVault) - "door opener"
  -- 2. Gallery active for 1 month
  -- 3. Client chooses:
  --    Option A: Start $8/month subscription (50/50 split) for ongoing access
  --    Option B: Download photos and leave (gallery archives again after 1 month)
  -- No one is forced into monthly payments

  RETURN QUERY SELECT
    TRUE,
    v_gallery.id,
    v_gallery.photographer_id,
    v_gallery.client_id,
    COALESCE(v_gallery.original_payment_option_id, v_gallery.payment_option_id),
    COALESCE(v_gallery.original_payment_option_id, v_gallery.payment_option_id) = 'shoot_only',
    TRUE, -- All reactivations require $20 fee
    2000, -- $20 in cents
    FALSE, -- $8/month is OPTIONAL, not required
    v_gallery.archive_reason,
    v_gallery.archived_at,
    'Pay $20 reactivation fee for 1 month access. Then choose: start $8/month subscription OR just download and leave.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to reactivate a gallery after $20 reactivation fee payment
-- Flow: $20 fee (100% PV) → gallery active for 1 month → client chooses:
--   Option A: Start $8/month subscription (50/50 split)
--   Option B: Download photos and leave (gallery archives again after 1 month)
CREATE OR REPLACE FUNCTION reactivate_gallery(
  p_gallery_id UUID,
  p_stripe_payment_intent_id VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  gallery_id UUID,
  was_shoot_only BOOLEAN,
  access_expires_at TIMESTAMPTZ,
  message TEXT
) AS $$
DECLARE
  v_gallery galleries%ROWTYPE;
  v_was_shoot_only BOOLEAN;
  v_access_expires TIMESTAMPTZ;
BEGIN
  -- Get gallery
  SELECT * INTO v_gallery FROM galleries WHERE id = p_gallery_id;

  IF v_gallery.id IS NULL THEN
    RETURN QUERY SELECT FALSE, p_gallery_id, FALSE, NULL::TIMESTAMPTZ, 'Gallery not found'::TEXT;
    RETURN;
  END IF;

  IF NOT v_gallery.is_archived THEN
    RETURN QUERY SELECT FALSE, p_gallery_id, FALSE, v_gallery.gallery_expires_at, 'Gallery is not archived'::TEXT;
    RETURN;
  END IF;

  -- Check if was shoot_only
  v_was_shoot_only := COALESCE(v_gallery.original_payment_option_id, v_gallery.payment_option_id) = 'shoot_only';

  -- $20 reactivation gives 1 month of access
  v_access_expires := NOW() + INTERVAL '1 month';

  -- Update gallery
  -- Reactivation gives 1 month access - client then decides if they want $8/month
  UPDATE galleries
  SET
    is_archived = FALSE,
    archived_at = NULL,
    archive_reason = NULL,
    payment_status = 'paid',
    paid_at = NOW(),
    -- Store original payment option if this is first reactivation
    original_payment_option_id = CASE
      WHEN original_payment_option_id IS NULL THEN v_gallery.payment_option_id
      ELSE original_payment_option_id
    END,
    -- Set to reactivation_fee - will change to ongoing_monthly if they subscribe
    payment_option_id = 'reactivation_fee',
    storage_fee = 0,  -- Reactivation fee is not storage
    total_amount = 2000, -- $20 reactivation fee
    -- Gallery access expires in 1 month unless they start $8/month subscription
    gallery_expires_at = v_access_expires,
    reactivation_count = reactivation_count + 1,
    last_reactivation_at = NOW(),
    stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
    -- Enable download tracking so they can download their photos
    download_tracking_enabled = TRUE,
    all_photos_downloaded = FALSE
  WHERE id = p_gallery_id;

  -- Log the reactivation fee payment
  INSERT INTO gallery_payment_transactions (
    gallery_id,
    photographer_id,
    client_id,
    payment_option_id,
    billing_mode,
    shoot_fee,
    storage_fee,
    total_amount,
    -- Reactivation fee: 100% to PhotoVault, NO photographer commission
    photographer_commission,
    photovault_revenue,
    photographer_payout,
    stripe_fees,
    stripe_payment_intent_id,
    status,
    paid_at,
    notes
  ) VALUES (
    p_gallery_id,
    v_gallery.photographer_id,
    v_gallery.client_id,
    'reactivation_fee',
    'storage_only',
    0,
    0,
    2000, -- $20 reactivation fee
    0, -- NO commission to photographer
    2000, -- 100% to PhotoVault
    0, -- Photographer gets $0 from reactivation
    0,
    p_stripe_payment_intent_id,
    'completed',
    NOW(),
    'Reactivation fee - 1 month access to download or start $8/month subscription'
  );

  RETURN QUERY SELECT
    TRUE,
    p_gallery_id,
    v_was_shoot_only,
    v_access_expires,
    'Gallery reactivated for 1 month. Client can download photos or start $8/month subscription for ongoing access.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to convert a reactivated gallery to $8/month subscription
-- Called when client chooses to start monthly payments after reactivation
CREATE OR REPLACE FUNCTION start_monthly_subscription(
  p_gallery_id UUID,
  p_stripe_subscription_id VARCHAR(255)
)
RETURNS TABLE (
  success BOOLEAN,
  gallery_id UUID,
  message TEXT
) AS $$
DECLARE
  v_gallery galleries%ROWTYPE;
BEGIN
  -- Get gallery
  SELECT * INTO v_gallery FROM galleries WHERE id = p_gallery_id;

  IF v_gallery.id IS NULL THEN
    RETURN QUERY SELECT FALSE, p_gallery_id, 'Gallery not found'::TEXT;
    RETURN;
  END IF;

  -- Update gallery to ongoing monthly
  UPDATE galleries
  SET
    payment_option_id = 'ongoing_monthly',
    storage_fee = 800,  -- $8/month in cents
    total_amount = 800,
    gallery_expires_at = NULL, -- No expiry - active as long as subscription continues
    download_tracking_enabled = FALSE -- No need to track downloads on subscription
  WHERE id = p_gallery_id;

  RETURN QUERY SELECT
    TRUE,
    p_gallery_id,
    'Gallery converted to $8/month subscription (50/50 split with photographer)'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Cron job helper: Find galleries that should be archived
CREATE OR REPLACE FUNCTION find_galleries_to_archive()
RETURNS TABLE (
  gallery_id UUID,
  reason VARCHAR(50),
  expires_at TIMESTAMPTZ,
  all_downloaded BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    CASE
      WHEN g.payment_option_id = 'shoot_only' AND g.all_photos_downloaded THEN 'download_complete'::VARCHAR(50)
      WHEN g.gallery_expires_at < NOW() THEN 'expired'::VARCHAR(50)
      ELSE 'non_payment'::VARCHAR(50)
    END,
    g.gallery_expires_at,
    g.all_photos_downloaded
  FROM galleries g
  WHERE g.is_archived = FALSE
    AND g.payment_status = 'paid'
    AND (
      -- Expired galleries
      (g.gallery_expires_at IS NOT NULL AND g.gallery_expires_at < NOW())
      OR
      -- Shoot Only with all photos downloaded
      (g.payment_option_id = 'shoot_only' AND g.all_photos_downloaded = TRUE)
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- New columns on galleries:
--   - payment_option_id: Which storage package
--   - billing_mode: 'storage_only' or 'all_in_one'
--   - shoot_fee: Photographer's session fee (cents)
--   - storage_fee: Storage package price (cents)
--   - total_amount: What client pays (cents)
--   - payment_status: pending/paid/failed/refunded
--   - gallery_expires_at: When access ends
--   - download_tracking_enabled: For shoot_only galleries
--   - photos_downloaded: Count of unique downloads
--   - all_photos_downloaded: TRUE when complete
--
-- New tables:
--   - photo_downloads: Track individual downloads
--   - gallery_payment_transactions: Full payment records with split
--
-- New functions:
--   - calculate_gallery_expiration(): Get expiry date for payment option
--   - calculate_payment_split(): Get revenue split breakdown
--   - check_gallery_download_completion(): Trigger for download tracking
--
-- ============================================================================
