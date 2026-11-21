-- CultivaNode 3.0, Batch 03.2: Published Agronomic Standards RAG & Verified Document Provenance
--
-- Extends `public.farm_agronomic_standards` (`20261008130000` + `20261103120000`) with:
-- 1. `public.agronomic_standard_documents` with explicit provenance verification fields distinguishing
--    `staff_asserted` text from `file_hash_verified` / `authority_verified` source files, storing
--    `storage_object_path`, `original_file_sha256`, and `extraction_method`.
-- 2. `public.agronomic_standard_chunks` (source-grounded passages + pgvector embeddings).
-- 3. Strict immutability trigger preventing chunk/document mutation once parent standard is published/superseded/retired.
-- 4. Controlled ingestion RPC (`public.ingest_agronomic_standard_document`) restricted to `standards.publish`/`crops.manage`
--    staff on `draft` standards ONLY (never auto-publishes).
-- 5. Published-only hybrid/vector retrieval RPC (`public.search_published_agronomic_standards`) enforcing
--    `status = 'published'` and effective dates INSIDE the database boundary.

create table if not exists public.agronomic_standard_documents (
  id                              uuid primary key default gen_random_uuid(),
  standard_id                     uuid not null references public.farm_agronomic_standards (id) on delete cascade,
  document_title                  text not null check (char_length(trim(document_title)) between 1 and 240),
  source_authority                text not null check (char_length(trim(source_authority)) between 1 and 120),
  mime_type                       text not null check (mime_type in ('text/plain', 'text/markdown', 'application/pdf', 'application/json')),
  file_size_bytes                 integer not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  content_sha256                  text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  original_file_sha256            text check (original_file_sha256 is null or original_file_sha256 ~ '^[a-f0-9]{64}$'),
  storage_object_path             text check (storage_object_path is null or char_length(storage_object_path) <= 500),
  extraction_method               text not null default 'staff_entered_text' check (
    extraction_method in ('staff_entered_text', 'plain_text_file', 'markdown_file', 'pdf_text_extractor', 'json_structured_file')
  ),
  provenance_verification_status  text not null default 'staff_asserted' check (
    provenance_verification_status in ('staff_asserted', 'file_hash_verified', 'authority_verified')
  ),
  external_uri                    text check (external_uri is null or char_length(external_uri) <= 500),
  uploaded_by                     uuid references public.profiles (id) on delete set null,
  created_at                      timestamptz not null default clock_timestamp(),
  unique (standard_id, content_sha256),
  constraint agronomic_std_docs_file_hash_consistency_check check (
    provenance_verification_status <> 'file_hash_verified'
    or original_file_sha256 is not null
  )
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
-- into a DRAFT standard ONLY. Never auto-publishes. Records explicit provenance verification level.
create or replace function public.ingest_agronomic_standard_document(
  p_standard_id uuid,
  p_document_title text,
  p_source_authority text,
  p_mime_type text,
  p_file_size_bytes integer,
  p_content_sha256 text,
  p_chunks jsonb,
  p_external_uri text default null,
  p_original_file_sha256 text default null,
  p_storage_object_path text default null,
  p_extraction_method text default 'staff_entered_text',
  p_provenance_verification_status text default 'staff_asserted'
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
  v_prov_status text := coalesce(nullif(trim(p_provenance_verification_status), ''), 'staff_asserted');
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

  -- Never allow claiming file_hash_verified without an actual original_file_sha256.
  if v_prov_status = 'file_hash_verified' and nullif(trim(p_original_file_sha256), '') is null then
    raise exception 'file_hash_verified provenance requires original_file_sha256.' using errcode = '22023';
  end if;

  if p_chunks is null or jsonb_typeof(p_chunks) <> 'array' or jsonb_array_length(p_chunks) = 0 or jsonb_array_length(p_chunks) > 500 then
    raise exception 'p_chunks must be a non-empty array (max 500 chunks).' using errcode = '22023';
  end if;

  insert into public.agronomic_standard_documents (
    standard_id, document_title, source_authority, mime_type,
    file_size_bytes, content_sha256, original_file_sha256, storage_object_path,
    extraction_method, provenance_verification_status, external_uri, uploaded_by
  )
  values (
    p_standard_id, trim(p_document_title), trim(p_source_authority), p_mime_type,
    p_file_size_bytes, lower(trim(p_content_sha256)),
    nullif(lower(trim(p_original_file_sha256)), ''),
    nullif(trim(p_storage_object_path), ''),
    coalesce(nullif(trim(p_extraction_method), ''), 'staff_entered_text'),
    v_prov_status,
    nullif(trim(p_external_uri), ''),
    v_uid
  )
  on conflict (standard_id, content_sha256) do update
    set document_title = excluded.document_title,
        original_file_sha256 = coalesce(excluded.original_file_sha256, public.agronomic_standard_documents.original_file_sha256),
        storage_object_path = coalesce(excluded.storage_object_path, public.agronomic_standard_documents.storage_object_path),
        extraction_method = excluded.extraction_method,
        provenance_verification_status = excluded.provenance_verification_status
  returning id into v_doc_id;

  delete from public.agronomic_standard_chunks where document_id = v_doc_id;

  for v_chunk in select value from jsonb_array_elements(p_chunks)
  loop
    v_embedding := null;
    if v_chunk ? 'embedding' and jsonb_typeof(v_chunk -> 'embedding') = 'string' then
      v_embedding := (v_chunk ->> 'embedding')::extensions.vector(1536);
    end if;

    insert into public.agronomic_standard_chunks (
      standard_id, document_id, chunk_index, section_ref, page_number,
      paragraph_index, content, content_sha256, embedding, embedding_model, embedding_version
    )
    values (
      p_standard_id, v_doc_id, coalesce((v_chunk ->> 'chunk_index')::integer, v_chunk_count),
      nullif(trim(v_chunk ->> 'section_ref'), ''), (v_chunk ->> 'page_number')::integer,
      (v_chunk ->> 'paragraph_index')::integer, v_chunk ->> 'content', lower(trim(v_chunk ->> 'content_sha256')),
      v_embedding, nullif(trim(v_chunk ->> 'embedding_model'), ''), nullif(trim(v_chunk ->> 'embedding_version'), '')
    );

    v_chunk_count := v_chunk_count + 1;
  end loop;

  perform public.write_audit(
    'agronomy_standard_document_ingested',
    'agronomic_standard_documents',
    v_doc_id,
    jsonb_build_object(
      'standard_id', p_standard_id,
      'chunk_count', v_chunk_count,
      'mime_type', p_mime_type,
      'extraction_method', coalesce(nullif(trim(p_extraction_method), ''), 'staff_entered_text'),
      'provenance_verification_status', v_prov_status
    )
  );

  return jsonb_build_object(
    'document_id', v_doc_id,
    'standard_id', p_standard_id,
    'standard_status', v_std.status,
    'chunk_count', v_chunk_count,
    'provenance_verification_status', v_prov_status
  );
end;
$$;

alter function public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text, text, text, text, text
) owner to postgres;
revoke all on function public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text, text, text, text, text
) from public, anon, authenticated, service_role;
grant execute on function public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text, text, text, text, text
) to authenticated;

-- Published-only Agronomic Standards RAG retrieval RPC.
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
  extraction_method text,
  provenance_verification_status text,
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
    d.extraction_method,
    d.provenance_verification_status,
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
