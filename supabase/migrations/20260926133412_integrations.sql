-- CultivaNode: switchable service providers (SMS, identity checks), configured by staff in the admin console.
--
-- * integration_providers  catalogue of providers the code has an adapter for (changed by migrations only)
-- * integration_settings   which provider is active for each kind (sms, identity)
-- * integration_configs    non-secret settings per provider and per mode (test / live)
-- * integration_secrets    API keys, stored encrypted in Supabase Vault; the apps can never read them back
-- * integration_events     delivery / check log without personal data, for the admin health view
--
-- Staff with `integrations.manage` change all of this through the admin_* functions below. Edge Functions
-- (service role) read the active provider and its keys through integration_runtime().

------------------------------------------------------------------------------------------------
-- 1. Types and permission
------------------------------------------------------------------------------------------------

create type public.integration_kind as enum ('sms', 'identity');
create type public.integration_mode as enum ('test', 'live');

insert into public.permissions (permission, description) values
  ('integrations.manage', 'Choose SMS and identity providers, set their API keys and switch test/live');
-- Only super_admin (who holds every permission) gets it by default.

------------------------------------------------------------------------------------------------
-- 2. Tables
------------------------------------------------------------------------------------------------

create table public.integration_providers (
  code           text primary key check (code ~ '^[a-z][a-z0-9_]{1,39}$'),
  kind           public.integration_kind not null,
  name           text not null,
  description    text not null,
  docs_url       text,
  -- true when an adapter exists in supabase/functions/_shared/providers; only these can be activated
  implemented    boolean not null default false,
  -- a provider for development only (fake results); refused by the Edge Functions when APP_ENV=production
  test_only      boolean not null default false,
  -- [{ "key", "label", "required", "default", "options"?, "help"? }]
  config_fields  jsonb not null default '[]'::jsonb check (jsonb_typeof(config_fields) = 'array'),
  -- [{ "key", "label", "required", "help"? }]
  secret_fields  jsonb not null default '[]'::jsonb check (jsonb_typeof(secret_fields) = 'array'),
  sort_order     smallint not null default 100,
  unique (code, kind)
);
comment on table public.integration_providers is
  'Providers the platform has an adapter for. Changed by migrations only; staff pick among them.';

create table public.integration_settings (
  kind             public.integration_kind primary key,
  active_provider  text not null,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references public.profiles (id) on delete set null,
  -- the active provider must be of the same kind
  foreign key (active_provider, kind) references public.integration_providers (code, kind)
);
comment on table public.integration_settings is 'The provider in use for each kind of service.';

create table public.integration_configs (
  provider    text primary key references public.integration_providers (code) on delete cascade,
  mode        public.integration_mode not null default 'test',
  -- non-secret settings, keyed by mode: { "test": {...}, "live": {...} }
  config      jsonb not null default '{"test": {}, "live": {}}'::jsonb
              check (jsonb_typeof(config) = 'object' and jsonb_typeof(config -> 'test') = 'object'
                     and jsonb_typeof(config -> 'live') = 'object'),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id) on delete set null
);
comment on table public.integration_configs is 'Current mode and non-secret settings per provider.';

create table public.integration_secrets (
  provider         text not null references public.integration_providers (code) on delete cascade,
  mode             public.integration_mode not null,
  field            text not null check (field ~ '^[a-z][a-z0-9_]{1,39}$'),
  vault_secret_id  uuid not null,
  -- last four characters for recognition only (null for short values)
  hint             text check (hint is null or hint ~ '^.{4}$'),
  updated_at       timestamptz not null default now(),
  updated_by       uuid references public.profiles (id) on delete set null,
  primary key (provider, mode, field)
);
comment on table public.integration_secrets is
  'Pointers to API keys held encrypted in Supabase Vault. The key itself is never readable by apps.';

create table public.integration_events (
  id           bigint generated always as identity primary key,
  kind         public.integration_kind not null,
  provider     text not null,
  mode         public.integration_mode not null,
  operation    text not null check (operation ~ '^[a-z][a-z0-9_]{1,39}$'),
  success      boolean not null,
  http_status  smallint,
  error_code   text check (error_code is null or char_length(error_code) <= 80),
  duration_ms  integer check (duration_ms is null or duration_ms >= 0),
  created_at   timestamptz not null default now()
);
create index integration_events_recent_idx on public.integration_events (kind, created_at desc);
comment on table public.integration_events is 'One row per provider call. Never holds phone numbers, IDs or codes.';

create index integration_settings_updated_by_idx on public.integration_settings (updated_by);
create index integration_configs_updated_by_idx on public.integration_configs (updated_by);
create index integration_secrets_updated_by_idx on public.integration_secrets (updated_by);
create index integration_settings_provider_idx on public.integration_settings (active_provider, kind);

create trigger integration_settings_audit after insert or update or delete on public.integration_settings
  for each row execute function private.audit_row_change();
create trigger integration_configs_audit after insert or update or delete on public.integration_configs
  for each row execute function private.audit_row_change();
-- integration_secrets is audited by the admin functions (field names only), never by row images.

------------------------------------------------------------------------------------------------
-- 3. Catalogue and defaults
------------------------------------------------------------------------------------------------

insert into public.integration_providers
  (code, kind, name, description, docs_url, implemented, test_only, config_fields, secret_fields, sort_order)
values
  ('mock_sms', 'sms', 'Test SMS (no messages sent)',
   'Accepts every message and sends nothing. Sign in with the test phone numbers set in Supabase Auth.',
   null, true, true, '[]', '[]', 90),
  ('termii', 'sms', 'Termii',
   'Nigerian SMS gateway. Use the DND channel for sign-in codes so they reach numbers on Do-Not-Disturb.',
   'https://developers.termii.com/messaging-api', true, false,
   '[{"key":"base_url","label":"Base URL","required":true,"default":"https://v3.api.termii.com","help":"Shown on your Termii dashboard (Settings > API)."},
     {"key":"sender_id","label":"Sender ID","required":true,"help":"An approved sender ID, 3 to 11 characters."},
     {"key":"channel","label":"Channel","required":true,"default":"dnd","options":["dnd","generic","whatsapp"],"help":"dnd reaches numbers on Do-Not-Disturb; ask Termii to activate the DND route."},
     {"key":"message_template","label":"Message","required":true,"default":"Your {brand} code is {code}. Do not share it with anyone.","help":"{brand} and {code} are filled in. Keep it under 160 characters."}]',
   '[{"key":"api_key","label":"API key","required":true}]', 10),
  ('twilio', 'sms', 'Twilio',
   'International SMS gateway. Adapter not built yet.', 'https://www.twilio.com/docs/sms', false, false,
   '[]', '[]', 20),
  ('mock_identity', 'identity', 'Test identity checks (fake results)',
   'Any 11-digit NIN or BVN passes using the name on the profile, except 00000000000, which is not found. Development only.',
   null, true, true, '[]', '[]', 90),
  ('prembly', 'identity', 'Prembly (IdentityPass)',
   'NIN, BVN and bank account checks. Sandbox and live use the same URL; the API key decides which one runs.',
   'https://docs.prembly.com', true, false,
   '[{"key":"base_url","label":"Base URL","required":true,"default":"https://api.prembly.com"},
     {"key":"nin_path","label":"NIN endpoint","required":true,"default":"/verification/vnin"},
     {"key":"bvn_path","label":"BVN endpoint","required":true,"default":"/verification/bvn_validation"},
     {"key":"bank_account_path","label":"Bank account endpoint","required":true,"default":"/verification/bank_account/basic"}]',
   '[{"key":"api_key","label":"API key (x-api-key)","required":true},
     {"key":"app_id","label":"App ID (older endpoints only)","required":false}]', 10),
  ('dojah', 'identity', 'Dojah', 'Identity checks. Adapter not built yet.', 'https://docs.dojah.io', false, false,
   '[]', '[]', 20),
  ('smile_id', 'identity', 'Smile ID', 'Identity checks. Adapter not built yet.', 'https://docs.usesmileid.com',
   false, false, '[]', '[]', 30);

insert into public.integration_settings (kind, active_provider) values
  ('sms', 'mock_sms'),
  ('identity', 'mock_identity');

-- Pepper for one-way ID fingerprints (duplicate NIN/BVN detection without storing the numbers).
-- Generated in the database; it never appears in the repository.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'id_hash_pepper') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
                                'id_hash_pepper', 'CultivaNode: HMAC key for ID fingerprints');
  end if;
end $$;

------------------------------------------------------------------------------------------------
-- 4. Identity results: fingerprint, name match, failure reason; bank accounts from ID providers
------------------------------------------------------------------------------------------------

alter table public.verifications
  add column id_hash        text check (id_hash is null or id_hash ~ '^[0-9a-f]{64}$'),
  add column name_match     numeric(4, 3) check (name_match is null or name_match between 0 and 1),
  add column failure_reason text check (failure_reason is null or failure_reason ~ '^[a-z_]{2,40}$');
create index verifications_id_hash_idx on public.verifications (kind, id_hash) where id_hash is not null;
comment on column public.verifications.id_hash is 'HMAC-SHA256 of the ID number with a secret pepper. Detects one ID on two accounts.';

alter table public.bank_accounts drop constraint bank_accounts_provider_check;
alter table public.bank_accounts add constraint bank_accounts_provider_check
  check (provider ~ '^[a-z][a-z0-9_]{1,39}$');
alter table public.bank_accounts
  add column id_hash text check (id_hash is null or id_hash ~ '^[0-9a-f]{64}$'),
  add column name_match numeric(4, 3) check (name_match is null or name_match between 0 and 1),
  add column failure_reason text check (failure_reason is null or failure_reason ~ '^[a-z_]{2,40}$');
create index bank_accounts_id_hash_idx on public.bank_accounts (id_hash) where id_hash is not null;

------------------------------------------------------------------------------------------------
-- 5. Admin functions (integrations.manage)
------------------------------------------------------------------------------------------------

create or replace function private.require_permission(p_permission text)
returns void
language plpgsql stable
set search_path = ''
as $$
begin
  if not public.has_permission(p_permission) then
    raise exception 'permission denied: %', p_permission using errcode = '42501';
  end if;
end;
$$;

-- Everything the Integrations page shows. Keys are reported as set / not set with a hint, never returned.
create or replace function public.admin_integration_overview()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform private.require_permission('integrations.manage');
  return jsonb_build_object(
    'settings', (select coalesce(jsonb_agg(jsonb_build_object(
                   'kind', s.kind, 'active_provider', s.active_provider, 'updated_at', s.updated_at)
                   order by s.kind), '[]'::jsonb)
                   from public.integration_settings s),
    'providers', (select coalesce(jsonb_agg(jsonb_build_object(
                   'code', p.code, 'kind', p.kind, 'name', p.name, 'description', p.description,
                   'docs_url', p.docs_url, 'implemented', p.implemented, 'test_only', p.test_only,
                   'config_fields', p.config_fields, 'secret_fields', p.secret_fields,
                   'mode', coalesce(c.mode, 'test'),
                   'config', coalesce(c.config, '{"test": {}, "live": {}}'::jsonb),
                   'secrets', (select coalesce(jsonb_agg(jsonb_build_object(
                                 'mode', x.mode, 'field', x.field, 'hint', x.hint, 'updated_at', x.updated_at)
                                 order by x.mode, x.field), '[]'::jsonb)
                                 from public.integration_secrets x where x.provider = p.code),
                   'last_event', (select jsonb_build_object('success', e.success, 'operation', e.operation,
                                    'error_code', e.error_code, 'created_at', e.created_at)
                                    from public.integration_events e
                                   where e.provider = p.code order by e.created_at desc limit 1))
                   order by p.kind, p.sort_order, p.code), '[]'::jsonb)
                   from public.integration_providers p
                   left join public.integration_configs c on c.provider = p.code)
  );
end;
$$;

create or replace function public.admin_save_integration_config(
  p_provider text, p_mode public.integration_mode, p_config jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_provider public.integration_providers;
  v_allowed  text[];
  v_key      text;
  v_value    jsonb;
  v_field    jsonb;
begin
  perform private.require_permission('integrations.manage');
  select * into v_provider from public.integration_providers where code = p_provider;
  if not found then
    raise exception 'unknown provider' using errcode = '22023';
  end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'settings must be an object' using errcode = '22023';
  end if;

  select coalesce(array_agg(f ->> 'key'), '{}') into v_allowed
    from jsonb_array_elements(v_provider.config_fields) f;
  for v_key, v_value in select * from jsonb_each(p_config) loop
    if not v_key = any (v_allowed) then
      raise exception 'unknown setting: %', v_key using errcode = '22023';
    end if;
    if jsonb_typeof(v_value) <> 'string' or char_length(v_value #>> '{}') > 500 then
      raise exception 'setting % must be text of at most 500 characters', v_key using errcode = '22023';
    end if;
    select f into v_field from jsonb_array_elements(v_provider.config_fields) f where f ->> 'key' = v_key;
    if v_field ? 'options' and not (v_field -> 'options') ? (v_value #>> '{}') then
      raise exception 'setting % must be one of %', v_key, v_field -> 'options' using errcode = '22023';
    end if;
    if v_key = 'message_template' and position('{code}' in (v_value #>> '{}')) = 0 then
      raise exception 'the message must contain {code}' using errcode = '22023';
    end if;
    if v_key like '%url' and (v_value #>> '{}') !~ '^https://[A-Za-z0-9.-]+(:[0-9]+)?(/[^\s]*)?$' then
      raise exception 'setting % must be an https:// address', v_key using errcode = '22023';
    end if;
  end loop;

  -- Saving settings for a mode never switches the mode; admin_set_integration_mode() does that.
  insert into public.integration_configs (provider, config, updated_by)
  values (p_provider,
          jsonb_build_object('test', '{}'::jsonb, 'live', '{}'::jsonb) || jsonb_build_object(p_mode::text, p_config),
          auth.uid())
  on conflict (provider) do update
     set config = public.integration_configs.config || jsonb_build_object(p_mode::text, p_config),
         updated_at = now(), updated_by = auth.uid();

  perform private.record_admin_action('integrations.manage', 'integration_config_saved', 'integration_provider',
                                      null, p_provider || ' (' || p_mode || ')');
end;
$$;

create or replace function public.admin_set_integration_secret(
  p_provider text, p_mode public.integration_mode, p_field text, p_value text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_provider public.integration_providers;
  v_existing uuid;
  v_value    text := btrim(p_value);
begin
  perform private.require_permission('integrations.manage');
  select * into v_provider from public.integration_providers where code = p_provider;
  if not found then
    raise exception 'unknown provider' using errcode = '22023';
  end if;
  if not exists (select 1 from jsonb_array_elements(v_provider.secret_fields) f where f ->> 'key' = p_field) then
    raise exception 'unknown key field' using errcode = '22023';
  end if;
  if v_value is null or char_length(v_value) not between 4 and 500 or v_value ~ '\s' then
    raise exception 'key must be 4 to 500 characters without spaces' using errcode = '22023';
  end if;

  select vault_secret_id into v_existing from public.integration_secrets
   where provider = p_provider and mode = p_mode and field = p_field;
  if v_existing is null then
    insert into public.integration_secrets (provider, mode, field, vault_secret_id, hint, updated_by)
    values (p_provider, p_mode, p_field,
            vault.create_secret(v_value, 'integration:' || p_provider || ':' || p_mode || ':' || p_field,
                                'CultivaNode integration key'),
            case when char_length(v_value) >= 12 then right(v_value, 4) end, auth.uid());
  else
    perform vault.update_secret(v_existing, v_value);
    update public.integration_secrets
       set hint = case when char_length(v_value) >= 12 then right(v_value, 4) end,
           updated_at = now(), updated_by = auth.uid()
     where provider = p_provider and mode = p_mode and field = p_field;
  end if;

  -- Field names only: the value never reaches the audit trail.
  perform public.write_audit('integration_secret_set', 'integration_provider', null,
                             jsonb_build_object('provider', p_provider, 'mode', p_mode, 'field', p_field));
  perform private.record_admin_action('integrations.manage', 'integration_secret_set', 'integration_provider',
                                      null, p_provider || ' ' || p_field || ' (' || p_mode || ')');
end;
$$;

create or replace function public.admin_clear_integration_secret(
  p_provider text, p_mode public.integration_mode, p_field text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_existing uuid;
begin
  perform private.require_permission('integrations.manage');
  delete from public.integration_secrets
   where provider = p_provider and mode = p_mode and field = p_field
  returning vault_secret_id into v_existing;
  if v_existing is null then
    raise exception 'no such key' using errcode = 'P0002';
  end if;
  delete from vault.secrets where id = v_existing;
  perform public.write_audit('integration_secret_cleared', 'integration_provider', null,
                             jsonb_build_object('provider', p_provider, 'mode', p_mode, 'field', p_field));
  perform private.record_admin_action('integrations.manage', 'integration_secret_cleared', 'integration_provider',
                                      null, p_provider || ' ' || p_field || ' (' || p_mode || ')');
end;
$$;

create or replace function public.admin_set_integration_mode(p_provider text, p_mode public.integration_mode)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_missing text[];
begin
  perform private.require_permission('integrations.manage');
  if not exists (select 1 from public.integration_providers where code = p_provider) then
    raise exception 'unknown provider' using errcode = '22023';
  end if;
  -- A provider in use must stay working: switch only when the target mode has everything it needs.
  if exists (select 1 from public.integration_settings where active_provider = p_provider) then
    v_missing := private.integration_missing(p_provider, p_mode);
    if cardinality(v_missing) > 0 then
      raise exception 'provider is in use and % mode is not ready: %', p_mode, array_to_string(v_missing, ', ')
        using errcode = '22023';
    end if;
  end if;
  insert into public.integration_configs (provider, mode, updated_by) values (p_provider, p_mode, auth.uid())
  on conflict (provider) do update set mode = excluded.mode, updated_at = now(), updated_by = auth.uid();
  perform private.record_admin_action('integrations.manage', 'integration_mode_set', 'integration_provider',
                                      null, p_provider || ' -> ' || p_mode);
end;
$$;

-- Missing required settings/keys for a provider in a mode (empty array = ready).
create or replace function private.integration_missing(p_provider text, p_mode public.integration_mode)
returns text[]
language sql stable security definer
set search_path = ''
as $$
  select coalesce(array_agg(missing order by missing), '{}') from (
    select 'setting:' || (f ->> 'key') as missing
      from public.integration_providers p, jsonb_array_elements(p.config_fields) f
     where p.code = p_provider and coalesce((f ->> 'required')::boolean, false)
       and coalesce(nullif(btrim((select c.config -> p_mode::text ->> (f ->> 'key')
                                    from public.integration_configs c where c.provider = p_provider)), ''),
                    nullif(f ->> 'default', '')) is null
    union all
    select 'key:' || (f ->> 'key')
      from public.integration_providers p, jsonb_array_elements(p.secret_fields) f
     where p.code = p_provider and coalesce((f ->> 'required')::boolean, false)
       and not exists (select 1 from public.integration_secrets s
                        where s.provider = p_provider and s.mode = p_mode and s.field = f ->> 'key')
  ) m;
$$;

create or replace function public.admin_activate_integration(p_kind public.integration_kind, p_provider text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_provider public.integration_providers;
  v_mode     public.integration_mode;
  v_missing  text[];
begin
  perform private.require_permission('integrations.manage');
  select * into v_provider from public.integration_providers where code = p_provider and kind = p_kind;
  if not found then
    raise exception 'unknown provider for this service' using errcode = '22023';
  end if;
  if not v_provider.implemented then
    raise exception 'this provider is not available yet' using errcode = '22023';
  end if;
  select coalesce((select mode from public.integration_configs where provider = p_provider), 'test') into v_mode;
  v_missing := private.integration_missing(p_provider, v_mode);
  if cardinality(v_missing) > 0 then
    raise exception 'provider is not ready: %', array_to_string(v_missing, ', ') using errcode = '22023';
  end if;

  update public.integration_settings
     set active_provider = p_provider, updated_at = now(), updated_by = auth.uid()
   where kind = p_kind;
  perform private.record_admin_action('integrations.manage', 'integration_activated', 'integration_provider',
                                      null, p_kind || ' -> ' || p_provider);
end;
$$;

------------------------------------------------------------------------------------------------
-- 6. Server-side functions (service role only)
------------------------------------------------------------------------------------------------

-- The active (or a named) provider with its settings for the current mode, defaults filled in, and keys.
create or replace function public.integration_runtime(p_kind public.integration_kind, p_provider text default null)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_code     text;
  v_provider public.integration_providers;
  v_mode     public.integration_mode;
  v_config   jsonb;
  v_secrets  jsonb;
begin
  v_code := coalesce(p_provider, (select active_provider from public.integration_settings where kind = p_kind));
  select * into v_provider from public.integration_providers where code = v_code and kind = p_kind;
  if not found then
    raise exception 'no provider configured for %', p_kind using errcode = 'P0002';
  end if;
  select coalesce((select mode from public.integration_configs where provider = v_code), 'test') into v_mode;

  select coalesce(jsonb_object_agg(f ->> 'key', coalesce(
           nullif(btrim((select c.config -> v_mode::text ->> (f ->> 'key')
                           from public.integration_configs c where c.provider = v_code)), ''),
           f ->> 'default')), '{}'::jsonb)
    into v_config
    from jsonb_array_elements(v_provider.config_fields) f;

  select coalesce(jsonb_object_agg(s.field, d.decrypted_secret), '{}'::jsonb)
    into v_secrets
    from public.integration_secrets s
    join vault.decrypted_secrets d on d.id = s.vault_secret_id
   where s.provider = v_code and s.mode = v_mode;

  return jsonb_build_object(
    'provider', v_code, 'kind', p_kind, 'mode', v_mode,
    'implemented', v_provider.implemented, 'test_only', v_provider.test_only,
    'missing', to_jsonb(private.integration_missing(v_code, v_mode)),
    'config', v_config, 'secrets', v_secrets,
    'hash_pepper', case when p_kind = 'identity'
                        then (select decrypted_secret from vault.decrypted_secrets where name = 'id_hash_pepper') end
  );
end;
$$;

-- Records an ID check result. Refuses an ID already verified on another account.
create or replace function public.record_identity_verification(
  p_profile      uuid,
  p_kind         public.verification_kind,
  p_verified     boolean,
  p_provider     text,
  p_reference    text,
  p_masked       text,
  p_id_hash      text,
  p_name_match   numeric,
  p_failure      text default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_status  public.verification_status := case when p_verified then 'verified' else 'failed' end;
  v_failure text := p_failure;
  v_id      uuid;
begin
  if p_kind not in ('nin', 'bvn') then
    raise exception 'only nin and bvn are recorded here' using errcode = '22023';
  end if;
  if p_verified and p_id_hash is not null and exists (
       select 1 from public.verifications v
        where v.kind = p_kind and v.id_hash = p_id_hash and v.status = 'verified' and v.profile_id <> p_profile) then
    v_status := 'failed';
    v_failure := 'already_linked';
  end if;

  insert into public.verifications
    (profile_id, kind, status, provider, reference, masked_value, verified_at, id_hash, name_match, failure_reason)
  values (p_profile, p_kind, v_status, p_provider, left(p_reference, 120), p_masked,
          case when v_status = 'verified' then now() end, p_id_hash, p_name_match, v_failure)
  returning id into v_id;

  perform public.write_audit('identity_check_' || v_status, 'verification', v_id,
    jsonb_build_object('profile_id', p_profile, 'kind', p_kind, 'provider', p_provider, 'failure', v_failure));
  return jsonb_build_object('id', v_id, 'status', v_status, 'failure_reason', v_failure);
end;
$$;

-- Records a checked payout account. The first verified one becomes the default.
create or replace function public.record_bank_account_verification(
  p_profile      uuid,
  p_bank_code    text,
  p_bank_name    text,
  p_account_name text,
  p_last4        text,
  p_provider     text,
  p_verified     boolean,
  p_id_hash      text,
  p_name_match   numeric,
  p_failure      text default null
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_status  public.verification_status := case when p_verified then 'verified' else 'failed' end;
  v_failure text := p_failure;
  v_id      uuid;
begin
  if p_verified and p_id_hash is not null and exists (
       select 1 from public.bank_accounts b
        where b.id_hash = p_id_hash and b.status = 'verified' and b.profile_id <> p_profile) then
    v_status := 'failed';
    v_failure := 'already_linked';
  end if;
  insert into public.bank_accounts
    (profile_id, bank_code, bank_name, account_name, account_number_last4, provider, status, verified_at,
     is_default, id_hash, name_match, failure_reason, created_by)
  values (p_profile, p_bank_code, p_bank_name, p_account_name, p_last4, p_provider, v_status,
          case when v_status = 'verified' then now() end,
          v_status = 'verified' and not exists (select 1 from public.bank_accounts b where b.profile_id = p_profile and b.is_default),
          p_id_hash, p_name_match, v_failure, p_profile)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'status', v_status, 'failure_reason', v_failure);
end;
$$;

------------------------------------------------------------------------------------------------
-- 7. Row Level Security and grants
------------------------------------------------------------------------------------------------

alter table public.integration_providers enable row level security;
alter table public.integration_settings  enable row level security;
alter table public.integration_configs   enable row level security;
alter table public.integration_secrets   enable row level security;
alter table public.integration_events    enable row level security;

-- Staff read through admin_integration_overview(); no direct table access for apps at all.
revoke all on public.integration_providers, public.integration_settings, public.integration_configs,
              public.integration_secrets, public.integration_events
  from anon, authenticated;
grant select, insert on public.integration_events to service_role;

revoke execute on function
  private.require_permission(text),
  private.integration_missing(text, public.integration_mode)
  from public, anon, authenticated;

revoke execute on function
  public.admin_integration_overview(),
  public.admin_save_integration_config(text, public.integration_mode, jsonb),
  public.admin_set_integration_secret(text, public.integration_mode, text, text),
  public.admin_clear_integration_secret(text, public.integration_mode, text),
  public.admin_set_integration_mode(text, public.integration_mode),
  public.admin_activate_integration(public.integration_kind, text),
  public.integration_runtime(public.integration_kind, text),
  public.record_identity_verification(uuid, public.verification_kind, boolean, text, text, text, text, numeric, text),
  public.record_bank_account_verification(uuid, text, text, text, text, text, boolean, text, numeric, text)
  from public, anon, authenticated;

grant execute on function
  public.admin_integration_overview(),
  public.admin_save_integration_config(text, public.integration_mode, jsonb),
  public.admin_set_integration_secret(text, public.integration_mode, text, text),
  public.admin_clear_integration_secret(text, public.integration_mode, text),
  public.admin_set_integration_mode(text, public.integration_mode),
  public.admin_activate_integration(public.integration_kind, text)
  to authenticated;

grant execute on function
  public.integration_runtime(public.integration_kind, text),
  public.record_identity_verification(uuid, public.verification_kind, boolean, text, text, text, text, numeric, text),
  public.record_bank_account_verification(uuid, text, text, text, text, text, boolean, text, numeric, text)
  to service_role;
