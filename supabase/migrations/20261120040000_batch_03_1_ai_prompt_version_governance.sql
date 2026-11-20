-- Batch 03.1B M5: immutable prompt versions and audited activation/rollback.
-- Management is gated by ai.manage. In the current permission catalogue this resolves
-- through the super-admin bypass only; no broader role grants are introduced here.

create table private.ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_key text not null check (prompt_key ~ '^[a-z][a-z0-9_.-]{1,99}$'),
  version text not null check (version ~ '^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$'),
  content text not null check (char_length(content) between 1 and 100000),
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 8192),
  created_by uuid not null references public.profiles(id) on delete restrict,
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
  updated_by uuid not null references public.profiles(id) on delete restrict,
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
  actor_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp()
);

create index ai_prompt_activation_history_key_time_idx
  on private.ai_prompt_activation_history(prompt_key, created_at desc);

alter table private.ai_prompt_versions enable row level security;
alter table private.ai_prompt_active_pointers enable row level security;
alter table private.ai_prompt_activation_history enable row level security;

alter table private.ai_prompt_versions owner to postgres;
alter table private.ai_prompt_active_pointers owner to postgres;
alter table private.ai_prompt_activation_history owner to postgres;

revoke all on table private.ai_prompt_versions,
  private.ai_prompt_active_pointers,
  private.ai_prompt_activation_history
  from public, anon, authenticated, service_role;

create trigger ai_prompt_versions_forbid_change
  before update or delete on private.ai_prompt_versions
  for each row execute function private.forbid_change();

create trigger ai_prompt_activation_history_forbid_change
  before update or delete on private.ai_prompt_activation_history
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
  v_actor uuid := auth.uid();
  v_hash text;
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(v_actor) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;
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
    p_prompt_key, p_version, p_content, v_hash, p_metadata, v_actor
  ) returning id into v_id;

  insert into public.audit_log(actor_id, action, entity, entity_id, new_values)
  values (
    v_actor, 'ai_prompt_version_created', 'ai_prompt_versions', v_id,
    jsonb_build_object('prompt_key', p_prompt_key, 'version', p_version, 'content_sha256', v_hash)
  );

  return jsonb_build_object('id', v_id, 'prompt_key', p_prompt_key,
    'version', p_version, 'content_sha256', v_hash);
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
  v_actor uuid := auth.uid();
  v_target private.ai_prompt_versions%rowtype;
  v_previous text;
begin
  if v_actor is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(v_actor) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;
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

  select version into v_previous from private.ai_prompt_active_pointers
   where prompt_key = p_prompt_key;

  if v_previous is not distinct from p_version then
    raise exception 'Requested prompt version is already active.' using errcode = '22023';
  end if;

  insert into private.ai_prompt_active_pointers(
    prompt_key, version_id, version, updated_by, updated_at
  ) values (p_prompt_key, v_target.id, v_target.version, v_actor, clock_timestamp())
  on conflict (prompt_key) do update set
    version_id = excluded.version_id,
    version = excluded.version,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  insert into private.ai_prompt_activation_history(
    prompt_key, from_version, to_version, operation, reason, actor_id
  ) values (p_prompt_key, v_previous, p_version, 'activate', trim(p_reason), v_actor);

  insert into public.audit_log(actor_id, action, entity, entity_id, new_values)
  values (
    v_actor, 'ai_prompt_version_activated', 'ai_prompt_active_pointers', v_target.id,
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
  v_actor uuid := auth.uid();
  v_current text;
  v_previous text;
  v_target private.ai_prompt_versions%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;
  if not private.account_active(v_actor) or not public.has_permission('ai.manage') then
    raise exception 'AI prompt management permission required.' using errcode = '42501';
  end if;
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

  update private.ai_prompt_active_pointers
     set version_id = v_target.id, version = v_target.version,
         updated_by = v_actor, updated_at = clock_timestamp()
   where prompt_key = p_prompt_key;

  insert into private.ai_prompt_activation_history(
    prompt_key, from_version, to_version, operation, reason, actor_id
  ) values (p_prompt_key, v_current, v_previous, 'rollback', trim(p_reason), v_actor);

  insert into public.audit_log(actor_id, action, entity, entity_id, new_values)
  values (
    v_actor, 'ai_prompt_version_rolled_back', 'ai_prompt_active_pointers', v_target.id,
    jsonb_build_object('prompt_key', p_prompt_key, 'from_version', v_current,
      'to_version', v_previous, 'reason', trim(p_reason))
  );

  return jsonb_build_object('prompt_key', p_prompt_key,
    'from_version', v_current, 'active_version', v_previous);
end;
$$;

alter function public.create_ai_prompt_version(text, text, text, jsonb) owner to postgres;
alter function public.set_active_ai_prompt_version(text, text, text) owner to postgres;
alter function public.rollback_active_ai_prompt_version(text, text) owner to postgres;

revoke all on function public.create_ai_prompt_version(text, text, text, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.set_active_ai_prompt_version(text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.rollback_active_ai_prompt_version(text, text)
  from public, anon, authenticated, service_role;

grant execute on function public.create_ai_prompt_version(text, text, text, jsonb) to authenticated;
grant execute on function public.set_active_ai_prompt_version(text, text, text) to authenticated;
grant execute on function public.rollback_active_ai_prompt_version(text, text) to authenticated;
