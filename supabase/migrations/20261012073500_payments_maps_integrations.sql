-- CultivaNode: Add Maps and Payment Provider Integrations to Super Admin Catalogue
-- (Paystack, Flutterwave, Stripe, Google Maps)

do $$
begin
  if not exists (select 1 from pg_type where typname = 'integration_kind' and typnamespace = 'public'::regnamespace) then
    create type public.integration_kind as enum ('sms', 'identity', 'weather', 'payment', 'maps');
  else
    alter type public.integration_kind add value if not exists 'payment';
    alter type public.integration_kind add value if not exists 'maps';
  end if;
end $$;

-- Register Payment Providers: Paystack, Flutterwave, Stripe
insert into public.integration_providers (code, kind, name, description, docs_url, implemented, test_only, config_fields, secret_fields, sort_order)
values
  ('paystack', 'payment', 'Paystack',
   'Nigerian-licensed collections and payouts: card, bank transfer and USSD. Automated escrow clearing and outgrower settlements.',
   'https://paystack.com/docs', true, false,
   '[{"key":"public_key","label":"Public Key","required":true,"help":"Starts with pk_test_ or pk_live_."},
     {"key":"base_url","label":"API Base URL","required":true,"default":"https://api.paystack.co"}]'::jsonb,
   '[{"key":"secret_key","label":"Secret Key","required":true,"help":"Starts with sk_test_ or sk_live_."},
     {"key":"webhook_secret","label":"Webhook Secret","required":false,"help":"Verifies x-paystack-signature header."}]'::jsonb,
   10),
  ('flutterwave', 'payment', 'Flutterwave',
   'Pan-African payment processing across Nigeria and ECOWAS (Card, Bank Account, Mobile Money, USSD). Registered for automated milestone escrow.',
   'https://developer.flutterwave.com', true, false,
   '[{"key":"public_key","label":"Public Key","required":true,"help":"Starts with FLWPUBK_TEST- or FLWPUBK-."},
     {"key":"base_url","label":"API Base URL","required":true,"default":"https://api.flutterwave.com/v3"}]'::jsonb,
   '[{"key":"secret_key","label":"Secret Key","required":true,"help":"Starts with FLWSECK_TEST- or FLWSECK-."},
     {"key":"encryption_key","label":"Encryption Key","required":false,"help":"For card tokenization."},
     {"key":"webhook_secret","label":"Webhook Secret","required":false,"help":"Verifies verf-hash header."}]'::jsonb,
   20),
  ('stripe', 'payment', 'Stripe',
   'International multi-currency card collections (Visa, Mastercard, Amex, Apple Pay) for diaspora agricultural investments and export offtake contracts.',
   'https://stripe.com/docs', true, false,
   '[{"key":"publishable_key","label":"Publishable Key","required":true,"help":"Starts with pk_test_ or pk_live_."}]'::jsonb,
   '[{"key":"secret_key","label":"Secret Key","required":true,"help":"Starts with sk_test_ or sk_live_."},
     {"key":"webhook_secret","label":"Webhook Signing Secret","required":false,"help":"Starts with whsec_."}]'::jsonb,
   30)
on conflict (code) do update set
  implemented = excluded.implemented,
  config_fields = excluded.config_fields,
  secret_fields = excluded.secret_fields,
  description = excluded.description;

-- Register Central Maps Provider: Google Maps Platform
insert into public.integration_providers (code, kind, name, description, docs_url, implemented, test_only, config_fields, secret_fields, sort_order)
values
  ('google_maps', 'maps', 'Google Maps Platform',
   'Centrally configured Google Maps Platform for sub-meter cadastral boundary delineation, satellite imagery, Geocoding, and transit routing.',
   'https://developers.google.com/maps', true, false,
   '[{"key":"map_id","label":"Map ID (Optional)","required":false,"help":"Cloud-based map styling ID from Google Cloud Console."},
     {"key":"default_zoom","label":"Default Zoom","required":true,"default":"14","help":"Default zoom level for parcel inspection."}]'::jsonb,
   '[{"key":"api_key","label":"Google Maps API Key","required":true,"help":"API key with Maps JavaScript API, Places API, and Geocoding API enabled."}]'::jsonb,
   10)
on conflict (code) do update set
  implemented = excluded.implemented,
  config_fields = excluded.config_fields,
  secret_fields = excluded.secret_fields,
  description = excluded.description;

-- Initialize default active settings if not set
insert into public.integration_settings (kind, active_provider)
values
  ('payment', 'paystack'),
  ('maps', 'google_maps')
on conflict (kind) do nothing;
