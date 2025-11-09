-- Drop the galleries table if it exists (since it was created incorrectly)
DROP TABLE IF EXISTS galleries CASCADE;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  client_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_photographer_client_email UNIQUE (photographer_id, email)
);

-- Now create galleries table with client_id
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  gallery_name TEXT NOT NULL,
  gallery_description TEXT,
  photo_count INTEGER DEFAULT 0,
  session_date TIMESTAMPTZ,
  storage_path TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_clients_photographer_id ON clients(photographer_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_galleries_photographer_id ON galleries(photographer_id);
CREATE INDEX idx_galleries_client_id ON galleries(client_id);
CREATE INDEX idx_galleries_share_token ON galleries(share_token);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table
CREATE POLICY "Photographers can view their own clients"
  ON clients FOR SELECT
  USING (photographer_id = auth.uid());

CREATE POLICY "Photographers can insert their own clients"
  ON clients FOR INSERT
  WITH CHECK (photographer_id = auth.uid());

CREATE POLICY "Photographers can update their own clients"
  ON clients FOR UPDATE
  USING (photographer_id = auth.uid())
  WITH CHECK (photographer_id = auth.uid());

CREATE POLICY "Photographers can delete their own clients"
  ON clients FOR DELETE
  USING (photographer_id = auth.uid());

-- RLS Policies for galleries table
CREATE POLICY "Photographers can view their own galleries"
  ON galleries FOR SELECT
  USING (photographer_id = auth.uid());

CREATE POLICY "Anyone can view public galleries"
  ON galleries FOR SELECT
  USING (is_public = true OR share_token IS NOT NULL);

CREATE POLICY "Photographers can insert their own galleries"
  ON galleries FOR INSERT
  WITH CHECK (photographer_id = auth.uid());

CREATE POLICY "Photographers can update their own galleries"
  ON galleries FOR UPDATE
  USING (photographer_id = auth.uid())
  WITH CHECK (photographer_id = auth.uid());

CREATE POLICY "Photographers can delete their own galleries"
  ON galleries FOR DELETE
  USING (photographer_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_galleries_updated_at
  BEFORE UPDATE ON galleries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
