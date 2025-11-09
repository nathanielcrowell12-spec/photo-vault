-- ============================================================================
-- STRIPE WEBHOOK TABLES MIGRATION
-- ============================================================================
-- This migration adds all tables required for Stripe webhook processing
-- Run this in Supabase SQL Editor after reviewing

-- ============================================================================
-- 1. ADD STRIPE FIELDS TO USERS TABLE
-- ============================================================================

-- Add Stripe-related fields to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_account_id ON users(stripe_connect_account_id);

-- Add comment
COMMENT ON COLUMN users.token_balance IS 'Number of tokens available for user to spend';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payments';
COMMENT ON COLUMN users.stripe_connect_account_id IS 'Stripe Connect account ID for photographers receiving payouts';

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'unpaid'
  )),
  plan_type TEXT NOT NULL, -- 'photographer_pro', 'client_basic', 'client_premium', etc.
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE subscriptions IS 'Stripe subscription records for photographers and clients';
COMMENT ON COLUMN subscriptions.plan_type IS 'Type of subscription plan (photographer_pro, client_basic, etc.)';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of period';

-- ============================================================================
-- 3. TOKEN TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase',
    'usage',
    'refund',
    'bonus',
    'adjustment'
  )),
  tokens_amount INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount_paid_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_stripe_payment_intent ON token_transactions(stripe_payment_intent_id);

-- RLS Policies
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own token transactions"
  ON token_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all token transactions"
  ON token_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE token_transactions IS 'History of all token purchases, usage, and refunds';
COMMENT ON COLUMN token_transactions.tokens_amount IS 'Number of tokens (positive for additions, negative for usage)';

-- ============================================================================
-- 4. PAYMENT HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT REFERENCES subscriptions(stripe_subscription_id),
  amount_paid_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_invoice_id ON payment_history(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_paid_at ON payment_history(paid_at DESC);

-- RLS Policies
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment history via subscription"
  ON payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.stripe_subscription_id = payment_history.stripe_subscription_id
      AND subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all payment history"
  ON payment_history FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE payment_history IS 'Record of all subscription and one-time payments';

-- ============================================================================
-- 5. PAYOUTS TABLE (for photographers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payout_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'canceled')),
  arrival_date TIMESTAMPTZ,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_photographer_id ON payouts(photographer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_stripe_payout_id ON payouts(stripe_payout_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_arrival_date ON payouts(arrival_date DESC);

-- RLS Policies
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers can view their own payouts"
  ON payouts FOR SELECT
  USING (auth.uid() = photographer_id);

CREATE POLICY "Service role can manage all payouts"
  ON payouts FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE payouts IS 'Stripe Connect payouts to photographers';
COMMENT ON COLUMN payouts.status IS 'Payout status from Stripe';

-- ============================================================================
-- 6. WEBHOOK LOGS TABLE (for debugging)
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  processing_time_ms INTEGER,
  result_message TEXT,
  error_message TEXT,
  stack_trace TEXT,
  metadata JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON webhook_logs(processed_at DESC);

-- RLS Policies
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access webhook logs"
  ON webhook_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE webhook_logs IS 'Logs of all webhook events for debugging';

-- ============================================================================
-- 7. PROCESSED WEBHOOK EVENTS TABLE (for idempotency)
-- ============================================================================

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_stripe_event_id ON processed_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_processed_at ON processed_webhook_events(processed_at DESC);

-- RLS Policies
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access processed events"
  ON processed_webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE processed_webhook_events IS 'Tracks processed webhook events to prevent duplicate processing';

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to add tokens to user balance (with transaction safety)
CREATE OR REPLACE FUNCTION add_tokens_to_balance(
  p_user_id UUID,
  p_tokens INTEGER,
  p_payment_intent_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user balance
  UPDATE users
  SET token_balance = COALESCE(token_balance, 0) + p_tokens
  WHERE id = p_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;
END;
$$;

-- Function to deduct tokens from user balance (for usage)
CREATE OR REPLACE FUNCTION deduct_tokens_from_balance(
  p_user_id UUID,
  p_tokens INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT token_balance INTO v_current_balance
  FROM users
  WHERE id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  -- Check if sufficient balance
  IF v_current_balance < p_tokens THEN
    RETURN FALSE;
  END IF;

  -- Deduct tokens
  UPDATE users
  SET token_balance = token_balance - p_tokens
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Function to get user's subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_status, 'none');
END;
$$;

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON token_transactions TO authenticated;
GRANT SELECT ON payment_history TO authenticated;
GRANT SELECT ON payouts TO authenticated;

-- Service role has full access (already set via RLS policies)

-- ============================================================================
-- 10. DATA CLEANUP FUNCTION (optional - for maintenance)
-- ============================================================================

-- Function to clean up old webhook logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_logs
  WHERE processed_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_webhook_logs() IS 'Deletes webhook logs older than 90 days - run periodically';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Stripe Webhook Tables Migration Complete!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  ✓ subscriptions';
  RAISE NOTICE '  ✓ token_transactions';
  RAISE NOTICE '  ✓ payment_history';
  RAISE NOTICE '  ✓ payouts';
  RAISE NOTICE '  ✓ webhook_logs';
  RAISE NOTICE '  ✓ processed_webhook_events';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions created:';
  RAISE NOTICE '  ✓ add_tokens_to_balance()';
  RAISE NOTICE '  ✓ deduct_tokens_from_balance()';
  RAISE NOTICE '  ✓ get_user_subscription_status()';
  RAISE NOTICE '  ✓ cleanup_old_webhook_logs()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Set STRIPE_WEBHOOK_SECRET in .env.local';
  RAISE NOTICE '  2. Configure webhook in Stripe Dashboard';
  RAISE NOTICE '  3. Test with Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe';
  RAISE NOTICE '==============================================';
END $$;
