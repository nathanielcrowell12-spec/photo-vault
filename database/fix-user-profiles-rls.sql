-- Fix RLS policies for user_profiles table
-- This allows users to read their own profile after login

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Recreate policies with better error handling
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
USING (
  auth.uid() = id
  OR
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

-- Also add a policy for service role (anon key with elevated permissions)
CREATE POLICY "Service role can do anything"
ON user_profiles FOR ALL
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);
