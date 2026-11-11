begin;
select plan(4);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-4111-8111-111111111117', 'combined-test@example.test', 'authenticated', 'authenticated');

-- Build submissions from the migrated bank before switching to the learner role.
create temporary table combined_submissions as
select target.score, jsonb_object_agg(
  q.id, case when q.order_index <= target.score then q.correct_index else (q.correct_index + 1) % 4 end
) as answers
from (values (55), (56)) as target(score)
cross join public.kpp_questions q
where q.set_id = 'mock-da-combined-1'
group by target.score;

grant select on combined_submissions to authenticated;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-4111-8111-111111111117","role":"authenticated"}';

select ok(
  not has_column_privilege(current_user, 'public.kpp_questions', 'correct_index', 'SELECT')
  and not has_column_privilege(current_user, 'public.kpp_questions', 'explanation_en', 'SELECT')
  and not has_column_privilege(current_user, 'public.kpp_questions', 'explanation_ms', 'SELECT'),
  'learners cannot query the mock answer key directly'
);
select is(
  (select count(*) from public.kpp_questions
   where set_id like 'mock-%-combined-%'
     and image_url is not null
     and image_url !~ '^/signs/[0-9a-f]{16}\.(svg|png|jpeg|jpg|webp)$'),
  0::bigint,
  'combined mock image names are neutral content hashes'
);

-- The server must overwrite the submitted grade using the saved answer indices.
insert into public.mock_test_results
  (user_id, set_id, score, total_questions, percentage, passed, duration_seconds, answers, language)
select '11111111-1111-4111-8111-111111111117', 'mock-da-combined-1',
       1, 1, 100, true, 60, answers, 'en'
from combined_submissions;

select results_eq(
  $$ select score, total_questions, percentage, passed from public.mock_test_results
     where set_id = 'mock-da-combined-1' and score = 55 $$,
  $$ values (55, 70, 78.57::numeric, false) $$,
  '55 correct fails despite a client-supplied pass'
);
select results_eq(
  $$ select score, total_questions, percentage, passed from public.mock_test_results
     where set_id = 'mock-da-combined-1' and score = 56 $$,
  $$ values (56, 70, 80.00::numeric, true) $$,
  '56 correct out of 70 passes'
);

select * from finish();
rollback;
