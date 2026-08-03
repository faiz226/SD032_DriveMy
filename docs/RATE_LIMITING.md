# Rate limiting — current state and the plan

> Status: **not implemented.** This document exists because the repo previously
> contained something that looked like rate limiting but was not.

## What was removed, and why

`supabase/functions/rate-limit/index.ts` was deleted. It was an Upstash-backed
counter keyed on `x-forwarded-for`, and it had three independent problems:

1. **Nothing called it.** `grep -rn "functions.invoke" src/` returned no hits.
   It limited nothing, but its presence implied the app was protected.
2. **The key was spoofable.** It read `req.headers.get('x-forwarded-for')` raw,
   without taking the leftmost trusted hop, so a client could supply any value
   and get an unlimited supply of fresh buckets.
3. **The architecture could not work.** It was a *separate* endpoint. The
   browser talks to PostgREST directly with the publishable key — a client that
   wants to skip the limiter simply does not call it.

Recoverable if needed: `git show HEAD:supabase/functions/rate-limit/index.ts`.

## Why this is not trivially replaceable

There is no application server. The request path is:

    browser ──► Supabase PostgREST (publishable key + RLS)

Nothing sits in between, so there is nowhere in the current architecture to
enforce a limit. Any real fix has to add a layer.

## What to actually do

### 1. Cloudflare in front (highest leverage)

Put the domain behind Cloudflare and configure rate-based rules on
`/rest/v1/*` and `/auth/v1/*`. This is the single highest-value infrastructure
change available: it covers rate limiting, DDoS protection, WAF and bot
management at once, and it needs no application changes.

Requires a production domain — see the deployment section of `TechStack.md`.

### 2. Supabase's own auth rate limits

Already available, and free. Confirm on the **hosted** project under
Authentication → Rate Limits. Note `supabase/config.toml` is local-dev config
and does **not** push these values.

Relevant keys: `sign_in_sign_ups`, `token_refresh`, `token_verifications`.

### 3. Per-user write throttles in the database

For expensive or abusable writes, a `BEFORE INSERT` trigger can reject rows
when the same `user_id` has inserted more than N in the last interval. This
works with no extra infrastructure and cannot be bypassed by the client,
because it runs inside the same transaction as the insert.

Sketch:

```sql
create or replace function public.throttle_inserts()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_recent integer;
begin
  execute format(
    'select count(*) from public.%I where user_id = $1 and completed_at > now() - interval ''1 minute''',
    tg_table_name
  ) into v_recent using new.user_id;

  if v_recent >= 20 then
    raise exception 'Too many submissions, please slow down'
      using errcode = '53400';
  end if;

  return new;
end $$;
```

Note the error code: `53400` is outside the 22/23/42 families that
`src/services/offlineQueue.ts` treats as permanent, so a throttled write is
retried rather than discarded.

## Related findings

`TechStack.md` §3.9 (rate limiting), §3.2.1 (the dead edge function), §3.8.7
(no WAF/DDoS protection), §3.6.1 (uncapped spend on a Free-tier project, where
quota exhaustion pauses the project outright).
