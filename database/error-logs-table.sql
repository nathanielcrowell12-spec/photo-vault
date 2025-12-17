-- Error logs fallback table
-- Captures errors even when PostHog is blocked by ad blockers
-- Created: December 16, 2025 (Story 6.3)

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type VARCHAR(255) NOT NULL,
  error_message TEXT NOT NULL,
  page VARCHAR(500),
  stack_trace TEXT,
  component_stack TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance and cleanup
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

-- RLS Policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read errors
CREATE POLICY "Admins can view all errors"
  ON error_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Anyone can insert errors (even unauthenticated)
CREATE POLICY "Anyone can log errors"
  ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- Data retention policy documentation
COMMENT ON TABLE error_logs IS 'Fallback error logging for when PostHog is blocked by ad blockers. Cleanup policy: Delete errors older than 90 days via scheduled job.';

-- Optional: Automated cleanup via pg_cron (if available)
-- Uncomment if Supabase Pro or self-hosted with pg_cron extension:
/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-old-error-logs',
  '0 2 * * 0',  -- Every Sunday at 2 AM
  $$DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days'$$
);
*/

-- Manual cleanup script for reference
-- Run this periodically if pg_cron is not available:
-- DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
