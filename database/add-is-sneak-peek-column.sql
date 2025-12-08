-- Add is_sneak_peek column to photos table
-- Allows marking photos as sneak peeks to include in gallery notification emails
-- Created: 2025-12-01

-- Add the column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'is_sneak_peek'
  ) THEN
    ALTER TABLE photos ADD COLUMN is_sneak_peek BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for faster sneak peek queries
CREATE INDEX IF NOT EXISTS idx_photos_is_sneak_peek ON photos(is_sneak_peek) WHERE is_sneak_peek = true;

-- Add comment
COMMENT ON COLUMN photos.is_sneak_peek IS 'When true, this photo is included in gallery notification emails as a preview';
