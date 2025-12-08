-- Migration: Add grace_notifications_sent column to subscriptions table
-- Purpose: Track which grace period notification milestones have been sent
-- Sprint 7: Grace Period Email Cron Job
-- Created: December 5, 2025

-- Add the column to track sent notifications
-- Format: {"3": "2025-01-15T00:00:00Z", "4": "2025-02-15T00:00:00Z", ...}
-- Keys are milestone months (3, 4, 5, 5.5), values are ISO timestamps

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS grace_notifications_sent JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.grace_notifications_sent IS 
  'Tracks grace period notification milestones sent to secondaries. Keys: "3", "4", "5", "5.5" (months), Values: ISO timestamp of when sent';

-- Create index for efficient queries on subscriptions in grace period
CREATE INDEX IF NOT EXISTS idx_subscriptions_grace_period 
ON subscriptions(last_payment_failure_at, access_suspended) 
WHERE last_payment_failure_at IS NOT NULL AND access_suspended = FALSE;

-- ============================================================================
-- VERIFICATION QUERY (run after migration to confirm):
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'subscriptions' AND column_name = 'grace_notifications_sent';
-- ============================================================================

