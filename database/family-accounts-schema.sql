-- Family Accounts Schema
-- PhotoVault Feature: Multi-generational photo preservation with payment continuity
-- Spec: docs/FAMILY-ACCOUNTS-SPEC-V2.md
-- Created: December 4, 2025

-- ============================================================================
-- TABLE 1: secondaries
-- Tracks designated family members who can view shared galleries and take over billing
-- ============================================================================

CREATE TABLE IF NOT EXISTS secondaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Account relationship
    account_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,  -- The primary's account
    
    -- Secondary's identity
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'other')),
    
    -- If secondary has created a PhotoVault account, link it
    secondary_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Invitation tracking
    invitation_token VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    -- Payment capability
    has_payment_method BOOLEAN DEFAULT FALSE,
    stripe_customer_id VARCHAR(255),
    
    -- Billing payer status (took over payments but not primary role)
    is_billing_payer BOOLEAN DEFAULT FALSE,
    became_billing_payer_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One secondary per email per account
    CONSTRAINT unique_account_secondary_email UNIQUE (account_id, email)
);

-- Indexes for secondaries
CREATE INDEX IF NOT EXISTS idx_secondaries_account_id ON secondaries(account_id);
CREATE INDEX IF NOT EXISTS idx_secondaries_email ON secondaries(email);
CREATE INDEX IF NOT EXISTS idx_secondaries_secondary_user_id ON secondaries(secondary_user_id);
CREATE INDEX IF NOT EXISTS idx_secondaries_invitation_token ON secondaries(invitation_token);
CREATE INDEX IF NOT EXISTS idx_secondaries_status ON secondaries(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_secondaries_billing_payer ON secondaries(is_billing_payer) WHERE is_billing_payer = TRUE;

-- Comments
COMMENT ON TABLE secondaries IS 'Designated family members who can view shared galleries and take over billing';
COMMENT ON COLUMN secondaries.account_id IS 'The primary account holder who designated this secondary';
COMMENT ON COLUMN secondaries.is_billing_payer IS 'True if this secondary took over payments but not the primary role';

-- ============================================================================
-- TABLE 2: gallery_sharing
-- Tracks which galleries are shared with family (per-gallery opt-in)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gallery_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    gallery_id UUID NOT NULL REFERENCES photo_galleries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    is_family_shared BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One record per gallery
    CONSTRAINT unique_gallery_sharing UNIQUE (gallery_id)
);

-- Indexes for gallery_sharing
CREATE INDEX IF NOT EXISTS idx_gallery_sharing_gallery_id ON gallery_sharing(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_sharing_account_id ON gallery_sharing(account_id);
CREATE INDEX IF NOT EXISTS idx_gallery_sharing_is_shared ON gallery_sharing(is_family_shared) WHERE is_family_shared = TRUE;

-- Comments
COMMENT ON TABLE gallery_sharing IS 'Per-gallery family sharing toggle';
COMMENT ON COLUMN gallery_sharing.is_family_shared IS 'When true, all secondaries on this account can view this gallery';

-- ============================================================================
-- TABLE 3: account_takeovers
-- Audit log of when secondaries take over accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_takeovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    account_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    previous_primary_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    new_primary_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,  -- NULL if billing_only takeover
    billing_payer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,  -- For billing_only takeovers
    
    takeover_type VARCHAR(20) NOT NULL CHECK (takeover_type IN ('full_primary', 'billing_only')),
    
    -- Reason for takeover (helps photographer understand context)
    reason VARCHAR(50) CHECK (reason IN ('death', 'financial', 'health', 'other')),
    reason_text TEXT,  -- Free text if reason = 'other'
    
    taken_over_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for account_takeovers
CREATE INDEX IF NOT EXISTS idx_account_takeovers_account_id ON account_takeovers(account_id);
CREATE INDEX IF NOT EXISTS idx_account_takeovers_taken_over_at ON account_takeovers(taken_over_at);

-- Comments
COMMENT ON TABLE account_takeovers IS 'Audit log of account takeovers for legal/support purposes';
COMMENT ON COLUMN account_takeovers.takeover_type IS 'full_primary = became new owner, billing_only = just paying bills';

-- ============================================================================
-- TABLE 4: gallery_incorporations
-- Tracks when galleries are copied from one account to another
-- ============================================================================

CREATE TABLE IF NOT EXISTS gallery_incorporations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    source_account_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE SET NULL,
    destination_account_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    source_gallery_id UUID NOT NULL REFERENCES photo_galleries(id) ON DELETE SET NULL,
    destination_gallery_id UUID NOT NULL REFERENCES photo_galleries(id) ON DELETE CASCADE,
    
    incorporated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for gallery_incorporations
CREATE INDEX IF NOT EXISTS idx_gallery_incorporations_source ON gallery_incorporations(source_account_id);
CREATE INDEX IF NOT EXISTS idx_gallery_incorporations_destination ON gallery_incorporations(destination_account_id);

-- Comments
COMMENT ON TABLE gallery_incorporations IS 'Tracks copied galleries between accounts (for commission attribution)';

-- ============================================================================
-- MODIFY: user_profiles table
-- Add family sharing columns
-- ============================================================================

DO $$ 
BEGIN
    -- Add family_sharing_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'family_sharing_enabled'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN family_sharing_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add max_secondaries column (configurable by tier, default 5)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'max_secondaries'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN max_secondaries INTEGER DEFAULT 5;
    END IF;
    
    -- Add original_primary_id (tracks original owner after takeover)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'original_primary_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN original_primary_id UUID REFERENCES user_profiles(id);
    END IF;
END $$;

-- ============================================================================
-- MODIFY: photo_galleries table
-- Add family sharing and incorporation tracking columns
-- ============================================================================

DO $$ 
BEGIN
    -- Add is_family_shared column (denormalized for faster access checks)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photo_galleries' AND column_name = 'is_family_shared'
    ) THEN
        ALTER TABLE photo_galleries ADD COLUMN is_family_shared BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add incorporated_from_gallery_id (tracks origin for copied galleries)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photo_galleries' AND column_name = 'incorporated_from_gallery_id'
    ) THEN
        ALTER TABLE photo_galleries ADD COLUMN incorporated_from_gallery_id UUID REFERENCES photo_galleries(id);
    END IF;
    
    -- Add incorporated_from_account_id (tracks which account it came from)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photo_galleries' AND column_name = 'incorporated_from_account_id'
    ) THEN
        ALTER TABLE photo_galleries ADD COLUMN incorporated_from_account_id UUID REFERENCES user_profiles(id);
    END IF;
END $$;

-- Create index for family shared galleries
CREATE INDEX IF NOT EXISTS idx_photo_galleries_family_shared 
ON photo_galleries(is_family_shared) WHERE is_family_shared = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE secondaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_takeovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_incorporations ENABLE ROW LEVEL SECURITY;

-- Secondaries policies
CREATE POLICY "Primary can view own secondaries" ON secondaries
    FOR SELECT USING (account_id = auth.uid());

CREATE POLICY "Primary can create secondaries" ON secondaries
    FOR INSERT WITH CHECK (account_id = auth.uid());

CREATE POLICY "Primary can update own secondaries" ON secondaries
    FOR UPDATE USING (account_id = auth.uid());

CREATE POLICY "Primary can delete own secondaries" ON secondaries
    FOR DELETE USING (account_id = auth.uid());

CREATE POLICY "Secondary can view self" ON secondaries
    FOR SELECT USING (secondary_user_id = auth.uid());

CREATE POLICY "Service role full access on secondaries" ON secondaries
    FOR ALL USING (true) WITH CHECK (true);

-- Gallery sharing policies
CREATE POLICY "Primary can manage gallery sharing" ON gallery_sharing
    FOR ALL USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());

CREATE POLICY "Service role full access on gallery_sharing" ON gallery_sharing
    FOR ALL USING (true) WITH CHECK (true);

-- Account takeovers policies (read-only for users, service role for writes)
CREATE POLICY "Users can view own takeover history" ON account_takeovers
    FOR SELECT USING (
        account_id = auth.uid() OR 
        previous_primary_id = auth.uid() OR 
        new_primary_id = auth.uid() OR
        billing_payer_id = auth.uid()
    );

CREATE POLICY "Service role full access on account_takeovers" ON account_takeovers
    FOR ALL USING (true) WITH CHECK (true);

-- Gallery incorporations policies
CREATE POLICY "Users can view own incorporations" ON gallery_incorporations
    FOR SELECT USING (
        source_account_id = auth.uid() OR 
        destination_account_id = auth.uid()
    );

CREATE POLICY "Service role full access on gallery_incorporations" ON gallery_incorporations
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON secondaries TO authenticated;
GRANT ALL ON secondaries TO service_role;

GRANT ALL ON gallery_sharing TO authenticated;
GRANT ALL ON gallery_sharing TO service_role;

GRANT ALL ON account_takeovers TO authenticated;
GRANT ALL ON account_takeovers TO service_role;

GRANT ALL ON gallery_incorporations TO authenticated;
GRANT ALL ON gallery_incorporations TO service_role;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user is a secondary with access to a gallery
CREATE OR REPLACE FUNCTION user_has_family_access(p_user_id UUID, p_gallery_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN := FALSE;
BEGIN
    -- Check if user is a secondary on the gallery owner's account
    -- AND the gallery is marked as family shared
    SELECT EXISTS (
        SELECT 1 
        FROM secondaries s
        INNER JOIN photo_galleries g ON g.photographer_id = s.account_id
        WHERE s.secondary_user_id = p_user_id
        AND s.status = 'accepted'
        AND g.id = p_gallery_id
        AND g.is_family_shared = TRUE
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get secondary count for an account (for limit enforcement)
CREATE OR REPLACE FUNCTION get_secondary_count(p_account_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM secondaries
    WHERE account_id = p_account_id
    AND status IN ('pending', 'accepted');
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONE! Run this in Supabase SQL Editor
-- ============================================================================

