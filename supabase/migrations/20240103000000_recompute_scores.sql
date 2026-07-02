-- =============================================================================
-- Server-side score recomputation
-- Automatically validates and recalculates scores based on the submitted answers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recompute_exam_score()
RETURNS trigger AS $$
DECLARE
  v_score integer := 0;
  v_total integer;
  v_percentage numeric;
BEGIN
  -- Recompute score from answers JSONB
  -- answers is { "question-uuid": selected_index_number, ... }
  -- We join with kpp_questions to check correctness
  SELECT count(*) INTO v_score
  FROM jsonb_each_text(NEW.answers) AS a(q_id, sel_idx)
  JOIN public.kpp_questions q ON q.id = a.q_id::uuid
  WHERE q.correct_index = a.sel_idx::integer;

  v_total := NEW.total_questions;
  IF v_total <= 0 THEN
    v_total := 1; -- avoid division by zero
  END IF;

  v_percentage := round((v_score::numeric / v_total::numeric) * 100, 2);

  -- Override client-submitted values
  NEW.score := v_score;
  NEW.percentage := v_percentage;

  -- If it's the mock test table, also compute passed (>= 84% is passing for JPJ)
  IF TG_TABLE_NAME = 'mock_test_results' THEN
    NEW.passed := v_percentage >= 84.00;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for mock_test_results
DROP TRIGGER IF EXISTS tr_mock_test_recompute_score ON public.mock_test_results;
CREATE TRIGGER tr_mock_test_recompute_score
  BEFORE INSERT OR UPDATE ON public.mock_test_results
  FOR EACH ROW
  EXECUTE PROCEDURE public.recompute_exam_score();

-- Trigger for quiz_results
DROP TRIGGER IF EXISTS tr_quiz_recompute_score ON public.quiz_results;
CREATE TRIGGER tr_quiz_recompute_score
  BEFORE INSERT OR UPDATE ON public.quiz_results
  FOR EACH ROW
  EXECUTE PROCEDURE public.recompute_exam_score();
