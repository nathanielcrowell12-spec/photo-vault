-- Create a PostgreSQL function to atomically increment gallery photo count
-- This prevents race conditions when multiple files are uploaded simultaneously

CREATE OR REPLACE FUNCTION increment_gallery_photo_count(
  gallery_id UUID,
  count_increment INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE photo_galleries
  SET photo_count = COALESCE(photo_count, 0) + count_increment
  WHERE id = gallery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_gallery_photo_count(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_gallery_photo_count(UUID, INTEGER) TO service_role;
