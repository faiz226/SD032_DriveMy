-- Two graded mock questions carried the wrong answer key, so the textbook-correct answer scored as wrong
-- (deployment audit F01, F02). Keys verified against KPP Kelas D Automatik (Edisi Ketiga 2021), PDF p.249
-- (pull-and-push through bends) and p.78 (alcohol impairs anticipation).
-- The correct_index = 0 guard makes this safe to run twice and leaves a key someone already corrected alone.
UPDATE public.kpp_questions SET correct_index = 1
  WHERE id = '92bda1e2-47b5-49ac-a6d2-09362de676fe' AND correct_index = 0;
UPDATE public.kpp_questions SET correct_index = 3
  WHERE id = '11739bb6-3181-421d-a79d-b2887d6c7b95' AND correct_index = 0;

-- Regrade saved attempts on the two sets: the BEFORE INSERT OR UPDATE trigger recompute_exam_score recomputes
-- score, percentage and passed from the corrected keys.
UPDATE public.mock_test_results SET answers = answers
  WHERE set_id IN ('mock-da-combined-1', 'mock-da-combined-2');
