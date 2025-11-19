-- Client-Photographer Messaging System
-- This schema enables direct messaging between clients and their photographers

-- Messages table: stores all messages between clients and photographers
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Message content
  message_text TEXT NOT NULL,

  -- Optional: link message to specific gallery or photo session
  gallery_id UUID REFERENCES photo_galleries(id) ON DELETE SET NULL,
  session_id UUID REFERENCES photo_sessions(id) ON DELETE SET NULL,

  -- Message status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Indexes for performance
  CONSTRAINT messages_sender_recipient_check CHECK (sender_id != recipient_id)
);

-- Indexes for fast message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read) WHERE deleted_at IS NULL AND is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_gallery ON messages(gallery_id) WHERE gallery_id IS NOT NULL AND deleted_at IS NULL;

-- Message threads table: tracks conversation threads between users
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants (always stored in consistent order for uniqueness)
  user1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Thread metadata
  last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unread counts for each user
  user1_unread_count INTEGER DEFAULT 0,
  user2_unread_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique thread per user pair
  CONSTRAINT message_threads_unique_pair UNIQUE (user1_id, user2_id),
  CONSTRAINT message_threads_user_order CHECK (user1_id < user2_id)
);

-- Indexes for thread lookup
CREATE INDEX IF NOT EXISTS idx_message_threads_user1 ON message_threads(user1_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_threads_user2 ON message_threads(user2_id, last_message_at DESC);

-- Function to automatically update message_threads when new message is sent
CREATE OR REPLACE FUNCTION update_message_thread()
RETURNS TRIGGER AS $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_recipient_is_user1 BOOLEAN;
BEGIN
  -- Determine consistent user ordering for thread lookup
  IF NEW.sender_id < NEW.recipient_id THEN
    v_user1_id := NEW.sender_id;
    v_user2_id := NEW.recipient_id;
    v_recipient_is_user1 := FALSE;
  ELSE
    v_user1_id := NEW.recipient_id;
    v_user2_id := NEW.sender_id;
    v_recipient_is_user1 := TRUE;
  END IF;

  -- Insert or update message thread
  INSERT INTO message_threads (user1_id, user2_id, last_message_id, last_message_at, user1_unread_count, user2_unread_count)
  VALUES (
    v_user1_id,
    v_user2_id,
    NEW.id,
    NEW.created_at,
    CASE WHEN v_recipient_is_user1 THEN 1 ELSE 0 END,
    CASE WHEN v_recipient_is_user1 THEN 0 ELSE 1 END
  )
  ON CONFLICT (user1_id, user2_id) DO UPDATE SET
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    user1_unread_count = CASE
      WHEN v_recipient_is_user1 THEN message_threads.user1_unread_count + 1
      ELSE message_threads.user1_unread_count
    END,
    user2_unread_count = CASE
      WHEN v_recipient_is_user1 THEN message_threads.user2_unread_count
      ELSE message_threads.user2_unread_count + 1
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update thread on new message
DROP TRIGGER IF EXISTS trigger_update_message_thread ON messages;
CREATE TRIGGER trigger_update_message_thread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_thread();

-- Function to mark messages as read and update thread unread counts
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_user_id UUID,
  p_other_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_user1_id UUID;
  v_user2_id UUID;
  v_user_is_user1 BOOLEAN;
BEGIN
  -- Update all unread messages from other_user to user
  UPDATE messages
  SET is_read = TRUE, read_at = NOW(), updated_at = NOW()
  WHERE recipient_id = p_user_id
    AND sender_id = p_other_user_id
    AND is_read = FALSE
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update thread unread count if any messages were marked as read
  IF v_count > 0 THEN
    -- Determine user ordering
    IF p_user_id < p_other_user_id THEN
      v_user1_id := p_user_id;
      v_user2_id := p_other_user_id;
      v_user_is_user1 := TRUE;
    ELSE
      v_user1_id := p_other_user_id;
      v_user2_id := p_user_id;
      v_user_is_user1 := FALSE;
    END IF;

    -- Reset unread count for the reading user
    UPDATE message_threads
    SET
      user1_unread_count = CASE WHEN v_user_is_user1 THEN 0 ELSE user1_unread_count END,
      user2_unread_count = CASE WHEN v_user_is_user1 THEN user2_unread_count ELSE 0 END,
      updated_at = NOW()
    WHERE user1_id = v_user1_id AND user2_id = v_user2_id;
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = recipient_id
  );

-- Users can send messages to anyone
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can update (mark as read) messages sent to them
CREATE POLICY "Users can update received messages" ON messages
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Users can soft delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Enable RLS on message_threads table
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

-- Users can view threads they're part of
CREATE POLICY "Users can view their threads" ON message_threads
  FOR SELECT
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

-- System can insert/update threads (via triggers)
CREATE POLICY "System can manage threads" ON message_threads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_threads TO authenticated;
GRANT ALL ON messages TO service_role;
GRANT ALL ON message_threads TO service_role;
