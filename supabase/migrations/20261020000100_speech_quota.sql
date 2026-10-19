-- Narration budget: at most 30 generation attempts per authenticated user per UTC day.
create table if not exists public.speech_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  requests integer not null default 0 check (requests between 0 and 30),
  primary key (user_id, usage_day)
);
alter table public.speech_usage enable row level security;
revoke all on public.speech_usage from anon, authenticated;

create or replace function public.consume_speech_quota() returns boolean
language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
  if auth.uid() is null then return false; end if;
  insert into public.speech_usage as usage (user_id, usage_day, requests)
  values (auth.uid(), (now() at time zone 'UTC')::date, 1)
  on conflict (user_id, usage_day) do update
    set requests = usage.requests + 1 where usage.requests < 30
  returning true into allowed;
  return coalesce(allowed, false);
end;
$$;
revoke all on function public.consume_speech_quota() from public, anon;
grant execute on function public.consume_speech_quota() to authenticated;
