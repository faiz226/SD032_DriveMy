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

-- Allow authenticated users to upload (for admin seeding)
CREATE POLICY "kpp_images_authenticated_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kpp-images');

-- Allow authenticated users to update (for re-uploads)
CREATE POLICY "kpp_images_authenticated_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'kpp-images');
