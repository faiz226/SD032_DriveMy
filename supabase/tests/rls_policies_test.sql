-- =============================================================================
-- RLS policy tests (pgTAP)
--
-- Run with:  supabase db test
--
-- The previous version of this file asserted `select count(*) from profiles = 0`
-- against an empty database. That assertion passes identically whether the
-- table is correctly locked down or wide open to anonymous users — it provided
-- false assurance about the most serious finding in the codebase. These tests
-- assert isolation between two real users instead.
-- =============================================================================

begin;
select plan(6);

-- ─── Fixtures: two distinct users ────────────────────────────────────────────

insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test',   'authenticated', 'authenticated');

-- handle_new_user() creates the profile rows via trigger. Fall back to an
-- explicit insert if the trigger is not installed in this test database.
insert into public.profiles (id, email, is_admin)
values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.test', false),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.test',   false)
on conflict (id) do nothing;

insert into public.quiz_results
  (user_id, quiz_title, score, total_questions, percentage, duration_seconds, language)
values
  ('11111111-1111-1111-1111-111111111111', 'alice-quiz', 5, 10, 50.00, 60, 'en'),
  ('22222222-2222-2222-2222-222222222222', 'bob-quiz',   7, 10, 70.00, 60, 'en');

-- ─── Anonymous access ────────────────────────────────────────────────────────

set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select is(
  (select count(*) from public.profiles)::bigint,
  0::bigint,
  'anon must not be able to read ANY profile row (regression guard for the public SELECT policy)'
);

select is(
  (select count(*) from public.quiz_results)::bigint,
  0::bigint,
  'anon must not be able to read quiz results'
);

select throws_ok(
  $$ insert into public.profiles (id, email, is_admin)
     values ('33333333-3333-3333-3333-333333333333', 'mallory@example.test', false) $$,
  '42501',
  null,
  'anon must not be able to insert a profile'
);

-- ─── Authenticated as Alice ──────────────────────────────────────────────────

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*) from public.profiles)::bigint,
  1::bigint,
  'alice sees exactly one profile row — her own, never bob''s'
);

select is(
  (select count(*) from public.quiz_results)::bigint,
  1::bigint,
  'alice sees only her own quiz results'
);

-- Privilege escalation must stay blocked (guards 20240104000000_enforce_mfa_rls).
select throws_ok(
  $$ update public.profiles set is_admin = true
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'a normal user must not be able to make themselves an admin'
);

select * from finish();
rollback;
