-- Add missing columns to photo_galleries table
ALTER TABLE photo_galleries 
ADD COLUMN IF NOT EXISTS import_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS import_completed_at TIMESTAMPTZ;
