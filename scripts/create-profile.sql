-- Create user profile for existing auth user
-- Run this in Supabase SQL Editor

-- Step 1: Add user_id column to clients if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
  END IF;
END $$;

-- Step 2: Add updated_at to client_invitations if missing (fixes trigger error)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'client_invitations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE client_invitations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Step 3: Create user profile
INSERT INTO user_profiles (id, full_name, user_type, created_at, updated_at)
VALUES (
  'b49ed546-a9e0-46d0-977d-f02ffc3ec19e',
  'Natey McNateface',
  'client',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  updated_at = NOW()
RETURNING *;

-- Step 4: Link the client to the user
-- Note: The trigger will try to update client_invitations, but we've added updated_at column above
UPDATE clients
SET user_id = 'b49ed546-a9e0-46d0-977d-f02ffc3ec19e'
WHERE email = 'nathaniel.crowell12+testclient@gmail.com'
  AND user_id IS NULL
RETURNING id, email, name, user_id;

