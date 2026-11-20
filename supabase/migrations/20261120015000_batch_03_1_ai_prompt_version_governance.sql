-- Batch 03.1B M5: immutable prompt versions, recorded validation, and audited
-- activation/rollback. Applied before M3 so AI audit events can reference a version.
-- Management is gated by ai.manage, registered here without granting it to any
-- admin sub-role, so it resolves through the super-admin bypass only.

insert into public.permissions (permission, description)
values ('ai.manage', 'Create, validate, activate and roll back AI prompt versions')
on conflict (permission) do nothing;

create table private.ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null check (prompt_key ~ '^[a-z][a-z0-9_.-]{1,99}$'),
  version text not null check (version ~ '^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$'),
  content text not null check (char_length(content) between 1 and 100000),
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 8192),
  created_by uuid not null references private.ai_actor_directory(actor_subject_id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  unique (prompt_key, version),
  unique (id, prompt_key, version),
  constraint ai_prompt_versions_hash_matches check (
    content_sha256 = encode(extensions.digest(content, 'sha256'), 'hex')
  )
);

create table private.ai_prompt_active_pointers (
  prompt_key text primary key check (prompt_key ~ '^[a-z][a-z0-9_.-]{1,99}$'),
  version_id uuid not null,
  version text not null,
  updated_by uuid not null references private.ai_actor_directory(actor_subject_id) on delete restrict,
  updated_at timestamptz not null default clock_timestamp(),
  foreign key (version_id, prompt_key, version)
    references private.ai_prompt_versions(id, prompt_key, version) on delete restrict
);

create table private.ai_prompt_activation_history (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null,
  from_version text,
  to_version text not null,
  operation text not null check (operation in ('activate', 'rollback')),
  reason text not null check (char_length(reason) between 10 and 500),
  actor_subject_id uuid not null references private.ai_actor_directory(actor_subject_id) on delete restrict,
  created_at timestamptz not null default clock_timestamp()
);

create index ai_prompt_activation_history_key_time_idx
  on private.ai_prompt_activation_history(prompt_key, created_at desc);

create table private.ai_prompt_version_validations (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null unique references private.ai_prompt_versions(id) on delete restrict,
  evidence text not null check (char_length(evidence) between 10 and 2000),
  validated_by uuid not null references private.ai_actor_directory(actor_subject_id) on delete restrict,
  created_at timestamptz not null default clock_timestamp()
);

alter table private.ai_prompt_versions enable row level security;
alter table private.ai_prompt_active_pointers enable row level security;
alter table private.ai_prompt_activation_history enable row level security;
alter table private.ai_prompt_version_validations enable row level security;

alter table private.ai_prompt_versions owner to postgres;
alter table private.ai_prompt_active_pointers owner to postgres;
alter table private.ai_prompt_activation_history owner to postgres;
alter table private.ai_prompt_version_validations owner to postgres;

revoke all on table private.ai_prompt_versions,
  private.ai_prompt_active_pointers,
  private.ai_prompt_activation_history,
  private.ai_prompt_version_validations
  from public, anon, authenticated, service_role;

create trigger ai_prompt_versions_forbid_change
  before update or delete on private.ai_prompt_versions
  for each row execute function private.forbid_change();

create trigger ai_prompt_activation_history_forbid_change
  before update or delete on private.ai_prompt_activation_history
  for each row execute function private.forbid_change();

create trigger ai_prompt_version_validations_forbid_change
  before update or delete on private.ai_prompt_version_validations
  for each row execute function private.forbid_change();

create or replace function public.create_ai_prompt_version(
  p_prompt_key text,
  p_version text,
  p_content text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_actor_subject_id uuid;
  v_hash text;
  v_id uuid;
begin
  if v_profile_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(v_profile_id) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;
  v_actor_subject_id := private.resolve_or_create_ai_actor(v_profile_id);
  if p_prompt_key is null or p_prompt_key !~ '^[a-z][a-z0-9_.-]{1,99}$'
     or p_version is null or p_version !~ '^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$'
     or p_content is null or char_length(p_content) not between 1 and 100000
     or p_metadata is null or jsonb_typeof(p_metadata) <> 'object'
     or pg_column_size(p_metadata) > 8192 then
    raise exception 'Invalid prompt version payload.' using errcode = '22023';
  end if;

  v_hash := encode(extensions.digest(p_content, 'sha256'), 'hex');
  insert into private.ai_prompt_versions(
    prompt_key, version, content, content_sha256, metadata, created_by
  ) values (
    p_prompt_key, p_version, p_content, v_hash, p_metadata, v_actor_subject_id
  ) returning id into v_id;

  insert into public.audit_log(actor_id, action, entity, entity_id, new_values)
  values (
    v_profile_id, 'ai_prompt_version_created', 'ai_prompt_versions', v_id,
    jsonb_build_object('prompt_key', p_prompt_key, 'version', p_version, 'content_sha256', v_hash)
  );

  return jsonb_build_object('id', v_id, 'prompt_key', p_prompt_key,
    'version', p_version, 'content_sha256', v_hash);
end;
$$;

-- Records the evaluation evidence that clears a version for activation. A version
-- is validated once; the record cannot be edited or removed.
create or replace function public.validate_ai_prompt_version(
  p_prompt_key text,
  p_version text,
  p_evidence text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_actor_subject_id uuid;
  v_target private.ai_prompt_versions%rowtype;
  v_evidence text := trim(p_evidence);
  v_validation_id uuid;
begin
  if v_profile_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(v_profile_id) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;
  v_actor_subject_id := private.resolve_or_create_ai_actor(v_profile_id);
  if p_prompt_key is null or p_prompt_key !~ '^[a-z][a-z0-9_.-]{1,99}$'
     or p_version is null
     or v_evidence is null or char_length(v_evidence) not between 10 and 2000 then
    raise exception 'Invalid prompt validation request.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai_prompt:' || p_prompt_key, 0));

  select * into v_target from private.ai_prompt_versions
   where prompt_key = p_prompt_key and version = p_version;
  if not found then
    raise exception 'Prompt version not found.' using errcode = 'P0002';
  end if;

  if exists (select 1 from private.ai_prompt_version_validations where version_id = v_target.id) then
    raise exception 'Prompt version is already validated.' using errcode = '22023';
  end if;

  insert into private.ai_prompt_version_validations (version_id, evidence, validated_by)
  values (v_target.id, v_evidence, v_actor_subject_id)
  returning id into v_validation_id;

  insert into public.audit_log(actor_id, action, entity, entity_id, new_values)
  values (
    v_profile_id, 'ai_prompt_version_validated', 'ai_prompt_versions', v_target.id,
    jsonb_build_object('prompt_key', p_prompt_key, 'version', p_version,
      'content_sha256', v_target.content_sha256, 'evidence', v_evidence)
  );

  return jsonb_build_object('validation_id', v_validation_id, 'prompt_key', p_prompt_key,
    'version', p_version);
end;
$$;

create or replace function public.set_active_ai_prompt_version(
  p_prompt_key text,
  p_version text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_actor_subject_id uuid;
  v_target private.ai_prompt_versions%rowtype;
  v_previous text;
begin
  if v_profile_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(v_profile_id) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;
  v_actor_subject_id := private.resolve_or_create_ai_actor(v_profile_id);
  if p_prompt_key is null or p_prompt_key !~ '^[a-z][a-z0-9_.-]{1,99}$'
     or p_version is null or p_reason is null
     or char_length(trim(p_reason)) not between 10 and 500 then
    raise exception 'Invalid prompt activation request.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai_prompt:' || p_prompt_key, 0));

  select * into v_target from private.ai_prompt_versions
   where prompt_key = p_prompt_key and version = p_version;
  if not found then
    raise exception 'Prompt version not found.' using errcode = 'P0002';
  end if;

  if not exists (select 1 from private.ai_prompt_version_validations where version_id = v_target.id) then
    raise exception 'Prompt version must be validated before activation.' using errcode = '55000';
  end if;

  select version into v_previous from private.ai_prompt_active_pointers
   where prompt_key = p_prompt_key;

  if v_previous is not distinct from p_version then
    raise exception 'Requested prompt version is already active.' using errcode = '22023';
  end if;

  insert into private.ai_prompt_active_pointers(
    prompt_key, version_id, version, updated_by, updated_at
  ) values (p_prompt_key, v_target.id, v_target.version, v_actor_subject_id, clock_timestamp())
  on conflict (prompt_key) do update set
    version_id = excluded.version_id,
    version = excluded.version,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  insert into private.ai_prompt_activation_history(
    prompt_key, from_version, to_version, operation, reason, actor_subject_id
  ) values (p_prompt_key, v_previous, p_version, 'activate', trim(p_reason), v_actor_subject_id);

  insert into public.audit_log(actor_id, action, entity, entity_id, new_values)
  values (
    v_profile_id, 'ai_prompt_version_activated', 'ai_prompt_active_pointers', v_target.id,
    jsonb_build_object('prompt_key', p_prompt_key, 'from_version', v_previous,
      'to_version', p_version, 'reason', trim(p_reason))
  );

  return jsonb_build_object('prompt_key', p_prompt_key,
    'from_version', v_previous, 'active_version', p_version);
end;
$$;

create or replace function public.rollback_active_ai_prompt_version(
  p_prompt_key text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid := auth.uid();
  v_actor_subject_id uuid;
  v_current text;
  v_previous text;
  v_target private.ai_prompt_versions%rowtype;
begin
  if v_profile_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(v_profile_id) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;
  v_actor_subject_id := private.resolve_or_create_ai_actor(v_profile_id);
  if p_prompt_key is null or p_prompt_key !~ '^[a-z][a-z0-9_.-]{1,99}$'
     or p_reason is null or char_length(trim(p_reason)) not between 10 and 500 then
    raise exception 'Invalid prompt rollback request.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai_prompt:' || p_prompt_key, 0));

  select version into v_current from private.ai_prompt_active_pointers
   where prompt_key = p_prompt_key;
  if not found then
    raise exception 'No active prompt version exists.' using errcode = 'P0002';
  end if;

  select from_version into v_previous
    from private.ai_prompt_activation_history
   where prompt_key = p_prompt_key
     and operation = 'activate'
     and to_version = v_current
     and from_version is not null
   order by created_at desc, id desc
   limit 1;

  if v_previous is null then
    raise exception 'No previous prompt version is available for rollback.' using errcode = 'P0002';
  end if;

  select * into v_target from private.ai_prompt_versions
   where prompt_key = p_prompt_key and version = v_previous;
  if not found then
    raise exception 'Previous prompt version is unavailable.' using errcode = 'P0002';
  end if;

  if not exists (select 1 from private.ai_prompt_version_validations where version_id = v_target.id) then
    raise exception 'Prompt version must be validated before activation.' using errcode = '55000';
  end if;

  update private.ai_prompt_active_pointers
     set version_id = v_target.id, version = v_target.version,
         updated_by = v_actor_subject_id, updated_at = clock_timestamp()
   where prompt_key = p_prompt_key;

  insert into private.ai_prompt_activation_history(
    prompt_key, from_version, to_version, operation, reason, actor_subject_id
  ) values (p_prompt_key, v_current, v_previous, 'rollback', trim(p_reason), v_actor_subject_id);

  insert into public.audit_log(actor_id, action, entity, entity_id, new_values)
  values (
    v_profile_id, 'ai_prompt_version_rolled_back', 'ai_prompt_active_pointers', v_target.id,
    jsonb_build_object('prompt_key', p_prompt_key, 'from_version', v_current,
      'to_version', v_previous, 'reason', trim(p_reason))
  );

  return jsonb_build_object('prompt_key', p_prompt_key,
    'from_version', v_current, 'active_version', v_previous);
end;
$$;

create or replace function public.list_ai_prompt_versions(p_prompt_key text default null)
returns table (
  id uuid,
  prompt_key text,
  version text,
  content_sha256 text,
  metadata jsonb,
  created_at timestamptz,
  validated_at timestamptz,
  validation_evidence text,
  is_active boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(auth.uid()) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;

  return query
  select v.id, v.prompt_key, v.version, v.content_sha256, v.metadata, v.created_at,
         pv.created_at, pv.evidence, (p.version_id is not null)
    from private.ai_prompt_versions v
    left join private.ai_prompt_version_validations pv on pv.version_id = v.id
    left join private.ai_prompt_active_pointers p on p.version_id = v.id
   where p_prompt_key is null or v.prompt_key = p_prompt_key
   order by v.prompt_key, v.created_at desc;
end;
$$;

create or replace function public.get_ai_prompt_version(p_prompt_key text, p_version text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(auth.uid()) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'id', v.id,
    'prompt_key', v.prompt_key,
    'version', v.version,
    'content', v.content,
    'content_sha256', v.content_sha256,
    'metadata', v.metadata,
    'created_at', v.created_at
  ) into v_result
  from private.ai_prompt_versions v
  where v.prompt_key = p_prompt_key and v.version = p_version;

  return v_result;
end;
$$;

create or replace function public.list_ai_prompt_activation_history(p_prompt_key text)
returns table (
  id uuid,
  prompt_key text,
  from_version text,
  to_version text,
  operation text,
  reason text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(auth.uid()) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;

  return query
  select h.id, h.prompt_key, h.from_version, h.to_version, h.operation, h.reason, h.created_at
    from private.ai_prompt_activation_history h
   where h.prompt_key = p_prompt_key
   order by h.created_at desc, h.id desc;
end;
$$;

alter function public.create_ai_prompt_version(text, text, text, jsonb) owner to postgres;
alter function public.validate_ai_prompt_version(text, text, text) owner to postgres;
alter function public.set_active_ai_prompt_version(text, text, text) owner to postgres;
alter function public.rollback_active_ai_prompt_version(text, text) owner to postgres;
alter function public.list_ai_prompt_versions(text) owner to postgres;
alter function public.get_ai_prompt_version(text, text) owner to postgres;
alter function public.list_ai_prompt_activation_history(text) owner to postgres;

revoke all on function public.create_ai_prompt_version(text, text, text, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.validate_ai_prompt_version(text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.set_active_ai_prompt_version(text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.rollback_active_ai_prompt_version(text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.list_ai_prompt_versions(text)
  from public, anon, authenticated, service_role;
revoke all on function public.get_ai_prompt_version(text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.list_ai_prompt_activation_history(text)
  from public, anon, authenticated, service_role;

grant execute on function public.create_ai_prompt_version(text, text, text, jsonb) to authenticated;
grant execute on function public.validate_ai_prompt_version(text, text, text) to authenticated;
grant execute on function public.set_active_ai_prompt_version(text, text, text) to authenticated;
grant execute on function public.rollback_active_ai_prompt_version(text, text) to authenticated;
grant execute on function public.list_ai_prompt_versions(text) to authenticated;
grant execute on function public.get_ai_prompt_version(text, text) to authenticated;
grant execute on function public.list_ai_prompt_activation_history(text) to authenticated;

-- Runtime read path: service_role may resolve the active prompt, but cannot mutate
-- prompt tables directly. Content is returned only for an explicit prompt key.
create or replace function public.get_active_ai_prompt(p_prompt_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_prompt_key is null or p_prompt_key !~ '^[a-z][a-z0-9_.-]{1,99}$' then
    raise exception 'Invalid prompt key.' using errcode = '22023';
  end if;

  select jsonb_build_object(
    'prompt_key', v.prompt_key,
    'version', v.version,
    'content', v.content,
    'content_sha256', v.content_sha256,
    'metadata', v.metadata
  ) into v_result
  from private.ai_prompt_active_pointers p
  join private.ai_prompt_versions v
    on v.id = p.version_id and v.prompt_key = p.prompt_key and v.version = p.version
  where p.prompt_key = p_prompt_key;

  return v_result;
end;
$$;

alter function public.get_active_ai_prompt(text) owner to postgres;
revoke all on function public.get_active_ai_prompt(text)
  from public, anon, authenticated, service_role;
grant execute on function public.get_active_ai_prompt(text) to service_role;
