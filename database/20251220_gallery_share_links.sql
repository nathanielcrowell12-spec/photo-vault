-- Gallery Share Links Schema
-- Feature: Allow paying clients to share gallery access via time-limited, revocable links
-- Date: December 20, 2025
--
-- DECISIONS (from user approval):
-- 1. Share links remain active after subscription ends
-- 2. No IP tracking (simple count-based limits for privacy)

-- ============================================================================
-- TABLE: gallery_share_links
-- ============================================================================

CREATE TABLE IF NOT EXISTS gallery_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gallery and creator
  gallery_id UUID NOT NULL REFERENCES photo_galleries(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Shareable token (unguessable)
  share_token VARCHAR(255) UNIQUE NOT NULL,  -- UUID v4

  -- Expiration
  expires_at TIMESTAMPTZ,  -- NULL = never expires (though we enforce max 365 days in app)
  is_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,

  -- Download limits (simplified: no IP tracking)
  download_limit INTEGER DEFAULT 5,  -- NULL = unlimited, 0 = view only
  downloads_used INTEGER DEFAULT 0,

  -- Usage tracking (simple counters, no PII)
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Metadata
  label VARCHAR(255),  -- Optional label like "Wedding Guests", "Grandparents"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()

  -- NOTE: No limit on share links per gallery - free advertising for PhotoVault
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for looking up links by gallery
CREATE INDEX IF NOT EXISTS idx_gallery_share_links_gallery_id
  ON gallery_share_links(gallery_id);

-- Index for token lookup (used in validation)
CREATE INDEX IF NOT EXISTS idx_gallery_share_links_share_token
  ON gallery_share_links(share_token);

-- Index for user's links
CREATE INDEX IF NOT EXISTS idx_gallery_share_links_created_by
  ON gallery_share_links(created_by_user_id);

-- Partial index for active links (commonly queried)
CREATE INDEX IF NOT EXISTS idx_gallery_share_links_active
  ON gallery_share_links(gallery_id, is_revoked, expires_at)
  WHERE is_revoked = FALSE;

-- ============================================================================
-- TRIGGERS: Atomic increment for view_count (fixes race condition)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_share_link_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_share_link_updated_at
BEFORE UPDATE ON gallery_share_links
FOR EACH ROW
EXECUTE FUNCTION update_share_link_updated_at();

-- ============================================================================
-- FUNCTION: Atomic view count increment (used by API)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_share_link_view_count(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE gallery_share_links
  SET
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Atomic download count increment (used by API)
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_share_link_download_count(link_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE gallery_share_links
  SET downloads_used = downloads_used + 1
  WHERE id = link_id
  RETURNING downloads_used INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE gallery_share_links ENABLE ROW LEVEL SECURITY;

-- Users can view share links they created
CREATE POLICY "Users can view own share links"
  ON gallery_share_links FOR SELECT
  USING (created_by_user_id = auth.uid());

-- Photographers can view share links for their galleries
CREATE POLICY "Photographers can view share links for own galleries"
  ON gallery_share_links FOR SELECT
  USING (
    gallery_id IN (
      SELECT id FROM photo_galleries WHERE photographer_id = auth.uid()
    )
  );

-- Users with active subscription can create share links for that gallery
CREATE POLICY "Subscribers can create share links"
  ON gallery_share_links FOR INSERT
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND (
      -- Has active subscription
      gallery_id IN (
        SELECT gallery_id FROM subscriptions
        WHERE user_id = auth.uid()
        AND status IN ('active', 'trialing', 'past_due')
        AND (access_suspended IS NULL OR access_suspended = FALSE)
      )
      OR
      -- Or owns the gallery (self-uploaded)
      gallery_id IN (
        SELECT id FROM photo_galleries WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update their own share links (for revocation)
CREATE POLICY "Users can update own share links"
  ON gallery_share_links FOR UPDATE
  USING (created_by_user_id = auth.uid());

-- Users can delete their own share links
CREATE POLICY "Users can delete own share links"
  ON gallery_share_links FOR DELETE
  USING (created_by_user_id = auth.uid());

-- Service role bypasses RLS (for public token validation)
CREATE POLICY "Service role full access"
  ON gallery_share_links FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON gallery_share_links TO authenticated;
GRANT ALL ON gallery_share_links TO service_role;
GRANT EXECUTE ON FUNCTION increment_share_link_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_share_link_view_count(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_share_link_download_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_share_link_download_count(UUID) TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE gallery_share_links IS
  'Shareable links for galleries - allows anonymous access without account/subscription. Different from family sharing (which requires PhotoVault accounts).';

COMMENT ON COLUMN gallery_share_links.share_token IS
  'Unguessable UUID token used in share URL. Format: /gallery/{id}?share={token}';

COMMENT ON COLUMN gallery_share_links.download_limit IS
  'Max downloads via this link. NULL=unlimited, 0=view only. Counter incremented atomically.';

COMMENT ON FUNCTION increment_share_link_view_count(UUID) IS
  'Atomically increments view_count to avoid race conditions on concurrent access.';

COMMENT ON FUNCTION increment_share_link_download_count(UUID) IS
  'Atomically increments downloads_used and returns new count. Avoids race conditions.';

-- ============================================================================
-- ROLLBACK SCRIPT (keep separate or comment out)
-- ============================================================================
--
-- DROP POLICY IF EXISTS "Users can view own share links" ON gallery_share_links;
-- DROP POLICY IF EXISTS "Photographers can view share links for own galleries" ON gallery_share_links;
-- DROP POLICY IF EXISTS "Subscribers can create share links" ON gallery_share_links;
-- DROP POLICY IF EXISTS "Users can update own share links" ON gallery_share_links;
-- DROP POLICY IF EXISTS "Users can delete own share links" ON gallery_share_links;
-- DROP POLICY IF EXISTS "Service role full access" ON gallery_share_links;
-- DROP TRIGGER IF EXISTS trigger_share_link_updated_at ON gallery_share_links;
-- DROP FUNCTION IF EXISTS update_share_link_updated_at();
-- DROP FUNCTION IF EXISTS increment_share_link_view_count(UUID);
-- DROP FUNCTION IF EXISTS increment_share_link_download_count(UUID);
-- DROP TABLE IF EXISTS gallery_share_links CASCADE;
