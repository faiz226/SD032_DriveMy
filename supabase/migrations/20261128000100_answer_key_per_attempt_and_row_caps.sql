-- Audit findings F3 and F4 (reports/deployment-audit/security).
--
-- F3. get_mock_test_answer_key returned the key and explanations of the WHOLE mock set to anyone holding any result
--     of their own for that set, including a blank one saved without answering anything. It now returns an entry only
--     for the questions that attempt answered. A learner who finished the test sees the full key for it (every
--     question answered); one who ran out of time sees the key for what they answered; a blank attempt sees nothing.
--
-- F4. Nothing limited how many rows one learner could write. Each table a learner can insert into now has a trigger
--     that refuses an insert past a limit with SQLSTATE 54000 (program_limit_exceeded). How the limits were chosen:
--       normal use                                   limit
--       quiz round of 15 questions, a few minutes    200 a day (about ten hours of rounds back to back), 5000 in all
--       mock test, 45 minutes each                    30 a day (more than a day can hold), 1000 in all
--       simulator attempt, restarts are quick         300 a day, 5000 in all
--       colour vision test, a handful ever             20 a day, 100 in all
--       theory progress, about a dozen modules       100 rows in all (an upsert of a module already there always works)
--     The "in all" limits sit far above what the 730 day (365 for colour) retention job leaves behind for one
--     learner. A profile picture can only be written at its one path, so a learner holds one picture, not many.

-- ─── F3 ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_mock_test_answer_key(p_test_result_id uuid)
RETURNS TABLE (
  id uuid,
  correct_index integer,
  explanation_en text,
  explanation_ms text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_set_id text;
  v_answers jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT r.set_id, r.answers INTO v_set_id, v_answers
  FROM public.mock_test_results r
  WHERE r.id = p_test_result_id AND r.user_id = v_uid;

  IF v_set_id IS NULL THEN
    RAISE EXCEPTION 'Mock test result not found or access denied' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  SELECT q.id, q.correct_index, q.explanation_en, q.explanation_ms
  FROM public.kpp_questions q
  WHERE q.set_id = v_set_id
    AND jsonb_exists(v_answers, q.id::text)
  ORDER BY q.order_index ASC;
END;
$$;
REVOKE ALL ON FUNCTION public.get_mock_test_answer_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mock_test_answer_key(uuid) TO authenticated;

-- ─── F4 ──────────────────────────────────────────────────────────────────────
-- TG_ARGV: rolling 24 hour limit (0 = none), limit in all, the timestamp column the daily count reads.
CREATE OR REPLACE FUNCTION public.enforce_row_cap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_day integer := TG_ARGV[0]::integer;
  v_total integer := TG_ARGV[1]::integer;
  v_time text := TG_ARGV[2];
  v_count bigint;
BEGIN
  -- Saving a module that is already there is an update, not a new row.
  -- Nested, because PL/pgSQL does not short-circuit AND: NEW.module_id must not be read on other tables.
  IF TG_TABLE_NAME = 'theory_progress' THEN
    IF EXISTS (
      SELECT 1 FROM public.theory_progress t WHERE t.user_id = NEW.user_id AND t.module_id = NEW.module_id
    ) THEN
      RETURN NEW;
    END IF;
  END IF;

  EXECUTE format('SELECT count(*) FROM %I.%I WHERE user_id = $1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
    INTO v_count USING NEW.user_id;
  IF v_count >= v_total THEN
    RAISE EXCEPTION 'Row limit reached for %', TG_TABLE_NAME USING ERRCODE = '54000', HINT = 'total';
  END IF;

  IF v_day > 0 THEN
    EXECUTE format('SELECT count(*) FROM %I.%I WHERE user_id = $1 AND %I > now() - interval ''1 day''', TG_TABLE_SCHEMA, TG_TABLE_NAME, v_time)
      INTO v_count USING NEW.user_id;
    IF v_count >= v_day THEN
      RAISE EXCEPTION 'Daily row limit reached for %', TG_TABLE_NAME USING ERRCODE = '54000', HINT = 'daily';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_row_cap() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_quiz_results_row_cap ON public.quiz_results;
CREATE TRIGGER tr_quiz_results_row_cap BEFORE INSERT ON public.quiz_results
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_cap('200', '5000', 'completed_at');

DROP TRIGGER IF EXISTS tr_mock_test_results_row_cap ON public.mock_test_results;
CREATE TRIGGER tr_mock_test_results_row_cap BEFORE INSERT ON public.mock_test_results
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_cap('30', '1000', 'completed_at');

DROP TRIGGER IF EXISTS tr_simulation_results_row_cap ON public.simulation_results;
CREATE TRIGGER tr_simulation_results_row_cap BEFORE INSERT ON public.simulation_results
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_cap('300', '5000', 'completed_at');

DROP TRIGGER IF EXISTS tr_colorblind_results_row_cap ON public.colorblind_results;
CREATE TRIGGER tr_colorblind_results_row_cap BEFORE INSERT ON public.colorblind_results
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_cap('20', '100', 'completed_at');

DROP TRIGGER IF EXISTS tr_theory_progress_row_cap ON public.theory_progress;
CREATE TRIGGER tr_theory_progress_row_cap BEFORE INSERT ON public.theory_progress
  FOR EACH ROW EXECUTE FUNCTION public.enforce_row_cap('0', '100', 'completed_at');

-- A learner's picture lives at one path, <user id>/avatar.webp, and nowhere else in the bucket.
drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar.webp'
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar.webp'
  );
