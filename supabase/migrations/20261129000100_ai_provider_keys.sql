-- AI provider keys in Admin > Integrations.
--
-- The farm assistant and photo analysis call Claude first, then Gemini, then OpenAI, then the built-in
-- rule-based advice. Until now their keys were Vercel environment variables, so changing a key meant a
-- redeploy. Now staff paste the keys in Admin > Integrations and they live in Vault like every other key.
-- The web server reads them through public.ai_provider_runtime() (service role only) and caches them for a
-- minute. A provider with no key saved here still uses its Vercel variable, so nothing changes until a key
-- is pasted. Model fields are optional: empty means the Vercel variable, then the built-in default.

insert into public.integration_providers
  (code, kind, name, description, docs_url, implemented, test_only, config_fields, secret_fields, sort_order)
values
  ('claude', 'ai', 'Claude (Anthropic)',
   'Answers first. If the first model fails, the second model is tried, then Gemini.',
   'https://console.anthropic.com/settings/keys', true, false,
   '[{"key":"model","label":"Model","required":false,"help":"Leave empty for the default (claude-sonnet-5-5)."},
     {"key":"fallback_model","label":"Second model","required":false,"help":"Tried when the first model fails. Leave empty for the default (claude-haiku-5-5)."}]',
   '[{"key":"api_key","label":"API key","required":true,"help":"Starts with sk-ant-."}]', 10),
  ('gemini', 'ai', 'Gemini (Google)',
   'Answers when Claude is not set up or fails.',
   'https://aistudio.google.com/app/apikey', true, false,
   '[{"key":"model","label":"Model","required":false,"help":"Leave empty for the default (gemini-flash-latest)."}]',
   '[{"key":"api_key","label":"API key","required":true}]', 20),
  ('openai', 'ai', 'OpenAI',
   'Answers when Claude and Gemini are not set up or fail. Built-in advice is the last resort.',
   'https://platform.openai.com/api-keys', true, false,
   '[{"key":"model","label":"Model","required":false,"help":"Leave empty for the default (gpt-4o-mini)."}]',
   '[{"key":"api_key","label":"API key","required":true,"help":"Starts with sk-."}]', 30)
on conflict (code) do nothing;

insert into public.integration_configs (provider, mode) values ('claude', 'live'), ('gemini', 'live'), ('openai', 'live')
on conflict (provider) do nothing;
-- All three are used in a fixed order; the setting only records that the kind exists.
insert into public.integration_settings (kind, active_provider) values ('ai', 'claude')
on conflict (kind) do nothing;

-- Every AI provider's settings and keys in one call, for the web server. Service role only.
create or replace function public.ai_provider_runtime()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(p.code, public.integration_runtime('ai', p.code)), '{}'::jsonb)
    from public.integration_providers p
   where p.kind = 'ai' and p.implemented;
$$;
revoke all on function public.ai_provider_runtime() from public, anon, authenticated;
grant execute on function public.ai_provider_runtime() to service_role;
