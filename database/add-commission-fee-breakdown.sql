-- Add fee breakdown columns to commissions table
-- Allows tracking of shoot_fee vs storage_fee for accurate commission calculations
-- Created: 2025-12-01

-- Add columns for fee breakdown
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS shoot_fee_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_fee_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS photovault_commission_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'upfront' CHECK (payment_type IN ('upfront', 'monthly'));

-- Update comments
COMMENT ON COLUMN commissions.amount_cents IS 'Photographer gross payout: shoot_fee + 50% of storage_fee (Stripe fees deducted at payout for upfront)';
COMMENT ON COLUMN commissions.shoot_fee_cents IS 'Photographer shoot fee portion (100% to photographer)';
COMMENT ON COLUMN commissions.storage_fee_cents IS 'PhotoVault storage fee portion (split 50/50)';
COMMENT ON COLUMN commissions.photovault_commission_cents IS 'PhotoVault commission: 50% of storage_fee';
COMMENT ON COLUMN commissions.payment_type IS 'upfront = Year 1 payment (photographer pays Stripe fees), monthly = Year 2+ (PhotoVault pays Stripe fees)';
