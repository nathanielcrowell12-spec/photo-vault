-- Client Ratings/Reviews System
-- Allows clients to rate and review their photographer experience

-- Create the client_ratings table
CREATE TABLE IF NOT EXISTS client_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES photographers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  gallery_id UUID REFERENCES photo_galleries(id) ON DELETE SET NULL,

  -- Rating fields
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  -- What they're rating
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),

  -- Status
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),

  -- Photographer response
  photographer_response TEXT,
  response_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_ratings_photographer ON client_ratings(photographer_id);
CREATE INDEX IF NOT EXISTS idx_client_ratings_client ON client_ratings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_ratings_gallery ON client_ratings(gallery_id);
CREATE INDEX IF NOT EXISTS idx_client_ratings_status ON client_ratings(status);

-- Unique constraint: one rating per client per gallery (or one per client-photographer if no gallery)
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_ratings_unique_gallery
  ON client_ratings(client_id, gallery_id)
  WHERE gallery_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_ratings_unique_no_gallery
  ON client_ratings(client_id, photographer_id)
  WHERE gallery_id IS NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_client_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS client_ratings_updated_at ON client_ratings;
CREATE TRIGGER client_ratings_updated_at
  BEFORE UPDATE ON client_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_client_ratings_updated_at();

-- RLS Policies
ALTER TABLE client_ratings ENABLE ROW LEVEL SECURITY;

-- Photographers can view their own ratings
CREATE POLICY "photographers_view_own_ratings" ON client_ratings
  FOR SELECT
  USING (photographer_id = auth.uid());

-- Photographers can respond to ratings
CREATE POLICY "photographers_respond_to_ratings" ON client_ratings
  FOR UPDATE
  USING (photographer_id = auth.uid())
  WITH CHECK (photographer_id = auth.uid());

-- Clients can view ratings they created
CREATE POLICY "clients_view_own_ratings" ON client_ratings
  FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Clients can create ratings for their photographers
CREATE POLICY "clients_create_ratings" ON client_ratings
  FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- Clients can update their own ratings (within 30 days)
CREATE POLICY "clients_update_own_ratings" ON client_ratings
  FOR UPDATE
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    AND created_at > NOW() - INTERVAL '30 days'
  )
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

-- Service role can do everything
CREATE POLICY "service_role_all_access" ON client_ratings
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Helper function to get photographer's average rating
CREATE OR REPLACE FUNCTION get_photographer_avg_rating(p_photographer_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM client_ratings
  WHERE photographer_id = p_photographer_id
    AND status = 'published';
$$ LANGUAGE sql STABLE;

-- Helper function to get photographer's rating count
CREATE OR REPLACE FUNCTION get_photographer_rating_count(p_photographer_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::integer
  FROM client_ratings
  WHERE photographer_id = p_photographer_id
    AND status = 'published';
$$ LANGUAGE sql STABLE;

COMMENT ON TABLE client_ratings IS 'Stores client ratings and reviews for photographers';
