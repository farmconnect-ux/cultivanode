-- CultivaNode 3.0, Batch 03.2: Persistent Farm Memory Data Model, Lifecycle & Vector Retrieval
-- Authority: ADR-002 (Persistent Memory Data Model), ADR-003 (pgvector), ADR-004 (Tenant Isolation), ADR-008 (Offline Sync).
--
-- Security & governance invariants:
-- 1. NOT NULL `memory_scope` discriminator ('farm' | 'profile') with strict CHECK separating ownership from attribution.
-- 2. RLS enabled and forced; authenticated clients get SELECT only on active visible rows (never direct INSERT/UPDATE/DELETE).
-- 3. All mutations pass through authenticated SECURITY DEFINER RPCs enforcing account_active, ai_intelligence consent,
--    farm edit permission (can_edit_farm) or profile self-ownership, immutable creator attribution, and lifecycle rules.
-- 4. AI-inferred and offline awaiting_sync memories can NEVER be created or auto-promoted as confirmed.
-- 5. Hybrid vector search RPC enforces tenant, scope, consent, and lifecycle filters INSIDE the database boundary.

create table if not exists public.farm_memory_items (
  id                  uuid primary key default gen_random_uuid(),
  memory_scope        text not null check (memory_scope in ('farm', 'profile')),
  farm_id             uuid references public.farms (id) on delete restrict,
  profile_id          uuid references public.profiles (id) on delete cascade,
  category            text not null check (category in ('episodic', 'semantic', 'procedural', 'preference', 'unresolved')),
  memory_type         text not null check (char_length(trim(memory_type)) between 1 and 80),
  title               text not null check (char_length(trim(title)) between 1 and 200),
  structured_content  jsonb not null default '{}'::jsonb,
  source_kind         text not null check (source_kind in ('farmer_explicit', 'farm_record', 'deterministic_derived', 'ai_inferred')),
  source_refs         jsonb not null default '[]'::jsonb,
  lifecycle_status    text not null default 'proposed' check (
    lifecycle_status in (
      'proposed',
      'awaiting_confirmation',
      'confirmed',
      'rejected',
      'superseded',
      'expired',
      'withdrawn',
      'deleted'
    )
  ),
  verification_status text not null default 'unverified' check (
    verification_status in ('unverified', 'provisional', 'confirmed', 'rejected')
  ),
  confidence          numeric(4, 3) not null default 0.500 check (confidence >= 0 and confidence <= 1),
  sync_state          text not null default 'synced' check (sync_state in ('synced', 'awaiting_sync')),
  idempotency_key     text unique check (idempotency_key is null or char_length(idempotency_key) between 1 and 128),
  supersedes_id       uuid references public.farm_memory_items (id) on delete set null,
  superseded_by_id    uuid references public.farm_memory_items (id) on delete set null,
  consent_verified_at timestamptz not null default clock_timestamp(),
  created_by          uuid references public.profiles (id) on delete set null,
  confirmed_by        uuid references public.profiles (id) on delete set null,
  confirmed_at        timestamptz,
  updated_by          uuid references public.profiles (id) on delete set null,
  expires_at          timestamptz,
  deleted_at          timestamptz,
  embedding           extensions.vector(1536),
  embedding_model     text check (embedding_model is null or char_length(embedding_model) between 1 and 128),
  embedding_version   text check (embedding_version is null or char_length(embedding_version) between 1 and 64),
  created_at          timestamptz not null default clock_timestamp(),
  updated_at          timestamptz not null default clock_timestamp(),

  -- ADR-002: strict scope and ownership discriminator.
  constraint farm_memory_items_scope_ownership_check check (
    (
      memory_scope = 'farm'
      and farm_id is not null
      and profile_id is null
      and category in ('episodic', 'semantic', 'procedural', 'preference', 'unresolved')
    )
    or (
      memory_scope = 'profile'
      and farm_id is null
      and profile_id is not null
      and category = 'preference'
    )
  ),

  -- Bounded JSONB payloads to prevent oversized/unstructured blobs.
  constraint farm_memory_items_structured_content_check check (
    jsonb_typeof(structured_content) = 'object'
    and pg_column_size(structured_content) <= 16384
  ),
  constraint farm_memory_items_source_refs_check check (
    jsonb_typeof(source_refs) = 'array'
    and jsonb_array_length(source_refs) <= 50
    and pg_column_size(source_refs) <= 8192
  ),

  -- Lifecycle and confirmation invariants (ADR-002, ADR-007, ADR-008).
  constraint farm_memory_items_confirmation_integrity_check check (
    (lifecycle_status <> 'confirmed')
    or (verification_status = 'confirmed' and confirmed_at is not null and sync_state = 'synced')
  ),
  constraint farm_memory_items_offline_not_confirmed_check check (
    not (sync_state = 'awaiting_sync' and lifecycle_status = 'confirmed')
  ),
  constraint farm_memory_items_self_supersede_check check (
    (supersedes_id is null or supersedes_id <> id)
    and (superseded_by_id is null or superseded_by_id <> id)
  ),
  constraint farm_memory_items_embedding_meta_check check (
    embedding is null or (embedding_model is not null and embedding_version is not null)
  )
);

comment on table public.farm_memory_items is
  'Batch 03.2 persistent farm-scoped and profile-scoped memory (ADR-002). Server-mediated writes only; RLS enforced.';

create index if not exists farm_memory_items_farm_active_idx
  on public.farm_memory_items (farm_id, lifecycle_status, updated_at desc)
  where memory_scope = 'farm';

create index if not exists farm_memory_items_profile_active_idx
  on public.farm_memory_items (profile_id, lifecycle_status, updated_at desc)
  where memory_scope = 'profile';

create index if not exists farm_memory_items_expires_idx
  on public.farm_memory_items (expires_at)
  where expires_at is not null;

create index if not exists farm_memory_items_supersedes_idx
  on public.farm_memory_items (supersedes_id)
  where supersedes_id is not null;

create index if not exists farm_memory_items_embedding_hnsw_idx
  on public.farm_memory_items
  using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

alter table public.farm_memory_items owner to postgres;
alter table public.farm_memory_items enable row level security;
alter table public.farm_memory_items force row level security;

revoke all on table public.farm_memory_items from public, anon, authenticated, service_role;
grant select on table public.farm_memory_items to authenticated;

drop policy if exists farm_memory_items_select_visible on public.farm_memory_items;
create policy farm_memory_items_select_visible
  on public.farm_memory_items
  for select
  to authenticated
  using (
    (select private.account_active((select auth.uid())))
    and lifecycle_status <> 'deleted'
    and deleted_at is null
    and (
      (memory_scope = 'farm' and (select private.can_view_farm(farm_id)))
      or (memory_scope = 'profile' and profile_id = (select auth.uid()))
    )
  );

-- Helper: verify caller has active ai_intelligence consent.
create or replace function private.has_ai_intelligence_consent(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.consents c
     where c.profile_id = p_profile_id
       and c.consent_type = 'ai_intelligence'
       and c.id = (
         select c2.id
           from public.consents c2
          where c2.profile_id = p_profile_id
            and c2.consent_type = 'ai_intelligence'
          order by c2.recorded_at desc, c2.id desc
          limit 1
       )
       and c.granted = true
  );
$$;

alter function private.has_ai_intelligence_consent(uuid) owner to postgres;
revoke all on function private.has_ai_intelligence_consent(uuid)
  from public, anon, authenticated, service_role;

-- Server-mediated authenticated memory creation RPC (ADR-002, ADR-004, ADR-008).
create or replace function public.create_farm_memory_item(
  p_memory_scope text,
  p_farm_id uuid,
  p_category text,
  p_memory_type text,
  p_title text,
  p_structured_content jsonb,
  p_source_kind text,
  p_source_refs jsonb default '[]'::jsonb,
  p_confidence numeric default 0.500,
  p_sync_state text default 'synced',
  p_idempotency_key text default null,
  p_expires_at timestamptz default null,
  p_embedding extensions.vector(1536) default null,
  p_embedding_model text default null,
  p_embedding_version text default null,
  p_request_confirm boolean default false
)
returns public.farm_memory_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.farm_memory_items%rowtype;
  v_row public.farm_memory_items%rowtype;
  v_lifecycle text;
  v_verification text;
  v_confirmed_by uuid := null;
  v_confirmed_at timestamptz := null;
  v_profile_id uuid := null;
begin
  if v_uid is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not private.account_active(v_uid) then
    raise exception 'Active account required.' using errcode = '42501';
  end if;

  if not private.has_ai_intelligence_consent(v_uid) then
    raise exception 'AI intelligence consent is required.' using errcode = '42501';
  end if;

  -- Idempotent retry support for offline sync / network retries (ADR-008).
  if p_idempotency_key is not null and trim(p_idempotency_key) <> '' then
    select * into v_existing
      from public.farm_memory_items
     where idempotency_key = trim(p_idempotency_key);
    if found then
      if (v_existing.memory_scope = 'farm' and not private.can_edit_farm(v_existing.farm_id))
         or (v_existing.memory_scope = 'profile' and v_existing.profile_id <> v_uid) then
        raise exception 'Idempotency key belongs to an inaccessible scope.' using errcode = '42501';
      end if;
      return v_existing;
    end if;
  end if;

  if p_memory_scope = 'farm' then
    if p_farm_id is null then
      raise exception 'farm_id is required for farm-scoped memory.' using errcode = '22023';
    end if;
    if not private.can_edit_farm(p_farm_id) then
      raise exception 'Permission denied: cannot write memory for this farm.' using errcode = '42501';
    end if;
    v_profile_id := null;
  elsif p_memory_scope = 'profile' then
    if p_farm_id is not null then
      raise exception 'farm_id must be null for profile-scoped memory.' using errcode = '22023';
    end if;
    if p_category <> 'preference' then
      raise exception 'Profile-scoped memory only permits category=preference.' using errcode = '22023';
    end if;
    v_profile_id := v_uid;
  else
    raise exception 'Invalid memory_scope.' using errcode = '22023';
  end if;

  -- AI-inferred or offline awaiting_sync memory can NEVER be auto-confirmed on creation.
  if p_sync_state = 'awaiting_sync' then
    v_lifecycle := 'awaiting_confirmation';
    v_verification := 'provisional';
  elsif p_source_kind = 'ai_inferred' then
    v_lifecycle := 'proposed';
    v_verification := 'provisional';
  elsif p_request_confirm and p_source_kind in ('farmer_explicit', 'farm_record') then
    v_lifecycle := 'confirmed';
    v_verification := 'confirmed';
    v_confirmed_by := v_uid;
    v_confirmed_at := clock_timestamp();
  else
    v_lifecycle := 'awaiting_confirmation';
    v_verification := 'provisional';
  end if;

  insert into public.farm_memory_items (
    memory_scope,
    farm_id,
    profile_id,
    category,
    memory_type,
    title,
    structured_content,
    source_kind,
    source_refs,
    lifecycle_status,
    verification_status,
    confidence,
    sync_state,
    idempotency_key,
    consent_verified_at,
    created_by,
    confirmed_by,
    confirmed_at,
    updated_by,
    expires_at,
    embedding,
    embedding_model,
    embedding_version
  )
  values (
    p_memory_scope,
    p_farm_id,
    v_profile_id,
    p_category,
    trim(p_memory_type),
    trim(p_title),
    coalesce(p_structured_content, '{}'::jsonb),
    p_source_kind,
    coalesce(p_source_refs, '[]'::jsonb),
    v_lifecycle,
    v_verification,
    p_confidence,
    coalesce(p_sync_state, 'synced'),
    nullif(trim(p_idempotency_key), ''),
    clock_timestamp(),
    v_uid,
    v_confirmed_by,
    v_confirmed_at,
    v_uid,
    p_expires_at,
    p_embedding,
    p_embedding_model,
    p_embedding_version
  )
  returning * into v_row;

  return v_row;
end;
$$;

alter function public.create_farm_memory_item(
  text, uuid, text, text, text, jsonb, text, jsonb, numeric, text, text, timestamptz, extensions.vector, text, text, boolean
) owner to postgres;
revoke all on function public.create_farm_memory_item(
  text, uuid, text, text, text, jsonb, text, jsonb, numeric, text, text, timestamptz, extensions.vector, text, text, boolean
) from public, anon, authenticated, service_role;
grant execute on function public.create_farm_memory_item(
  text, uuid, text, text, text, jsonb, text, jsonb, numeric, text, text, timestamptz, extensions.vector, text, text, boolean
) to authenticated;

-- Explicit lifecycle governance RPC: confirm, reject, withdraw, supersede (correct), expire, delete.
-- Preserves immutable creator attribution (`created_by`) and prevents ordinary users from forging confirmer/editor IDs.
create or replace function public.transition_farm_memory_item(
  p_memory_id uuid,
  p_action text,
  p_new_title text default null,
  p_new_structured_content jsonb default null,
  p_new_source_refs jsonb default null,
  p_new_embedding extensions.vector(1536) default null,
  p_new_embedding_model text default null,
  p_new_embedding_version text default null
)
returns public.farm_memory_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_current public.farm_memory_items%rowtype;
  v_result public.farm_memory_items%rowtype;
begin
  if v_uid is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not private.account_active(v_uid) then
    raise exception 'Active account required.' using errcode = '42501';
  end if;

  if not private.has_ai_intelligence_consent(v_uid) then
    raise exception 'AI intelligence consent is required.' using errcode = '42501';
  end if;

  select * into v_current
    from public.farm_memory_items
   where id = p_memory_id
     for update;

  if not found then
    raise exception 'Memory item not found.' using errcode = 'P0002';
  end if;

  if (v_current.memory_scope = 'farm' and not private.can_edit_farm(v_current.farm_id))
     or (v_current.memory_scope = 'profile' and v_current.profile_id <> v_uid) then
    raise exception 'Permission denied for this memory item.' using errcode = '42501';
  end if;

  if v_current.lifecycle_status in ('deleted', 'superseded') then
    raise exception 'Terminal memory items cannot be transitioned.' using errcode = '22023';
  end if;

  if p_action = 'confirm' then
    if v_current.sync_state = 'awaiting_sync' then
      raise exception 'Offline awaiting_sync memory cannot be confirmed before server synchronisation.' using errcode = '22023';
    end if;
    if v_current.lifecycle_status not in ('proposed', 'awaiting_confirmation') then
      raise exception 'Only proposed or awaiting_confirmation memories can be confirmed.' using errcode = '22023';
    end if;

    update public.farm_memory_items
       set lifecycle_status = 'confirmed',
           verification_status = 'confirmed',
           confirmed_by = v_uid,
           confirmed_at = clock_timestamp(),
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;
    return v_result;

  elsif p_action = 'reject' then
    update public.farm_memory_items
       set lifecycle_status = 'rejected',
           verification_status = 'rejected',
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;
    return v_result;

  elsif p_action = 'withdraw' then
    update public.farm_memory_items
       set lifecycle_status = 'withdrawn',
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;
    return v_result;

  elsif p_action = 'expire' then
    update public.farm_memory_items
       set lifecycle_status = 'expired',
           expires_at = coalesce(expires_at, clock_timestamp()),
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;
    return v_result;

  elsif p_action = 'delete' then
    update public.farm_memory_items
       set lifecycle_status = 'deleted',
           deleted_at = clock_timestamp(),
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = p_memory_id
    returning * into v_result;
    return v_result;

  elsif p_action = 'supersede' then
    if p_new_structured_content is null then
      raise exception 'Replacement structured_content is required to supersede a memory.' using errcode = '22023';
    end if;

    insert into public.farm_memory_items (
      memory_scope,
      farm_id,
      profile_id,
      category,
      memory_type,
      title,
      structured_content,
      source_kind,
      source_refs,
      lifecycle_status,
      verification_status,
      confidence,
      sync_state,
      supersedes_id,
      consent_verified_at,
      created_by,
      confirmed_by,
      confirmed_at,
      updated_by,
      expires_at,
      embedding,
      embedding_model,
      embedding_version
    )
    values (
      v_current.memory_scope,
      v_current.farm_id,
      v_current.profile_id,
      v_current.category,
      v_current.memory_type,
      coalesce(nullif(trim(p_new_title), ''), v_current.title),
      p_new_structured_content,
      'farmer_explicit',
      coalesce(p_new_source_refs, v_current.source_refs),
      'confirmed',
      'confirmed',
      1.000,
      'synced',
      v_current.id,
      clock_timestamp(),
      v_uid,
      v_uid,
      clock_timestamp(),
      v_uid,
      v_current.expires_at,
      p_new_embedding,
      p_new_embedding_model,
      p_new_embedding_version
    )
    returning * into v_result;

    update public.farm_memory_items
       set lifecycle_status = 'superseded',
           superseded_by_id = v_result.id,
           updated_by = v_uid,
           updated_at = clock_timestamp()
     where id = v_current.id;

    return v_result;

  else
    raise exception 'Unsupported memory transition action: %', p_action using errcode = '22023';
  end if;
end;
$$;

alter function public.transition_farm_memory_item(
  uuid, text, text, jsonb, jsonb, extensions.vector, text, text
) owner to postgres;
revoke all on function public.transition_farm_memory_item(
  uuid, text, text, jsonb, jsonb, extensions.vector, text, text
) from public, anon, authenticated, service_role;
grant execute on function public.transition_farm_memory_item(
  uuid, text, text, jsonb, jsonb, extensions.vector, text, text
) to authenticated;

-- Hybrid tenant-isolated memory retrieval RPC (ADR-003, ADR-004).
-- Tenant, consent, scope, lifecycle, and expiry filters are enforced INSIDE the database boundary.
create or replace function public.search_farm_memory_items(
  p_farm_id uuid default null,
  p_include_profile boolean default true,
  p_categories text[] default null,
  p_include_provisional boolean default true,
  p_query_embedding extensions.vector(1536) default null,
  p_limit integer default 20
)
returns table (
  id uuid,
  memory_scope text,
  farm_id uuid,
  profile_id uuid,
  category text,
  memory_type text,
  title text,
  structured_content jsonb,
  source_kind text,
  source_refs jsonb,
  lifecycle_status text,
  verification_status text,
  confidence numeric,
  sync_state text,
  created_by uuid,
  confirmed_by uuid,
  confirmed_at timestamptz,
  updated_by uuid,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  similarity_score double precision
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 50));
begin
  if v_uid is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not private.account_active(v_uid) then
    raise exception 'Active account required.' using errcode = '42501';
  end if;

  if not private.has_ai_intelligence_consent(v_uid) then
    raise exception 'AI intelligence consent is required.' using errcode = '42501';
  end if;

  if p_farm_id is not null and not private.can_view_farm(p_farm_id) then
    raise exception 'Farm not found or access denied.' using errcode = '42501';
  end if;

  return query
  select
    m.id,
    m.memory_scope,
    m.farm_id,
    m.profile_id,
    m.category,
    m.memory_type,
    m.title,
    m.structured_content,
    m.source_kind,
    m.source_refs,
    m.lifecycle_status,
    m.verification_status,
    m.confidence,
    m.sync_state,
    m.created_by,
    m.confirmed_by,
    m.confirmed_at,
    m.updated_by,
    m.expires_at,
    m.created_at,
    m.updated_at,
    case
      when p_query_embedding is not null and m.embedding is not null
        then (1.0 - (m.embedding OPERATOR(extensions.<=>) p_query_embedding))::double precision
      else null::double precision
    end as similarity_score
  from public.farm_memory_items m
  where
    m.deleted_at is null
    and (m.expires_at is null or m.expires_at > clock_timestamp())
    and (
      m.lifecycle_status = 'confirmed'
      or (p_include_provisional and m.lifecycle_status in ('proposed', 'awaiting_confirmation'))
    )
    and (
      (p_farm_id is not null and m.memory_scope = 'farm' and m.farm_id = p_farm_id)
      or (p_include_profile and m.memory_scope = 'profile' and m.profile_id = v_uid)
    )
    and (p_categories is null or m.category = any(p_categories))
  order by
    -- Confirmed memories always rank ahead of provisional memories; similarity never overrides lifecycle.
    case when m.lifecycle_status = 'confirmed' then 0 else 1 end asc,
    case
      when p_query_embedding is not null and m.embedding is not null
        then (m.embedding OPERATOR(extensions.<=>) p_query_embedding)
      else 2.0
    end asc,
    m.updated_at desc,
    m.id asc
  limit v_limit;
end;
$$;

alter function public.search_farm_memory_items(uuid, boolean, text[], boolean, extensions.vector, integer) owner to postgres;
revoke all on function public.search_farm_memory_items(uuid, boolean, text[], boolean, extensions.vector, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.search_farm_memory_items(uuid, boolean, text[], boolean, extensions.vector, integer)
  to authenticated;
