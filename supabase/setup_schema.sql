-- =============================================================================
-- DriveMy — Supabase Schema
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. kpp_questions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.kpp_questions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category        text        NOT NULL,
  set_id          text        NOT NULL,                  -- 'quiz-pool', 'mock-1', 'mock-2', 'mock-3'
  order_index     integer     NOT NULL,
  question_en     text        NOT NULL,
  question_ms     text        NOT NULL,
  options_en      jsonb       NOT NULL,
  options_ms      jsonb       NOT NULL,
  correct_index   integer     NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation_en  text,
  explanation_ms  text,
  image_url       text,
  source_url      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  -- Required for idempotent upserts in the seed script
  CONSTRAINT kpp_questions_set_order_unique UNIQUE (set_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_kpp_questions_set_order
  ON public.kpp_questions (set_id, order_index);

CREATE INDEX IF NOT EXISTS idx_kpp_questions_category
  ON public.kpp_questions (category);

ALTER TABLE public.kpp_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpp_questions_select_authenticated"
  ON public.kpp_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- 2. quiz_results
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_title        text        NOT NULL,
  score             integer     NOT NULL CHECK (score >= 0),
  total_questions   integer     NOT NULL CHECK (total_questions > 0),
  percentage        numeric(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  duration_seconds  integer     NOT NULL CHECK (duration_seconds >= 0),
  language          text        NOT NULL CHECK (language IN ('en', 'ms')),
  question_ids      uuid[]      NOT NULL DEFAULT '{}',
  answers           jsonb       NOT NULL DEFAULT '{}',
  completed_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_completed
  ON public.quiz_results (user_id, completed_at DESC);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_results_all_own"
  ON public.quiz_results
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. mock_test_results
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.mock_test_results (
  id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id            text        NOT NULL,               -- 'mock-1', 'mock-2', 'mock-3'
  score             integer     NOT NULL CHECK (score >= 0),
  total_questions   integer     NOT NULL CHECK (total_questions > 0),
  percentage        numeric(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  passed            boolean     NOT NULL DEFAULT false,
  duration_seconds  integer     NOT NULL CHECK (duration_seconds >= 0),
  answers           jsonb       NOT NULL DEFAULT '{}',
  language          text        NOT NULL CHECK (language IN ('en', 'ms')),
  completed_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mock_test_results_user_completed
  ON public.mock_test_results (user_id, completed_at DESC);

ALTER TABLE public.mock_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mock_test_results_all_own"
  ON public.mock_test_results
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. simulation_results
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.simulation_results (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  maneuver_id         text        NOT NULL,
  mode                text        NOT NULL CHECK (mode IN ('practice', 'assessment')),
  score               integer     NOT NULL CHECK (score >= 0),
  errors              integer     NOT NULL DEFAULT 0 CHECK (errors >= 0),
  passed              boolean     NOT NULL DEFAULT false,
  completion_seconds  integer     CHECK (completion_seconds >= 0),
  stall_count         integer     NOT NULL DEFAULT 0 CHECK (stall_count >= 0),
  rollback_cm         numeric(8,2) NOT NULL DEFAULT 0,
  language            text        NOT NULL CHECK (language IN ('en', 'ms')),
  attempt_data        jsonb       NOT NULL DEFAULT '{}',
  completed_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_simulation_results_user_completed
  ON public.simulation_results (user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_simulation_results_user_maneuver
  ON public.simulation_results (user_id, maneuver_id, completed_at DESC);

ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulation_results_all_own"
  ON public.simulation_results
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5. theory_progress
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.theory_progress (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id     text        NOT NULL,
  completed     boolean     NOT NULL DEFAULT false,
  completed_at  timestamptz,
  CONSTRAINT theory_progress_user_module_unique UNIQUE (user_id, module_id)
);

ALTER TABLE public.theory_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theory_progress_all_own"
  ON public.theory_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 6. colorblind_results
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.colorblind_results (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score         integer     NOT NULL CHECK (score >= 0),
  total_plates  integer     NOT NULL CHECK (total_plates > 0),
  percentage    numeric(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  answers       jsonb       NOT NULL DEFAULT '{}',
  completed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_colorblind_results_user_completed
  ON public.colorblind_results (user_id, completed_at DESC);

ALTER TABLE public.colorblind_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colorblind_results_all_own"
  ON public.colorblind_results
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Grants
-- =============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.kpp_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_test_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulation_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.theory_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colorblind_results TO authenticated;