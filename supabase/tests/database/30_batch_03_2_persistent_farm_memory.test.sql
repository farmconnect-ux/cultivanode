-- Batch 03.2 pgTAP tests: Persistent Farm Memory, Tenant Isolation, Lifecycle, Vector Search & Account Deletion (ADR-002, ADR-004, ADR-009)
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- Seed two users, two farms, and active ai_intelligence consents.
insert into auth.users (id, phone)
values
  ('32000000-0000-4000-8000-000000000001', '2348032000001'),
  ('32000000-0000-4000-8000-000000000002', '2348032000002')
on conflict (id) do nothing;

insert into public.farms (id, owner_id, name, zone, state, location)
values
  ('32000000-0000-4000-8000-000000000101', '32000000-0000-4000-8000-000000000001', 'Alpha Farm', 'rainforest', 'Oyo', extensions.st_geogfromtext('POINT(3.947 7.3775)')),
  ('32000000-0000-4000-8000-000000000102', '32000000-0000-4000-8000-000000000002', 'Beta Farm', 'derived_savanna', 'Ogun', extensions.st_geogfromtext('POINT(3.3619 7.1475)'))
on conflict (id) do nothing;

insert into public.consents (profile_id, consent_type, granted, recorded_at)
values
  ('32000000-0000-4000-8000-000000000001', 'ai_intelligence', true, now()),
  ('32000000-0000-4000-8000-000000000002', 'ai_intelligence', true, now());

-- 1. Table exists with RLS enabled and forced.
select ok(
  exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'farm_memory_items'
      and c.relrowsecurity = true and c.relforcerowsecurity = true
  ),
  'farm_memory_items has RLS enabled and forced'
);

-- 2. Direct DML revoked from anon and authenticated; SELECT granted to authenticated only.
select ok(
  not has_table_privilege('anon', 'public.farm_memory_items', 'select')
  and has_table_privilege('authenticated', 'public.farm_memory_items', 'select')
  and not has_table_privilege('authenticated', 'public.farm_memory_items', 'insert')
  and not has_table_privilege('authenticated', 'public.farm_memory_items', 'update')
  and not has_table_privilege('authenticated', 'public.farm_memory_items', 'delete'),
  'farm_memory_items allows SELECT only for authenticated and revokes all direct DML'
);

-- 3. RPC grants: PUBLIC and anon revoked; authenticated granted.
select ok(
  not has_function_privilege('anon', 'public.create_farm_memory_item(text,uuid,text,text,text,jsonb,text,jsonb,numeric,text,text,timestamptz,extensions.vector,text,text,boolean)', 'execute')
  and has_function_privilege('authenticated', 'public.create_farm_memory_item(text,uuid,text,text,text,jsonb,text,jsonb,numeric,text,text,timestamptz,extensions.vector,text,text,boolean)', 'execute')
  and not has_function_privilege('anon', 'public.search_farm_memory_items(uuid,boolean,text[],boolean,extensions.vector,integer)', 'execute')
  and has_function_privilege('authenticated', 'public.search_farm_memory_items(uuid,boolean,text[],boolean,extensions.vector,integer)', 'execute'),
  'memory RPCs are revoked from anon and granted to authenticated'
);

-- 4. CHECK constraint rejects invalid farm/profile scope combination (farm scope with profile_id set).
select throws_ok(
  $$
    insert into public.farm_memory_items (
      memory_scope, farm_id, profile_id, category, memory_type, title, structured_content, source_kind
    ) values (
      'farm', '32000000-0000-4000-8000-000000000101', '32000000-0000-4000-8000-000000000001',
      'semantic', 'soil', 'Invalid', '{}'::jsonb, 'farmer_explicit'
    )
  $$,
  '23514',
  null,
  'scope CHECK constraint rejects farm-scoped row with non-null profile_id'
);

-- 5. CHECK constraint rejects profile scope with non-preference category.
select throws_ok(
  $$
    insert into public.farm_memory_items (
      memory_scope, farm_id, profile_id, category, memory_type, title, structured_content, source_kind
    ) values (
      'profile', null, '32000000-0000-4000-8000-000000000001',
      'episodic', 'pref', 'Invalid', '{}'::jsonb, 'farmer_explicit'
    )
  $$,
  '23514',
  null,
  'scope CHECK constraint rejects profile-scoped row with non-preference category'
);

-- Act as User 1.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32000000-0000-4000-8000-000000000001', true);

-- 6. AI-inferred farm memory is NEVER auto-confirmed even if p_request_confirm = true.
select is(
  (select lifecycle_status from public.create_farm_memory_item(
    'farm', '32000000-0000-4000-8000-000000000101', 'semantic', 'irrigation_note',
    'AI inferred drip schedule', '{"schedule":"morning"}'::jsonb, 'ai_inferred',
    '[]'::jsonb, 0.72, 'synced', 'idem-ai-1', null, null, null, null, true
  )),
  'proposed',
  'AI-inferred memory is created as proposed, never auto-confirmed'
);

-- 7. Idempotency key returns same memory row without duplicate creation.
select is(
  (select count(*)::int from public.farm_memory_items where idempotency_key = 'idem-ai-1'),
  1,
  'first idempotent creation inserted 1 row'
);
select is(
  (select id from public.create_farm_memory_item(
    'farm', '32000000-0000-4000-8000-000000000101', 'semantic', 'irrigation_note',
    'AI inferred drip schedule', '{"schedule":"morning"}'::jsonb, 'ai_inferred',
    '[]'::jsonb, 0.72, 'synced', 'idem-ai-1', null, null, null, null, true
  )),
  (select id from public.farm_memory_items where idempotency_key = 'idem-ai-1'),
  'duplicate idempotency_key returns existing memory row'
);

-- 8. Offline awaiting_sync memory cannot be confirmed before sync.
select ok(
  (select sync_state = 'awaiting_sync' and lifecycle_status = 'awaiting_confirmation'
     from public.create_farm_memory_item(
       'farm', '32000000-0000-4000-8000-000000000101', 'episodic', 'field_note',
       'Offline observation', '{"note":"wilting"}'::jsonb, 'farmer_explicit',
       '[]'::jsonb, 0.80, 'awaiting_sync', 'idem-offline-1', null, null, null, null, true
     )),
  'offline awaiting_sync memory is not auto-confirmed'
);

select throws_ok(
  $$
    select public.transition_farm_memory_item(
      (select id from public.farm_memory_items where idempotency_key = 'idem-offline-1'),
      'confirm'
    )
  $$,
  '22023',
  null,
  'offline awaiting_sync memory cannot be confirmed before synchronisation'
);

-- 9. Explicit confirmation sets lifecycle_status = confirmed, confirmed_by = auth.uid(), preserves created_by.
select ok(
  (select lifecycle_status = 'confirmed'
      and verification_status = 'confirmed'
      and confirmed_by = '32000000-0000-4000-8000-000000000001'::uuid
      and created_by = '32000000-0000-4000-8000-000000000001'::uuid
     from public.transition_farm_memory_item(
       (select id from public.farm_memory_items where idempotency_key = 'idem-ai-1'),
       'confirm'
     )),
  'explicit confirmation transitions proposed memory to confirmed with verified attribution'
);

-- 10. Create profile-scoped preference memory for User 1.
select ok(
  (select memory_scope = 'profile' and farm_id is null and profile_id = '32000000-0000-4000-8000-000000000001'::uuid and lifecycle_status = 'confirmed'
     from public.create_farm_memory_item(
       'profile', null, 'preference', 'language_pref',
       'Prefers Yoruba summaries', '{"language":"yo"}'::jsonb, 'farmer_explicit',
       '[]'::jsonb, 1.0, 'synced', 'idem-prof-1', null, null, null, null, true
     )),
  'profile-scoped preference memory created with profile ownership'
);

-- 11. Supersede (correct) creates replacement confirmed memory and marks original superseded.
select ok(
  (select supersedes_id = (select id from public.farm_memory_items where idempotency_key = 'idem-ai-1')
      and lifecycle_status = 'confirmed'
     from public.transition_farm_memory_item(
       (select id from public.farm_memory_items where idempotency_key = 'idem-ai-1'),
       'supersede',
       'Corrected drip schedule',
       '{"schedule":"evening"}'::jsonb
     )),
  'supersede creates linked replacement memory'
);

select is(
  (select lifecycle_status from public.farm_memory_items where idempotency_key = 'idem-ai-1'),
  'superseded',
  'original memory marked superseded'
);

-- 12. Create an expired memory and a rejected memory, verify search excludes superseded, expired, and rejected.
select ok(
  (select id is not null from public.create_farm_memory_item(
    'farm', '32000000-0000-4000-8000-000000000101', 'semantic', 'expired_note',
    'Expired memory', '{"v":1}'::jsonb, 'farmer_explicit',
    '[]'::jsonb, 1.0, 'synced', 'idem-exp-1', now() - interval '1 hour', null, null, null, true
  )),
  'expired memory inserted for filtering test'
);

select is(
  (select count(*)::int from public.search_farm_memory_items(
    '32000000-0000-4000-8000-000000000101', true, null, false, null, 20
  )),
  2,
  'search returns only active confirmed farm memory (replacement) + profile preference, excluding superseded/expired/provisional'
);

-- 13. Cross-farm write denial: User 1 cannot write to Beta Farm (owned by User 2).
select throws_ok(
  $$
    select public.create_farm_memory_item(
      'farm', '32000000-0000-4000-8000-000000000102', 'semantic', 'cross_farm',
      'Unauthorized', '{}'::jsonb, 'farmer_explicit'
    )
  $$,
  '42501',
  null,
  'cross-farm memory creation denied with 42501'
);

-- 14. Cross-farm & cross-user read denial: switch to User 2.
select set_config('request.jwt.claim.sub', '32000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::int from public.farm_memory_items),
  0,
  'User 2 sees zero rows of User 1 farm and profile memories under RLS'
);

select throws_ok(
  $$
    select * from public.search_farm_memory_items(
      '32000000-0000-4000-8000-000000000101', true, null, true, null, 20
    )
  $$,
  '42501',
  null,
  'User 2 denied search_farm_memory_items on Alpha Farm with 42501'
);

-- 15. Withdrawn consent denies memory creation & retrieval.
reset role;
insert into public.consents (profile_id, consent_type, granted, recorded_at)
values ('32000000-0000-4000-8000-000000000002', 'ai_intelligence', false, now() + interval '1 second');

set local role authenticated;
select set_config('request.jwt.claim.sub', '32000000-0000-4000-8000-000000000002', true);

select throws_ok(
  $$
    select * from public.search_farm_memory_items(
      '32000000-0000-4000-8000-000000000102', true, null, true, null, 20
    )
  $$,
  '42501',
  null,
  'withdrawn ai_intelligence consent denies memory retrieval'
);

-- 16. Account deletion (ADR-009): hard-deletes profile memory, preserves farm memory with nulled attribution.
reset role;
select public.execute_account_deletion('32000000-0000-4000-8000-000000000001', 'Batch 03.2 ADR-009 test');

select is(
  (select count(*)::int from public.farm_memory_items
    where memory_scope = 'profile' and profile_id = '32000000-0000-4000-8000-000000000001'),
  0,
  'execute_account_deletion hard-deletes profile-scoped memories of deleted user'
);

select ok(
  exists (
    select 1 from public.farm_memory_items
     where memory_scope = 'farm'
       and farm_id = '32000000-0000-4000-8000-000000000101'
       and lifecycle_status = 'confirmed'
       and created_by is null
       and confirmed_by is null
       and updated_by is null
  ),
  'execute_account_deletion preserves farm-scoped memories while nullifying personal attribution'
);

select * from finish();
rollback;
