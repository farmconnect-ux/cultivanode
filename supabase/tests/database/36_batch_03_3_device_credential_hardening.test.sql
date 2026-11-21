-- Batch 03.3 pgTAP tests: device credential and device-link hardening (PR #24 review, High 2)
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- Seed: Farmer A (Farm A), Farmer B (Farm B), Staff C (super_admin), one device model and three devices.
insert into auth.users (id, phone)
values
  ('36000000-0000-4000-8000-000000000001', '2348036000001'),
  ('36000000-0000-4000-8000-000000000002', '2348036000002'),
  ('36000000-0000-4000-8000-000000000003', '2348036000003')
on conflict (id) do nothing;

insert into public.admin_roles (profile_id, admin_role)
values ('36000000-0000-4000-8000-000000000003', 'super_admin')
on conflict do nothing;

insert into public.farms (id, owner_id, name, zone, state, location)
values
  ('36000000-0000-4000-8000-000000000101', '36000000-0000-4000-8000-000000000001', 'Farm A Devices', 'derived_savanna', 'Oyo', extensions.st_geogfromtext('POINT(3.947 7.3775)')),
  ('36000000-0000-4000-8000-000000000102', '36000000-0000-4000-8000-000000000002', 'Farm B Devices', 'derived_savanna', 'Oyo', extensions.st_geogfromtext('POINT(3.950 7.3800)'))
on conflict (id) do nothing;

insert into public.farm_machinery_assets (id, farm_id, asset_code, name, category, engine_hours)
values
  ('36000000-0000-4000-8000-000000000201', '36000000-0000-4000-8000-000000000101', 'TR-A36', 'Tractor A36', 'tractor', 10.0),
  ('36000000-0000-4000-8000-000000000202', '36000000-0000-4000-8000-000000000101', 'TR-A37', 'Tractor A37', 'tractor', 12.0)
on conflict (id) do nothing;

insert into public.device_models (id, model_code, name, vendor, connectivity)
values ('36000000-0000-4000-8000-000000000301', 'CN-TEL-M36', 'Machinery Tracker M36', 'CultivaNode', 'cellular_2g_4g')
on conflict (id) do nothing;

-- D1 assigned to Farmer A, D2 assigned to Farmer B, D3 assigned to Farmer A but revoked.
insert into public.devices (id, serial_number, model_id, status, assigned_owner_id, revoked_at)
values
  ('36000000-0000-4000-8000-000000000401', 'CN-36-A', '36000000-0000-4000-8000-000000000301', 'active', '36000000-0000-4000-8000-000000000001', null),
  ('36000000-0000-4000-8000-000000000402', 'CN-36-B', '36000000-0000-4000-8000-000000000301', 'active', '36000000-0000-4000-8000-000000000002', null),
  ('36000000-0000-4000-8000-000000000403', 'CN-36-R', '36000000-0000-4000-8000-000000000301', 'active', '36000000-0000-4000-8000-000000000001', now() - interval '1 day')
on conflict (id) do nothing;

-- 1. Credential columns are no longer writable by app roles; other columns still are.
select ok(
  not has_column_privilege('authenticated', 'public.devices', 'auth_token_hash', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.devices', 'secret_key_hash', 'UPDATE')
  and not has_column_privilege('authenticated', 'public.devices', 'auth_token_hash', 'INSERT')
  and not has_column_privilege('anon', 'public.devices', 'auth_token_hash', 'UPDATE')
  and has_column_privilege('authenticated', 'public.devices', 'battery_level_pct', 'UPDATE'),
  'authenticated cannot write device credential columns but keeps other column grants'
);

-- 2. TRUNCATE (which bypasses RLS) is not granted to app roles.
select ok(
  not has_table_privilege('authenticated', 'public.devices', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.devices', 'TRUNCATE'),
  'authenticated and anon cannot TRUNCATE public.devices'
);

-- 3. Credential issuance is callable by authenticated (staff-checked inside) and service_role, never anon.
select ok(
  has_function_privilege('authenticated', 'public.issue_device_auth_token(uuid)', 'execute')
  and has_function_privilege('service_role', 'public.issue_device_auth_token(uuid)', 'execute')
  and not has_function_privilege('anon', 'public.issue_device_auth_token(uuid)', 'execute'),
  'issue_device_auth_token grants: authenticated and service_role only'
);

-- Act as Farmer A.
set local role authenticated;
select set_config('request.jwt.claim.sub', '36000000-0000-4000-8000-000000000001', true);

-- 4. A farmer cannot mint a device credential, even for their own device.
select throws_ok(
  $$ select public.issue_device_auth_token('36000000-0000-4000-8000-000000000401') $$,
  '42501',
  null,
  'non-staff cannot issue device credentials'
);

-- 5. A farmer cannot link another owner's device to their machinery.
select throws_ok(
  $$
    insert into public.machinery_device_links (farm_id, machinery_id, device_id)
    values ('36000000-0000-4000-8000-000000000101', '36000000-0000-4000-8000-000000000201', '36000000-0000-4000-8000-000000000402')
  $$,
  '42501',
  null,
  'cannot link a device assigned to another owner'
);

-- 6. A farmer can link their own device, and linked_by is forced to the caller.
select lives_ok(
  $$
    insert into public.machinery_device_links (farm_id, machinery_id, device_id, linked_by)
    values (
      '36000000-0000-4000-8000-000000000101', '36000000-0000-4000-8000-000000000201',
      '36000000-0000-4000-8000-000000000401', '36000000-0000-4000-8000-000000000002'
    )
  $$,
  'owner can link a device assigned to them'
);

select is(
  (select linked_by from public.machinery_device_links where device_id = '36000000-0000-4000-8000-000000000401'),
  '36000000-0000-4000-8000-000000000001'::uuid,
  'linked_by is forced to the calling user, not the supplied value'
);

-- 7. A revoked device cannot be linked.
select throws_ok(
  $$
    insert into public.machinery_device_links (farm_id, machinery_id, device_id)
    values ('36000000-0000-4000-8000-000000000101', '36000000-0000-4000-8000-000000000202', '36000000-0000-4000-8000-000000000403')
  $$,
  '22023',
  null,
  'revoked device cannot be linked'
);

-- 8. linked_by cannot be rewritten afterwards.
select throws_ok(
  $$
    update public.machinery_device_links
       set linked_by = '36000000-0000-4000-8000-000000000002'
     where device_id = '36000000-0000-4000-8000-000000000401'
  $$,
  '42501',
  null,
  'linked_by is immutable for end users'
);

-- Act as Staff C.
select set_config('request.jwt.claim.sub', '36000000-0000-4000-8000-000000000003', true);

-- 9. Staff can issue a credential: a 64-character hex token returned once.
select set_config('cultivanode_test.device_token', public.issue_device_auth_token('36000000-0000-4000-8000-000000000401'), true);

select matches(
  current_setting('cultivanode_test.device_token'),
  '^[0-9a-f]{64}$',
  'staff-issued device token is 256-bit hex'
);

-- 10. Issuing for a revoked device is refused.
select throws_ok(
  $$ select public.issue_device_auth_token('36000000-0000-4000-8000-000000000403') $$,
  '22023',
  null,
  'cannot issue a credential for a revoked device'
);

reset role;

-- 11. Only the SHA-256 of the token is stored.
select is(
  (select auth_token_hash from public.devices where id = '36000000-0000-4000-8000-000000000401'),
  encode(extensions.digest(current_setting('cultivanode_test.device_token'), 'sha256'), 'hex'),
  'devices.auth_token_hash stores the SHA-256 of the issued token'
);

-- 12. Issuance is audited without the token or its hash.
select ok(
  exists (
    select 1 from public.audit_log
     where action = 'device_credential_issued'
       and entity = 'device'
       and entity_id = '36000000-0000-4000-8000-000000000401'
       and actor_id = '36000000-0000-4000-8000-000000000003'
       and position(current_setting('cultivanode_test.device_token') in coalesce(new_values::text, '')) = 0
       and position(
         encode(extensions.digest(current_setting('cultivanode_test.device_token'), 'sha256'), 'hex')
         in coalesce(new_values::text, '')
       ) = 0
  ),
  'credential issuance is recorded in audit_log without the token or its hash'
);

select * from finish();
rollback;
