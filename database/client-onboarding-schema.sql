-- Client Onboarding and Auto-Linking System
-- This schema enables the photographer-to-client invitation flow

-- Client invitations table (if not exists from main schema)
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Photographer and client info
  photographer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  gallery_id UUID REFERENCES galleries(id) ON DELETE SET NULL,

  -- Invitation details
  client_email VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,

  -- Unique constraint: one active invitation per client email per photographer
  CONSTRAINT unique_photographer_client_email UNIQUE (photographer_id, client_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(client_email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_photographer ON client_invitations(photographer_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_status ON client_invitations(status) WHERE status = 'pending';

-- Function to auto-link client record to user account on signup
-- This runs when a new user_profile is created
CREATE OR REPLACE FUNCTION link_client_to_user_account()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_client_record RECORD;
  v_invitation_token TEXT;
BEGIN
  -- Only process if user_type is 'client'
  IF NEW.user_type != 'client' THEN
    RETURN NEW;
  END IF;

  -- Get invitation token from user metadata
  v_invitation_token := NEW.id::text; -- This will be passed from signup

  -- Try to get email from auth.users table
  -- First, find matching client record by email
  FOR v_client_record IN
    SELECT c.id, c.photographer_id, c.email
    FROM clients c
    INNER JOIN auth.users au ON au.email = c.email
    WHERE au.id = NEW.id
    AND c.user_id IS NULL -- Not yet linked
  LOOP
    -- Link client record to user account
    UPDATE clients
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE id = v_client_record.id;

    -- Log the linking
    RAISE NOTICE 'Linked client record % to user account %', v_client_record.id, NEW.id;

    -- Update all galleries for this client
    UPDATE galleries
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE client_id = v_client_record.id
    AND user_id IS NULL;

    -- Update photo_galleries for this client
    UPDATE photo_galleries
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE client_id = v_client_record.id
    AND user_id IS NULL;

    -- Mark related invitation as accepted (if exists)
    UPDATE client_invitations
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE client_email = v_client_record.email
    AND photographer_id = v_client_record.photographer_id
    AND status = 'pending';
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-link client on user_profile creation
DROP TRIGGER IF EXISTS trigger_link_client_to_user ON user_profiles;
CREATE TRIGGER trigger_link_client_to_user
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_client_to_user_account();

-- Function to expire old invitations (run periodically)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE client_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security for client_invitations
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Photographers can view their own invitations
CREATE POLICY "Photographers can view own invitations" ON client_invitations
  FOR SELECT
  USING (auth.uid() = photographer_id);

-- Photographers can create invitations
CREATE POLICY "Photographers can create invitations" ON client_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = photographer_id);

-- Photographers can update their own invitations
CREATE POLICY "Photographers can update own invitations" ON client_invitations
  FOR UPDATE
  USING (auth.uid() = photographer_id);

-- Service role can do everything (for API endpoints)
CREATE POLICY "Service role full access" ON client_invitations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON client_invitations TO authenticated;
GRANT ALL ON client_invitations TO service_role;

-- Add user_id to clients table if not exists (to link client to user account)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
    CREATE INDEX idx_clients_user_id ON clients(user_id);
  END IF;
END $$;

-- Add user_id to galleries table if not exists (to link gallery to user account)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'galleries' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE galleries ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
    CREATE INDEX idx_galleries_user_id ON galleries(user_id);
  END IF;
END $$;
