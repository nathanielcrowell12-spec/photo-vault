-- Create user profile for Farty McGee
-- Run this in Supabase SQL Editor

-- Step 1: Create user profile
INSERT INTO user_profiles (id, full_name, user_type, created_at, updated_at)
VALUES (
  '364d4cfb-13d5-4a57-a7db-826dd20c7ba5',
  'Farty McGee',
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

-- Step 2: Link the client to the user
UPDATE clients
SET user_id = '364d4cfb-13d5-4a57-a7db-826dd20c7ba5'
WHERE email = 'nathaniel.crowell12+fartymcgee@gmail.com'
  AND user_id IS NULL
RETURNING id, email, name, user_id;

