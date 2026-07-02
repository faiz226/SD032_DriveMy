-- Drop existing policies
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

-- 1. Secure Insert Policy:
-- Users can only insert their own profile, and is_admin must be false.
create policy "Users can insert their own profile."
  on public.profiles
  for insert
  with check (
    auth.uid() = id 
    and is_admin = false
  );

-- 2. Secure Update Policy:
-- - Normal users can update their own profile, but cannot elevate themselves to is_admin = true.
-- - Admins can update their own profile, but ONLY if they are authenticated with MFA (aal2).
create policy "Users can update own profile."
  on public.profiles
  for update
  using (
    auth.uid() = id
  )
  with check (
    auth.uid() = id
    and (
      -- Case A: Normal user updating their profile (must keep is_admin = false)
      (
        is_admin = false
        and (select is_admin from public.profiles where id = auth.uid()) = false
      )
      -- Case B: Admin user updating their profile (must be verified with MFA / aal2)
      or (
        (select is_admin from public.profiles where id = auth.uid()) = true
        and coalesce((select auth.jwt()->>'aal'), 'aal1') = 'aal2'
      )
    )
  );
