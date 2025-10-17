-- Create galleries table to store connected photo galleries
CREATE TABLE IF NOT EXISTS galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gallery_name VARCHAR(255) NOT NULL,
    gallery_description TEXT,
    cover_image_url TEXT,
    platform VARCHAR(50) NOT NULL,
    photographer_name VARCHAR(255),
    photographer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    session_date DATE,
    photo_count INTEGER DEFAULT 0,
    gallery_url TEXT,
    gallery_password VARCHAR(255), -- Encrypted password for gallery access
    is_imported BOOLEAN DEFAULT false,
    import_started_at TIMESTAMP WITH TIME ZONE,
    import_completed_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB, -- Store additional platform-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_galleries_user_id ON galleries(user_id);
CREATE INDEX IF NOT EXISTS idx_galleries_platform ON galleries(platform);
CREATE INDEX IF NOT EXISTS idx_galleries_photographer_id ON galleries(photographer_id);
CREATE INDEX IF NOT EXISTS idx_galleries_session_date ON galleries(session_date);

-- Enable Row Level Security
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for galleries table

-- Users can view their own galleries
CREATE POLICY "Users can view own galleries" ON galleries
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Users can insert their own galleries
CREATE POLICY "Users can create own galleries" ON galleries
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Users can update their own galleries
CREATE POLICY "Users can update own galleries" ON galleries
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Users can delete their own galleries
CREATE POLICY "Users can delete own galleries" ON galleries
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Photographers can view galleries where they are the photographer
CREATE POLICY "Photographers can view their client galleries" ON galleries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.user_type = 'photographer'
            AND galleries.photographer_id = auth.uid()
        )
    );

-- Admins can view all galleries
CREATE POLICY "Admins can view all galleries" ON galleries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.user_type = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_galleries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER galleries_updated_at
    BEFORE UPDATE ON galleries
    FOR EACH ROW
    EXECUTE FUNCTION update_galleries_updated_at();

-- Create photos table to store individual photos from galleries
CREATE TABLE IF NOT EXISTS gallery_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    original_filename VARCHAR(255),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    taken_at TIMESTAMP WITH TIME ZONE,
    caption TEXT,
    is_favorite BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for gallery_photos
CREATE INDEX IF NOT EXISTS idx_gallery_photos_gallery_id ON gallery_photos(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_taken_at ON gallery_photos(taken_at);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_is_favorite ON gallery_photos(is_favorite);

-- Enable RLS for gallery_photos
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gallery_photos

-- Users can view photos from their own galleries
CREATE POLICY "Users can view photos from own galleries" ON gallery_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM galleries 
            WHERE galleries.id = gallery_photos.gallery_id 
            AND galleries.user_id = auth.uid()
        )
    );

-- Users can insert photos to their own galleries
CREATE POLICY "Users can add photos to own galleries" ON gallery_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM galleries 
            WHERE galleries.id = gallery_photos.gallery_id 
            AND galleries.user_id = auth.uid()
        )
    );

-- Users can update photos in their own galleries
CREATE POLICY "Users can update photos in own galleries" ON gallery_photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM galleries 
            WHERE galleries.id = gallery_photos.gallery_id 
            AND galleries.user_id = auth.uid()
        )
    );

-- Users can delete photos from their own galleries
CREATE POLICY "Users can delete photos from own galleries" ON gallery_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM galleries 
            WHERE galleries.id = gallery_photos.gallery_id 
            AND galleries.user_id = auth.uid()
        )
    );

-- Admins can manage all photos
CREATE POLICY "Admins can manage all photos" ON gallery_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.user_type = 'admin'
        )
    );

-- Create updated_at trigger for gallery_photos
CREATE TRIGGER gallery_photos_updated_at
    BEFORE UPDATE ON gallery_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_galleries_updated_at();

