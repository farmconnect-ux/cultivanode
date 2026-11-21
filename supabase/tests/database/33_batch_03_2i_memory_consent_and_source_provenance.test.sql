-- Batch 03.2I pgTAP tests: memory actions after consent withdrawal (finding 1) and
-- server-only source kinds + validated source references (finding 2).
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, phone)
values
  ('33000000-0000-4000-8000-000000000001', '2348033000001'),
  ('33000000-0000-4000-8000-000000000002', '2348033000002')
on conflict (id) do nothing;

insert into public.farms (id, owner_id, name, zone, state, location)
values
  ('33000000-0000-4000-8000-000000000101', '33000000-0000-4000-8000-000000000001', 'Gamma Farm', 'rainforest', 'Oyo', extensions.st_geogfromtext('POINT(3.947 7.3775)')),
  ('33000000-0000-4000-8000-000000000102', '33000000-0000-4000-8000-000000000002', 'Delta Farm', 'derived_savanna', 'Ogun', extensions.st_geogfromtext('POINT(3.3619 7.1475)'))
on conflict (id) do nothing;

insert into public.consents (profile_id, consent_type, granted, document_version, created_at)
values
  ('33000000-0000-4000-8000-000000000001', 'ai_intelligence', true, 'v1.0', clock_timestamp()),
  ('33000000-0000-4000-8000-000000000002', 'ai_intelligence', true, 'v1.0', clock_timestamp());

-- 1. Helper functions are private and not executable by API roles; the guard trigger is installed.
select ok(
  not has_function_privilege('authenticated', 'private.assert_memory_source_refs_permitted(uuid,text,uuid,jsonb)', 'execute')
  and not has_function_privilege('anon', 'private.assert_memory_source_refs_permitted(uuid,text,uuid,jsonb)', 'execute')
  and not has_function_privilege('authenticated', 'private.memory_source_ref_permitted(uuid,text,uuid,text,text)', 'execute')
  and exists (
    select 1 from pg_trigger
     where tgrelid = 'public.farm_memory_items'::regclass
       and tgname = 'farm_memory_items_client_provenance_guard'
       and not tgisinternal
  ),
  'source reference helpers are private and the provenance guard trigger is installed'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '33000000-0000-4000-8000-000000000001', true);

-- Finding 2: server-only source kinds.
select throws_ok(
  $$
    select public.create_farm_memory_item(
      'farm', '33000000-0000-4000-8000-000000000101', 'semantic', 'yield_note',
      'Claimed farm record', '{"yield":"9t"}'::jsonb, 'farm_record',
      '[]'::jsonb, 1.0, 'synced', null, null, null, null, null, true
    )
  $$,
  '42501',
  null,
  'authenticated callers cannot assert source_kind farm_record'
);

select throws_ok(
  $$
    select public.create_farm_memory_item(
      'farm', '33000000-0000-4000-8000-000000000101', 'semantic', 'yield_note',
      'Claimed derivation', '{"yield":"9t"}'::jsonb, 'deterministic_derived'
    )
  $$,
  '42501',
  null,
  'authenticated callers cannot assert source_kind deterministic_derived'
);

select throws_ok(
  $$
    select public.create_farm_memory_item(
      'farm', '33000000-0000-4000-8000-000000000101', 'semantic', 'yield_note',
      'Unknown kind', '{}'::jsonb, 'something_else'
    )
  $$,
  '23514',
  null,
  'unknown source_kind is still rejected by the table CHECK constraint'
);

-- Finding 2: source references must exist and belong to the memory's farm.
select throws_ok(
  $$
    select public.create_farm_memory_item(
      'farm', '33000000-0000-4000-8000-000000000101', 'semantic', 'field_note',
      'Points at another farm', '{}'::jsonb, 'farmer_explicit',
      '[{"source":"farms","record_id":"33000000-0000-4000-8000-000000000102"}]'::jsonb
    )
  $$,
  '42501',
  null,
  'farm memory cannot reference a record of another farm'
);

select throws_ok(
  $$
    select public.create_farm_memory_item(
      'farm', '33000000-0000-4000-8000-000000000101', 'semantic', 'field_note',
      'Points at nothing', '{}'::jsonb, 'farmer_explicit',
      '[{"source":"plots","record_id":"33000000-0000-4000-8000-000000000999"}]'::jsonb
    )
  $$,
  '42501',
  null,
  'farm memory cannot reference a record that does not exist'
);

select throws_ok(
  $$
    select public.create_farm_memory_item(
      'farm', '33000000-0000-4000-8000-000000000101', 'semantic', 'field_note',
      'Weather anchor', '{}'::jsonb, 'farmer_explicit',
      '[{"source":"weather_cache","record_id":"lagos-2026-11-21"}]'::jsonb
    )
  $$,
  '42501',
  null,
  'weather_cache cannot anchor a persistent memory'
);

select throws_ok(
  $$
    select public.create_farm_memory_item(
      'farm', '33000000-0000-4000-8000-000000000101', 'semantic', 'field_note',
      'Malformed ref', '{}'::jsonb, 'farmer_explicit',
      '[{"source":"farms","record_id":"33000000-0000-4000-8000-000000000101","note":"x"}]'::jsonb
    )
  $$,
  '22023',
  null,
  'source references with extra keys are rejected'
);

select ok(
  (select lifecycle_status = 'confirmed' and source_kind = 'farmer_explicit'
     from public.create_farm_memory_item(
       'farm', '33000000-0000-4000-8000-000000000101', 'semantic', 'field_note',
       'Own farm reference', '{"note":"north slope drains slowly"}'::jsonb, 'farmer_explicit',
       '[{"source":"farms","record_id":"33000000-0000-4000-8000-000000000101","observed_at":"2026-11-21T06:00:00Z"}]'::jsonb,
       1.0, 'synced', 'idem-33-farm', null, null, null, null, true
     )),
  'farmer_explicit memory referencing its own farm is accepted'
);

select throws_ok(
  $$
    select public.create_farm_memory_item(
      'profile', null, 'preference', 'units_pref',
      'Other farm in profile', '{}'::jsonb, 'farmer_explicit',
      '[{"source":"farms","record_id":"33000000-0000-4000-8000-000000000102"}]'::jsonb
    )
  $$,
  '42501',
  null,
  'profile memory cannot reference a farm the user cannot view'
);

select ok(
  (select lifecycle_status = 'proposed'
     from public.create_farm_memory_item(
       'farm', '33000000-0000-4000-8000-000000000101', 'semantic', 'pest_note',
       'AI suggestion', '{"pest":"fall armyworm"}'::jsonb, 'ai_inferred',
       '[]'::jsonb, 0.6, 'synced', 'idem-33-ai', null, null, null, null, true
     )),
  'ai_inferred memory is still accepted and stays proposed'
);

select ok(
  (select lifecycle_status = 'confirmed'
     from public.create_farm_memory_item(
       'profile', null, 'preference', 'language_pref',
       'Prefers Yoruba', '{"language":"yo"}'::jsonb, 'farmer_explicit',
       '[]'::jsonb, 1.0, 'synced', 'idem-33-prof', null, null, null, null, true
     )),
  'profile preference created before consent withdrawal'
);

select throws_ok(
  $$
    select public.transition_farm_memory_item(
      (select id from public.farm_memory_items where idempotency_key = 'idem-33-farm'),
      'supersede',
      'Corrected',
      '{"note":"drains slowly after heavy rain"}'::jsonb,
      '[{"source":"farms","record_id":"33000000-0000-4000-8000-000000000102"}]'::jsonb
    )
  $$,
  '42501',
  null,
  'supersede cannot attach references to another farm'
);

-- Finding 1: withdraw consent, then confirm is denied but reject / withdraw / delete still work.
reset role;
insert into public.consents (profile_id, consent_type, granted, document_version, created_at)
values ('33000000-0000-4000-8000-000000000001', 'ai_intelligence', false, 'v1.0', clock_timestamp() + interval '1 second');

set local role authenticated;
select set_config('request.jwt.claim.sub', '33000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$
    select public.transition_farm_memory_item(
      (select id from public.farm_memory_items where idempotency_key = 'idem-33-ai'),
      'confirm'
    )
  $$,
  '42501',
  null,
  'confirm still requires current ai_intelligence consent'
);

select is(
  (select lifecycle_status from public.transition_farm_memory_item(
    (select id from public.farm_memory_items where idempotency_key = 'idem-33-ai'),
    'reject'
  )),
  'rejected',
  'reject works after consent is withdrawn'
);

select is(
  (select lifecycle_status from public.transition_farm_memory_item(
    (select id from public.farm_memory_items where idempotency_key = 'idem-33-prof'),
    'withdraw'
  )),
  'withdrawn',
  'withdraw works after consent is withdrawn'
);

select is(
  (select lifecycle_status from public.transition_farm_memory_item(
    (select id from public.farm_memory_items where idempotency_key = 'idem-33-farm'),
    'delete'
  )),
  'deleted',
  'delete works after consent is withdrawn'
);

-- Another user still cannot act on these memories (capture the id first: RLS hides it from user 2).
select set_config(
  'cultivanode_test.profile_memory_id',
  (select id::text from public.farm_memory_items where idempotency_key = 'idem-33-prof'),
  true
);
select set_config('request.jwt.claim.sub', '33000000-0000-4000-8000-000000000002', true);

select throws_ok(
  $$
    select public.transition_farm_memory_item(
      current_setting('cultivanode_test.profile_memory_id')::uuid,
      'delete'
    )
  $$,
  '42501',
  null,
  'another user cannot delete someone else''s memory'
);

select * from finish();
rollback;
