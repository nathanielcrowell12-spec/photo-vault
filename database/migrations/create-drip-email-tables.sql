-- Migration: Create Drip Email Tables
-- Description: Infrastructure for post-signup email drip sequences
-- Date: 2026-02-19
--
-- Tables:
--   drip_sequences  - Tracks which user is in which sequence
--   drip_emails     - Individual scheduled emails with status
--
-- Sequences:
--   photographer_post_signup - 4 emails over 14 days (Day 1, 3, 7, 14)
--   client_post_payment      - 3 emails over 7 days (Day 1, 3, 7)

-- ============================================================================
-- Enable moddatetime extension (may already be enabled in Supabase)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ============================================================================
-- drip_sequences: Tracks user enrollment in a drip sequence
-- ============================================================================
CREATE TABLE IF NOT EXISTS drip_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_name TEXT NOT NULL,
  current_step INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  suppressed BOOLEAN DEFAULT false,
  unsubscribe_token UUID DEFAULT gen_random_uuid() NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent double-enrollment in the same sequence
  CONSTRAINT drip_sequences_user_sequence_unique UNIQUE (user_id, sequence_name)
);

-- Auto-update updated_at on changes
CREATE TRIGGER update_drip_sequences_updated_at
  BEFORE UPDATE ON drip_sequences
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================================
-- drip_emails: Individual scheduled emails within a sequence
-- ============================================================================
CREATE TABLE IF NOT EXISTS drip_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES drip_sequences(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  template_name TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  skip_reason TEXT,
  status TEXT DEFAULT 'pending' NOT NULL
    CHECK (status IN ('pending', 'sending', 'sent', 'skipped', 'failed', 'dead')),
  retry_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Cron job queries pending emails by scheduled time
CREATE INDEX idx_drip_emails_pending_scheduled
  ON drip_emails (status, scheduled_for)
  WHERE status IN ('pending', 'failed');

-- Look up sequences by user (for enrollment checks, unsubscribe)
CREATE INDEX idx_drip_sequences_user_id
  ON drip_sequences (user_id);

-- Look up sequences by unsubscribe token
CREATE INDEX idx_drip_sequences_unsubscribe_token
  ON drip_sequences (unsubscribe_token);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE drip_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_emails ENABLE ROW LEVEL SECURITY;

-- Users can view their own drip sequences (for unsubscribe UI)
CREATE POLICY "Users can view own drip sequences"
  ON drip_sequences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own drip sequences (for unsubscribe)
CREATE POLICY "Users can update own drip sequences"
  ON drip_sequences FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role bypasses RLS (used by cron job and enrollment)
-- No explicit policy needed — service role client ignores RLS

-- drip_emails: No user-facing access needed
-- Only accessed by cron job via service role client
