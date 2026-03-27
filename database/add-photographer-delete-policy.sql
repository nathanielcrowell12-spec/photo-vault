-- ============================================================================
-- Add missing DELETE policy for photographers on photo_galleries
-- ============================================================================
-- Date: January 25, 2026
-- Issue: Photographers cannot delete their galleries - DELETE policy was missing
-- Root Cause: Only INSERT, UPDATE, SELECT policies existed for photographers
-- ============================================================================

-- Drop if exists to make this migration idempotent
DROP POLICY IF EXISTS "Photographers can delete their galleries" ON photo_galleries;

-- Create DELETE policy for photographers
-- Allows photographers to delete galleries they own (where photographer_id = their user id)
CREATE POLICY "Photographers can delete their galleries"
ON photo_galleries
FOR DELETE
USING (photographer_id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all photographer policies now exist:

-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE tablename = 'photo_galleries'
-- AND policyname LIKE '%Photographers%'
-- ORDER BY cmd;

-- Expected output should show:
-- Photographers can create galleries     | INSERT
-- Photographers can update their galleries | UPDATE
-- Photographers can view their galleries  | SELECT
-- Photographers can delete their galleries | DELETE  (NEW)
