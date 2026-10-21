-- =============================================================================
-- W02 REMEDIATION: Make database grading and profile ownership authoritative.
--
-- Findings addressed:
-- 1. BUG-004: Score integrity — derive mock denominator from server set, validate
--    quiz question IDs and answers against declared selection, derive totals
--    server-side, reject foreign-set answers, malformed values and impossible
--    answer options; preserve partial exams without accepting fabricated passes.
--
-- 2. SEC-004: Profile email ownership — close unique-profile-email reservation attack.
--    Revoke direct client writes of profile email; sync verified email changes from
--    auth.users via trigger. Protect is_admin from client writes.
--
-- 3. SEC-003: Answer-key withholding boundary — restrict base-table kpp_questions
--    so correct_index and explanations cannot be read directly during mock exams.
--    Expose practice questions (quiz-pool) via secure view for immediate feedback,
--    and gate mock test review behind authenticated submitted-attempt RPC.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- ─── 1. SEC-004: Close Profile Email Reservation Attack ─────────────────────

-- Revoke direct client write privileges on public.profiles.
-- Profiles must only be created or modified by trusted server-side Auth triggers.
REVOKE UPDATE, INSERT ON public.profiles FROM PUBLIC, anon, authenticated;
-- Table revocation does not revoke the earlier column-level UPDATE(email).
REVOKE UPDATE (id, email, is_admin, created_at), INSERT (id, email, is_admin, created_at)
  ON public.profiles FROM PUBLIC, anon, authenticated;

-- Auth owns email; a profile is identified only by its immutable Auth UUID.
-- Removing the redundant uniqueness constraint permits non-destructive repair,
-- including swapped emails on linked accounts. Auth retains its own constraints.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
UPDATE public.profiles p SET email = u.email
FROM auth.users u WHERE p.id = u.id AND p.email IS DISTINCT FROM u.email;
GRANT SELECT ON public.profiles TO authenticated;

-- Drop legacy own-profile update policies since direct client update is prohibited
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

-- Ensure own-row select policy remains active
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Only trusted Auth events create profiles; existing admin flags are preserved.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- Trigger to sync verified email updates from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_user_email_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_user_email_updated();

-- Revoke EXECUTE from named client roles on trigger functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_user_email_updated() FROM PUBLIC, anon, authenticated;


-- ─── 2. SEC-003: Answer-Key Access Boundary & Withholding ───────────────────

-- Revoke blanket table SELECT on public.kpp_questions
REVOKE SELECT ON public.kpp_questions FROM PUBLIC, anon, authenticated;
REVOKE SELECT (correct_index, explanation_en, explanation_ms)
  ON public.kpp_questions FROM PUBLIC, anon, authenticated;

-- Grant SELECT only on safe columns (excludes correct_index, explanation_en, explanation_ms)
GRANT SELECT (
  id,
  category,
  set_id,
  order_index,
  question_en,
  question_ms,
  options_en,
  options_ms,
  image_url,
  source_url,
  created_at
) ON public.kpp_questions TO authenticated, anon;

-- Secure view for practice quiz questions (quiz-pool only):
-- Preserves intentional immediate practice feedback with answer key.
CREATE OR REPLACE VIEW public.kpp_practice_questions
WITH (security_invoker = false, security_barrier = true)
AS
  SELECT
    id,
    category,
    set_id,
    order_index,
    question_en,
    question_ms,
    options_en,
    options_ms,
    correct_index,
    explanation_en,
    explanation_ms,
    image_url,
    source_url,
    created_at
  FROM public.kpp_questions
  WHERE set_id = 'quiz-pool';

GRANT SELECT ON public.kpp_practice_questions TO authenticated, anon;

-- Gated RPC for mock test answer key: released ONLY after attempt submission
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
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- Verify caller owns the submitted mock test result
  SELECT set_id INTO v_set_id
  FROM public.mock_test_results
  WHERE id = p_test_result_id AND user_id = v_uid;

  IF v_set_id IS NULL THEN
    RAISE EXCEPTION 'Mock test result not found or access denied' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  SELECT
    q.id,
    q.correct_index,
    q.explanation_en,
    q.explanation_ms
  FROM public.kpp_questions q
  WHERE q.set_id = v_set_id
  ORDER BY q.order_index ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_mock_test_answer_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mock_test_answer_key(uuid) TO authenticated;


-- ─── 3. BUG-004: Authoritative Database Grading & Denominator Derivation ───

CREATE OR REPLACE FUNCTION public.recompute_exam_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_score integer := 0;
  v_total integer;
  v_q_id_text text;
  v_sel_idx_text text;
  v_q_uuid uuid;
  v_sel_idx integer;
  v_correct integer;
  v_set text;
  v_seen uuid[] := ARRAY[]::uuid[];
BEGIN
  IF NEW.answers IS NULL OR jsonb_typeof(NEW.answers) <> 'object' THEN
    RAISE EXCEPTION 'Answers must be a JSON object' USING ERRCODE = '22023';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify result owner' USING ERRCODE = '42501';
  END IF;

  IF TG_TABLE_NAME = 'mock_test_results' THEN
    IF NEW.set_id IS NULL OR NEW.set_id NOT IN ('mock-1', 'mock-2', 'mock-3') THEN
      RAISE EXCEPTION 'Invalid mock set_id' USING ERRCODE = '22023';
    END IF;
    SELECT count(*) INTO v_total FROM public.kpp_questions WHERE set_id = NEW.set_id;
    IF v_total = 0 THEN
      RAISE EXCEPTION 'Empty mock set' USING ERRCODE = '22023';
    END IF;
  ELSIF TG_TABLE_NAME = 'quiz_results' THEN
    v_total := cardinality(NEW.question_ids);
    IF v_total IS NULL OR v_total = 0 OR v_total <> (
      SELECT count(DISTINCT id) FROM unnest(NEW.question_ids) AS selection(id)
    ) THEN
      RAISE EXCEPTION 'Quiz selection must be nonempty and distinct' USING ERRCODE = '22023';
    END IF;
    IF v_total <> (
      SELECT count(*) FROM public.kpp_questions
      WHERE id = ANY(NEW.question_ids) AND set_id = 'quiz-pool'
    ) THEN
      RAISE EXCEPTION 'Quiz selection must belong to the practice pool' USING ERRCODE = '22023';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unsupported grading table' USING ERRCODE = '22023';
  END IF;

  FOR v_q_id_text, v_sel_idx_text IN SELECT key, value FROM jsonb_each_text(NEW.answers) LOOP
    BEGIN
      v_q_uuid := v_q_id_text::uuid;
      v_sel_idx := v_sel_idx_text::integer;
    EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RAISE EXCEPTION 'Malformed question UUID or answer index' USING ERRCODE = '22023';
    END;
    IF v_q_uuid = ANY(v_seen) THEN
      RAISE EXCEPTION 'Duplicate parsed question UUID' USING ERRCODE = '22023';
    END IF;
    v_seen := array_append(v_seen, v_q_uuid);
    IF v_sel_idx IS NULL OR v_sel_idx < 0 OR v_sel_idx > 3 THEN
      RAISE EXCEPTION 'Impossible answer option index' USING ERRCODE = '22023';
    END IF;
    SELECT correct_index, set_id INTO v_correct, v_set
    FROM public.kpp_questions WHERE id = v_q_uuid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unknown question ID' USING ERRCODE = '22023';
    END IF;
    IF TG_TABLE_NAME = 'mock_test_results' THEN
      IF v_set <> NEW.set_id THEN
        RAISE EXCEPTION 'Foreign-set answer' USING ERRCODE = '22023';
      END IF;
    ELSIF NOT (v_q_uuid = ANY(NEW.question_ids)) THEN
      RAISE EXCEPTION 'Undeclared quiz answer' USING ERRCODE = '22023';
    END IF;
    IF v_sel_idx = v_correct THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  NEW.total_questions := v_total;
  NEW.score := v_score;
  NEW.percentage := round(100 * v_score::numeric / v_total, 2);
  IF TG_TABLE_NAME = 'mock_test_results' THEN
    NEW.passed := NEW.percentage >= 84;
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure triggers are wired
DROP TRIGGER IF EXISTS tr_mock_test_recompute_score ON public.mock_test_results;
CREATE TRIGGER tr_mock_test_recompute_score
  BEFORE INSERT OR UPDATE ON public.mock_test_results
  FOR EACH ROW
  EXECUTE PROCEDURE public.recompute_exam_score();

DROP TRIGGER IF EXISTS tr_quiz_recompute_score ON public.quiz_results;
CREATE TRIGGER tr_quiz_recompute_score
  BEFORE INSERT OR UPDATE ON public.quiz_results
  FOR EACH ROW
  EXECUTE PROCEDURE public.recompute_exam_score();

REVOKE ALL ON FUNCTION public.recompute_exam_score() FROM PUBLIC, anon, authenticated;
