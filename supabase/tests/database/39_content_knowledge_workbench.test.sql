-- Content & Knowledge workbench: standards editing and review, agrochemical register, translation queue.
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

insert into auth.users (id, phone) values
  ('39000000-0000-4000-8000-000000000001', '2348039000001'),
  ('39000000-0000-4000-8000-000000000002', '2348039000002'),
  ('39000000-0000-4000-8000-000000000003', '2348039000003'),
  ('39000000-0000-4000-8000-000000000004', '2348039000004')
on conflict (id) do nothing;

update public.profiles set onboarded_at = now(), full_name = v.n
  from (values
    ('39000000-0000-4000-8000-000000000001'::uuid, 'Editor Author'),
    ('39000000-0000-4000-8000-000000000002'::uuid, 'Editor Reviewer'),
    ('39000000-0000-4000-8000-000000000003'::uuid, 'Super Admin'),
    ('39000000-0000-4000-8000-000000000004'::uuid, 'Farmer')
  ) v(i, n)
 where id = v.i;

insert into public.admin_roles (profile_id, admin_role) values
  ('39000000-0000-4000-8000-000000000001', 'agronomy_editor'),
  ('39000000-0000-4000-8000-000000000002', 'agronomy_editor'),
  ('39000000-0000-4000-8000-000000000003', 'super_admin')
on conflict do nothing;

create table pg_temp.t (k text primary key, id uuid);
grant all on pg_temp.t to authenticated;

create or replace function pg_temp.as_user(p text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p)::text, true);
$$;

set local role authenticated;

-- Standards -----------------------------------------------------------------------------------
select pg_temp.as_user('39000000-0000-4000-8000-000000000001');
do $$
declare v public.farm_agronomic_standards;
begin
  select * into v from public.agronomy_create_standard_draft(
    'TEST39_LETTUCE', 'lettuce', 'derived_savanna', '1.0', 'Lettuce test standard', null, '{}'::jsonb,
    array['Nursery'], array['paraquat'], 100);
  insert into pg_temp.t values ('std', v.id);
end $$;

-- 1. A valid stage and nutrient plan saves.
select lives_ok($$
  select public.agronomy_update_standard_draft(
    (select id from pg_temp.t where k = 'std'), 'Lettuce test standard v1', 'Test', 'derived_savanna', 'TEST_SOURCE',
    '{"stages":[{"name":"Nursery","start_day":-28,"end_day":0,"description":"Raise seedlings"}],
      "nutrient_plan":[{"timing":"Basal","product":"NPK 15-15-15","rate_kg_ha":200,"n_kg_ha":30}],
      "protection_notes":[{"title":"Aphids","text":"Scout weekly"}]}'::jsonb,
    array['Nursery', 'Transplanting'], array['Paraquat', ' paraquat '], 100)
$$, 'editor saves a valid draft');

-- 2. Restricted chemicals are normalised and de-duplicated.
select is((select restricted_chemicals from public.farm_agronomic_standards where id = (select id from pg_temp.t where k = 'std')),
  array['paraquat']::text[], 'restricted chemicals normalised');

-- 3. Nitrogen total above the maximum is refused.
select throws_ok($$
  select public.agronomy_update_standard_draft((select id from pg_temp.t where k = 'std'), 'Lettuce test standard v1', null,
    'derived_savanna', null,
    '{"nutrient_plan":[{"timing":"Basal","product":"Urea","rate_kg_ha":300,"n_kg_ha":138}]}'::jsonb, null, null, 100)
$$, '22023', null, 'nitrogen above the standard maximum is refused');

-- 4. A stage ending before it starts is refused.
select throws_ok($$
  select public.agronomy_update_standard_draft((select id from pg_temp.t where k = 'std'), 'Lettuce test standard v1', null,
    'derived_savanna', null, '{"stages":[{"name":"Bad","start_day":10,"end_day":5}]}'::jsonb, null, null, 100)
$$, '22023', null, 'invalid stage days are refused');

-- 5. A non-array stages value is refused cleanly.
select throws_ok($$
  select public.agronomy_update_standard_draft((select id from pg_temp.t where k = 'std'), 'Lettuce test standard v1', null,
    'derived_savanna', null, '{"stages":{"name":"x"}}'::jsonb, null, null, 100)
$$, '22023', null, 'non-array stages are refused');

-- 6. A farmer cannot edit.
select pg_temp.as_user('39000000-0000-4000-8000-000000000004');
select throws_ok($$
  select public.agronomy_update_standard_draft((select id from pg_temp.t where k = 'std'), 'Hijack', null, null, null, '{}'::jsonb, null, null, null)
$$, '42501', null, 'farmer cannot edit a draft');

-- 7. The author cannot approve their own standard.
select pg_temp.as_user('39000000-0000-4000-8000-000000000001');
select public.agronomy_submit_standard_for_review((select id from pg_temp.t where k = 'std'), 'Ready');
select throws_ok($$ select public.agronomy_approve_standard((select id from pg_temp.t where k = 'std')) $$,
  '42501', null, 'author cannot approve their own standard');

-- 9. Editing is blocked once in review.
select throws_ok($$
  select public.agronomy_update_standard_draft((select id from pg_temp.t where k = 'std'), 'Changed', null, null, null, '{}'::jsonb, null, null, 100)
$$, '22023', null, 'a standard in review cannot be edited');

-- 10. Return for revision needs a reason.
select pg_temp.as_user('39000000-0000-4000-8000-000000000002');
select throws_ok($$ select public.agronomy_return_standard((select id from pg_temp.t where k = 'std'), 'short') $$,
  '22023', null, 'returning needs a reason');

-- 11. A different reviewer returns it to draft.
select lives_ok($$ select public.agronomy_return_standard((select id from pg_temp.t where k = 'std'), 'Please cite the source for the basal rate.') $$,
  'reviewer returns the standard for revision');
select is((select status::text from public.farm_agronomic_standards where id = (select id from pg_temp.t where k = 'std')),
  'draft', 'returned standard is a draft again');

-- 13-14. Resubmitted, a different reviewer approves.
select pg_temp.as_user('39000000-0000-4000-8000-000000000001');
select public.agronomy_submit_standard_for_review((select id from pg_temp.t where k = 'std'), 'Source added');
select pg_temp.as_user('39000000-0000-4000-8000-000000000002');
select lives_ok($$ select public.agronomy_approve_standard((select id from pg_temp.t where k = 'std'), 'Checked') $$,
  'a different reviewer approves');
select is((select status::text from public.farm_agronomic_standards where id = (select id from pg_temp.t where k = 'std')),
  'approved', 'standard is approved');

-- 15. History is readable by standards staff and lists the steps.
select ok((select count(*) >= 4 from public.agronomy_standard_history('TEST39_LETTUCE')), 'history lists the review steps');

-- 16. A farmer cannot read the history.
select pg_temp.as_user('39000000-0000-4000-8000-000000000004');
select throws_ok($$ select * from public.agronomy_standard_history('TEST39_LETTUCE') $$, '42501', null, 'farmer cannot read history');

-- Agrochemical register -------------------------------------------------------------------------
select pg_temp.as_user('39000000-0000-4000-8000-000000000001');

-- 17. A banned active ingredient cannot be added.
select throws_ok($$
  select public.agrochemical_save_draft(null, 'Gramo Test', 'herbicide', 'SL', 'Paraquat dichloride 276 g/L', null, null,
    3, 'L/ha', 24, 30, 'II', array['maize'], array['weeds'], 'Product label')
$$, '22023', null, 'banned active ingredient refused');

-- 18. A valid draft is created.
do $$
begin
  insert into pg_temp.t values ('chem', public.agrochemical_save_draft(null, 'Emamectin Test', 'insecticide', 'WDG',
    'Emamectin benzoate 50 g/kg', 'Test Maker', 'nafdac/test-39', 250, 'g/ha', 12, 14, 'III', array['maize'],
    array['fall armyworm'], 'Product label photo 2026-11'));
end $$;
select is((select status from public.agrochemical_products where id = (select id from pg_temp.t where k = 'chem')),
  'draft', 'agrochemical draft created');

-- 19. A rate without a unit is refused.
select throws_ok($$
  select public.agrochemical_save_draft((select id from pg_temp.t where k = 'chem'), 'Emamectin Test', 'insecticide', 'WDG',
    'Emamectin benzoate 50 g/kg', null, null, 250, null, null, null, null, null, null, 'Label')
$$, '22023', null, 'rate without unit refused');

-- 20. The creator cannot review their own product.
select public.agrochemical_submit_for_review((select id from pg_temp.t where k = 'chem'));
select throws_ok($$ select public.agrochemical_review((select id from pg_temp.t where k = 'chem'), true) $$,
  '42501', null, 'creator cannot approve own product');

-- 21. A different reviewer approves.
select pg_temp.as_user('39000000-0000-4000-8000-000000000002');
select lives_ok($$ select public.agrochemical_review((select id from pg_temp.t where k = 'chem'), true, 'Matches label') $$,
  'different reviewer approves product');

-- 22. Withdrawal needs a reason and works on approved products.
select lives_ok($$ select public.agrochemical_withdraw((select id from pg_temp.t where k = 'chem'), 'Registration expired on the NAFDAC register') $$,
  'approved product withdrawn');

-- 23. Farmers cannot read the register.
select pg_temp.as_user('39000000-0000-4000-8000-000000000004');
select is((select count(*)::int from public.agrochemical_products), 0, 'farmer cannot read the agrochemical register');

-- 24. App roles cannot write the table directly.
select ok(not has_table_privilege('authenticated', 'public.agrochemical_products', 'INSERT')
  and not has_table_privilege('authenticated', 'public.agrochemical_products', 'UPDATE')
  and not has_table_privilege('anon', 'public.agrochemical_products', 'SELECT'),
  'no direct writes to the register');

-- Translation queue --------------------------------------------------------------------------------
select pg_temp.as_user('39000000-0000-4000-8000-000000000001');
do $$
begin
  insert into pg_temp.t values ('tr', public.content_translation_request('standard:test39:stage:1', 'Raise seedlings in a nursery', 'standard', 'yo'));
end $$;
select public.content_translation_submit((select id from pg_temp.t where k = 'tr'), 'Gbin irugbin si nọọsìrì');

-- 25. The translator cannot approve their own translation.
select throws_ok($$ select public.content_translation_review((select id from pg_temp.t where k = 'tr'), true) $$,
  '42501', null, 'translator cannot approve own translation');

-- 26. A different reviewer approves.
select pg_temp.as_user('39000000-0000-4000-8000-000000000002');
select lives_ok($$ select public.content_translation_review((select id from pg_temp.t where k = 'tr'), true) $$,
  'different reviewer approves translation');

-- 27. Re-requesting with the same English keeps the approval.
select public.content_translation_request('standard:test39:stage:1', 'Raise seedlings in a nursery', 'standard', 'yo');
select is((select status from public.content_translations where id = (select id from pg_temp.t where k = 'tr')),
  'approved', 'unchanged source keeps the approved translation');

-- 28. Changing the English source reopens it.
select public.content_translation_request('standard:test39:stage:1', 'Raise seedlings in a shaded nursery', 'standard', 'yo');
select ok((select status = 'pending' and translated_text is null from public.content_translations
            where id = (select id from pg_temp.t where k = 'tr')), 'changed source resets the translation');

-- 29. A farmer cannot request translations or read the queue.
select pg_temp.as_user('39000000-0000-4000-8000-000000000004');
select throws_ok($$ select public.content_translation_request('general:test39', 'Hello', 'general', 'yo') $$,
  '42501', null, 'farmer cannot request translations');
select is((select count(*)::int from public.content_translations), 0, 'farmer cannot read the translation queue');

select * from finish();
rollback;
