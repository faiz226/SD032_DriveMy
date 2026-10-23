-- =============================================================================
-- Replace the unsatisfiable MFA requirement on public.profiles.
--
-- 20240104000000_enforce_mfa_rls.sql requires an admin to hold an aal2 JWT
-- claim in order to update their own profile row. Reaching aal2 requires an
-- enrolled MFA factor, and Supabase MFA is a PAID (Pro) feature — this project
-- is on the Free tier, and config.toml:297-299 has TOTP enrolment disabled.
--
-- The practical effect: no user can ever reach aal2, so the admin branch of
-- that policy can never be satisfied and admins are permanently locked out of
-- updating their own profile. A security control that cannot be satisfied is
-- not a control — it is an outage that looks like rigour in code review.
--
-- What actually matters in this policy is preventing privilege escalation.
-- That is preserved below, and hardened: is_admin is now protected by a
-- COLUMN-LEVEL privilege, so a client cannot modify it regardless of what any
-- RLS policy says.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── Defence in depth: make is_admin unwritable from the client ──────────────
--
-- Column-level privileges are checked independently of RLS, so even a future
-- policy mistake cannot re-open self-promotion to admin. Escalation now
-- requires the service-role key (server-side / SQL editor only).
--
-- The previous policy tried to express this in a WITH CHECK subquery against
-- public.profiles itself, which is both slower (an extra lookup per row) and
-- the classic setup for "infinite recursion detected in policy for relation".

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (email) ON public.profiles TO authenticated;

-- INSERT stays as hardened in 20240104000000: own row only, is_admin = false.
-- (No client code inserts profiles directly — handle_new_user() does it on
-- signup — but the policy remains as a backstop.)

-- ─── Restoring the MFA requirement later ─────────────────────────────────────
--
-- When this project moves to Supabase Pro AND [auth.mfa.totp] enroll_enabled
-- and verify_enabled are turned on for the HOSTED project (config.toml is
-- local-dev only and is not pushed by `supabase db push`), add an admin-only
-- aal2 gate back. Verify end to end first — enrol a factor, confirm the JWT
-- actually carries aal=aal2, and only then apply the policy.
