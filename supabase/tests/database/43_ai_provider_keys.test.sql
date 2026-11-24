-- AI provider keys in Admin > Integrations: providers, and the service-role-only runtime read.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select is((select count(*)::int from public.integration_providers where kind = 'ai' and code in ('claude', 'gemini', 'openai')), 3,
  'Claude, Gemini and OpenAI are registered as AI providers');
select ok((select bool_and(mode = 'live') from public.integration_configs where provider in ('claude', 'gemini', 'openai')),
  'the AI providers run in live mode');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"43000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$ select public.ai_provider_runtime() $$, '42501', null, 'signed-in people cannot read AI keys');
reset role;
set local role anon;
select throws_ok($$ select public.ai_provider_runtime() $$, '42501', null, 'visitors cannot read AI keys');
reset role;

set local role service_role;
select is((select array_agg(k order by k) from jsonb_object_keys(public.ai_provider_runtime()) k), array['claude', 'gemini', 'openai'],
  'the web server reads all three providers in one call');
select is(public.ai_provider_runtime() -> 'claude' -> 'missing', '["key:api_key"]'::jsonb,
  'a provider without a saved key says so (the web server then uses its Vercel variable)');
reset role;

select * from finish();
rollback;
