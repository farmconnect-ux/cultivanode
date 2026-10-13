-- Register NiMet (Nigerian Meteorological Agency) as the primary commercial weather provider.
-- Replaces free/non-commercial Open-Meteo with NiMet's official weather data API.
-- Keys are stored encrypted in Supabase Vault and managed through Admin > Integrations.

insert into public.integration_providers
  (code, kind, name, description, docs_url, implemented, test_only, config_fields, secret_fields, sort_order)
values
  ('nimet', 'weather', 'NiMet (Nigerian Meteorological Agency)',
   'Official meteorological forecasts and synoptic station observations across Nigeria from the Nigerian Meteorological Agency (NiMet). Fully licensed for commercial agro-meteorology and pilot state forecasts.',
   'https://nimet.gov.ng', true, false,
   '[{"key":"base_url","label":"API Base URL","required":true,"default":"https://api.nimet.gov.ng/api","help":"NiMet developer API endpoint."},{"key":"station_prefix","label":"Station Prefix","required":false,"default":"","help":"Optional synoptic station identifier prefix."}]'::jsonb,
   '[{"key":"api_key","label":"NiMet API Key","required":true,"help":"From your NiMet Developer Portal dashboard."}]'::jsonb,
   5)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  docs_url = excluded.docs_url,
  implemented = excluded.implemented,
  test_only = excluded.test_only,
  config_fields = excluded.config_fields,
  secret_fields = excluded.secret_fields,
  sort_order = excluded.sort_order;

-- Initialize NiMet config in live mode
insert into public.integration_configs (provider, mode, config)
values ('nimet', 'live', '{"live": {"base_url": "https://api.nimet.gov.ng/api"}, "test": {"base_url": "https://api.nimet.gov.ng/api"}}'::jsonb)
on conflict (provider) do update set mode = 'live';

-- Set NiMet as active weather provider
update public.integration_settings
   set active_provider = 'nimet', updated_at = now()
 where kind = 'weather';
