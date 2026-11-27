-- Audit findings F3 and F4.
-- F3: the answer key of a mock attempt covers only the questions that attempt answered, so a blank attempt shows
--     nothing and a finished one shows everything it covered.
-- F4: a learner cannot write rows without limit, and one picture is one path.
begin;
select plan(10);

insert into auth.users (id, email, aud, role)
values ('88888888-8888-4888-8888-888888888801', 'cap-alice@example.test', 'authenticated', 'authenticated');

-- Alice's three attempts at the same set, written by the owner of the tables.
create temporary table key_attempts as
select 'finished'::text as kind, jsonb_object_agg(q.id, q.correct_index) as answers
from public.kpp_questions q where q.set_id = 'mock-da-combined-1'
union all
select 'partial', jsonb_object_agg(q.id, q.correct_index)
from public.kpp_questions q where q.set_id = 'mock-da-combined-1' and q.order_index <= 3
union all
select 'blank', '{}'::jsonb;

insert into public.mock_test_results (id, user_id, set_id, score, total_questions, percentage, passed, duration_seconds, answers, language)
select case kind when 'finished' then '99999999-9999-4999-8999-999999999901'::uuid
                 when 'partial'  then '99999999-9999-4999-8999-999999999902'::uuid
                 else                 '99999999-9999-4999-8999-999999999903'::uuid end,
       '88888888-8888-4888-8888-888888888801', 'mock-da-combined-1', 0, 1, 0, false, 60, answers, 'en'
from key_attempts;

set local role authenticated;
set local request.jwt.claims to '{"sub":"88888888-8888-4888-8888-888888888801","role":"authenticated"}';

-- ─── F3 ──────────────────────────────────────────────────────────────────────
select is(
  (select count(*) from public.get_mock_test_answer_key('99999999-9999-4999-8999-999999999901'))::bigint,
  70::bigint, 'a finished attempt shows the key of every question in it'
);
select is(
  (select count(*) from public.get_mock_test_answer_key('99999999-9999-4999-8999-999999999902'))::bigint,
  3::bigint, 'an attempt that answered three questions shows the key of those three only'
);
select is(
  (select count(*) from public.get_mock_test_answer_key('99999999-9999-4999-8999-999999999903'))::bigint,
  0::bigint, 'a blank attempt shows no key at all (audit F3)'
);

-- ─── F4: results ─────────────────────────────────────────────────────────────
select lives_ok(
  $$ insert into public.colorblind_results (user_id, score, total_plates, percentage, answers)
     select '88888888-8888-4888-8888-888888888801', 20, 25, 80, '{}' from generate_series(1, 20) $$,
  'twenty colour results in a day are accepted'
);
select throws_ok(
  $$ insert into public.colorblind_results (user_id, score, total_plates, percentage, answers)
     values ('88888888-8888-4888-8888-888888888801', 20, 25, 80, '{}') $$,
  '54000', null, 'the twenty-first colour result in a day is refused (audit F4)'
);

-- ─── F4: theory progress ─────────────────────────────────────────────────────
reset role;
insert into public.theory_progress (user_id, module_id, completed)
select '88888888-8888-4888-8888-888888888801', 'cap-module-' || g, false from generate_series(1, 100) g;
set local role authenticated;
set local request.jwt.claims to '{"sub":"88888888-8888-4888-8888-888888888801","role":"authenticated"}';

select lives_ok(
  $$ insert into public.theory_progress (user_id, module_id, completed, completed_at)
     values ('88888888-8888-4888-8888-888888888801', 'cap-module-1', true, now())
     on conflict (user_id, module_id) do update set completed = excluded.completed, completed_at = excluded.completed_at $$,
  'saving a module that is already there still works at the limit'
);
select throws_ok(
  $$ insert into public.theory_progress (user_id, module_id, completed)
     values ('88888888-8888-4888-8888-888888888801', 'one-module-too-many', false) $$,
  '54000', null, 'a new module past the limit of 100 is refused (audit F4)'
);

select is(
  (select count(*) from pg_trigger
   where tgname in ('tr_quiz_results_row_cap', 'tr_mock_test_results_row_cap', 'tr_simulation_results_row_cap',
                    'tr_colorblind_results_row_cap', 'tr_theory_progress_row_cap') and not tgisinternal)::bigint,
  5::bigint, 'every table a learner can insert into has its row cap'
);

-- ─── F4: the profile picture is one path ─────────────────────────────────────
select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', '88888888-8888-4888-8888-888888888801/avatar.webp') $$,
  'a learner can write their one picture path'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('avatars', '88888888-8888-4888-8888-888888888801/another.webp') $$,
  '42501', null, 'a second file in the learner''s own folder is refused (audit F4)'
);

select * from finish();
rollback;
