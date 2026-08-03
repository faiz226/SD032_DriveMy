-- =============================================================================
-- Append-only audit log (PDPA 2010 accountability; GDPR Art. 30).
--
-- Nothing recorded who did what. After an incident there was no way to answer
-- "who changed this, and when" — and privilege changes on public.profiles, the
-- single most security-relevant mutation in the schema, left no trace at all.
--
-- Scope is deliberately narrow: security-relevant events only. Logging every
-- quiz answer would create a second copy of the personal data this audit is
-- meant to protect, which is the opposite of data minimisation.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  -- Intentionally NOT a foreign key to auth.users: the log must survive the
  -- account it describes, or "user deleted their account" erases its own
  -- evidence. Deliberate exception to the ON DELETE CASCADE used elsewhere.
  actor_id    uuid,
  action      text        NOT NULL,
  table_name  text        NOT NULL,
  row_id      text,
  old_data    jsonb,
  new_data    jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_occurred
  ON public.audit_log (occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor
  ON public.audit_log (actor_id, occurred_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- No policies are defined, so with RLS enabled the table is unreadable and
-- unwritable through PostgREST by anon and authenticated alike. Only the
-- service role (which bypasses RLS) can read it. The trigger below writes to
-- it as SECURITY DEFINER, so inserts still work for ordinary users without
-- granting them any direct access.
REVOKE ALL ON public.audit_log FROM anon, authenticated;

-- ─── Append-only enforcement ────────────────────────────────────────────────
--
-- An audit log that can be edited is not evidence. Block UPDATE and DELETE for
-- everyone including the table owner, so tampering requires a schema change
-- rather than a stray statement.

CREATE OR REPLACE FUNCTION public.audit_log_is_append_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only; % is not permitted', TG_OP
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS tr_audit_log_no_update ON public.audit_log;
CREATE TRIGGER tr_audit_log_no_update
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_is_append_only();

-- ─── Capture privilege-relevant changes to profiles ─────────────────────────

CREATE OR REPLACE FUNCTION public.audit_profiles_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only record changes that matter for security. A user correcting their own
  -- email is not an audit event; a change of admin status very much is.
  IF TG_OP = 'UPDATE'
     AND OLD.is_admin IS NOT DISTINCT FROM NEW.is_admin THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_log (actor_id, action, table_name, row_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    'profiles',
    coalesce(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP = 'INSERT' THEN NULL
         ELSE jsonb_build_object('is_admin', OLD.is_admin, 'email', OLD.email) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL
         ELSE jsonb_build_object('is_admin', NEW.is_admin, 'email', NEW.email) END
  );

  RETURN coalesce(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_audit_profiles ON public.profiles;
CREATE TRIGGER tr_audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_profiles_change();

COMMENT ON TABLE public.audit_log IS
  'Append-only security audit trail (PDPA 2010 accountability). '
  'Readable only via the service role. UPDATE/DELETE blocked by trigger. '
  'Retention is intentionally longer than the result tables — see '
  '20260804000200_data_retention.sql.';
