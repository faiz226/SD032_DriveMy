-- =============================================================================
-- Post-migration verification.
--
-- Run after `supabase db push`, two ways:
--
--   1. Paste into the Supabase Dashboard -> SQL Editor and run. Each row's
--      `result` column reads PASS or FAIL.
--
--   2. From the CLI, non-interactively:
--        supabase db query --file scripts/verify-security-fixes.sql --linked
--
-- Written as ONE query (UNION ALL) rather than 12 separate SELECTs so that
-- method 2 actually shows everything. `supabase db query --file` only returns
-- the result of the LAST statement in a multi-statement file — the original
-- version of this script (12 separate SELECTs, narrated with psql \echo
-- commands) silently showed just one check when run this way, and \echo
-- itself is a psql-only meta-command that errors outright over the CLI's
-- non-psql connection. Confirmed the hard way on 2026-08-04: the incident log
-- in docs/DISASTER_RECOVERY.md §8 has the story.
--
-- This checks the SQL migrations. It does NOT check function-level EXECUTE
-- grants inherited via Supabase's default privileges, which is a real,
-- independent gap category — Postgres grants EXECUTE to PUBLIC by default,
-- and Supabase's project template ALSO grants it to `anon`/`authenticated`
-- explicitly, separately from PUBLIC. Revoking one does not revoke the other
-- (see 20260804000500 vs 20260804000600 — the first attempt only caught
-- PUBLIC). For that class of issue, run Supabase's own linter as well:
--
--   supabase db advisors --linked --type security --level warn
--
-- Do not treat "no output" from that command as absence of findings — check
-- the actual JSON `results` array; an empty array is the true all-clear.
-- =============================================================================

SELECT '01. profiles has no permissive public SELECT' AS check, CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL: ' || COUNT(*)::text || ' permissive policy(ies)' END AS result
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT' AND (qual IS NULL OR qual = 'true')

UNION ALL
SELECT '02. profiles SELECT scoped to caller', CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL: expected 1 own-row policy, found ' || COUNT(*)::text END
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT' AND qual ILIKE '%auth.uid()%'

UNION ALL
SELECT '03. kpp-images has no authenticated write policy', CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL: ' || COUNT(*)::text || ' write policy(ies) present' END
FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname IN ('kpp_images_authenticated_insert', 'kpp_images_authenticated_update')

UNION ALL
SELECT '04a. delete_user() exists', CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL: delete_user() missing' END
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'delete_user'

UNION ALL
SELECT '04b. authenticated can execute delete_user()', CASE WHEN has_function_privilege('authenticated', 'public.delete_user()', 'EXECUTE') THEN 'PASS' ELSE 'FAIL' END

UNION ALL
SELECT '05. every SECURITY DEFINER function pins search_path', CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL: unpinned: ' || string_agg(p.proname, ', ') END
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef
  AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) cfg WHERE cfg LIKE 'search_path=%')

UNION ALL
SELECT '06. is_admin is not client-writable', CASE WHEN has_column_privilege('authenticated', 'public.profiles', 'is_admin', 'UPDATE') THEN 'FAIL: still writable' ELSE 'PASS' END

UNION ALL
SELECT '07. RLS enabled on every user-data table', CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL: disabled on ' || string_agg(relname, ', ') END
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  AND c.relname IN ('profiles','kpp_questions','quiz_results','mock_test_results','simulation_results','theory_progress','colorblind_results')

UNION ALL
SELECT '08a. purge_expired_results() exists', CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL: missing' END
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'purge_expired_results'

UNION ALL
SELECT '08b. purge is service-role only', CASE WHEN has_function_privilege('authenticated', 'public.purge_expired_results()', 'EXECUTE') THEN 'FAIL: authenticated can trigger it' ELSE 'PASS' END

UNION ALL
SELECT '09. audit_log exists and is append-only', CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_audit_log_no_update') THEN 'PASS' ELSE 'FAIL: no-update trigger missing' END

UNION ALL
SELECT '10. jsonb size-limit triggers installed (expect 4)', CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL: found ' || COUNT(*)::text || ' of 4 expected' END
FROM pg_trigger WHERE tgname LIKE 'tr_%_payload_limit'

UNION ALL
SELECT '11. trigger-only functions cannot be called directly by anon', CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL: anon can execute: ' || string_agg(proname, ', ') END
FROM (
  SELECT unnest(ARRAY['handle_new_user','recompute_exam_score','audit_profiles_change']) AS proname
) t
WHERE has_function_privilege('anon', 'public.' || proname || '()', 'EXECUTE')

UNION ALL
SELECT '12. trigger-only functions cannot be called directly by authenticated', CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL: authenticated can execute: ' || string_agg(proname, ', ') END
FROM (
  SELECT unnest(ARRAY['handle_new_user','recompute_exam_score','audit_profiles_change']) AS proname
) t
WHERE has_function_privilege('authenticated', 'public.' || proname || '()', 'EXECUTE')

ORDER BY 1;
