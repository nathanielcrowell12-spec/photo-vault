-- RLS Policies for photo_galleries table
-- Enable RLS
ALTER TABLE photo_galleries ENABLE ROW LEVEL SECURITY;

-- Policy: Photographers can view their own galleries
CREATE POLICY "Photographers can view own galleries"
ON photo_galleries
FOR SELECT
USING (photographer_id = auth.uid());

-- Policy: Photographers can insert their own galleries
CREATE POLICY "Photographers can insert own galleries"
ON photo_galleries
FOR INSERT
WITH CHECK (photographer_id = auth.uid());

-- Policy: Photographers can update their own galleries
CREATE POLICY "Photographers can update own galleries"
ON photo_galleries
FOR UPDATE
USING (photographer_id = auth.uid())
WITH CHECK (photographer_id = auth.uid());

-- Policy: Photographers can delete their own galleries
CREATE POLICY "Photographers can delete own galleries"
ON photo_galleries
FOR DELETE
USING (photographer_id = auth.uid());

-- Policy: Clients can view galleries assigned to them
CREATE POLICY "Clients can view assigned galleries"
ON photo_galleries
FOR SELECT
USING (client_id = auth.uid());

-- RLS Policies for photos table
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policy: Photographers can manage photos in their galleries
CREATE POLICY "Photographers can manage photos in own galleries"
ON photos
FOR ALL
USING (
  gallery_id IN (
    SELECT id FROM photo_galleries WHERE photographer_id = auth.uid()
  )
);

-- Policy: Clients can view photos in their galleries
CREATE POLICY "Clients can view photos in assigned galleries"
ON photos
FOR SELECT
USING (
  gallery_id IN (
    SELECT id FROM photo_galleries WHERE client_id = auth.uid()
  )
);
