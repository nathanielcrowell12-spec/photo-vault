-- ============================================================================
-- FIX: Photos Table RLS Policies for Client Access
-- ============================================================================
-- Date: 2026-01-03
--
-- PROBLEM:
-- 1. The existing "Clients can view photos in assigned galleries" policy uses:
--      client_id = auth.uid()
--    But photo_galleries.client_id references clients.id, NOT auth.uid().
--    Clients are linked indirectly: auth.uid() -> clients.user_id -> clients.id
--
-- 2. There is NO UPDATE policy for clients, so the favorite toggle silently fails.
--
-- SOLUTION:
-- - Update SELECT policy to properly traverse the FK relationship
-- - Add UPDATE policy for clients (needed for favorite toggle)
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing broken policies
-- ============================================================================

DROP POLICY IF EXISTS "Clients can view photos in assigned galleries" ON photos;
DROP POLICY IF EXISTS "Clients can update photos in assigned galleries" ON photos;

-- ============================================================================
-- STEP 2: Create corrected SELECT policy for clients
-- ============================================================================
-- Pattern: auth.uid() -> clients.user_id -> clients.id = photo_galleries.client_id

CREATE POLICY "Clients can view photos in assigned galleries"
ON photos
FOR SELECT
TO authenticated
USING (
  gallery_id IN (
    SELECT pg.id
    FROM photo_galleries pg
    WHERE
      -- Direct user_id match (for self-uploaded galleries)
      pg.user_id = (SELECT auth.uid())
      OR
      -- Client relationship match (photographer assigned client to gallery)
      pg.client_id IN (
        SELECT id FROM clients WHERE user_id = (SELECT auth.uid())
      )
  )
);

-- ============================================================================
-- STEP 3: Create UPDATE policy for clients (needed for favorite toggle)
-- ============================================================================

CREATE POLICY "Clients can update photos in assigned galleries"
ON photos
FOR UPDATE
TO authenticated
USING (
  gallery_id IN (
    SELECT pg.id
    FROM photo_galleries pg
    WHERE
      pg.user_id = (SELECT auth.uid())
      OR
      pg.client_id IN (
        SELECT id FROM clients WHERE user_id = (SELECT auth.uid())
      )
  )
)
WITH CHECK (
  gallery_id IN (
    SELECT pg.id
    FROM photo_galleries pg
    WHERE
      pg.user_id = (SELECT auth.uid())
      OR
      pg.client_id IN (
        SELECT id FROM clients WHERE user_id = (SELECT auth.uid())
      )
  )
);

-- ============================================================================
-- STEP 4: Add performance index (if not exists)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- ============================================================================
-- STEP 5: Ensure RLS is enabled
-- ============================================================================

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION: Test the fix (run after applying)
-- ============================================================================
/*
-- Impersonate betaclient2
SELECT set_config('request.jwt.claims',
  '{"sub": "2562e80b-1e7e-4c70-a53e-2031b4fa295e", "role": "authenticated"}',
  true);
SET ROLE authenticated;

-- This should now return the photo
SELECT id, gallery_id, is_favorite
FROM photos
WHERE gallery_id = '5dbd9363-e521-4c96-9d42-90872b3c2bcc'
LIMIT 1;

-- Test UPDATE works
UPDATE photos
SET is_favorite = true
WHERE id = (SELECT id FROM photos WHERE gallery_id = '5dbd9363-e521-4c96-9d42-90872b3c2bcc' LIMIT 1);

-- Reset
RESET ROLE;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
