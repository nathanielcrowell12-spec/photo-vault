-- Add stripe_transfer_id column to commissions table
-- This stores the Stripe Transfer ID for reconciliation with destination charges
-- Created: 2025-12-01

-- Add the column
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_commissions_stripe_transfer_id
ON commissions(stripe_transfer_id);

-- Update comment
COMMENT ON COLUMN commissions.stripe_transfer_id IS 'Stripe Transfer ID from destination charge - money already sent to photographer';

-- Note: With destination charges, status will always be 'paid' immediately
-- The scheduled_payout_date column is no longer needed (Stripe handles 2-day settlement)
