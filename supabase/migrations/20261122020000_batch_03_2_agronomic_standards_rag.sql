-- CultivaNode 3.0, Batch 03.2: Published Agronomic Standards RAG & Controlled Document Ingestion
--
-- Extends `public.farm_agronomic_standards` (`20261008130000` + `20261103120000`) with:
-- 1. `public.agronomic_standard_documents` (validated source document metadata bound to a standard version).
-- 2. `public.agronomic_standard_chunks` (source-grounded passages + pgvector embeddings).
-- 3. Strict immutability trigger preventing chunk/document mutation once parent standard is published/superseded/retired.
-- 4. Controlled ingestion RPC (`public.ingest_agronomic_standard_document`) restricted to `standards.publish`/`crops.manage`
--    staff on `draft` standards ONLY (never auto-publishes).
-- 5. Published-only hybrid/vector retrieval RPC (`public.search_published_agronomic_standards`) enforcing
--    `status = 'published'` and effective dates INSIDE the database boundary.
-- 6. Updates `private.write_ai_audit_event` allowed context sources to include `farm_memory_items`,
--    `agronomic_standard_documents`, `agronomic_standard_chunks`, `irrigation_zones`, and `irrigation_events`.

create table if not exists public.agronomic_standard_documents (
  id                uuid primary key default gen_random_uuid(),
  standard_id       uuid not null references public.farm_agronomic_standards (id) on delete cascade,
  document_title    text not null check (char_length(trim(document_title)) between 1 and 240),
  source_authority  text not null check (char_length(trim(source_authority)) between 1 and 120),
  mime_type         text not null check (mime_type in ('text/plain', 'text/markdown', 'application/pdf', 'application/json')),
  file_size_bytes   integer not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  content_sha256    text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  external_uri      text check (external_uri is null or char_length(external_uri) <= 500),
  uploaded_by       uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default clock_timestamp(),
  unique (standard_id, content_sha256)
);

create index if not exists agronomic_std_docs_standard_idx
  on public.agronomic_standard_documents (standard_id);

create table if not exists public.agronomic_standard_chunks (
  id                uuid primary key default gen_random_uuid(),
  standard_id       uuid not null references public.farm_agronomic_standards (id) on delete cascade,
  document_id       uuid not null references public.agronomic_standard_documents (id) on delete cascade,
  chunk_index       integer not null check (chunk_index >= 0),
  section_ref       text check (section_ref is null or char_length(section_ref) <= 200),
  page_number       integer check (page_number is null or page_number > 0),
  paragraph_index   integer check (paragraph_index is null or paragraph_index >= 0),
  content           text not null check (char_length(trim(content)) between 1 and 8000),
  content_sha256    text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  embedding         extensions.vector(1536),
  embedding_model   text check (embedding_model is null or char_length(embedding_model) between 1 and 128),
  embedding_version text check (embedding_version is null or char_length(embedding_version) between 1 and 64),
  created_at        timestamptz not null default clock_timestamp(),
  unique (document_id, chunk_index),
  constraint agronomic_chunks_embedding_meta_check check (
    embedding is null or (embedding_model is not null and embedding_version is not null)
  )
);

create index if not exists agronomic_std_chunks_standard_idx
  on public.agronomic_standard_chunks (standard_id, chunk_index);

create index if not exists agronomic_std_chunks_document_idx
  on public.agronomic_standard_chunks (document_id, chunk_index);

create index if not exists agronomic_std_chunks_embedding_hnsw_idx
  on public.agronomic_standard_chunks
  using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

-- Enforce that chunk.standard_id matches document.standard_id and parent standard is mutable (draft only).
create or replace function private.guard_agronomic_rag_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.agronomy_content_status;
  v_doc_standard_id uuid;
  v_target_standard_id uuid;
begin
  v_target_standard_id := coalesce(new.standard_id, old.standard_id);

  if tg_table_name = 'agronomic_standard_chunks' and tg_op in ('INSERT', 'UPDATE') then
    select standard_id into v_doc_standard_id
      from public.agronomic_standard_documents
     where id = new.document_id;
    if v_doc_standard_id is null or v_doc_standard_id <> new.standard_id then
      raise exception 'Chunk standard_id must match parent document standard_id.' using errcode = '23514';
    end if;
  end if;

  select status into v_status
    from public.farm_agronomic_standards
   where id = v_target_standard_id;

  if v_status in ('published', 'superseded', 'retired') then
    raise exception 'Documents and chunks of published, superseded, or retired agronomic standards are immutable.'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

alter function private.guard_agronomic_rag_integrity() owner to postgres;
revoke all on function private.guard_agronomic_rag_integrity()
  from public, anon, authenticated, service_role;

drop trigger if exists agronomic_docs_immutability_guard on public.agronomic_standard_documents;
create trigger agronomic_docs_immutability_guard
  before insert or update or delete on public.agronomic_standard_documents
  for each row execute function private.guard_agronomic_rag_integrity();

drop trigger if exists agronomic_chunks_immutability_guard on public.agronomic_standard_chunks;
create trigger agronomic_chunks_immutability_guard
  before insert or update or delete on public.agronomic_standard_chunks
  for each row execute function private.guard_agronomic_rag_integrity();

-- RLS + Force RLS (no anon access; authenticated users see published standards ONLY unless staff).
alter table public.agronomic_standard_documents owner to postgres;
alter table public.agronomic_standard_documents enable row level security;
alter table public.agronomic_standard_documents force row level security;
revoke all on table public.agronomic_standard_documents from public, anon, authenticated, service_role;
grant select on table public.agronomic_standard_documents to authenticated;

drop policy if exists agronomic_std_docs_select_published on public.agronomic_standard_documents;
create policy agronomic_std_docs_select_published
  on public.agronomic_standard_documents
  for select
  to authenticated
  using (
    (select private.account_active((select auth.uid())))
    and (
      exists (
        select 1
          from public.farm_agronomic_standards s
         where s.id = standard_id
           and s.status = 'published'
           and s.is_active = true
           and (s.effective_from is null or s.effective_from <= current_date)
           and (s.effective_to is null or s.effective_to >= current_date)
      )
      or public.has_permission('standards.publish')
      or public.has_permission('crops.manage')
    )
  );

alter table public.agronomic_standard_chunks owner to postgres;
alter table public.agronomic_standard_chunks enable row level security;
alter table public.agronomic_standard_chunks force row level security;
revoke all on table public.agronomic_standard_chunks from public, anon, authenticated, service_role;
grant select on table public.agronomic_standard_chunks to authenticated;

drop policy if exists agronomic_std_chunks_select_published on public.agronomic_standard_chunks;
create policy agronomic_std_chunks_select_published
  on public.agronomic_standard_chunks
  for select
  to authenticated
  using (
    (select private.account_active((select auth.uid())))
    and (
      exists (
        select 1
          from public.farm_agronomic_standards s
         where s.id = standard_id
           and s.status = 'published'
           and s.is_active = true
           and (s.effective_from is null or s.effective_from <= current_date)
           and (s.effective_to is null or s.effective_to >= current_date)
      )
      or public.has_permission('standards.publish')
      or public.has_permission('crops.manage')
    )
  );

-- Controlled ingestion RPC: staff with `standards.publish` or `crops.manage` may ingest chunks
-- into a DRAFT standard ONLY. Never auto-publishes.
create or replace function public.ingest_agronomic_standard_document(
  p_standard_id uuid,
  p_document_title text,
  p_source_authority text,
  p_mime_type text,
  p_file_size_bytes integer,
  p_content_sha256 text,
  p_chunks jsonb,
  p_external_uri text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_std public.farm_agronomic_standards%rowtype;
  v_doc_id uuid;
  v_chunk jsonb;
  v_chunk_count integer := 0;
  v_embedding extensions.vector(1536);
begin
  if v_uid is null or not private.account_active(v_uid) then
    raise exception 'Active authenticated staff account required.' using errcode = '42501';
  end if;

  if not (public.has_permission('standards.publish') or public.has_permission('crops.manage')) then
    raise exception 'Permission denied: standards.publish or crops.manage required.' using errcode = '42501';
  end if;

  select * into v_std
    from public.farm_agronomic_standards
   where id = p_standard_id
     for update;

  if not found then
    raise exception 'Agronomic standard not found.' using errcode = 'P0002';
  end if;

  if v_std.status <> 'draft' then
    raise exception 'Documents can only be ingested into draft agronomic standards.' using errcode = '42501';
  end if;

  if p_chunks is null or jsonb_typeof(p_chunks) <> 'array' or jsonb_array_length(p_chunks) = 0 or jsonb_array_length(p_chunks) > 500 then
    raise exception 'p_chunks must be a non-empty array (max 500 chunks).' using errcode = '22023';
  end if;

  insert into public.agronomic_standard_documents (
    standard_id, document_title, source_authority, mime_type,
    file_size_bytes, content_sha256, external_uri, uploaded_by
  )
  values (
    p_standard_id, trim(p_document_title), trim(p_source_authority), p_mime_type,
    p_file_size_bytes, lower(trim(p_content_sha256)), nullif(trim(p_external_uri), ''), v_uid
  )
  on conflict (standard_id, content_sha256) do update
    set document_title = excluded.document_title
  returning id into v_doc_id;

  delete from public.agronomic_standard_chunks where document_id = v_doc_id;

  for v_chunk in select value from jsonb_array_elements(p_chunks)
  loop
    v_embedding := null;
    if v_chunk ? 'embedding' and jsonb_typeof(v_chunk -> 'embedding') = 'string' then
      v_embedding := (v_chunk ->> 'embedding')::extensions.vector(1536);
    end if;

    insert into public.agronomic_standard_chunks (
      standard_id,
      document_id,
      chunk_index,
      section_ref,
      page_number,
      paragraph_index,
      content,
      content_sha256,
      embedding,
      embedding_model,
      embedding_version
    )
    values (
      p_standard_id,
      v_doc_id,
      coalesce((v_chunk ->> 'chunk_index')::integer, v_chunk_count),
      nullif(trim(v_chunk ->> 'section_ref'), ''),
      (v_chunk ->> 'page_number')::integer,
      (v_chunk ->> 'paragraph_index')::integer,
      v_chunk ->> 'content',
      lower(trim(v_chunk ->> 'content_sha256')),
      v_embedding,
      nullif(trim(v_chunk ->> 'embedding_model'), ''),
      nullif(trim(v_chunk ->> 'embedding_version'), '')
    );

    v_chunk_count := v_chunk_count + 1;
  end loop;

  perform public.write_audit(
    'agronomy_standard_document_ingested',
    'agronomic_standard_documents',
    v_doc_id,
    jsonb_build_object('standard_id', p_standard_id, 'chunk_count', v_chunk_count, 'mime_type', p_mime_type)
  );

  return jsonb_build_object(
    'document_id', v_doc_id,
    'standard_id', p_standard_id,
    'standard_status', v_std.status,
    'chunk_count', v_chunk_count
  );
end;
$$;

alter function public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text
) owner to postgres;
revoke all on function public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text
) from public, anon, authenticated, service_role;
grant execute on function public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text
) to authenticated;

-- Published-only Agronomic Standards RAG retrieval RPC.
-- Strictly excludes draft, in_review, approved (unpublished), superseded, retired, inactive, and out-of-date standards.
create or replace function public.search_published_agronomic_standards(
  p_crop_or_livestock_id text default null,
  p_agro_zone text default null,
  p_source_authority text default null,
  p_standard_code text default null,
  p_query_text text default null,
  p_query_embedding extensions.vector(1536) default null,
  p_limit integer default 10
)
returns table (
  chunk_id uuid,
  document_id uuid,
  standard_id uuid,
  standard_code text,
  version text,
  title text,
  crop_or_livestock_id text,
  agro_zone text,
  source_authority text,
  published_at timestamptz,
  effective_from date,
  effective_to date,
  document_title text,
  section_ref text,
  page_number integer,
  paragraph_index integer,
  content text,
  similarity_score double precision
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 10), 25));
  v_query text := nullif(trim(p_query_text), '');
begin
  if v_uid is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not private.account_active(v_uid) then
    raise exception 'Active account required.' using errcode = '42501';
  end if;

  return query
  select
    c.id as chunk_id,
    c.document_id,
    s.id as standard_id,
    s.standard_code,
    s.version,
    s.title,
    s.crop_or_livestock_id,
    s.agro_zone,
    s.source_authority,
    s.published_at,
    s.effective_from,
    s.effective_to,
    d.document_title,
    c.section_ref,
    c.page_number,
    c.paragraph_index,
    c.content,
    case
      when p_query_embedding is not null and c.embedding is not null
        then (1.0 - (c.embedding OPERATOR(extensions.<=>) p_query_embedding))::double precision
      else null::double precision
    end as similarity_score
  from public.agronomic_standard_chunks c
  join public.agronomic_standard_documents d on d.id = c.document_id
  join public.farm_agronomic_standards s on s.id = c.standard_id
  where
    -- Mandatory database-boundary publication gate: ONLY active, published, effective standards.
    s.status = 'published'
    and s.is_active = true
    and (s.effective_from is null or s.effective_from <= current_date)
    and (s.effective_to is null or s.effective_to >= current_date)
    and (p_crop_or_livestock_id is null or lower(s.crop_or_livestock_id) = lower(trim(p_crop_or_livestock_id)))
    and (p_agro_zone is null or lower(s.agro_zone) in (lower(trim(p_agro_zone)), 'all'))
    and (p_source_authority is null or lower(s.source_authority) = lower(trim(p_source_authority)))
    and (p_standard_code is null or s.standard_code = trim(p_standard_code))
    and (
      v_query is null
      or p_query_embedding is not null
      or c.content ilike '%' || v_query || '%'
      or s.title ilike '%' || v_query || '%'
    )
  order by
    case
      when p_query_embedding is not null and c.embedding is not null
        then (c.embedding OPERATOR(extensions.<=>) p_query_embedding)
      else 2.0
    end asc,
    s.published_at desc nulls last,
    c.chunk_index asc,
    c.id asc
  limit v_limit;
end;
$$;

alter function public.search_published_agronomic_standards(
  text, text, text, text, text, extensions.vector, integer
) owner to postgres;
revoke all on function public.search_published_agronomic_standards(
  text, text, text, text, text, extensions.vector, integer
) from public, anon, authenticated, service_role;
grant execute on function public.search_published_agronomic_standards(
  text, text, text, text, text, extensions.vector, integer
) to authenticated;

-- Extend `private.write_ai_audit_event` allowed context sources to include Batch 03.2 memory & RAG tables
-- (plus `irrigation_zones` and `irrigation_events` identified in Batch 03.1D).
create or replace function private.write_ai_audit_event(
  p_profile_id uuid,
  p_farm_id uuid,
  p_trace_id uuid,
  p_provider text,
  p_model_id text,
  p_prompt_version text,
  p_execution_outcome text,
  p_guardrail_result jsonb,
  p_context_refs jsonb,
  p_memory_item_ids uuid[],
  p_prompt_version_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_subject_id uuid;
  v_event_id uuid;
  v_existing public.ai_audit_events%rowtype;
  v_ref jsonb;
  v_source text;
  v_record_id text;
  v_observed_at text;
  v_parsed_ts timestamptz;
  v_seen_refs text[] := '{}'::text[];
  c_allowed_sources constant text[] := array[
    'farms', 'plots', 'crop_cycles', 'crop_cycle_operations',
    'crop_observations', 'crop_alerts', 'crop_harvests', 'soil_records',
    'farm_agronomic_standards', 'agronomic_standard_documents', 'agronomic_standard_chunks',
    'farm_memory_items', 'irrigation_zones', 'irrigation_events',
    'farm_inventory', 'farm_inventory_transactions',
    'farm_financial_transactions', 'farm_machinery_assets',
    'farm_machinery_maintenance', 'farm_machinery_usage_logs',
    'machinery_telemetry', 'farm_operational_tasks', 'farm_livestock',
    'farm_livestock_health_events', 'farm_livestock_production_logs',
    'telemetry_readings', 'telemetry_rollups', 'weather_cache',
    'marketplace_orders', 'marketplace_journal_entries'
  ];
begin
  if p_profile_id is null or p_farm_id is null or p_trace_id is null then
    raise exception 'Profile, farm and trace identifiers are required.' using errcode = '22023';
  end if;

  if not private.account_active(p_profile_id) then
    raise exception 'Inactive profiles cannot create AI audit events.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.farms f where f.id = p_farm_id) then
    raise exception 'Farm not found.' using errcode = 'P0002';
  end if;

  if not private.profile_can_view_farm(p_profile_id, p_farm_id) then
    raise exception 'Profile cannot access this farm.' using errcode = '42501';
  end if;

  if p_provider is null or p_provider not in ('claude', 'gemini', 'openai', 'rule-engine')
     or p_model_id is null or char_length(p_model_id) not between 1 and 128
     or p_prompt_version is null or char_length(p_prompt_version) not between 1 and 128
     or p_execution_outcome is null
     or p_execution_outcome not in ('completed', 'blocked', 'failed', 'fallback') then
    raise exception 'Invalid AI audit event attributes.' using errcode = '22023';
  end if;

  if p_prompt_version_id is not null and not exists (
    select 1 from private.ai_prompt_versions v
     where v.id = p_prompt_version_id and v.version = p_prompt_version
  ) then
    raise exception 'Prompt version reference does not match a registered prompt version.' using errcode = '22023';
  end if;

  if p_guardrail_result is null
     or jsonb_typeof(p_guardrail_result) <> 'object'
     or pg_column_size(p_guardrail_result) > 8192
     or p_guardrail_result - array['status', 'rule_ids', 'reason_codes', 'blocked']::text[] <> '{}'::jsonb
     or (p_guardrail_result ? 'status' and jsonb_typeof(p_guardrail_result -> 'status') <> 'string')
     or (p_guardrail_result ? 'rule_ids' and jsonb_typeof(p_guardrail_result -> 'rule_ids') <> 'array')
     or (p_guardrail_result ? 'reason_codes' and jsonb_typeof(p_guardrail_result -> 'reason_codes') <> 'array')
     or (p_guardrail_result ? 'blocked' and jsonb_typeof(p_guardrail_result -> 'blocked') <> 'boolean') then
    raise exception 'Invalid or oversized guardrail result.' using errcode = '22023';
  end if;

  if p_context_refs is null
     or jsonb_typeof(p_context_refs) <> 'array'
     or jsonb_array_length(p_context_refs) > 100
     or pg_column_size(p_context_refs) > 16384 then
    raise exception 'Invalid or oversized context references.' using errcode = '22023';
  end if;

  for v_ref in select value from jsonb_array_elements(p_context_refs)
  loop
    if jsonb_typeof(v_ref) <> 'object'
       or v_ref - array['source', 'record_id', 'observed_at']::text[] <> '{}'::jsonb
       or not (v_ref ? 'source')
       or not (v_ref ? 'record_id')
       or jsonb_typeof(v_ref -> 'source') <> 'string'
       or jsonb_typeof(v_ref -> 'record_id') <> 'string'
       or (v_ref ? 'observed_at' and jsonb_typeof(v_ref -> 'observed_at') <> 'string') then
      raise exception 'Context references must contain only source, record_id and optional observed_at.' using errcode = '22023';
    end if;

    v_source := v_ref ->> 'source';
    v_record_id := v_ref ->> 'record_id';

    if not (v_source = any(c_allowed_sources)) then
      raise exception 'Unsupported context reference source.' using errcode = '22023';
    end if;

    if v_record_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,63}$' then
      raise exception 'Invalid context reference record_id format.' using errcode = '22023';
    end if;

    if (v_source || '|' || v_record_id) = any(v_seen_refs) then
      raise exception 'Duplicate context references are not permitted.' using errcode = '22023';
    end if;
    v_seen_refs := array_append(v_seen_refs, v_source || '|' || v_record_id);

    if v_ref ? 'observed_at' then
      v_observed_at := v_ref ->> 'observed_at';
      if v_observed_at !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$' then
        raise exception 'Invalid context reference observed_at timestamp.' using errcode = '22023';
      end if;
      begin
        v_parsed_ts := v_observed_at::timestamptz;
      exception
        when invalid_datetime_format or datetime_field_overflow then
          raise exception 'Invalid context reference observed_at timestamp.' using errcode = '22023';
      end;
      if v_parsed_ts is null then
        raise exception 'Invalid context reference observed_at timestamp.' using errcode = '22023';
      end if;
    end if;
  end loop;

  if coalesce(cardinality(p_memory_item_ids), 0) > 100 then
    raise exception 'Too many memory references.' using errcode = '22023';
  end if;

  v_actor_subject_id := private.resolve_or_create_ai_actor(p_profile_id);

  insert into public.ai_audit_events (
    trace_id, farm_id, actor_subject_id, actor_kind, event_kind,
    provider, model_id, prompt_version, prompt_version_id, execution_outcome,
    guardrail_result, context_refs, memory_item_ids
  )
  select
    p_trace_id, p_farm_id, v_actor_subject_id, d.actor_kind, 'ai_execution',
    p_provider, p_model_id, p_prompt_version, p_prompt_version_id, p_execution_outcome,
    p_guardrail_result, p_context_refs, coalesce(p_memory_item_ids, '{}'::uuid[])
  from private.ai_actor_directory d
  where d.actor_subject_id = v_actor_subject_id
  on conflict (trace_id) do nothing
  returning id into v_event_id;

  if v_event_id is not null then
    return v_event_id;
  end if;

  select e.*
    into v_existing
  from public.ai_audit_events e
  where e.trace_id = p_trace_id;

  if not found
     or v_existing.farm_id is distinct from p_farm_id
     or v_existing.actor_subject_id is distinct from v_actor_subject_id
     or v_existing.provider is distinct from p_provider
     or v_existing.model_id is distinct from p_model_id
     or v_existing.prompt_version is distinct from p_prompt_version
     or v_existing.prompt_version_id is distinct from p_prompt_version_id
     or v_existing.execution_outcome is distinct from p_execution_outcome
     or v_existing.guardrail_result is distinct from p_guardrail_result
     or v_existing.context_refs is distinct from p_context_refs
     or v_existing.memory_item_ids is distinct from coalesce(p_memory_item_ids, '{}'::uuid[]) then
    raise exception 'Trace ID is already associated with a different AI audit event.' using errcode = '23505';
  end if;

  return v_existing.id;
end;
$$;

alter function private.write_ai_audit_event(uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[], uuid) owner to postgres;
revoke all on function private.write_ai_audit_event(uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[], uuid)
  from public, anon, authenticated, service_role;
grant execute on function private.write_ai_audit_event(uuid, uuid, uuid, text, text, text, text, jsonb, jsonb, uuid[], uuid)
  to service_role;
