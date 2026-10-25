-- Weather as a switchable integration (NiMet by default since 20261013140000, WeatherAPI.com kept as an
-- option) and its service-only cache.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select is((select active_provider from public.integration_settings where kind = 'weather'), 'nimet',
  'NiMet is the weather provider in use');
select is((select mode::text from public.integration_configs where provider = 'weatherapi'), 'live',
  'WeatherAPI.com starts in live mode, where its key belongs');
select ok((select test_only from public.integration_providers where code = 'open_meteo'),
  'free Open-Meteo is test-only (refused in production)');

set local role service_role;
select is((public.integration_runtime('weather') ->> 'missing'), '["key:api_key"]',
  'until staff add the key, the runtime reports it missing');
select is((public.integration_runtime('weather') -> 'config' ->> 'base_url'), 'https://api.nimet.gov.ng/api', 'NiMet''s API address is filled in by default');
reset role;

insert into auth.users (id, phone) values ('a0000000-0000-0000-0000-000000000001', '2348000001001');
insert into public.admin_roles (profile_id, admin_role) values ('a0000000-0000-0000-0000-000000000001', 'super_admin');
insert into public.weather_cache (provider, payload) values ('weatherapi', '{"forecasts": []}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001"}', true);
select throws_ok($$ select * from public.weather_cache $$, '42501', null, 'even staff cannot read the cache directly');
select lives_ok($$ select public.admin_set_integration_secret('nimet', 'live', 'api_key', 'NMtestkey00000000000000000000') $$,
  'staff with integrations.manage store the NiMet key (encrypted in Vault)');
reset role;
set local role service_role;
select is((public.integration_runtime('weather') ->> 'missing'), '[]', 'with the key stored, weather is ready');
reset role;
set local role anon;
select throws_ok($$ select * from public.weather_cache $$, '42501', null, 'visitors cannot read the cache');

select * from finish();
rollback;
