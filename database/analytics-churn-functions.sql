-- Analytics churn tracking functions and indexes
-- Created: December 16, 2025 (Story 6.3)

-- Performance indexes for churn stat queries (add FIRST before creating functions)
CREATE INDEX IF NOT EXISTS idx_commissions_photographer_status
  ON commissions(photographer_id, status);

CREATE INDEX IF NOT EXISTS idx_clients_photographer
  ON clients(photographer_id);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_photographer
  ON photo_galleries(photographer_id);

CREATE INDEX IF NOT EXISTS idx_photo_galleries_client
  ON photo_galleries(client_id);

-- Get photographer churn statistics
-- Used for tracking photographer_churned events with LTV metrics
CREATE OR REPLACE FUNCTION get_photographer_churn_stats(p_photographer_id UUID)
RETURNS TABLE (
  total_revenue_cents INTEGER,
  client_count INTEGER,
  gallery_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(c.photographer_amount_cents), 0)::INTEGER AS total_revenue_cents,
    COUNT(DISTINCT cl.id)::INTEGER AS client_count,
    COUNT(DISTINCT pg.id)::INTEGER AS gallery_count
  FROM photographers p
  LEFT JOIN commissions c ON p.id = c.photographer_id AND c.status = 'paid'
  LEFT JOIN clients cl ON p.id = cl.photographer_id
  LEFT JOIN photo_galleries pg ON p.id = pg.photographer_id
  WHERE p.id = p_photographer_id
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get client churn statistics
-- Used for tracking client_churned events with engagement data
CREATE OR REPLACE FUNCTION get_client_churn_stats(p_client_id UUID)
RETURNS TABLE (
  photographer_id UUID,
  gallery_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.photographer_id,
    COUNT(DISTINCT pg.id)::INTEGER AS gallery_count
  FROM clients cl
  LEFT JOIN photo_galleries pg ON cl.id = pg.client_id
  WHERE cl.id = p_client_id
  GROUP BY cl.id, cl.photographer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_photographer_churn_stats IS 'Calculate photographer lifetime value and engagement for churn tracking. Optimized with indexes on commissions, clients, and photo_galleries.';
COMMENT ON FUNCTION get_client_churn_stats IS 'Calculate client engagement for churn tracking. Optimized with index on photo_galleries.';
