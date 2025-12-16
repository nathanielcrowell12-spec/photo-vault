-- ============================================================================
-- Fix RLS policies for client self-uploads
-- ============================================================================
-- Date: December 10, 2025
-- Issue: Clients cannot insert galleries via web form due to incomplete RLS policy
-- Solution: Require user_id = auth.uid() to ensure ownership

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Clients can insert own galleries" ON photo_galleries;
DROP POLICY IF EXISTS "Clients can update own uploaded galleries" ON photo_galleries;
DROP POLICY IF EXISTS "Clients can delete own uploaded galleries" ON photo_galleries;

-- ============================================================================
-- CREATE FIXED POLICIES
-- ============================================================================

-- Policy: Clients can insert galleries for themselves
-- Requirements:
--   1. photographer_id must be NULL (self-upload, no photographer)
--   2. user_id must equal auth.uid() (ownership)
--   3. client_id can be NULL (no photographer relationship) OR
--      client_id can reference a clients record where user_id = auth.uid()
CREATE POLICY "Clients can insert own galleries"
ON photo_galleries
FOR INSERT
WITH CHECK (
  photographer_id IS NULL
  AND user_id = auth.uid()
  AND (
    client_id IS NULL
    OR client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Clients can update their own galleries
CREATE POLICY "Clients can update own uploaded galleries"
ON photo_galleries
FOR UPDATE
USING (
  photographer_id IS NULL
  AND user_id = auth.uid()
)
WITH CHECK (
  photographer_id IS NULL
  AND user_id = auth.uid()
);

-- Policy: Clients can delete their own galleries
CREATE POLICY "Clients can delete own uploaded galleries"
ON photo_galleries
FOR DELETE
USING (
  photographer_id IS NULL
  AND user_id = auth.uid()
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify the policies were created correctly:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'photo_galleries'
AND policyname LIKE '%Clients%';
