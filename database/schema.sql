-- PhotoVault Database Schema
-- Designed for easy integration with professional CMS software
-- PostgreSQL/Supabase compatible

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'photographer', 'admin')),
  business_name VARCHAR(255),
  full_name VARCHAR(255),
  business_type VARCHAR(100),
  website_url VARCHAR(500),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(50),
  postal_code VARCHAR(20),
  bio TEXT,
  profile_image_url VARCHAR(500),
  social_links JSONB,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('active', 'inactive', 'grace_period', 'pending', 'admin_bypass')),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photographers table (for professional CMS integration)
CREATE TABLE IF NOT EXISTS photographers (
  id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  business_license VARCHAR(100),
  tax_id VARCHAR(50),
  bank_account_info JSONB, -- Encrypted payment info
  cms_integration_id VARCHAR(100), -- For professional CMS integration
  cms_system VARCHAR(50), -- 'photovault', 'studio-ninja', 'tave', etc.
  commission_rate DECIMAL(5,2) DEFAULT 50.00,
  total_commission_earned DECIMAL(10,2) DEFAULT 0.00,
  monthly_commission DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table (for professional CMS integration)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  client_notes TEXT,
  cms_client_id VARCHAR(100), -- For professional CMS integration
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(photographer_id, email)
);

-- Photo galleries table
CREATE TABLE IF NOT EXISTS photo_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'photovault', 'pixieset', 'shootproof', etc.
  platform_gallery_id VARCHAR(100),
  gallery_name VARCHAR(255) NOT NULL,
  gallery_description TEXT,
  gallery_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  photo_count INTEGER DEFAULT 0,
  session_date DATE,
  gallery_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'proofing', 'delivery'
  is_imported BOOLEAN DEFAULT FALSE,
  imported_at TIMESTAMP WITH TIME ZONE,
  cms_gallery_id VARCHAR(100), -- For professional CMS integration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES photo_galleries(id) ON DELETE CASCADE,
  platform_photo_id VARCHAR(100),
  filename VARCHAR(255) NOT NULL,
  original_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  medium_url VARCHAR(500),
  full_url VARCHAR(500),
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  exif_data JSONB,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment options table (for commission tracking)
CREATE TABLE IF NOT EXISTS payment_options (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  photographer_commission_rate DECIMAL(5,2) NOT NULL,
  gallery_status VARCHAR(20) DEFAULT 'active',
  reactivation_fee DECIMAL(10,2) DEFAULT 8.00,
  commission_applies BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client payments table (for commission tracking)
CREATE TABLE IF NOT EXISTS client_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  gallery_id UUID REFERENCES photo_galleries(id) ON DELETE CASCADE,
  payment_option_id VARCHAR(50) REFERENCES payment_options(id),
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  expiry_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  commission_paid DECIMAL(10,2) DEFAULT 0.00,
  reactivation_count INTEGER DEFAULT 0,
  last_reactivation_date DATE,
  new_session_with_photographer BOOLEAN DEFAULT FALSE,
  new_session_date DATE,
  cms_payment_id VARCHAR(100), -- For professional CMS integration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo sessions table (for commission reset tracking)
CREATE TABLE IF NOT EXISTS photo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  gallery_id UUID REFERENCES photo_galleries(id),
  session_date DATE NOT NULL,
  session_type VARCHAR(100) NOT NULL,
  session_description TEXT,
  commission_reset BOOLEAN DEFAULT FALSE,
  cms_session_id VARCHAR(100), -- For professional CMS integration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission payments table (for tracking photographer earnings)
CREATE TABLE IF NOT EXISTS commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  client_payment_id UUID REFERENCES client_payments(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) NOT NULL,
  payment_period_start DATE NOT NULL,
  payment_period_end DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  cms_payment_id VARCHAR(100), -- For professional CMS integration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform connections table (for API integrations)
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'pixieset', 'shootproof', 'smugmug'
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(photographer_id, platform)
);

-- Memory refresh events table (for Phase 3 feature)
CREATE TABLE IF NOT EXISTS memory_refresh_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  gallery_id UUID REFERENCES photo_galleries(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'anniversary', 'birthday', 'holiday', 'custom'
  event_date DATE NOT NULL,
  event_title VARCHAR(255) NOT NULL,
  event_description TEXT,
  photos_selected UUID[], -- Array of photo IDs
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client invitations table
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  client_email VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  session_name VARCHAR(255) NOT NULL,
  payment_option_id VARCHAR(50) REFERENCES payment_options(id),
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  custom_message TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_photographers_cms_integration ON photographers(cms_integration_id);
CREATE INDEX IF NOT EXISTS idx_clients_photographer ON clients(photographer_id);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_photographer ON photo_galleries(photographer_id);
CREATE INDEX IF NOT EXISTS idx_photo_galleries_client ON photo_galleries(client_id);
CREATE INDEX IF NOT EXISTS idx_photos_gallery ON photos(gallery_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_client ON client_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_photographer ON client_payments(photographer_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_client ON photo_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_photographer ON commission_payments(photographer_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_photographer ON platform_connections(photographer_id);
CREATE INDEX IF NOT EXISTS idx_memory_refresh_events_client ON memory_refresh_events(client_id);

-- Insert default payment options
INSERT INTO payment_options (id, name, description, price, duration_months, photographer_commission_rate, gallery_status, reactivation_fee, commission_applies) VALUES
('photographer_billed', 'Photographer Billed - Monthly', 'Include PhotoVault access in your photo shoot package - $4/month commission', 8.00, 999, 50.00, 'active', 8.00, true),
('six_month_trial', '6-Month Trial', 'Client pays $20 for 6 months access, then gallery goes inactive', 20.00, 6, 50.00, 'active', 8.00, true),
('client_direct_monthly', 'Client Direct - Monthly', 'Client pays $8/month directly to PhotoVault', 8.00, 999, 50.00, 'active', 8.00, true),
('reactivated_gallery', 'Reactivated Gallery', 'Client reactivated after 6+ months of inactivity', 8.00, 1, 0.00, 'active', 8.00, false)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_refresh_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Photographers can view own data" ON photographers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Clients can view own photographer data" ON photographers FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE photographer_id = photographers.id AND id IN (
    SELECT client_id FROM photo_galleries WHERE client_id IN (
      SELECT id FROM clients WHERE photographer_id = photographers.id
    )
  ))
);

-- Add similar policies for other tables...

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photographers_updated_at BEFORE UPDATE ON photographers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photo_galleries_updated_at BEFORE UPDATE ON photo_galleries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_payments_updated_at BEFORE UPDATE ON client_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_photo_sessions_updated_at BEFORE UPDATE ON photo_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_payments_updated_at BEFORE UPDATE ON commission_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON platform_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memory_refresh_events_updated_at BEFORE UPDATE ON memory_refresh_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_invitations_updated_at BEFORE UPDATE ON client_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Competitor logos table for automatic logo updates
CREATE TABLE IF NOT EXISTS competitor_logos (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo_url TEXT NOT NULL,
    website TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for competitor_logos
ALTER TABLE competitor_logos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitor_logos (public read access, admin write access)
CREATE POLICY "Anyone can view competitor logos" ON competitor_logos
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage competitor logos" ON competitor_logos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.user_type = 'admin'
        )
    );

-- Index for competitor logos
CREATE INDEX IF NOT EXISTS idx_competitor_logos_last_updated ON competitor_logos(last_updated);
CREATE INDEX IF NOT EXISTS idx_competitor_logos_is_active ON competitor_logos(is_active);

-- Trigger for competitor_logos updated_at
CREATE TRIGGER update_competitor_logos_updated_at BEFORE UPDATE ON competitor_logos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
