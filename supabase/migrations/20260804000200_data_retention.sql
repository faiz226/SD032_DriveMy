-- =============================================================================
-- Data retention (PDPA 2010 §10 — Retention Principle; GDPR Art. 5(1)(e)).
--
-- Six tables accumulated personal data indefinitely with no purge path. The
-- most sensitive is colorblind_results: colour-vision deficiency is
-- health-adjacent data about an identified individual, and it was being kept
-- forever with no stated purpose limit.
--
-- This adds a purge function and the retention windows. It does NOT schedule
-- itself — see the note at the bottom.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- Retention windows, in days. Chosen so a learner keeps a useful revision
-- history across a typical JPJ preparation cycle, without keeping exam
-- performance forever.
--
--   quiz / mock / simulation results : 730 days (2 years)
--   colorblind results              : 365 days (1 year — most sensitive,
--                                     and a screening result is a snapshot,
--                                     not a longitudinal record)
--   theory_progress                 : retained while the account exists; it is
--                                     completion state, not performance data,
--                                     and is removed by ON DELETE CASCADE.

CREATE OR REPLACE FUNCTION public.purge_expired_results()
RETURNS TABLE (table_name text, rows_deleted bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted bigint;
BEGIN
  DELETE FROM public.quiz_results
    WHERE completed_at < (now() - interval '730 days');
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  table_name := 'quiz_results'; rows_deleted := v_deleted; RETURN NEXT;

  DELETE FROM public.mock_test_results
    WHERE completed_at < (now() - interval '730 days');
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  table_name := 'mock_test_results'; rows_deleted := v_deleted; RETURN NEXT;

  DELETE FROM public.simulation_results
    WHERE completed_at < (now() - interval '730 days');
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  table_name := 'simulation_results'; rows_deleted := v_deleted; RETURN NEXT;

  -- Shorter window: health-adjacent screening data.
  DELETE FROM public.colorblind_results
    WHERE completed_at < (now() - interval '365 days');
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  table_name := 'colorblind_results'; rows_deleted := v_deleted; RETURN NEXT;

  RETURN;
END;
$$;

-- Purging is an administrative operation. Clients must never be able to
-- trigger a mass delete.
REVOKE ALL ON FUNCTION public.purge_expired_results() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_expired_results() FROM anon;
REVOKE ALL ON FUNCTION public.purge_expired_results() FROM authenticated;

COMMENT ON FUNCTION public.purge_expired_results() IS
  'Deletes result rows past their retention window (PDPA 2010 s.10). '
  'Service-role only. Returns per-table deletion counts. '
  'Run on a schedule — see supabase/migrations/20260804000200_data_retention.sql.';

-- ─── Scheduling — REQUIRES A MANUAL STEP ─────────────────────────────────────
--
-- pg_cron is NOT enabled on the Supabase Free tier, so this migration cannot
-- schedule itself. Until the project moves to Pro, run the purge manually (or
-- from CI on a monthly schedule) with the service-role key:
--
--     select * from public.purge_expired_results();
--
-- On Pro, enable pg_cron (Dashboard → Database → Extensions) and schedule it:
--
--     select cron.schedule(
--       'purge-expired-results',
--       '0 3 1 * *',                      -- 03:00 UTC on the 1st of each month
--       $$select public.purge_expired_results()$$
--     );
--
-- Whatever the retention windows end up being, they must match what the
-- privacy policy tells users (src/pages/PrivacyPolicyPage.tsx).
