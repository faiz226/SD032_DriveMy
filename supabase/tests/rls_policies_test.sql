begin;
select plan(2);

-- Test 1: Profiles table RLS (Anonymous users cannot insert)
select throws_like(
    $$ insert into public.profiles (id, email, is_admin) values ('00000000-0000-0000-0000-000000000000', 'test@test.com', false) $$,
    '%new row violates row-level security policy%',
    'Anonymous users should not be able to insert profiles'
);

-- Test 2: Profiles table RLS (Viewable by everyone)
select results_eq(
    $$ select count(*) from public.profiles $$,
    $$ values (0::bigint) $$,
    'Profiles should be viewable, returning 0 rows initially'
);

select * from finish();
rollback;
