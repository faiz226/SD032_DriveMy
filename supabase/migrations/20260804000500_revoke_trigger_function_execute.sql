-- =============================================================================
-- Revoke direct-call access to trigger-only functions.
--
-- Postgres grants EXECUTE on every new function to PUBLIC by default unless you
-- revoke it. Three SECURITY DEFINER functions in this schema are meant to run
-- only as triggers — handle_new_user, recompute_exam_score, audit_profiles_change
-- — and none of the migrations that created them revoked the default grant. As
-- a result Supabase's own security advisor (`supabase db advisors`) flags all
-- three as callable directly via /rest/v1/rpc/<name> by both anon and
-- authenticated.
--
-- Exploitability is low: each is declared RETURNS trigger, and Postgres refuses
-- to invoke a trigger-type function outside of an actual trigger firing —
-- calling the RPC endpoint directly errors before the function body runs. But
-- an RPC endpoint that always errors is still an unnecessary exposed surface,
-- and matching the advisor's recommendation is cheap and exactly right:
-- trigger functions should never be directly callable.
--
-- This does NOT affect the triggers themselves. Firing a trigger during an
-- INSERT/UPDATE/DELETE is governed by table-level grants and RLS, not by the
-- invoking role's EXECUTE privilege on the trigger function — Postgres invokes
-- trigger functions as the table owner regardless. Revoking EXECUTE only
-- blocks calling these AS ORDINARY FUNCTIONS, which nothing legitimate does.
--
-- delete_user() and purge_expired_results() are unaffected: the advisor
-- correctly did not flag purge_expired_results (already service-role only,
-- since its migration explicitly revoked from anon/authenticated), and
-- delete_user() is INTENTIONALLY callable by authenticated — that is its whole
-- purpose (see 20260803000200), and it self-scopes to auth.uid() internally.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'recompute_exam_score'
  ) THEN
    REVOKE ALL ON FUNCTION public.recompute_exam_score() FROM PUBLIC;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'audit_profiles_change'
  ) THEN
    REVOKE ALL ON FUNCTION public.audit_profiles_change() FROM PUBLIC;
  END IF;
END $$;
