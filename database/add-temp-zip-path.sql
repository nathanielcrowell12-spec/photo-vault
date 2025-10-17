-- Add temp_zip_path column to galleries table for fast upload system
-- This column stores the temporary path of uploaded ZIP files before processing

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'galleries' 
        AND column_name = 'temp_zip_path'
    ) THEN
        ALTER TABLE galleries ADD COLUMN temp_zip_path TEXT;
        
        -- Add comment for documentation
        COMMENT ON COLUMN galleries.temp_zip_path IS 'Temporary storage path for ZIP files during upload process';
        
        -- Create index for faster cleanup queries
        CREATE INDEX IF NOT EXISTS idx_galleries_temp_zip_path ON galleries(temp_zip_path);
        
        RAISE NOTICE 'Added temp_zip_path column to galleries table';
    ELSE
        RAISE NOTICE 'temp_zip_path column already exists in galleries table';
    END IF;
END $$;
