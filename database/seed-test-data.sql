-- Seed Test Data for PhotoVault
-- This creates sample galleries and photos for testing

-- First, create a client record in the clients table for the test client user
-- This links the photographer to the client
INSERT INTO clients (
  id,
  photographer_id,
  email,
  name,
  status,
  created_at
) VALUES (
  'a1b956e4-67ae-4516-9452-3b5a4d838f41',
  'f1cf2244-c06f-406f-9b31-253deb1f7ceb',
  'randomperson12@gmail.com',
  'Random Person',
  'active',
  NOW() - INTERVAL '60 days'
)
ON CONFLICT (photographer_id, email) DO NOTHING;

-- Create test galleries for the photographer (f1cf2244-c06f-406f-9b31-253deb1f7ceb)
-- and link one to the client (a1b956e4-67ae-4516-9452-3b5a4d838f41)

-- Gallery 1: Wedding shoot linked to client
INSERT INTO photo_galleries (
  id,
  photographer_id,
  client_id,
  platform,
  gallery_name,
  gallery_description,
  gallery_url,
  photo_count,
  session_date,
  is_imported,
  created_at
) VALUES (
  gen_random_uuid(),
  'f1cf2244-c06f-406f-9b31-253deb1f7ceb',
  'a1b956e4-67ae-4516-9452-3b5a4d838f41',
  'photovault',
  'Smith Wedding - October 2024',
  'Beautiful outdoor wedding ceremony and reception photos',
  'https://photovault.com/gallery/smith-wedding-2024',
  25,
  '2024-10-15',
  true,
  NOW() - INTERVAL '30 days'
);

-- Gallery 2: Family portrait session (no client linked yet)
INSERT INTO photo_galleries (
  id,
  photographer_id,
  client_id,
  platform,
  gallery_name,
  gallery_description,
  gallery_url,
  photo_count,
  session_date,
  is_imported,
  created_at
) VALUES (
  gen_random_uuid(),
  'f1cf2244-c06f-406f-9b31-253deb1f7ceb',
  NULL,
  'photovault',
  'Johnson Family Portraits',
  'Annual family photo session at the park',
  'https://photovault.com/gallery/johnson-family-2024',
  18,
  '2024-11-05',
  true,
  NOW() - INTERVAL '10 days'
);

-- Gallery 3: Senior portraits
INSERT INTO photo_galleries (
  id,
  photographer_id,
  client_id,
  platform,
  gallery_name,
  gallery_description,
  gallery_url,
  photo_count,
  session_date,
  is_imported,
  created_at
) VALUES (
  gen_random_uuid(),
  'f1cf2244-c06f-406f-9b31-253deb1f7ceb',
  NULL,
  'photovault',
  'Emma - Senior Portraits 2025',
  'High school senior portrait session',
  'https://photovault.com/gallery/emma-senior-2025',
  32,
  '2024-11-12',
  true,
  NOW() - INTERVAL '3 days'
);

-- Add some sample photos to the first gallery
-- First, get the gallery ID we just created
DO $$
DECLARE
  wedding_gallery_id UUID;
  family_gallery_id UUID;
BEGIN
  -- Get the wedding gallery ID
  SELECT id INTO wedding_gallery_id
  FROM photo_galleries
  WHERE gallery_name = 'Smith Wedding - October 2024'
  LIMIT 1;

  -- Get the family gallery ID
  SELECT id INTO family_gallery_id
  FROM photo_galleries
  WHERE gallery_name = 'Johnson Family Portraits'
  LIMIT 1;

  -- Insert sample photos for wedding gallery
  FOR i IN 1..5 LOOP
    INSERT INTO photos (
      gallery_id,
      filename,
      original_url,
      thumbnail_url,
      file_size,
      width,
      height,
      is_favorite,
      created_at
    ) VALUES (
      wedding_gallery_id,
      'wedding-photo-' || i || '.jpg',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
      2500000 + (i * 100000),
      3840,
      2160,
      i <= 2, -- Mark first 2 as favorites
      NOW() - INTERVAL '30 days'
    );
  END LOOP;

  -- Insert sample photos for family gallery
  FOR i IN 1..3 LOOP
    INSERT INTO photos (
      gallery_id,
      filename,
      original_url,
      thumbnail_url,
      file_size,
      width,
      height,
      is_favorite,
      created_at
    ) VALUES (
      family_gallery_id,
      'family-photo-' || i || '.jpg',
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1920',
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400',
      1800000 + (i * 50000),
      3000,
      2000,
      i = 1, -- Mark first one as favorite
      NOW() - INTERVAL '10 days'
    );
  END LOOP;
END $$;

-- Verify the data was inserted
SELECT
  'Data seeded successfully!' as message,
  (SELECT COUNT(*) FROM photo_galleries) as galleries_created,
  (SELECT COUNT(*) FROM photos) as photos_created;
