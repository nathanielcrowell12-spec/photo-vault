-- PhotoVault Messaging System - MVP
-- Simple text-based messaging between users with permission controls

-- ============================================================================
-- TABLES
-- ============================================================================

-- Conversations table: tracks 1:1 conversations between users
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants (always in consistent order: user1_id < user2_id)
  user1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Metadata
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,

  -- Archive status (per user)
  user1_archived BOOLEAN DEFAULT FALSE,
  user2_archived BOOLEAN DEFAULT FALSE,

  -- Unread counts (per user)
  user1_unread_count INTEGER DEFAULT 0,
  user2_unread_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT conversations_unique_pair UNIQUE (user1_id, user2_id),
  CONSTRAINT conversations_user_order CHECK (user1_id < user2_id)
);

-- Messages table: stores individual messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conversation reference
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Sender
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Message content
  message_text TEXT NOT NULL,

  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Reporting/moderation
  is_reported BOOLEAN DEFAULT FALSE,
  reported_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ,
  report_reason TEXT,

  -- Admin review
  is_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON conversation_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON conversation_messages(conversation_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_reported ON conversation_messages(is_reported, reviewed_by) WHERE is_reported = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON conversation_messages(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_ordered_user1_id UUID;
  v_ordered_user2_id UUID;
BEGIN
  -- Ensure consistent ordering
  IF p_user1_id < p_user2_id THEN
    v_ordered_user1_id := p_user1_id;
    v_ordered_user2_id := p_user2_id;
  ELSE
    v_ordered_user1_id := p_user2_id;
    v_ordered_user2_id := p_user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE user1_id = v_ordered_user1_id
    AND user2_id = v_ordered_user2_id;

  -- Create if doesn't exist
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (v_ordered_user1_id, v_ordered_user2_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
  v_is_user1 BOOLEAN;
BEGIN
  -- Determine recipient
  SELECT user1_id, user2_id INTO v_recipient_id, v_is_user1
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Check if sender is user1
  SELECT (user1_id = NEW.sender_id) INTO v_is_user1
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Update conversation
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.message_text, 100),
    user1_unread_count = CASE
      WHEN v_is_user1 THEN user1_unread_count
      ELSE user1_unread_count + 1
    END,
    user2_unread_count = CASE
      WHEN v_is_user1 THEN user2_unread_count + 1
      ELSE user2_unread_count
    END,
    -- Unarchive for recipient
    user1_archived = CASE
      WHEN v_is_user1 THEN user1_archived
      ELSE FALSE
    END,
    user2_archived = CASE
      WHEN v_is_user1 THEN FALSE
      ELSE user2_archived
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON conversation_messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_conversation_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_is_user1 BOOLEAN;
BEGIN
  -- Mark unread messages as read
  UPDATE conversation_messages
  SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Reset unread count for this user
  SELECT (user1_id = p_user_id) INTO v_is_user1
  FROM conversations
  WHERE id = p_conversation_id;

  UPDATE conversations
  SET
    user1_unread_count = CASE WHEN v_is_user1 THEN 0 ELSE user1_unread_count END,
    user2_unread_count = CASE WHEN v_is_user1 THEN user2_unread_count ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can message another user
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
  -- Get user types
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
  IF v_sender_type = 'photographer' AND v_recipient_type = 'client' THEN
    -- Check if recipient is photographer's client
    SELECT EXISTS (
      SELECT 1 FROM clients
      WHERE photographer_id = p_sender_id
      AND user_id = p_recipient_id
    ) INTO v_can_message;
    RETURN v_can_message;
  END IF;

  -- Client to their Photographer
  IF v_sender_type = 'client' AND v_recipient_type = 'photographer' THEN
    -- Check if sender is photographer's client (has galleries)
    SELECT EXISTS (
      SELECT 1 FROM galleries
      WHERE photographer_id = p_recipient_id
      AND user_id = p_sender_id
    ) INTO v_can_message;
    RETURN v_can_message;
  END IF;

  -- Default: cannot message
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can view conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Conversations: System can create/update (via functions)
CREATE POLICY "System can manage conversations" ON conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view their messages" ON conversation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Messages: Users can send messages if they have permission
CREATE POLICY "Users can send messages" ON conversation_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    can_user_message(sender_id, (
      SELECT CASE
        WHEN user1_id = sender_id THEN user2_id
        ELSE user1_id
      END
      FROM conversations
      WHERE id = conversation_id
    ))
  );

-- Messages: Users can update their own messages (for read status)
CREATE POLICY "Users can update messages" ON conversation_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_messages TO authenticated;
GRANT ALL ON conversations TO service_role;
GRANT ALL ON conversation_messages TO service_role;
