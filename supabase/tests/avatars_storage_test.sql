-- Profile pictures: the `avatars` bucket is public to read, and a learner can write only inside
-- their own `<user id>/` folder. Alice can add, replace and delete her own picture; she cannot touch
-- Bob's, or write to the bucket root.
begin;
select plan(12);

insert into auth.users (id, email, aud, role)
values
  ('77777777-7777-4777-8777-777777777701', 'avatar-alice@example.test', 'authenticated', 'authenticated'),
  ('77777777-7777-4777-8777-777777777702', 'avatar-bob@example.test',   'authenticated', 'authenticated');

-- Bob's picture, written by the owner of the table (RLS does not apply to it).
insert into storage.objects (bucket_id, name)
values ('avatars', '77777777-7777-4777-8777-777777777702/avatar.webp');

-- ─── The bucket ──────────────────────────────────────────────────────────────
select is((select public from storage.buckets where id = 'avatars'), true, 'the avatars bucket is public');
select is((select file_size_limit from storage.buckets where id = 'avatars'), 1048576::bigint, 'the avatars bucket limits a file to 1 MB');
select is(
  (select allowed_mime_types from storage.buckets where id = 'avatars'),
  array['image/webp', 'image/png', 'image/jpeg'],
  'the avatars bucket accepts image types only'
);

-- ─── Anyone can read ─────────────────────────────────────────────────────────
set local role anon;
select is(
  (select count(*) from storage.objects where bucket_id = 'avatars')::bigint, 1::bigint,
  'a signed-out visitor can read a picture'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', '77777777-7777-4777-8777-777777777701/avatar.webp') $$,
  '42501', null, 'a signed-out visitor cannot upload'
);

-- ─── Alice ───────────────────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"77777777-7777-4777-8777-777777777701","role":"authenticated"}';

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', '77777777-7777-4777-8777-777777777701/avatar.webp') $$,
  'Alice can upload into her own folder'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', '77777777-7777-4777-8777-777777777702/other.webp') $$,
  '42501', null, 'Alice cannot upload into Bob''s folder'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', 'root.webp') $$,
  '42501', null, 'Alice cannot upload to the bucket root'
);

with moved as (
  update storage.objects set name = '77777777-7777-4777-8777-777777777701/avatar.webp'
  where bucket_id = 'avatars' and name = '77777777-7777-4777-8777-777777777701/avatar.webp'
  returning 1
)
select is((select count(*) from moved)::bigint, 1::bigint, 'Alice can replace her own picture');

with changed as (
  update storage.objects set name = '77777777-7777-4777-8777-777777777701/stolen.webp'
  where bucket_id = 'avatars' and name = '77777777-7777-4777-8777-777777777702/avatar.webp'
  returning 1
)
select is((select count(*) from changed)::bigint, 0::bigint, 'Alice cannot rename Bob''s picture into her folder');

with removed as (
  delete from storage.objects
  where bucket_id = 'avatars' and name = '77777777-7777-4777-8777-777777777702/avatar.webp'
  returning 1
)
select is((select count(*) from removed)::bigint, 0::bigint, 'Alice cannot delete Bob''s picture');

with removed as (
  delete from storage.objects
  where bucket_id = 'avatars' and name = '77777777-7777-4777-8777-777777777701/avatar.webp'
  returning 1
)
select is((select count(*) from removed)::bigint, 1::bigint, 'Alice can delete her own picture');

select * from finish();
rollback;
