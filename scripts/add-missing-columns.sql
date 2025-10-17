-- Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('active', 'inactive', 'grace_period', 'pending', 'admin_bypass'));

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Create competitor_logos table if it doesn't exist
CREATE TABLE IF NOT EXISTS competitor_logos (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo_url TEXT NOT NULL,
    website TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for competitor_logos
ALTER TABLE competitor_logos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitor_logos
CREATE POLICY "Anyone can view competitor logos" ON competitor_logos
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage competitor logos" ON competitor_logos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.user_type = 'admin'
        )
    );
