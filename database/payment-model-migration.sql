-- PhotoVault Payment Model - Complete Database Migration
-- Date: November 15, 2025
-- Purpose: Support full payment processing (shoot fees + storage packages)
--
-- IMPORTANT: This migration implements the complete payment model documented in:
-- C:\Users\natha\Stone-Fence-Brain\PHOTOVAULT_PAYMENT_MODEL_SCHEMA_CHANGES.md
--
-- Migration Phases:
-- Phase 1: Modify existing tables (clients, photographers, payment_options, client_payments)
-- Phase 2: Create new tables (photographer_succession_log, monthly_billing_schedule, photographer_payouts)
-- Phase 3: Create database functions (set_primary_photographer, handle_photographer_succession, calculate_photographer_payout)
-- Phase 4: Insert correct payment options
--
-- Execute phases in order. Test each phase before proceeding to next.

-- ============================================================================
-- PHASE 1: MODIFY EXISTING TABLES
-- ============================================================================

-- ============================================================================
-- 1.1 CLIENTS TABLE - Add Primary Photographer Tracking
-- ============================================================================

-- Add primary photographer tracking columns
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS primary_photographer_id UUID REFERENCES photographers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS became_primary_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_orphaned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS orphaned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_type VARCHAR(20) DEFAULT 'photographer_referred'
  CHECK (client_type IN ('photographer_referred', 'direct_signup', 'orphaned'));

-- Make photographer_id nullable to support orphaned clients
ALTER TABLE clients
ALTER COLUMN photographer_id DROP NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_primary_photographer ON clients(primary_photographer_id);
CREATE INDEX IF NOT EXISTS idx_clients_orphaned ON clients(is_orphaned) WHERE is_orphaned = TRUE;

-- ============================================================================
-- 1.2 PAYMENT_OPTIONS TABLE - Add Package Type Fields
-- ============================================================================

-- Add new columns for package types
ALTER TABLE payment_options
ADD COLUMN IF NOT EXISTS package_type VARCHAR(50) CHECK (package_type IN ('service_fee', 'prepaid', 'monthly', 'reactivation')),
ADD COLUMN IF NOT EXISTS free_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_first_gallery_only BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 1.3 CLIENT_PAYMENTS TABLE - Add Shoot Fee Itemization
-- ============================================================================

-- Add shoot fee and itemization columns
ALTER TABLE client_payments
ADD COLUMN IF NOT EXISTS shoot_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS storage_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS photographer_payout DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS photovault_revenue DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_reactivation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_first_gallery BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS monthly_billing_starts_at DATE,
ADD COLUMN IF NOT EXISTS has_prepaid_period BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_charge_id VARCHAR(255);

-- Make storage_fee and total_amount nullable initially for migration
-- They will be populated by backfill script
ALTER TABLE client_payments
ALTER COLUMN storage_fee DROP NOT NULL,
ALTER COLUMN total_amount DROP NOT NULL,
ALTER COLUMN photographer_payout DROP NOT NULL,
ALTER COLUMN photovault_revenue DROP NOT NULL;

-- Add indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON client_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_charge ON client_payments(stripe_charge_id);

-- ============================================================================
-- 1.4 CLIENT_INVITATIONS TABLE - Add Package Selection
-- ============================================================================

-- Add package and shoot fee to invitation
ALTER TABLE client_invitations
ADD COLUMN IF NOT EXISTS payment_option_id VARCHAR(50) REFERENCES payment_options(id),
ADD COLUMN IF NOT EXISTS shoot_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS photographer_message TEXT;

-- ============================================================================
-- 1.5 PHOTOGRAPHERS TABLE - Add Stripe Connect Fields
-- ============================================================================

-- Add Stripe Connect integration columns
ALTER TABLE photographers
ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_connect_status VARCHAR(50) DEFAULT 'not_started' CHECK (stripe_connect_status IN (
  'not_started',
  'pending',
  'active',
  'restricted',
  'disabled'
)),
ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bank_account_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_receive_payouts BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS next_payout_date DATE,
ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(10,2) DEFAULT 0.00;

-- Add index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_photographers_stripe_connect ON photographers(stripe_connect_account_id);

-- ============================================================================
-- 1.6 PHOTO_GALLERIES TABLE - Add Sneak Peek and Payment Tracking
-- ============================================================================

-- Add gallery status and sneak peek fields
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS shoot_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_option_id VARCHAR(50) REFERENCES payment_options(id),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gallery_status VARCHAR(20) DEFAULT 'draft' CHECK (gallery_status IN ('draft', 'ready', 'live', 'archived')),
ADD COLUMN IF NOT EXISTS sneak_peek_photo_ids UUID[],
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_emails_stopped BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_stop_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS days_since_ready INTEGER DEFAULT 0;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_galleries_status ON photo_galleries(gallery_status);
CREATE INDEX IF NOT EXISTS idx_galleries_ready ON photo_galleries(gallery_status, days_since_ready) WHERE gallery_status = 'ready';

-- ============================================================================
-- PHASE 2: CREATE NEW TABLES
-- ============================================================================

-- ============================================================================
-- 2.1 PHOTOGRAPHER_SUCCESSION_LOG - Track Primary Photographer Changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS photographer_succession_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  previous_primary_photographer_id UUID REFERENCES photographers(id) ON DELETE SET NULL,
  new_primary_photographer_id UUID REFERENCES photographers(id) ON DELETE SET NULL,
  succession_reason VARCHAR(50) CHECK (succession_reason IN (
    'initial_signup',
    'photographer_left',
    'photographer_deactivated',
    'orphan_protocol',
    'photographer_returned',
    'manual_override'
  )),
  succession_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_succession_client ON photographer_succession_log(client_id);
CREATE INDEX IF NOT EXISTS idx_succession_new_primary ON photographer_succession_log(new_primary_photographer_id);
CREATE INDEX IF NOT EXISTS idx_succession_date ON photographer_succession_log(succession_date);

-- ============================================================================
-- 2.2 MONTHLY_BILLING_SCHEDULE - Track $8/Month Recurring Billing
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_billing_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  primary_photographer_id UUID REFERENCES photographers(id) ON DELETE SET NULL,
  billing_start_date DATE NOT NULL,
  billing_status VARCHAR(20) DEFAULT 'active' CHECK (billing_status IN (
    'scheduled',
    'active',
    'paused',
    'cancelled',
    'failed'
  )),
  last_billing_date DATE,
  next_billing_date DATE,
  consecutive_failures INTEGER DEFAULT 0,
  grace_period_ends_at DATE,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_next_date ON monthly_billing_schedule(next_billing_date) WHERE billing_status = 'active';
CREATE INDEX IF NOT EXISTS idx_billing_grace_period ON monthly_billing_schedule(grace_period_ends_at) WHERE grace_period_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_stripe_sub ON monthly_billing_schedule(stripe_subscription_id);

-- ============================================================================
-- 2.3 PHOTOGRAPHER_PAYOUTS - Track Photographer Earnings with 2-Week Delay
-- ============================================================================

CREATE TABLE IF NOT EXISTS photographer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  client_payment_id UUID REFERENCES client_payments(id) ON DELETE SET NULL,
  payout_type VARCHAR(50) CHECK (payout_type IN (
    'shoot_fee',
    'storage_commission',
    'monthly_commission',
    'prepaid_commission'
  )),
  amount DECIMAL(10,2) NOT NULL,
  earned_date DATE NOT NULL,
  payout_eligible_date DATE NOT NULL,
  payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN (
    'pending',
    'processing',
    'paid',
    'failed',
    'cancelled'
  )),
  payout_date DATE,
  stripe_transfer_id VARCHAR(255),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_photographer ON photographer_payouts(photographer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_eligible_date ON photographer_payouts(payout_eligible_date) WHERE payout_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payouts_status ON photographer_payouts(payout_status);
CREATE INDEX IF NOT EXISTS idx_payouts_stripe_transfer ON photographer_payouts(stripe_transfer_id);

-- ============================================================================
-- PHASE 3: CREATE DATABASE FUNCTIONS
-- ============================================================================

-- ============================================================================
-- 3.1 SET_PRIMARY_PHOTOGRAPHER() - Automatically set on client signup
-- ============================================================================

CREATE OR REPLACE FUNCTION set_primary_photographer()
RETURNS TRIGGER AS $$
BEGIN
  -- Set primary photographer on client creation
  IF NEW.photographer_id IS NOT NULL AND NEW.primary_photographer_id IS NULL THEN
    NEW.primary_photographer_id = NEW.photographer_id;
    NEW.became_primary_at = NOW();

    -- Log succession (will be inserted after client creation)
    -- We'll use an AFTER trigger for this
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_set_primary_photographer ON clients;
CREATE TRIGGER trigger_set_primary_photographer
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_primary_photographer();

-- ============================================================================
-- 3.2 LOG_PRIMARY_PHOTOGRAPHER() - Log succession after client insert
-- ============================================================================

CREATE OR REPLACE FUNCTION log_primary_photographer()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the initial primary photographer assignment
  IF NEW.primary_photographer_id IS NOT NULL THEN
    INSERT INTO photographer_succession_log (
      client_id,
      new_primary_photographer_id,
      succession_reason,
      notes
    ) VALUES (
      NEW.id,
      NEW.primary_photographer_id,
      'initial_signup',
      'Client signed up via photographer invitation'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_log_primary_photographer ON clients;
CREATE TRIGGER trigger_log_primary_photographer
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_primary_photographer();

-- ============================================================================
-- 3.3 HANDLE_PHOTOGRAPHER_SUCCESSION() - Reassign primary when photographer leaves
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_photographer_succession(
  departing_photographer_id UUID
)
RETURNS TABLE (
  affected_clients INTEGER,
  new_orphans INTEGER,
  reassigned INTEGER
) AS $$
DECLARE
  client_record RECORD;
  next_photographer UUID;
  clients_affected INTEGER := 0;
  orphaned_count INTEGER := 0;
  reassigned_count INTEGER := 0;
BEGIN
  -- Find all clients where departing photographer is PRIMARY
  FOR client_record IN
    SELECT id, name, email
    FROM clients
    WHERE primary_photographer_id = departing_photographer_id
  LOOP
    clients_affected := clients_affected + 1;

    -- Try to find another photographer who has galleries with this client
    SELECT DISTINCT pg.photographer_id
    INTO next_photographer
    FROM photo_galleries pg
    WHERE pg.client_id = client_record.id
      AND pg.photographer_id != departing_photographer_id
      AND pg.photographer_id IN (SELECT id FROM photographers WHERE id IS NOT NULL)
    LIMIT 1;

    IF next_photographer IS NOT NULL THEN
      -- Reassign to next photographer
      UPDATE clients
      SET
        primary_photographer_id = next_photographer,
        became_primary_at = NOW(),
        is_orphaned = FALSE,
        orphaned_at = NULL
      WHERE id = client_record.id;

      -- Update monthly billing schedule
      UPDATE monthly_billing_schedule
      SET primary_photographer_id = next_photographer,
          updated_at = NOW()
      WHERE client_id = client_record.id;

      -- Log succession
      INSERT INTO photographer_succession_log (
        client_id,
        previous_primary_photographer_id,
        new_primary_photographer_id,
        succession_reason,
        notes
      ) VALUES (
        client_record.id,
        departing_photographer_id,
        next_photographer,
        'photographer_left',
        'Primary photographer departed, reassigned to next photographer with galleries for this client'
      );

      reassigned_count := reassigned_count + 1;
    ELSE
      -- No other photographers found - activate orphan protocol
      UPDATE clients
      SET
        primary_photographer_id = NULL,
        is_orphaned = TRUE,
        orphaned_at = NOW()
      WHERE id = client_record.id;

      -- Update monthly billing (PhotoVault keeps 100% of monthly revenue)
      UPDATE monthly_billing_schedule
      SET primary_photographer_id = NULL,
          updated_at = NOW()
      WHERE client_id = client_record.id;

      -- Log orphan status
      INSERT INTO photographer_succession_log (
        client_id,
        previous_primary_photographer_id,
        new_primary_photographer_id,
        succession_reason,
        notes
      ) VALUES (
        client_record.id,
        departing_photographer_id,
        NULL,
        'orphan_protocol',
        'No other photographers found for client. PhotoVault retains 100% of monthly revenue.'
      );

      orphaned_count := orphaned_count + 1;
    END IF;
  END LOOP;

  -- Return summary
  RETURN QUERY SELECT clients_affected, orphaned_count, reassigned_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3.4 CALCULATE_PHOTOGRAPHER_PAYOUT() - Calculate payout amounts with 2-week delay
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_photographer_payout(
  p_photographer_id UUID,
  p_client_payment_id UUID,
  p_shoot_fee DECIMAL(10,2),
  p_storage_fee DECIMAL(10,2),
  p_service_fee DECIMAL(10,2),
  p_is_reactivation BOOLEAN DEFAULT FALSE
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_payout DECIMAL(10,2) := 0.00;
  storage_commission DECIMAL(10,2) := 0.00;
  earned_date DATE := CURRENT_DATE;
  eligible_date DATE := CURRENT_DATE + INTERVAL '14 days';
BEGIN
  -- Calculate shoot fee payout (100% pass-through minus Stripe fees ~3%)
  -- For simplicity, we'll do 100% pass-through and handle Stripe fees separately
  IF p_shoot_fee > 0 THEN
    total_payout := total_payout + p_shoot_fee;

    -- Create payout record
    INSERT INTO photographer_payouts (
      photographer_id,
      client_payment_id,
      payout_type,
      amount,
      earned_date,
      payout_eligible_date,
      payout_status
    ) VALUES (
      p_photographer_id,
      p_client_payment_id,
      'shoot_fee',
      p_shoot_fee,
      earned_date,
      eligible_date,
      'pending'
    );
  END IF;

  -- Calculate storage commission (50/50 split)
  IF p_storage_fee > 0 THEN
    IF p_is_reactivation THEN
      -- Reactivation: 50% of storage portion only (service fee goes 100% to PhotoVault)
      storage_commission := p_storage_fee * 0.50;
    ELSE
      -- Regular gallery: 50% of storage fee
      storage_commission := p_storage_fee * 0.50;
    END IF;

    total_payout := total_payout + storage_commission;

    -- Create payout record
    INSERT INTO photographer_payouts (
      photographer_id,
      client_payment_id,
      payout_type,
      amount,
      earned_date,
      payout_eligible_date,
      payout_status
    ) VALUES (
      p_photographer_id,
      p_client_payment_id,
      CASE WHEN p_is_reactivation THEN 'storage_commission' ELSE 'prepaid_commission' END,
      storage_commission,
      earned_date,
      eligible_date,
      'pending'
    );
  END IF;

  -- Service fee: PhotoVault keeps 100% (no payout)

  RETURN total_payout;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 4: UPDATE PAYMENT OPTIONS WITH CORRECT PRICING
-- ============================================================================

-- Clear old payment options (backup first if needed)
DELETE FROM payment_options;

-- Insert correct payment options per specification
INSERT INTO payment_options (
  id,
  name,
  description,
  price,
  duration_months,
  photographer_commission_rate,
  package_type,
  free_months,
  is_first_gallery_only,
  commission_applies,
  is_active
) VALUES

-- Initial Gallery Packages (First gallery only)
(
  'service_fee_20',
  '$20 Service Fee (6 Months)',
  'Gallery active for 6 months, then archived. Client has 6 months to download. No monthly billing.',
  20.00,
  6,
  50.00,
  'service_fee',
  6,
  TRUE,
  TRUE,
  TRUE
),

(
  'prepaid_6mo',
  '$50 (6 Months Prepaid)',
  'Gallery storage prepaid for 6 months. After expiration, $8/month billing starts automatically.',
  50.00,
  6,
  50.00,
  'prepaid',
  6,
  TRUE,
  TRUE,
  TRUE
),

(
  'prepaid_1yr',
  '$100 (1 Year Prepaid)',
  'Gallery storage prepaid for 12 months. After expiration, $8/month billing starts automatically.',
  100.00,
  12,
  50.00,
  'prepaid',
  12,
  TRUE,
  TRUE,
  TRUE
),

-- Ongoing Monthly (starts after prepaid period or immediately on upgrade)
(
  'monthly_ongoing',
  '$8/Month Ongoing',
  'Monthly gallery access fee. Client vault remains active as long as payments continue. Never pauses once started.',
  8.00,
  999,
  50.00,
  'monthly',
  0,
  FALSE,
  TRUE,
  TRUE
),

-- Reactivation Options (after gallery archived)
(
  'reactivation_download',
  '$20 One-Time Download',
  'Reactivate gallery for 1 month download window, then archive again. 100% to PhotoVault (no commission).',
  20.00,
  1,
  0.00,
  'reactivation',
  0,
  FALSE,
  FALSE,
  TRUE
),

(
  'reactivation_6mo',
  '$70 Reactivation (6 Months)',
  '$20 service fee + $50 for 6 months prepaid storage. Monthly billing starts after 6 months. 50% commission on $50 portion only.',
  70.00,
  6,
  0.00,
  'reactivation',
  6,
  FALSE,
  FALSE,
  TRUE
),

(
  'reactivation_1yr',
  '$120 Reactivation (1 Year)',
  '$20 service fee + $100 for 1 year prepaid storage. Monthly billing starts after 12 months. 50% commission on $100 portion only.',
  120.00,
  12,
  0.00,
  'reactivation',
  12,
  FALSE,
  FALSE,
  TRUE
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify critical indexes exist
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN (
  'clients',
  'photographers',
  'photo_galleries',
  'client_payments',
  'photographer_payouts',
  'monthly_billing_schedule',
  'photographer_succession_log'
)
ORDER BY tablename, indexname;

-- Verify new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'photographer_succession_log',
    'monthly_billing_schedule',
    'photographer_payouts'
  );

-- Verify new columns exist on clients table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN (
    'primary_photographer_id',
    'became_primary_at',
    'is_orphaned',
    'orphaned_at',
    'client_type'
  );

-- Verify payment options inserted correctly
SELECT id, name, price, package_type, free_months, is_first_gallery_only
FROM payment_options
ORDER BY
  CASE package_type
    WHEN 'service_fee' THEN 1
    WHEN 'prepaid' THEN 2
    WHEN 'monthly' THEN 3
    WHEN 'reactivation' THEN 4
  END,
  price;

-- ============================================================================
-- NOTES FOR NEXT STEPS
-- ============================================================================

-- 1. Run this migration on development database first
-- 2. Test all functions manually
-- 3. Create data backfill script for existing client_payments records
-- 4. Update application code to use new schema
-- 5. Test Stripe integration with new payment flow
-- 6. Run on staging, then production

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
