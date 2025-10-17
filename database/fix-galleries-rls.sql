-- Fix RLS policies for galleries table
-- Run this in Supabase Dashboard > SQL Editor

-- Enable RLS on galleries table
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own galleries" ON galleries;
DROP POLICY IF EXISTS "Users can create own galleries" ON galleries;
DROP POLICY IF EXISTS "Users can update own galleries" ON galleries;
DROP POLICY IF EXISTS "Users can delete own galleries" ON galleries;
DROP POLICY IF EXISTS "Photographers can view their client galleries" ON galleries;
DROP POLICY IF EXISTS "Admins can view all galleries" ON galleries;

-- Create new policies
-- Allow users to view their own galleries
CREATE POLICY "Users can view own galleries" ON galleries
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to create their own galleries
CREATE POLICY "Users can create own galleries" ON galleries
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own galleries
CREATE POLICY "Users can update own galleries" ON galleries
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own galleries
CREATE POLICY "Users can delete own galleries" ON galleries
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow photographers to view galleries they created for clients
CREATE POLICY "Photographers can view their client galleries" ON galleries
FOR SELECT 
USING (
  photographer_name IN (
    SELECT full_name FROM user_profiles WHERE id = auth.uid()
  )
);

-- Allow admins to view all galleries
CREATE POLICY "Admins can view all galleries" ON galleries
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);



