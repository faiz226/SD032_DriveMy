-- =============================================================================
-- Constrain the free-form jsonb payloads.
--
-- `answers` and `attempt_data` accepted arbitrary JSON of arbitrary size. Zod
-- validates on the client, which is UX rather than security — anyone holding
-- the publishable key can POST directly to PostgREST. A learner could store
-- megabytes of junk in their own rows: storage-cost abuse on a Free-tier
-- project, where exhausting quota pauses the whole project (a full outage).
--
-- Two layers, because CHECK constraints may only call IMMUTABLE functions:
--   * CHECK      — shape (must be a JSON object, not an array/string/number)
--   * trigger    — size (pg_column_size is STABLE, so it cannot live in a CHECK)
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- ─── Shape ───────────────────────────────────────────────────────────────────
-- jsonb_typeof() is IMMUTABLE, so it is valid in a CHECK constraint.

DO $$
DECLARE
  t text;
  c text;
BEGIN
  FOREACH t IN ARRAY ARRAY['quiz_results', 'mock_test_results', 'colorblind_results'] LOOP
    c := t || '_answers_is_object';
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = c) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (jsonb_typeof(answers) = ''object'')',
        t, c
      );
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'simulation_results_attempt_data_is_object') THEN
    ALTER TABLE public.simulation_results
      ADD CONSTRAINT simulation_results_attempt_data_is_object
      CHECK (jsonb_typeof(attempt_data) = 'object');
  END IF;
END $$;

-- ─── Size ────────────────────────────────────────────────────────────────────
-- A 50-question mock stores 50 short key/value pairs — comfortably under 8 KB.
-- 64 KB leaves generous headroom for attempt_data (simulation telemetry) while
-- still ruling out payloads that only make sense as abuse.

CREATE OR REPLACE FUNCTION public.enforce_jsonb_payload_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_limit constant integer := 65536;   -- 64 KB
  v_size  integer;
  v_col   text := TG_ARGV[0];
  v_value jsonb;
BEGIN
  EXECUTE format('SELECT ($1).%I', v_col) INTO v_value USING NEW;
  v_size := pg_column_size(v_value);

  IF v_size > v_limit THEN
    RAISE EXCEPTION
      'Payload too large: %.% is % bytes, limit is % bytes',
      TG_TABLE_NAME, v_col, v_size, v_limit
      USING ERRCODE = '22001';   -- string_data_right_truncation
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_quiz_results_payload_limit ON public.quiz_results;
CREATE TRIGGER tr_quiz_results_payload_limit
  BEFORE INSERT OR UPDATE ON public.quiz_results
  FOR EACH ROW EXECUTE FUNCTION public.enforce_jsonb_payload_limit('answers');

DROP TRIGGER IF EXISTS tr_mock_results_payload_limit ON public.mock_test_results;
CREATE TRIGGER tr_mock_results_payload_limit
  BEFORE INSERT OR UPDATE ON public.mock_test_results
  FOR EACH ROW EXECUTE FUNCTION public.enforce_jsonb_payload_limit('answers');

DROP TRIGGER IF EXISTS tr_colorblind_results_payload_limit ON public.colorblind_results;
CREATE TRIGGER tr_colorblind_results_payload_limit
  BEFORE INSERT OR UPDATE ON public.colorblind_results
  FOR EACH ROW EXECUTE FUNCTION public.enforce_jsonb_payload_limit('answers');

DROP TRIGGER IF EXISTS tr_simulation_results_payload_limit ON public.simulation_results;
CREATE TRIGGER tr_simulation_results_payload_limit
  BEFORE INSERT OR UPDATE ON public.simulation_results
  FOR EACH ROW EXECUTE FUNCTION public.enforce_jsonb_payload_limit('attempt_data');

-- NOTE: the error code 22001 is deliberately in the 22xxx family, which
-- src/services/offlineQueue.ts classifies as PERMANENT — an oversized payload
-- is surfaced to the user rather than retried forever in the offline queue.
