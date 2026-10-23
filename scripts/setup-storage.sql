-- =============================================================================
-- DriveMy — Supabase Storage Setup
-- Run in Supabase SQL Editor before running upload-images.js
-- =============================================================================

-- Create the kpp-images bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kpp-images',
  'kpp-images',
  true,
  2097152,  -- 2 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public read access to all files in kpp-images
CREATE POLICY "kpp_images_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'kpp-images');

-- NOTE: there is deliberately NO write policy for the `authenticated` role.
--
-- Granting INSERT/UPDATE to `authenticated` would let anyone who completes the
-- free self-service signup overwrite the road-sign and Ishihara plate images
-- that every other learner is tested on. For a road-safety product, corrupted
-- sign imagery is a worse outcome than a data leak.
--
-- Seeding (scripts/upload-images.js) authenticates with
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS — so uploads work without any
-- policy at all. Do not add one.
