-- ============================================================================
-- GALLERY WIZARD & PROOFING SYSTEM — Story 0: Schema Migration
-- ============================================================================
--
-- Purpose: Expand CHECK constraints and add wizard columns to photo_galleries
-- in preparation for the Gallery Creation Wizard (Epic 1) and Proofing System
-- (Epic 2).
--
-- Changes:
--   1. Resolve gallery_status discrepancy: 'live' → 'delivered'
--   2. DROP and re-create CHECK constraints with expanded values
--   3. Add wizard columns (payment_timing, proofing_enabled, etc.)
--
-- Run this AFTER: consolidate-photo-galleries-migration.sql
-- QA Critic reviewed: 2026-03-18 (APPROVE WITH CONCERNS — all resolved)
-- ============================================================================

-- ============================================================================
-- STEP 1: Resolve 'live' vs 'delivered' discrepancy
-- ============================================================================
-- payment-model-migration.sql used 'live'
-- consolidate-photo-galleries-migration.sql used 'delivered'
-- The codebase uses 'live'. Standardize on 'delivered' (semantically correct
-- for the wizard workflow where galleries are "delivered" to clients).

UPDATE photo_galleries
SET gallery_status = 'delivered'
WHERE gallery_status = 'live';

-- ============================================================================
-- STEP 2: DROP existing CHECK constraints
-- ============================================================================
-- Multiple migrations created overlapping CHECK constraints. We need to find
-- and drop the actual constraint names. PostgreSQL auto-names inline CHECK
-- constraints as: {table}_{column}_check
--
-- If custom names were used, the DO block handles discovery.

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all CHECK constraints on billing_mode
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
      AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'photo_galleries'::regclass
      AND con.contype = 'c'
      AND att.attname = 'billing_mode'
  LOOP
    EXECUTE format('ALTER TABLE photo_galleries DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped billing_mode constraint: %', r.conname;
  END LOOP;

  -- Drop all CHECK constraints on gallery_status
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
      AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'photo_galleries'::regclass
      AND con.contype = 'c'
      AND att.attname = 'gallery_status'
  LOOP
    EXECUTE format('ALTER TABLE photo_galleries DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped gallery_status constraint: %', r.conname;
  END LOOP;

  -- Drop all CHECK constraints on payment_status
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey)
      AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'photo_galleries'::regclass
      AND con.contype = 'c'
      AND att.attname = 'payment_status'
  LOOP
    EXECUTE format('ALTER TABLE photo_galleries DROP CONSTRAINT %I', r.conname);
    RAISE NOTICE 'Dropped payment_status constraint: %', r.conname;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Re-create CHECK constraints with expanded values
-- ============================================================================

ALTER TABLE photo_galleries
ADD CONSTRAINT photo_galleries_billing_mode_check
  CHECK (billing_mode IN ('storage_only', 'all_in_one', 'external'));

ALTER TABLE photo_galleries
ADD CONSTRAINT photo_galleries_gallery_status_check
  CHECK (gallery_status IN (
    'draft',
    'ready',
    'proofing',
    'proofing_complete',
    'payment_pending',
    'delivered',
    'archived'
  ));

ALTER TABLE photo_galleries
ADD CONSTRAINT photo_galleries_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'expired', 'external'));

-- ============================================================================
-- STEP 4: Add wizard columns to photo_galleries
-- ============================================================================

-- Payment timing: when client pays relative to gallery access
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS payment_timing VARCHAR(30) DEFAULT 'before_access'
  CHECK (payment_timing IN ('before_access', 'after_proofing', 'external'));

COMMENT ON COLUMN photo_galleries.payment_timing IS
  'before_access = Classic (pay then view), after_proofing = Proof First Pay Later, external = Deliver and Done';

-- Proofing toggle and deadline
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS proofing_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS proofing_deadline TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN photo_galleries.proofing_enabled IS
  'Whether client can submit proofing selections (filter preferences + notes) on this gallery';
COMMENT ON COLUMN photo_galleries.proofing_deadline IS
  'Auto-close proofing after this timestamp. NULL = no deadline';

-- AI edits permission
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS ai_edits_permission VARCHAR(30) DEFAULT 'not_allowed'
  CHECK (ai_edits_permission IN ('not_allowed', 'allowed', 'approval_required'));

COMMENT ON COLUMN photo_galleries.ai_edits_permission IS
  'Whether client can request CSS-filter-based edits on delivered photos (Phase 2 feature)';

-- Which preset flow was selected (analytics-only, no business logic dependency)
ALTER TABLE photo_galleries
ADD COLUMN IF NOT EXISTS preset_flow VARCHAR(30) DEFAULT NULL
  CHECK (preset_flow IN ('classic', 'proof_first', 'deliver_and_done'));

COMMENT ON COLUMN photo_galleries.preset_flow IS
  'Which wizard preset was used. Analytics-only — all settings are stored in their own columns';

-- ============================================================================
-- STEP 5: Add indexes for new columns used in queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_photo_galleries_payment_timing
  ON photo_galleries(payment_timing);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_proofing_enabled
  ON photo_galleries(proofing_enabled)
  WHERE proofing_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_photo_galleries_proofing_deadline
  ON photo_galleries(proofing_deadline)
  WHERE proofing_deadline IS NOT NULL;

-- ============================================================================
-- STEP 6: Verify migration
-- ============================================================================

-- Show the new CHECK constraints
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'photo_galleries'::regclass
  AND con.contype = 'c'
ORDER BY con.conname;

-- Show the new columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'photo_galleries'
  AND column_name IN (
    'payment_timing', 'proofing_enabled', 'proofing_deadline',
    'ai_edits_permission', 'preset_flow'
  )
ORDER BY column_name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- CHECK constraint changes:
--   billing_mode:    + 'external'
--   gallery_status:  'live' → 'delivered', + 'proofing', 'proofing_complete', 'payment_pending'
--   payment_status:  + 'external'
--
-- New columns (all nullable/defaulted — safe for existing galleries):
--   payment_timing       VARCHAR(30) DEFAULT 'before_access'
--   proofing_enabled     BOOLEAN     DEFAULT FALSE
--   proofing_deadline    TIMESTAMPTZ DEFAULT NULL
--   ai_edits_permission  VARCHAR(30) DEFAULT 'not_allowed'
--   preset_flow          VARCHAR(30) DEFAULT NULL
--
-- Existing galleries default to Classic behavior (payment_timing=before_access,
-- proofing_enabled=false). No data is modified except gallery_status 'live' → 'delivered'.
--
-- ============================================================================
