-- =============================================================================
-- P0 SECURITY FIX — close two anonymous/authenticated data-exposure holes.
--
-- 1. public.profiles was readable by EVERYONE (including the `anon` role), so
--    an unauthenticated request could enumerate every registered user's email
--    address and is_admin flag. See 20240102000000_create_profiles.sql:12-14.
--    Migration 20240104000000 hardened INSERT and UPDATE but never revisited
--    SELECT.
--
-- 2. storage.objects granted blanket INSERT/UPDATE on the public `kpp-images`
--    bucket to the entire `authenticated` role, so any self-service signup
--    could overwrite the road-sign and Ishihara plate imagery served to all
--    other users. See scripts/setup-storage.sql:28-39.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- ─── 1. profiles: own-row reads only ─────────────────────────────────────────

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- No client code reads another user's profile row: the only two call sites are
-- SettingsPage.tsx:187 and DataExportDelete.tsx:57, both scoped to
-- .eq('id', user.id). Narrowing this policy therefore breaks no existing read.

-- ─── 2. storage: revoke learner write access to the exam image bucket ────────

-- Seeding runs out-of-band via scripts/upload-images.js, which authenticates
-- with SUPABASE_SERVICE_ROLE_KEY and bypasses RLS entirely. No `authenticated`
-- write policy is required for the application to function.

DROP POLICY IF EXISTS "kpp_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "kpp_images_authenticated_update" ON storage.objects;

-- Public read is intentional and is left in place: the bucket serves road-sign
-- images to signed-out users on the auth screen.
--   "kpp_images_public_read" — FOR SELECT TO public USING (bucket_id = 'kpp-images')
