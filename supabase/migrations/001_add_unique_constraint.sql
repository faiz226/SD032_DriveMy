-- =============================================================================
-- Migration 001 — Add unique constraint to kpp_questions
-- Run this if you already created the table without the constraint.
-- Safe to run multiple times (uses IF NOT EXISTS pattern via DO block).
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kpp_questions_set_order_unique'
      AND conrelid = 'public.kpp_questions'::regclass
  ) THEN
    ALTER TABLE public.kpp_questions
      ADD CONSTRAINT kpp_questions_set_order_unique UNIQUE (set_id, order_index);
    RAISE NOTICE 'Constraint kpp_questions_set_order_unique added.';
  ELSE
    RAISE NOTICE 'Constraint kpp_questions_set_order_unique already exists — skipping.';
  END IF;
END $$;
