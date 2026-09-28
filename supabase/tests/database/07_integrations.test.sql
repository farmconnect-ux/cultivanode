-- Switchable providers: only integrations.manage can change them, keys are write-only,
-- activation needs a ready provider, and ID checks refuse an ID already used on another account.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

insert into auth.users (id, phone, raw_user_meta_data) values
  ('10000000-0000-0000-0000-0000000000a1', '2348000000401', '{"full_name":"Farmer Ada"}'),
  ('10000000-0000-0000-0000-0000000000a2', '2348000000402', '{"full_name":"Farmer Bayo"}'),
  ('10000000-0000-0000-0000-0000000000a3', '2348000000403', '{"full_name":"Officer Chi"}'),
  ('10000000-0000-0000-0000-0000000000a4', '2348000000404', '{"full_name":"Super Dayo"}');
insert into public.admin_roles (profile_id, admin_role) values
  ('10000000-0000-0000-0000-0000000000a3', 'verification_officer'),
  ('10000000-0000-0000-0000-0000000000a4', 'super_admin');

---------------------------------------------------------------- defaults
select is((select active_provider from public.integration_settings where kind = 'sms'), 'mock_sms',
  'SMS starts on the test provider');
select is((select active_provider from public.integration_settings where kind = 'identity'), 'mock_identity',
  'identity checks start on the test provider');
select ok(exists (select 1 from vault.secrets where name = 'id_hash_pepper'),
  'an ID fingerprint key is generated in the vault');

---------------------------------------------------------------- who can manage
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000a1"}', true);
select throws_ok($$ select public.admin_integration_overview() $$, '42501', null,
  'a farmer cannot see provider settings');
select throws_ok($$ select public.admin_set_integration_secret('termii', 'live', 'api_key', 'TL-abcdefghijklmnop') $$,
  '42501', null, 'a farmer cannot set provider keys');
select throws_ok($$ select * from public.integration_secrets $$, '42501', null,
  'apps cannot read the key table directly');
select throws_ok($$ select * from public.integration_providers $$, '42501', null,
  'apps cannot read the provider table directly');
select throws_ok($$ select public.integration_runtime('sms') $$, '42501', null,
  'apps cannot call the server-side runtime lookup');

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000a3"}', true);
select throws_ok($$ select public.admin_activate_integration('sms', 'termii') $$, '42501', null,
  'a verification officer cannot switch providers');

---------------------------------------------------------------- super admin configures Termii
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000a4"}', true);
select ok(jsonb_array_length(public.admin_integration_overview() -> 'providers') >= 7,
  'a super admin sees the provider catalogue');
select throws_ok($$ select public.admin_activate_integration('sms', 'termii') $$, '22023', null,
  'Termii cannot be activated before its key and sender ID are set');
select throws_ok($$ select public.admin_activate_integration('identity', 'dojah') $$, '22023',
  'this provider is not available yet', 'a provider without an adapter cannot be activated');
select throws_ok($$ select public.admin_activate_integration('identity', 'termii') $$, '22023', null,
  'an SMS provider cannot be used for identity checks');
select throws_ok($$ select public.admin_save_integration_config('termii', 'test', '{"colour":"red"}') $$, '22023', null,
  'unknown settings are refused');
select throws_ok($$ select public.admin_save_integration_config('termii', 'test', '{"channel":"carrier-pigeon"}') $$,
  '22023', null, 'settings outside their allowed options are refused');
select throws_ok($$ select public.admin_save_integration_config('termii', 'test', '{"base_url":"http://evil.example"}') $$,
  '22023', null, 'provider addresses must use https');
select lives_ok($$ select public.admin_save_integration_config('termii', 'test', '{"sender_id":"Tillmate","channel":"dnd"}') $$,
  'valid Termii settings are saved');
select throws_ok($$ select public.admin_set_integration_secret('termii', 'test', 'api_key', 'has space in it') $$, '22023', null,
  'keys with spaces are refused');
select lives_ok($$ select public.admin_set_integration_secret('termii', 'test', 'api_key', 'TLtestkey1234567890WXYZ') $$,
  'a Termii test key is stored');
select is((public.admin_integration_overview() #>> '{providers}')::jsonb @? '$[*] ? (@.code == "termii").secrets[*] ? (@.hint == "WXYZ")',
  true, 'the overview shows only the last four characters of the key');
select ok(position('TLtestkey1234567890WXYZ' in public.admin_integration_overview()::text) = 0,
  'the overview never contains the key itself');
select lives_ok($$ select public.admin_activate_integration('sms', 'termii') $$,
  'Termii is activated once it is ready');
select lives_ok($$ select public.admin_set_integration_secret('termii', 'test', 'api_key', 'TLrotatedkey0000000ABCD') $$,
  'the key can be replaced');
select throws_ok($$ select public.admin_set_integration_mode('termii', 'live') $$, '22023', null,
  'an active provider cannot switch to a mode that has no key');
select lives_ok($$ select public.admin_save_integration_config('termii', 'live', '{"sender_id":"Tillmate"}') $$,
  'live settings can be prepared while test mode stays in use');
select is((public.admin_integration_overview() #>> '{providers}')::jsonb @? '$[*] ? (@.code == "termii" && @.mode == "test")',
  true, 'saving live settings does not switch the mode');

reset role;
select is((select count(*)::int from vault.secrets where name = 'integration:termii:test:api_key'), 1,
  'replacing a key updates the vault entry instead of adding one');
select is((public.integration_runtime('sms') #>> '{secrets,api_key}'), 'TLrotatedkey0000000ABCD',
  'server code gets the current key');
select is((public.integration_runtime('sms') #>> '{config,base_url}'), 'https://v3.api.termii.com',
  'server code gets defaults for settings left blank');
select is((public.integration_runtime('sms') ->> 'provider'), 'termii', 'server code sees the active provider');
select ok(not exists (select 1 from public.audit_log where metadata::text like '%TLrotatedkey%' or coalesce(new_values::text, '') like '%TLrotatedkey%'),
  'no key value reaches the audit log');
select ok(exists (select 1 from public.admin_actions where action = 'integration_activated' and reason = 'sms -> termii'),
  'switching provider is recorded as a staff action');
select ok(exists (select 1 from public.audit_log where action = 'integration_settings_update'),
  'the provider switch is in the audit log with old and new values');

---------------------------------------------------------------- identity results
select is(public.record_identity_verification('10000000-0000-0000-0000-0000000000a1', 'nin', true, 'prembly', 'ref-1',
          '*******8901', repeat('a', 64), 0.95) ->> 'status', 'verified', 'a first NIN check is recorded as verified');
select is((select verification_tier from public.profiles where id = '10000000-0000-0000-0000-0000000000a1'), 1::smallint,
  'a verified NIN raises the tier to 1');
select is(public.record_identity_verification('10000000-0000-0000-0000-0000000000a2', 'nin', true, 'prembly', 'ref-2',
          '*******8901', repeat('a', 64), 0.97) ->> 'failure_reason', 'already_linked',
  'the same NIN on a second account is refused');
select is((select verification_tier from public.profiles where id = '10000000-0000-0000-0000-0000000000a2'), 0::smallint,
  'the second account stays at tier 0');

select is(public.record_bank_account_verification('10000000-0000-0000-0000-0000000000a1', '044', 'Access Bank', 'ADA OBI',
          '6789', 'prembly', true, repeat('b', 64), 1) ->> 'status', 'verified', 'a checked bank account is stored as verified');
select is(public.record_bank_account_verification('10000000-0000-0000-0000-0000000000a2', '044', 'Access Bank', 'ADA OBI',
          '6789', 'prembly', true, repeat('b', 64), 1) ->> 'failure_reason', 'already_linked',
  'the same bank account on a second profile is refused');

select * from finish();
rollback;
