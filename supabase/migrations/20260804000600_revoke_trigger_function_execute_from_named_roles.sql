-- =============================================================================
-- Follow-up to 20260804000500, which was incomplete.
--
-- That migration revoked EXECUTE from PUBLIC on the three trigger-only
-- functions, but Supabase's project template grants EXECUTE to `anon` and
-- `authenticated` EXPLICITLY at function-creation time (via ALTER DEFAULT
-- PRIVILEGES), separately from whatever PUBLIC holds. Revoking from PUBLIC
-- does not touch those explicit grants — confirmed by has_function_privilege()
-- returning true for both roles even after 20260804000500 was applied, and by
-- `supabase db advisors` continuing to flag all three functions unchanged.
--
-- This finishes the job by revoking from the named roles directly. Written as
-- a new migration rather than editing 20260804000500, because Supabase's
-- migration tracking keys off the version timestamp, not file content — an
-- edit to an already-applied migration would not be picked up by `db push`
-- and would leave the local file and the remote history silently disagreeing.
--
-- Idempotent: safe to run more than once. Harmless on a fresh project too,
-- where it simply confirms what 20260804000500 already established.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'recompute_exam_score'
  ) THEN
    REVOKE ALL ON FUNCTION public.recompute_exam_score() FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'audit_profiles_change'
  ) THEN
    REVOKE ALL ON FUNCTION public.audit_profiles_change() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
