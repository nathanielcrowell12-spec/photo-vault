-- Fix: User Profile Trigger Permission Issue
-- Date: December 2, 2025
-- Problem: Trigger function link_client_to_user_account() queries auth.users
--          but lacks permission when invoked via service role webhook
-- Solution: Add SECURITY DEFINER to run with owner (postgres) privileges

-- Drop and recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION link_client_to_user_account()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth  -- Required for security with SECURITY DEFINER
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
  v_invitation_token := NEW.id::text;

  -- Try to get email from auth.users table
  -- Find matching client record by email
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

    -- Update all galleries for this client (both tables for compatibility)
    UPDATE galleries
    SET user_id = NEW.id,
        updated_at = NOW()
    WHERE client_id = v_client_record.id
    AND user_id IS NULL;

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

-- Ensure trigger exists and uses the updated function
DROP TRIGGER IF EXISTS trigger_link_client_to_user ON user_profiles;
CREATE TRIGGER trigger_link_client_to_user
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_client_to_user_account();

-- Verify the function has SECURITY DEFINER
-- You can check with: SELECT proname, prosecdef FROM pg_proc WHERE proname = 'link_client_to_user_account';
-- prosecdef = true means SECURITY DEFINER is set
