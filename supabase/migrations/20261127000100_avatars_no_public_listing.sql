-- Audit finding SEC-F1: the avatars bucket had a SELECT policy for `public`, so a signed-out visitor holding the
-- (public) publishable key could LIST the bucket through the Storage API and read every learner's user id from the
-- folder names. Pictures do not need that policy to show: a public bucket serves its files by URL without row-level
-- security. Reading rows of storage.objects is now allowed only for a learner's own folder, which the upsert in
-- the app (replace my picture) needs.
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_owner_read" on storage.objects;
create policy "avatars_owner_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
