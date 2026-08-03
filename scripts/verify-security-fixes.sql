-- =============================================================================
-- Post-migration verification.
--
-- Run in the Supabase SQL Editor AFTER `supabase db push` succeeds, to confirm
-- the P0/P1 security migrations actually took effect on the hosted project.
-- Every check prints PASS or FAIL — do not assume a green `db push` means the
-- policies are what you think they are.
--
--   supabase/migrations/20260803000100_lock_down_profiles_and_storage_rls.sql
--   supabase/migrations/20260803000200_add_delete_user_and_harden_definer_functions.sql
--   supabase/migrations/20260804000100_fix_unsatisfiable_mfa_policy.sql
--   supabase/migrations/20260804000200_data_retention.sql
-- =============================================================================

\echo '=== 1. profiles must NOT be readable by anon or with a bare USING(true) ==='
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS — no permissive public SELECT policy'
       ELSE 'FAIL — ' || COUNT(*)::text || ' policy(ies) still allow unrestricted SELECT'
  END AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'profiles'
  AND cmd        = 'SELECT'
  AND (qual IS NULL OR qual = 'true');

\echo ''
\echo '=== 2. profiles SELECT must be scoped to the caller ==='
SELECT
  CASE WHEN COUNT(*) = 1 THEN 'PASS — profiles_select_own present'
       ELSE 'FAIL — expected exactly one own-row SELECT policy, found ' || COUNT(*)::text
  END AS result
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
  AND cmd = 'SELECT' AND qual ILIKE '%auth.uid()%';

\echo ''
\echo '=== 3. kpp-images must have NO authenticated write policies ==='
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS — learners cannot overwrite exam imagery'
       ELSE 'FAIL — ' || COUNT(*)::text || ' write policy(ies) still present'
  END AS result
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname IN ('kpp_images_authenticated_insert', 'kpp_images_authenticated_update');

\echo ''
\echo '=== 4. delete_user() must exist and be executable by authenticated ==='
SELECT
  CASE WHEN COUNT(*) = 1 THEN 'PASS — delete_user() defined'
       ELSE 'FAIL — delete_user() missing; account deletion will error'
  END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'delete_user';

SELECT
  CASE WHEN has_function_privilege('authenticated', 'public.delete_user()', 'EXECUTE')
       THEN 'PASS — authenticated may execute delete_user()'
       ELSE 'FAIL — authenticated cannot execute delete_user()'
  END AS result;

\echo ''
\echo '=== 5. every SECURITY DEFINER function must pin search_path ==='
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS — all SECURITY DEFINER functions pin search_path'
       ELSE 'FAIL — unpinned: ' || string_agg(p.proname, ', ')
  END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef                                     -- SECURITY DEFINER
  AND NOT EXISTS (
    SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) cfg
    WHERE cfg LIKE 'search_path=%'
  );

\echo ''
\echo '=== 6. is_admin must not be updatable by authenticated ==='
SELECT
  CASE WHEN has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'UPDATE')
       THEN 'FAIL — authenticated can still write is_admin (privilege escalation)'
       ELSE 'PASS — is_admin is not client-writable'
  END AS result;

\echo ''
\echo '=== 7. RLS must be enabled on every user-data table ==='
SELECT
  CASE WHEN COUNT(*) = 0 THEN 'PASS — RLS enabled everywhere'
       ELSE 'FAIL — RLS disabled on: ' || string_agg(relname, ', ')
  END AS result
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  AND c.relname IN ('profiles','kpp_questions','quiz_results','mock_test_results',
                    'simulation_results','theory_progress','colorblind_results');

\echo ''
\echo '=== 8. retention purge function must exist and be admin-only ==='
SELECT
  CASE WHEN COUNT(*) = 1 THEN 'PASS — purge_expired_results() defined'
       ELSE 'FAIL — purge_expired_results() missing'
  END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'purge_expired_results';

SELECT
  CASE WHEN has_function_privilege('authenticated', 'public.purge_expired_results()', 'EXECUTE')
       THEN 'FAIL — authenticated can trigger a mass delete'
       ELSE 'PASS — purge is service-role only'
  END AS result;
