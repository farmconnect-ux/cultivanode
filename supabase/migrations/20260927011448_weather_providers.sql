-- Weather providers, chosen and keyed in Admin > Integrations like SMS and identity.
--   weatherapi: WeatherAPI.com (commercial use allowed on paid plans). Key stored in Vault.
--   open_meteo: free, non-commercial only, so it is marked test-only (refused when APP_ENV=production).
-- The `weather` Edge Function fetches forecasts for the pilot states and caches them in weather_cache
-- for 30 minutes so the provider is called at most 6 times per half hour.

insert into public.integration_providers
  (code, kind, name, description, docs_url, implemented, test_only, config_fields, secret_fields, sort_order)
values
  ('weatherapi', 'weather', 'WeatherAPI.com',
   'Current weather and daily forecasts for the pilot states. The number of forecast days depends on your plan (free plans return 3).',
   'https://www.weatherapi.com/docs/', true, false,
   '[{"key":"days","label":"Forecast days","required":true,"default":"7","options":["3","7","10","14"],"help":"Days to request; your plan may return fewer."}]',
   '[{"key":"api_key","label":"API key","required":true,"help":"From your WeatherAPI.com dashboard."}]', 10),
  ('open_meteo', 'weather', 'Open-Meteo (free, non-commercial)',
   'Free forecasts without a key, for development. Commercial use needs an Open-Meteo plan, so it is refused in production.',
   'https://open-meteo.com/en/docs', true, true, '[]', '[]', 90);

-- WeatherAPI keys are live keys; start it in live mode so the key goes where it will be used.
insert into public.integration_configs (provider, mode) values ('weatherapi', 'live');
insert into public.integration_settings (kind, active_provider) values ('weather', 'weatherapi');

-- Latest forecast per provider. Written by the Edge Function (service role) only; no API access.
create table public.weather_cache (
  provider    text primary key references public.integration_providers (code) on delete cascade,
  payload     jsonb not null,
  fetched_at  timestamptz not null default now()
);
comment on table public.weather_cache is 'Last pilot-state forecast per weather provider (30-minute cache). Service role only.';
alter table public.weather_cache enable row level security;
revoke all on public.weather_cache from anon, authenticated;
