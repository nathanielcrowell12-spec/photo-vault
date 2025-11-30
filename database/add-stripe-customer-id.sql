-- Add stripe_customer_id to user_profiles if it doesn't exist
-- Run this in Supabase SQL Editor

-- Check if column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN stripe_customer_id VARCHAR(255);
        CREATE INDEX idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);
        COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe customer ID for subscription payments';
    END IF;
END
$$;

-- Verify the column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'stripe_customer_id';
