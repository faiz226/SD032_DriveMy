-- get_mock_test_answer_key returns a column named "id", so the unqualified "id" in its ownership check was
-- ambiguous (42702) and every call failed: the mock answer review never loaded. Qualify the column.
-- Found by the cross-user pgTAP test (audit F27). Otherwise identical to 20260804000700.
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

  SELECT r.set_id INTO v_set_id
  FROM public.mock_test_results r
  WHERE r.id = p_test_result_id AND r.user_id = v_uid;

  IF v_set_id IS NULL THEN
    RAISE EXCEPTION 'Mock test result not found or access denied' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  SELECT q.id, q.correct_index, q.explanation_en, q.explanation_ms
  FROM public.kpp_questions q
  WHERE q.set_id = v_set_id
  ORDER BY q.order_index ASC;
END;
$$;
REVOKE ALL ON FUNCTION public.get_mock_test_answer_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mock_test_answer_key(uuid) TO authenticated;
