-- Batch 03.3 (Workstream B) pgTAP tests: Machinery Telemetry Provenance, Device Auth & Immutability
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Seed: Farmer A (Farm A), Farmer B (Farm B), Staff C (super_admin), Device Model, Registered Device, Revoked Device.
insert into auth.users (id, phone)
values
  ('35000000-0000-4000-8000-000000000001', '2348035000001'),
  ('35000000-0000-4000-8000-000000000002', '2348035000002'),
  ('35000000-0000-4000-8000-000000000003', '2348035000003')
on conflict (id) do nothing;

insert into public.admin_roles (profile_id, admin_role)
values ('35000000-0000-4000-8000-000000000003', 'super_admin')
on conflict do nothing;

insert into public.farms (id, owner_id, name, zone, state, location)
values
  ('35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000001', 'Farm A Telemetry', 'derived_savanna', 'Oyo', extensions.st_geogfromtext('POINT(3.947 7.3775)')),
  ('35000000-0000-4000-8000-000000000102', '35000000-0000-4000-8000-000000000002', 'Farm B Telemetry', 'derived_savanna', 'Oyo', extensions.st_geogfromtext('POINT(3.950 7.3800)'))
on conflict (id) do nothing;

insert into public.farm_machinery_assets (id, farm_id, asset_code, name, category, engine_hours)
values
  ('35000000-0000-4000-8000-000000000201', '35000000-0000-4000-8000-000000000101', 'TR-A1', 'Tractor A1', 'tractor', 120.0),
  ('35000000-0000-4000-8000-000000000202', '35000000-0000-4000-8000-000000000102', 'TR-B1', 'Tractor B1', 'tractor', 200.0)
on conflict (id) do nothing;

insert into public.device_models (id, model_code, name, vendor, connectivity)
values ('35000000-0000-4000-8000-000000000301', 'CN-TEL-M1', 'Machinery Tracker M1', 'CultivaNode', 'cellular_2g_4g')
on conflict (id) do nothing;

insert into public.devices (id, serial_number, model_id, status, auth_token_hash, revoked_at)
values
  (
    '35000000-0000-4000-8000-000000000401', 'CN-MACH-001', '35000000-0000-4000-8000-000000000301', 'active',
    encode(extensions.digest('secret-device-token-farm-a-001', 'sha256'), 'hex'), null
  ),
  (
    '35000000-0000-4000-8000-000000000402', 'CN-MACH-REV', '35000000-0000-4000-8000-000000000301', 'active',
    encode(extensions.digest('secret-device-token-revoked-002', 'sha256'), 'hex'), now() - interval '1 day'
  )
on conflict (id) do nothing;

insert into public.machinery_device_links (farm_id, machinery_id, device_id, is_active, linked_by)
values (
  '35000000-0000-4000-8000-000000000101',
  '35000000-0000-4000-8000-000000000201',
  '35000000-0000-4000-8000-000000000401',
  true,
  '35000000-0000-4000-8000-000000000001'
);

-- 1. FORCE ROW LEVEL SECURITY enabled on machinery_telemetry & machinery_device_links; UPDATE/DELETE revoked from authenticated.
select ok(
  exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'machinery_telemetry'
       and c.relrowsecurity = true and c.relforcerowsecurity = true
  )
  and not has_table_privilege('authenticated', 'public.machinery_telemetry', 'update')
  and not has_table_privilege('authenticated', 'public.machinery_telemetry', 'delete'),
  'machinery_telemetry has FORCE RLS and direct UPDATE/DELETE revoked from authenticated'
);

-- 2. Trusted device & provider ingestion RPCs are executable ONLY by service_role (never anon or authenticated).
select ok(
  not has_function_privilege('anon', 'public.ingest_authenticated_device_telemetry(uuid,text,uuid,uuid,timestamptz,text,numeric,numeric,numeric,integer,numeric,numeric,text,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.ingest_authenticated_device_telemetry(uuid,text,uuid,uuid,timestamptz,text,numeric,numeric,numeric,integer,numeric,numeric,text,uuid)', 'execute')
  and has_function_privilege('service_role', 'public.ingest_authenticated_device_telemetry(uuid,text,uuid,uuid,timestamptz,text,numeric,numeric,numeric,integer,numeric,numeric,text,uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.ingest_provider_machinery_telemetry(text,uuid,uuid,timestamptz,text,numeric,numeric,numeric,integer,numeric,numeric,text,uuid)', 'execute')
  and has_function_privilege('service_role', 'public.ingest_provider_machinery_telemetry(text,uuid,uuid,timestamptz,text,numeric,numeric,numeric,integer,numeric,numeric,text,uuid)', 'execute'),
  'device and provider telemetry ingestion RPCs are restricted exclusively to service_role'
);

------------------------------------------------------------------------------------------------
-- Negative Tests: Authenticated Farmer Spoofing & Cross-Farm Attacks
------------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '35000000-0000-4000-8000-000000000001', true);

-- 3. Authenticated farmer CANNOT self-assert device_authenticated provenance or verified_current.
select throws_ok(
  $$
    insert into public.machinery_telemetry (
      farm_id, machinery_id, recorded_at, engine_hours, source_category, source_device_id, validation_status, trust_classification
    ) values (
      '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201', now() - interval '1 minute',
      121.0, 'device_authenticated', '35000000-0000-4000-8000-000000000401', 'verified', 'verified_current'
    )
  $$,
  '42501',
  null,
  'authenticated farmer cannot self-assert device_authenticated provenance'
);

-- 4. Authenticated farmer CANNOT self-assert staff_observation.
select throws_ok(
  $$
    insert into public.machinery_telemetry (
      farm_id, machinery_id, recorded_at, engine_hours, source_category
    ) values (
      '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201', now() - interval '1 minute',
      121.0, 'staff_observation'
    )
  $$,
  '42501',
  null,
  'ordinary farmer cannot self-assert staff_observation'
);

-- 5. Farm A editor CANNOT submit telemetry referencing Farm B machinery (cross-farm machinery mismatch).
select throws_ok(
  $$
    select public.record_machinery_observation(
      '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000202',
      now() - interval '1 minute', 75.0, 201.0, 82.0, 'working'
    )
  $$,
  '23514',
  null,
  'cross-farm machinery telemetry insertion is rejected'
);

-- 6. Impossible future timestamp is rejected (22023).
select throws_ok(
  $$
    select public.record_machinery_observation(
      '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201',
      now() + interval '2 hours', 75.0, 121.0, 82.0, 'working'
    )
  $$,
  '22023',
  null,
  'impossible future recorded_at timestamp is rejected'
);

-- 7. Physically implausible sensor value (engine_temp_c = 999) is rejected (22023).
select throws_ok(
  $$
    select public.record_machinery_observation(
      '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201',
      now() - interval '1 minute', 75.0, 121.0, 999.0, 'working'
    )
  $$,
  '22023',
  null,
  'physically implausible engine temperature is rejected'
);

-- 8. [Positive] Legitimate farmer observation succeeds and stays farmer_observation + unverified_provisional.
select is(
  (public.record_machinery_observation(
    '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201',
    now() - interval '10 minutes', 80.0, 120.5, 84.0, 'working'
  ) ->> 'trust_classification'),
  'unverified_provisional',
  'farmer observation stays unverified_provisional (never promoted to verified_current)'
);

------------------------------------------------------------------------------------------------
-- Device Authentication & Provider Ingestion Tests (service_role)
------------------------------------------------------------------------------------------------
reset role;
set local role service_role;

-- 9. Wrong device token (unauthenticated device / impersonation) is rejected (42501).
select throws_ok(
  $$
    select public.ingest_authenticated_device_telemetry(
      '35000000-0000-4000-8000-000000000401', 'wrong-token-attempt-1234567890',
      '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201',
      now() - interval '2 minutes', 'evt-bad-token-1', 12.0, 90.0, 75.0, 1800, 85.0, 121.0, 'working'
    )
  $$,
  '42501',
  null,
  'wrong device token is rejected inside PostgreSQL'
);

-- 10. Revoked device is rejected even with valid token (42501).
select throws_ok(
  $$
    select public.ingest_authenticated_device_telemetry(
      '35000000-0000-4000-8000-000000000402', 'secret-device-token-revoked-002',
      '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201',
      now() - interval '2 minutes', 'evt-revoked-1', 12.0, 90.0, 75.0, 1800, 85.0, 121.0, 'working'
    )
  $$,
  '42501',
  null,
  'revoked device cannot submit telemetry'
);

-- 11. Authenticated Device A CANNOT submit telemetry for Farm B's machinery (42501).
select throws_ok(
  $$
    select public.ingest_authenticated_device_telemetry(
      '35000000-0000-4000-8000-000000000401', 'secret-device-token-farm-a-001',
      '35000000-0000-4000-8000-000000000102', '35000000-0000-4000-8000-000000000202',
      now() - interval '2 minutes', 'evt-cross-farm-1', 12.0, 90.0, 75.0, 1800, 85.0, 201.0, 'working'
    )
  $$,
  '42501',
  null,
  'authenticated device cannot submit telemetry for another farm machinery asset'
);

-- 12. [Positive] Legitimate authenticated device ingestion succeeds with device_authenticated + verified_current.
select is(
  (public.ingest_authenticated_device_telemetry(
    '35000000-0000-4000-8000-000000000401', 'secret-device-token-farm-a-001',
    '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201',
    now() - interval '2 minutes', 'evt-valid-001', 14.5, 180.0, 72.0, 1950, 86.5, 121.5, 'working'
  ) ->> 'trust_classification'),
  'verified_current',
  'legitimate authenticated device records device_authenticated / verified_current telemetry'
);

-- 13. Duplicate/replayed device_event_id is rejected by unique index (23505).
select throws_ok(
  $$
    select public.ingest_authenticated_device_telemetry(
      '35000000-0000-4000-8000-000000000401', 'secret-device-token-farm-a-001',
      '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201',
      now() - interval '1 minute', 'evt-valid-001', 14.5, 180.0, 72.0, 1950, 86.5, 121.5, 'working'
    )
  $$,
  '23505',
  null,
  'duplicate/replayed device_event_id is rejected'
);

-- 14. [Positive] Legitimate trusted provider ingestion succeeds with trusted_provider_integration + verified_current.
select is(
  (public.ingest_provider_machinery_telemetry(
    'teltonika_fmb',
    '35000000-0000-4000-8000-000000000101', '35000000-0000-4000-8000-000000000201',
    now() - interval '1 minute', 'prov-evt-001', 15.0, 185.0, 71.0, 2000, 87.0, 121.8, 'working'
  ) ->> 'source_category'),
  'trusted_provider_integration',
  'trusted provider ingestion records trusted_provider_integration / verified_current telemetry'
);

------------------------------------------------------------------------------------------------
-- Immutability, Audited Transition & Cross-Tenant RLS Tests
------------------------------------------------------------------------------------------------
reset role;

-- 15. Immutable provenance & reading fields cannot be modified even by direct UPDATE (42501).
select throws_ok(
  $$
    update public.machinery_telemetry
       set engine_hours = 999.0
     where device_event_id = 'evt-valid-001'
  $$,
  '42501',
  null,
  'telemetry sensor readings and provenance fields are immutable'
);

-- 16. Direct trust_classification UPDATE bypassing audited transition RPC is rejected (42501).
select throws_ok(
  $$
    update public.machinery_telemetry
       set validation_status = 'rejected', trust_classification = 'invalid_rejected'
     where device_event_id = 'evt-valid-001'
  $$,
  '42501',
  null,
  'trust state cannot be mutated without audited transition RPC'
);

-- 17. [Positive] Staff can quarantine faulty telemetry via audited transition RPC, writing audit_log entry.
set local role authenticated;
select set_config('request.jwt.claim.sub', '35000000-0000-4000-8000-000000000003', true);

select is(
  (public.transition_machinery_telemetry_trust(
    (select id from public.machinery_telemetry where device_event_id = 'prov-evt-001'),
    'rejected', 'invalid_rejected', 'Sensor drift confirmed by technician'
  ) ->> 'new_trust_state'),
  'invalid_rejected',
  'staff can quarantine telemetry to invalid_rejected via audited transition RPC'
);

-- 18. Cannot promote farmer_observation to verified_current (CHECK constraint 23514).
select throws_ok(
  $$
    select public.transition_machinery_telemetry_trust(
      (select id from public.machinery_telemetry where source_category = 'farmer_observation' limit 1),
      'verified', 'verified_current', 'Attempt invalid promotion'
    )
  $$,
  '23514',
  null,
  'farmer_observation cannot be promoted to verified_current'
);

-- 19. [Positive] Audit log recorded ingestion & trust transition with zero raw device tokens.
reset role;
select ok(
  exists (
    select 1 from public.audit_log
     where action = 'machinery_telemetry_device_ingested'
       and metadata ->> 'source_device_id' = '35000000-0000-4000-8000-000000000401'
       and metadata::text not like '%secret-device-token%'
  )
  and exists (
    select 1 from public.audit_log
     where action = 'machinery_telemetry_trust_transitioned'
       and actor_id = '35000000-0000-4000-8000-000000000003'
       and metadata ->> 'previous_trust_state' = 'verified_current'
       and metadata ->> 'new_trust_state' = 'invalid_rejected'
  ),
  'audit_log retains device ingestion and trust transition attribution without leaking raw tokens'
);

-- 20. Cross-tenant RLS: Farmer B sees ZERO rows from Farm A telemetry.
set local role authenticated;
select set_config('request.jwt.claim.sub', '35000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::int from public.machinery_telemetry where farm_id = '35000000-0000-4000-8000-000000000101'),
  0,
  'cross-tenant RLS blocks Farmer B from reading Farm A machinery telemetry'
);

select * from finish();
rollback;
