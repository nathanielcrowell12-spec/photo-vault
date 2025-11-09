-- PhotoVault Directory Schema
-- This schema defines the tables required for the photographer and location directory.

-- Locations Table: Core table for each photo spot.
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    cover_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location Attributes Table: Stores filterable metadata for locations.
CREATE TABLE IF NOT EXISTS location_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    attribute_type TEXT NOT NULL, -- e.g., 'Location Type', 'Vibe/Style'
    value TEXT NOT NULL,
    UNIQUE(location_id, attribute_type, value)
);

-- Location Business Intelligence Table: Stores the "killer feature" data.
CREATE TABLE IF NOT EXISTS location_business_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE UNIQUE,
    permit_status TEXT, -- 'Yes', 'No', 'Varies'
    permit_cost TEXT,
    permit_details TEXT,
    rules_and_restrictions TEXT,
    seasonal_availability TEXT,
    insider_tips TEXT
);

-- Photographer Profiles Table: Public-facing profiles for photographers.
CREATE TABLE IF NOT EXISTS photographer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username TEXT NOT NULL UNIQUE,
    business_name TEXT,
    bio TEXT,
    website TEXT,
    profile_image_url TEXT,
    is_founding_member BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table: For client reviews of photographers.
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photographer_id UUID REFERENCES photographer_profiles(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_business_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for public access (read-only)
CREATE POLICY "Allow public read access to locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Allow public read access to location_attributes" ON location_attributes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to location_business_intelligence" ON location_business_intelligence FOR SELECT USING (true);
CREATE POLICY "Allow public read access to photographer_profiles" ON photographer_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access to reviews" ON reviews FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_city_state ON locations (city, state);
CREATE INDEX IF NOT EXISTS idx_location_attributes_type_value ON location_attributes (attribute_type, value);
CREATE INDEX IF NOT EXISTS idx_photographer_profiles_username ON photographer_profiles (username);
