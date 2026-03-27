-- ============================================================================
-- PROOFING SUBMISSIONS — Story 2.1: Data Model
-- ============================================================================
--
-- Purpose: Create proofing_submissions table for client proofing selections.
-- Clients select CSS filter preferences and leave notes per photo.
-- One submission per gallery per client (batch submit, immutable after).
--
-- Depends on: gallery-wizard-migration.sql (proofing_enabled column)
-- QA Critic reviewed: 2026-03-18 (C2 resolved — FK to photos table only)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create proofing_submissions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS proofing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  gallery_id UUID NOT NULL REFERENCES photo_galleries(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Proofing data
  filter_selection VARCHAR(50) DEFAULT NULL
    CHECK (filter_selection IS NULL OR filter_selection IN (
      'grayscale', 'sepia', 'brightness-up', 'contrast-up', 'warmth', 'cool-tone'
    )),
  client_note TEXT DEFAULT NULL
    CHECK (client_note IS NULL OR length(client_note) <= 500),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ DEFAULT NULL,

  -- One proofing entry per photo per client per gallery
  UNIQUE (gallery_id, photo_id, client_user_id)
);

COMMENT ON TABLE proofing_submissions IS
  'Per-photo proofing selections from clients: CSS filter preference + free-text note. FK to photos table (not gallery_photos). Old gallery_photos-only galleries cannot use proofing.';
COMMENT ON COLUMN proofing_submissions.filter_selection IS
  'CSS filter name or NULL (approved as-is). Values map to CSS filter properties in ProofingPanel.tsx';
COMMENT ON COLUMN proofing_submissions.client_note IS
  'Free-text note from client, max 500 chars. One note per photo.';
COMMENT ON COLUMN proofing_submissions.submitted_at IS
  'NULL while client is still working. Set on batch submission. Once set, row is immutable.';

-- ============================================================================
-- STEP 2: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_proofing_gallery_id
  ON proofing_submissions(gallery_id);

CREATE INDEX IF NOT EXISTS idx_proofing_client_user_id
  ON proofing_submissions(client_user_id);

CREATE INDEX IF NOT EXISTS idx_proofing_submitted
  ON proofing_submissions(gallery_id, submitted_at)
  WHERE submitted_at IS NOT NULL;

-- ============================================================================
-- STEP 3: RLS Policies
-- ============================================================================

ALTER TABLE proofing_submissions ENABLE ROW LEVEL SECURITY;

-- Clients can INSERT proofing for galleries where they are the assigned client
-- and proofing hasn't been submitted yet
DROP POLICY IF EXISTS "Clients can save proofing selections" ON proofing_submissions;
CREATE POLICY "Clients can save proofing selections"
  ON proofing_submissions
  FOR INSERT
  WITH CHECK (
    client_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM photo_galleries g
      JOIN clients c ON c.id = g.client_id
      WHERE g.id = proofing_submissions.gallery_id
        AND c.user_id = auth.uid()
        AND g.proofing_enabled = TRUE
    )
  );

-- Clients can UPDATE their own proofing (only if not yet submitted)
DROP POLICY IF EXISTS "Clients can update unsubmitted proofing" ON proofing_submissions;
CREATE POLICY "Clients can update unsubmitted proofing"
  ON proofing_submissions
  FOR UPDATE
  USING (
    client_user_id = auth.uid()
    AND submitted_at IS NULL
  )
  WITH CHECK (
    client_user_id = auth.uid()
    AND submitted_at IS NULL
  );

-- Clients can read their own proofing
DROP POLICY IF EXISTS "Clients can view their proofing" ON proofing_submissions;
CREATE POLICY "Clients can view their proofing"
  ON proofing_submissions
  FOR SELECT
  USING (client_user_id = auth.uid());

-- Photographers can read proofing for their galleries
DROP POLICY IF EXISTS "Photographers can view proofing for their galleries" ON proofing_submissions;
CREATE POLICY "Photographers can view proofing for their galleries"
  ON proofing_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM photo_galleries g
      WHERE g.id = proofing_submissions.gallery_id
        AND g.photographer_id = auth.uid()
    )
  );

-- Admins can view all proofing
DROP POLICY IF EXISTS "Admins can view all proofing" ON proofing_submissions;
CREATE POLICY "Admins can view all proofing"
  ON proofing_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND user_type = 'admin'
    )
  );

-- ============================================================================
-- STEP 4: Updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_proofing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proofing_updated_at ON proofing_submissions;
CREATE TRIGGER trigger_proofing_updated_at
  BEFORE UPDATE ON proofing_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_proofing_updated_at();

-- ============================================================================
-- STEP 5: Verify
-- ============================================================================

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'proofing_submissions'
ORDER BY ordinal_position;

SELECT polname, polcmd
FROM pg_policy
WHERE polrelid = 'proofing_submissions'::regclass;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- New table: proofing_submissions
--   - Per-photo proofing data (filter + note)
--   - FK to photos (not gallery_photos)
--   - Immutable after submitted_at is set
--   - RLS: clients insert/update (pre-submit), photographers read, admins read
--
-- ============================================================================
