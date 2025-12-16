-- Fix can_user_message function
-- Bug: Original function references non-existent 'galleries' table with wrong 'user_id' column
-- Fix: Use 'clients' table which has both 'photographer_id' and 'user_id' columns
-- Date: December 16, 2025

-- Note: The messaging API uses service role key, so this function runs with elevated privileges
-- and bypasses RLS. The function queries the 'clients' table directly.

CREATE OR REPLACE FUNCTION can_user_message(
  p_sender_id UUID,
  p_recipient_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sender_type TEXT;
  v_recipient_type TEXT;
  v_can_message BOOLEAN := FALSE;
BEGIN
  -- Get user types from user_profiles
  SELECT user_type INTO v_sender_type FROM user_profiles WHERE id = p_sender_id;
  SELECT user_type INTO v_recipient_type FROM user_profiles WHERE id = p_recipient_id;

  -- Admin can message anyone
  IF v_sender_type = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Anyone can message admin
  IF v_recipient_type = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Photographer to Photographer
  IF v_sender_type = 'photographer' AND v_recipient_type = 'photographer' THEN
    RETURN TRUE;
  END IF;

  -- Photographer to their Client
  -- Check if recipient (client user) has a clients record with this photographer
  IF v_sender_type = 'photographer' AND v_recipient_type = 'client' THEN
    SELECT EXISTS (
      SELECT 1 FROM clients
      WHERE photographer_id = p_sender_id
      AND user_id = p_recipient_id
    ) INTO v_can_message;
    RETURN v_can_message;
  END IF;

  -- Client to their Photographer
  -- Check if sender (client user) has a clients record with this photographer
  -- FIX: Use 'clients' table (has user_id) instead of non-existent 'galleries' table
  IF v_sender_type = 'client' AND v_recipient_type = 'photographer' THEN
    SELECT EXISTS (
      SELECT 1 FROM clients
      WHERE photographer_id = p_recipient_id
      AND user_id = p_sender_id
    ) INTO v_can_message;
    RETURN v_can_message;
  END IF;

  -- Default: cannot message
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Verification test (run manually after applying migration):
-- SELECT can_user_message('client-user-id'::uuid, 'photographer-user-id'::uuid);
-- Should return TRUE if relationship exists in clients table
