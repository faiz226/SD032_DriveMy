-- Another learner cannot see, change or delete Alice's results (mock, simulator, theory, colour tables),
-- and cannot fetch the answer key of her mock attempt (audit F27).
begin;
select plan(9);

insert into auth.users (id, email, aud, role)
values
  ('55555555-5555-4555-8555-555555555501', 'iso-alice@example.test', 'authenticated', 'authenticated'),
  ('55555555-5555-4555-8555-555555555502', 'iso-bob@example.test',   'authenticated', 'authenticated');

-- Alice's rows, written by the owner of the tables (RLS does not apply to it).
insert into public.mock_test_results
  (id, user_id, set_id, score, total_questions, percentage, passed, duration_seconds, answers, language)
values
  ('66666666-6666-4666-8666-666666666601', '55555555-5555-4555-8555-555555555501', 'mock-da-combined-1', 0, 70, 0, false, 60, '{}', 'en');
insert into public.simulation_results
  (user_id, maneuver_id, mode, score, errors, passed, completion_seconds, language)
values
  ('55555555-5555-4555-8555-555555555501', 'hill-start', 'practice', 50, 0, false, 90, 'en');
insert into public.theory_progress (user_id, module_id, completed, completed_at)
values ('55555555-5555-4555-8555-555555555501', 'theory-signs', true, now());
insert into public.colorblind_results (user_id, score, total_plates, percentage, answers)
values ('55555555-5555-4555-8555-555555555501', 20, 25, 80, '{}');

-- ─── Bob ─────────────────────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims to '{"sub":"55555555-5555-4555-8555-555555555502","role":"authenticated"}';

select is((select count(*) from public.mock_test_results)::bigint, 0::bigint, 'Bob cannot read Alice''s mock results');
select is((select count(*) from public.simulation_results)::bigint, 0::bigint, 'Bob cannot read Alice''s simulator results');
select is((select count(*) from public.theory_progress)::bigint, 0::bigint, 'Bob cannot read Alice''s theory progress');
select is((select count(*) from public.colorblind_results)::bigint, 0::bigint, 'Bob cannot read Alice''s colour results');

select throws_ok(
  $$ select * from public.get_mock_test_answer_key('66666666-6666-4666-8666-666666666601') $$,
  'P0002', null, 'Bob cannot fetch the answer key of Alice''s mock attempt'
);

-- Both statements find no row he may touch, so they change nothing; the checks below show it.
update public.mock_test_results set duration_seconds = 1 where user_id = '55555555-5555-4555-8555-555555555501';
delete from public.mock_test_results where user_id = '55555555-5555-4555-8555-555555555501';
update public.simulation_results set score = 1 where user_id = '55555555-5555-4555-8555-555555555501';
delete from public.simulation_results where user_id = '55555555-5555-4555-8555-555555555501';
update public.theory_progress set completed = false where user_id = '55555555-5555-4555-8555-555555555501';
delete from public.theory_progress where user_id = '55555555-5555-4555-8555-555555555501';
update public.colorblind_results set score = 1 where user_id = '55555555-5555-4555-8555-555555555501';
delete from public.colorblind_results where user_id = '55555555-5555-4555-8555-555555555501';

reset role;

select is((select duration_seconds from public.mock_test_results where id = '66666666-6666-4666-8666-666666666601'), 60, 'Alice''s mock result survived Bob''s update and delete');
select is((select score from public.simulation_results where user_id = '55555555-5555-4555-8555-555555555501'), 50, 'Alice''s simulator result survived Bob''s update and delete');
select is((select completed from public.theory_progress where user_id = '55555555-5555-4555-8555-555555555501'), true, 'Alice''s theory progress survived Bob''s update and delete');
select is((select score from public.colorblind_results where user_id = '55555555-5555-4555-8555-555555555501'), 20, 'Alice''s colour result survived Bob''s update and delete');

select * from finish();
rollback;
