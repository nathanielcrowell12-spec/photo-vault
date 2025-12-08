-- Migration: Create Subscriptions Table with Payment Failure Tracking
-- Purpose: Track client subscriptions and failed payment attempts for gallery access suspension
-- Story: 1.4 - Failed Payment Handling
-- Date: December 4, 2025

-- Create subscriptions table (if not exists)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    gallery_id UUID REFERENCES photo_galleries(id),
    stripe_subscription_id VARCHAR UNIQUE,
    stripe_customer_id VARCHAR,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing', 'incomplete')),
    plan_type VARCHAR,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    -- Payment failure tracking columns
    payment_failure_count INTEGER DEFAULT 0,
    last_payment_failure_at TIMESTAMPTZ,
    access_suspended BOOLEAN DEFAULT FALSE,
    access_suspended_at TIMESTAMPTZ,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_gallery_id ON subscriptions(gallery_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_access_suspended 
ON subscriptions(access_suspended) 
WHERE access_suspended = TRUE;

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'Tracks client subscriptions for gallery access';
COMMENT ON COLUMN subscriptions.payment_failure_count IS 'Number of consecutive payment failures';
COMMENT ON COLUMN subscriptions.last_payment_failure_at IS 'Timestamp of the most recent payment failure';
COMMENT ON COLUMN subscriptions.access_suspended IS 'Whether gallery access is suspended due to failed payments (after 48 hours)';
COMMENT ON COLUMN subscriptions.access_suspended_at IS 'Timestamp when access was suspended';

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT
USING (user_id = auth.uid());

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access"
ON subscriptions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create payment_history table for tracking all payment attempts
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_invoice_id VARCHAR,
    stripe_subscription_id VARCHAR,
    amount_paid_cents INTEGER DEFAULT 0,
    currency VARCHAR DEFAULT 'usd',
    status VARCHAR CHECK (status IN ('succeeded', 'failed', 'pending')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_subscription 
ON payment_history(stripe_subscription_id);

-- Create webhook logging tables if they don't exist
CREATE TABLE IF NOT EXISTS processed_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR UNIQUE NOT NULL,
    event_type VARCHAR,
    processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR,
    event_type VARCHAR,
    status VARCHAR,
    processing_time_ms INTEGER,
    result_message TEXT,
    error_message TEXT,
    stack_trace TEXT,
    processed_at TIMESTAMPTZ DEFAULT now()
);

