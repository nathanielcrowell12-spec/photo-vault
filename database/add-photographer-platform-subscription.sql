-- Add platform subscription fields to photographers table
-- Story 1.3: Platform Fee Billing
-- Run this migration in Supabase SQL Editor

-- Add subscription fields to photographers table
ALTER TABLE photographers 
ADD COLUMN IF NOT EXISTS stripe_platform_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS platform_subscription_status VARCHAR(50) CHECK (platform_subscription_status IN (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'cancelled'
)),
ADD COLUMN IF NOT EXISTS platform_subscription_trial_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS platform_subscription_current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS platform_subscription_current_period_end TIMESTAMPTZ;

-- Add index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_photographers_platform_subscription_id 
ON photographers(stripe_platform_subscription_id) 
WHERE stripe_platform_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_photographers_platform_subscription_status 
ON photographers(platform_subscription_status) 
WHERE platform_subscription_status IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN photographers.stripe_platform_subscription_id IS 'Stripe subscription ID for $22/month platform fee';
COMMENT ON COLUMN photographers.platform_subscription_status IS 'Status of platform subscription (active, trialing, past_due, etc.)';
COMMENT ON COLUMN photographers.platform_subscription_trial_end IS 'Trial end date (Stripe field, not currently used - photographers billed immediately)';
COMMENT ON COLUMN photographers.platform_subscription_current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN photographers.platform_subscription_current_period_end IS 'End of current billing period';

