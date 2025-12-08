-- Commissions Table
-- Tracks photographer commissions from client payments
-- Created: 2025-12-01

-- Create the commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  gallery_id UUID REFERENCES photo_galleries(id) ON DELETE SET NULL,
  client_email TEXT,
  amount_cents INTEGER NOT NULL,
  total_paid_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  UNIQUE(stripe_payment_intent_id) -- Prevent duplicate commissions for same payment
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_commissions_photographer_id ON commissions(photographer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_gallery_id ON commissions(gallery_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);

-- Enable Row Level Security
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Photographers can view their own commissions
CREATE POLICY "Photographers can view own commissions"
  ON commissions FOR SELECT
  USING (photographer_id = auth.uid());

-- Admins can view all commissions
CREATE POLICY "Admins can view all commissions"
  ON commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Service role can insert/update (for webhooks)
CREATE POLICY "Service role can manage commissions"
  ON commissions FOR ALL
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON commissions TO authenticated;
GRANT ALL ON commissions TO service_role;

-- Add comment
COMMENT ON TABLE commissions IS 'Tracks photographer commissions from client payments. 50% of payment goes to photographer.';
COMMENT ON COLUMN commissions.amount_cents IS 'Commission amount in cents (50% of total_paid_cents)';
COMMENT ON COLUMN commissions.total_paid_cents IS 'Total amount client paid in cents';
COMMENT ON COLUMN commissions.status IS 'pending = awaiting payout, paid = transferred to photographer, cancelled = refunded/reversed';
