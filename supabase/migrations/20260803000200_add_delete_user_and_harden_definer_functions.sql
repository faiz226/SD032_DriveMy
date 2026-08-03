-- =============================================================================
-- P0 — implement the missing delete_user() RPC, and harden the existing
-- SECURITY DEFINER functions.
--
-- Two client call sites (SettingsPage.tsx:188 and DataExportDelete.tsx:61)
-- already invoke supabase.rpc('delete_user') — but the function was never
-- written. Both call sites deleted every row of the user's data FIRST and then
-- hit the missing-function error, so the user lost all their data, kept their
-- account, and was shown a generic "Failed to delete account" toast.
--
-- Defining the function makes the right-to-erasure path work (PDPA 2010
-- §§30-34 / GDPR Art. 17). The client changes in the same commit reorder the
-- operation so the account row goes first and the six dependent tables are
-- removed by the existing ON DELETE CASCADE.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- ─── 1. delete_user() ────────────────────────────────────────────────────────

-- Supabase does not allow a client to delete its own auth.users row through the
-- REST API, so this runs SECURITY DEFINER. It is deliberately narrow: it takes
-- no arguments and can only ever delete the caller's own account.
--
-- search_path is pinned to '' and every object below is schema-qualified, so a
-- caller cannot shadow an unqualified name to hijack execution as the owner.

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  -- All six user-data tables reference auth.users(id) ON DELETE CASCADE
  -- (20240101000000_initial_schema.sql), as does public.profiles
  -- (20240102000000_create_profiles.sql). Removing the auth row removes
  -- everything else atomically, inside this statement's transaction.
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

-- Only signed-in users may call it; anon must not be able to probe it.
REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- ─── 2. Pin search_path on the pre-existing SECURITY DEFINER functions ───────

-- Both of these were created without SET search_path, which is the standard
-- PostgreSQL privilege-escalation vector: an unqualified name inside a
-- SECURITY DEFINER body resolves against the CALLER's search_path, so anyone
-- able to create objects on that path can shadow a function or operator and
-- run code as the function owner. Supabase's own database linter flags this as
-- `function_search_path_mutable` at error severity.
--
-- ALTER is used rather than CREATE OR REPLACE so the function bodies stay
-- exactly as originally reviewed.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'recompute_exam_score'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.recompute_exam_score() SET search_path = public, pg_temp';
  END IF;
END $$;
