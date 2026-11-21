-- CultivaNode 3.0, Batch 03.2G: Verifiable Agronomic Document-to-Passage Provenance Chain (Finding 6)
--
-- Forward-only migration extending `public.agronomic_standard_documents` (`20261122020000`) with:
-- 1. Private, immutable-for-authenticated Storage bucket `agronomic-standard-sources` (staff-only INSERT/SELECT; no UPDATE/DELETE).
-- 2. Explicit ingestion lifecycle (`pending`, `source_archived`, `extracted`, `indexed`, `failed`, `reconciliation_required`),
--    `extraction_version`, `extracted_text_sha256`, `storage_bucket_id`, `authority_verified_by`, `authority_verified_at`.
-- 3. Database-enforced provenance status governance:
--    - Ordinary ingestion can NEVER set `authority_verified` (raises 42501).
--    - `file_hash_verified` is assigned ONLY by PostgreSQL when `storage.objects` contains the archived object in
--      `agronomic-standard-sources` AND `original_file_sha256` + `extracted_text_sha256` are present.
--    - Staff-entered text without an archived Storage object is unconditionally forced to `staff_asserted`.
-- 4. Durable failure/reconciliation RPC (`public.record_agronomic_document_ingestion_failure`) for partial failures.
-- 5. Published-only RAG search (`public.search_published_agronomic_standards`) enforces `d.ingestion_status = 'indexed'`.
--
-- Rollback notes: Drop policies on `storage.objects` for `agronomic-standard-sources`, drop
-- `public.record_agronomic_document_ingestion_failure`, and restore `20261122020000` RPC signatures.
-- Archived Storage objects and added columns contain audit history and should not be dropped in Production.

------------------------------------------------------------------------------------------------
-- 1. Private Storage Bucket for Immutable Agronomic Source Documents
------------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agronomic-standard-sources',
  'agronomic-standard-sources',
  false,
  10485760,
  array['text/plain', 'text/markdown', 'application/json']
)
on conflict (id) do nothing;

drop policy if exists "agronomic sources: staff upload" on storage.objects;
create policy "agronomic sources: staff upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'agronomic-standard-sources'
    and (select private.account_active((select auth.uid())))
    and (
      (select public.has_permission('standards.publish'))
      or (select public.has_permission('crops.manage'))
    )
  );

drop policy if exists "agronomic sources: staff read" on storage.objects;
create policy "agronomic sources: staff read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'agronomic-standard-sources'
    and (select private.account_active((select auth.uid())))
    and (
      (select public.has_permission('standards.publish'))
      or (select public.has_permission('crops.manage'))
    )
  );
-- Intentionally NO UPDATE or DELETE policy for `authenticated`: archived source files are immutable.

------------------------------------------------------------------------------------------------
-- 2. Provenance Chain & Lifecycle Columns on public.agronomic_standard_documents
------------------------------------------------------------------------------------------------
alter table public.agronomic_standard_documents
  add column if not exists ingestion_status text not null default 'indexed' check (
    ingestion_status in ('pending', 'source_archived', 'extracted', 'indexed', 'failed', 'reconciliation_required')
  ),
  add column if not exists extraction_version text not null default '1.0' check (char_length(trim(extraction_version)) between 1 and 64),
  add column if not exists extracted_text_sha256 text check (extracted_text_sha256 is null or extracted_text_sha256 ~ '^[a-f0-9]{64}$'),
  add column if not exists storage_bucket_id text check (storage_bucket_id is null or storage_bucket_id = 'agronomic-standard-sources'),
  add column if not exists authority_verified_by uuid references public.profiles (id) on delete set null,
  add column if not exists authority_verified_at timestamptz,
  add column if not exists ingestion_error text check (ingestion_error is null or char_length(ingestion_error) <= 1000);

alter table public.agronomic_standard_documents
  drop constraint if exists agronomic_std_docs_file_hash_consistency_check;

alter table public.agronomic_standard_documents
  add constraint agronomic_std_docs_file_hash_consistency_check check (
    (
      provenance_verification_status <> 'file_hash_verified'
      or (
        original_file_sha256 is not null
        and extracted_text_sha256 is not null
        and storage_bucket_id = 'agronomic-standard-sources'
        and storage_object_path is not null
      )
    )
    and (
      provenance_verification_status <> 'authority_verified'
      or (authority_verified_by is not null and authority_verified_at is not null)
    )
  );

------------------------------------------------------------------------------------------------
-- 3. Database-Enforced Provenance Ingestion RPC
------------------------------------------------------------------------------------------------
drop function if exists public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text, text, text, text, text
);

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
  p_provenance_verification_status text default 'staff_asserted',
  p_extraction_version text default '1.0',
  p_extracted_text_sha256 text default null
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
  v_storage_path text := nullif(trim(p_storage_object_path), '');
  v_orig_hash text := nullif(lower(trim(p_original_file_sha256)), '');
  v_ext_hash text := nullif(lower(trim(p_extracted_text_sha256)), '');
  v_effective_prov_status text;
  v_effective_extraction text;
  v_storage_bucket text := null;
begin
  if v_uid is null or not private.account_active(v_uid) then
    raise exception 'Active authenticated staff account required.' using errcode = '42501';
  end if;

  if not (public.has_permission('standards.publish') or public.has_permission('crops.manage')) then
    raise exception 'Permission denied: standards.publish or crops.manage required.' using errcode = '42501';
  end if;

  -- Never permit ordinary ingestion to self-assign `authority_verified`.
  if lower(trim(coalesce(p_provenance_verification_status, ''))) = 'authority_verified' then
    raise exception 'Ordinary ingestion cannot assign authority_verified; a separate authority verification workflow is required.'
      using errcode = '42501';
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

  -- Database-enforced provenance status derivation:
  -- File-backed ingestion MUST reference an actual object in `storage.objects` (`agronomic-standard-sources`)
  -- with both original_file_sha256 and extracted_text_sha256 present.
  if v_storage_path is not null or v_orig_hash is not null or lower(trim(coalesce(p_provenance_verification_status, ''))) = 'file_hash_verified' then
    if v_storage_path is null or v_orig_hash is null or v_ext_hash is null then
      raise exception 'file_hash_verified provenance requires storage_object_path, original_file_sha256, and extracted_text_sha256.'
        using errcode = '22023';
    end if;

    if not exists (
      select 1
        from storage.objects o
       where o.bucket_id = 'agronomic-standard-sources'
         and o.name = v_storage_path
    ) then
      raise exception 'Archived source object not found in agronomic-standard-sources Storage bucket.'
        using errcode = '22023';
    end if;

    v_storage_bucket := 'agronomic-standard-sources';
    v_effective_prov_status := 'file_hash_verified';
    v_effective_extraction := coalesce(nullif(trim(p_extraction_method), ''), 'plain_text_file');
  else
    -- Staff-entered text without an archived Storage source object is unconditionally `staff_asserted`.
    v_storage_bucket := null;
    v_effective_prov_status := 'staff_asserted';
    v_effective_extraction := 'staff_entered_text';
  end if;

  insert into public.agronomic_standard_documents (
    standard_id, document_title, source_authority, mime_type,
    file_size_bytes, content_sha256, original_file_sha256, extracted_text_sha256,
    storage_bucket_id, storage_object_path, extraction_method, extraction_version,
    provenance_verification_status, ingestion_status, ingestion_error, external_uri, uploaded_by
  )
  values (
    p_standard_id, trim(p_document_title), trim(p_source_authority), p_mime_type,
    p_file_size_bytes, lower(trim(p_content_sha256)), v_orig_hash, v_ext_hash,
    v_storage_bucket, v_storage_path, v_effective_extraction, coalesce(nullif(trim(p_extraction_version), ''), '1.0'),
    v_effective_prov_status, 'indexed', null, nullif(trim(p_external_uri), ''), v_uid
  )
  on conflict (standard_id, content_sha256) do update
    set document_title = excluded.document_title,
        original_file_sha256 = coalesce(excluded.original_file_sha256, public.agronomic_standard_documents.original_file_sha256),
        extracted_text_sha256 = coalesce(excluded.extracted_text_sha256, public.agronomic_standard_documents.extracted_text_sha256),
        storage_bucket_id = coalesce(excluded.storage_bucket_id, public.agronomic_standard_documents.storage_bucket_id),
        storage_object_path = coalesce(excluded.storage_object_path, public.agronomic_standard_documents.storage_object_path),
        extraction_method = excluded.extraction_method,
        extraction_version = excluded.extraction_version,
        provenance_verification_status = excluded.provenance_verification_status,
        ingestion_status = 'indexed',
        ingestion_error = null
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
      'extraction_method', v_effective_extraction,
      'provenance_verification_status', v_effective_prov_status,
      'storage_object_path', v_storage_path
    )
  );

  return jsonb_build_object(
    'document_id', v_doc_id,
    'standard_id', p_standard_id,
    'standard_status', v_std.status,
    'ingestion_status', 'indexed',
    'chunk_count', v_chunk_count,
    'provenance_verification_status', v_effective_prov_status,
    'extraction_method', v_effective_extraction
  );
end;
$$;

alter function public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text, text, text, text, text, text, text
) owner to postgres;
revoke all on function public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text, text, text, text, text, text, text
) from public, anon, authenticated, service_role;
grant execute on function public.ingest_agronomic_standard_document(
  uuid, text, text, text, integer, text, jsonb, text, text, text, text, text, text, text
) to authenticated;

------------------------------------------------------------------------------------------------
-- 4. Durable Failure / Reconciliation Recording RPC (Zero Chunks Created)
------------------------------------------------------------------------------------------------
create or replace function public.record_agronomic_document_ingestion_failure(
  p_standard_id uuid,
  p_document_title text,
  p_source_authority text,
  p_mime_type text,
  p_file_size_bytes integer,
  p_content_sha256 text,
  p_ingestion_status text,
  p_error_message text,
  p_storage_object_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_std public.farm_agronomic_standards%rowtype;
  v_doc_id uuid;
begin
  if v_uid is null or not private.account_active(v_uid) then
    raise exception 'Active authenticated staff account required.' using errcode = '42501';
  end if;

  if not (public.has_permission('standards.publish') or public.has_permission('crops.manage')) then
    raise exception 'Permission denied: standards.publish or crops.manage required.' using errcode = '42501';
  end if;

  if p_ingestion_status not in ('failed', 'reconciliation_required') then
    raise exception 'Failure status must be failed or reconciliation_required.' using errcode = '22023';
  end if;

  select * into v_std from public.farm_agronomic_standards where id = p_standard_id for update;
  if not found or v_std.status <> 'draft' then
    raise exception 'Target draft agronomic standard not found.' using errcode = '42501';
  end if;

  insert into public.agronomic_standard_documents (
    standard_id, document_title, source_authority, mime_type,
    file_size_bytes, content_sha256, storage_bucket_id, storage_object_path,
    extraction_method, provenance_verification_status, ingestion_status, ingestion_error, uploaded_by
  )
  values (
    p_standard_id, trim(p_document_title), trim(p_source_authority), p_mime_type,
    greatest(1, least(coalesce(p_file_size_bytes, 1), 10485760)),
    lower(trim(p_content_sha256)),
    case when nullif(trim(p_storage_object_path), '') is not null then 'agronomic-standard-sources' else null end,
    nullif(trim(p_storage_object_path), ''),
    'staff_entered_text',
    'staff_asserted',
    p_ingestion_status,
    left(coalesce(p_error_message, 'Ingestion failed'), 1000),
    v_uid
  )
  on conflict (standard_id, content_sha256) do update
    set ingestion_status = excluded.ingestion_status,
        ingestion_error = excluded.ingestion_error
  returning id into v_doc_id;

  delete from public.agronomic_standard_chunks where document_id = v_doc_id;

  perform public.write_audit(
    'agronomy_standard_document_ingestion_failed',
    'agronomic_standard_documents',
    v_doc_id,
    jsonb_build_object('standard_id', p_standard_id, 'ingestion_status', p_ingestion_status)
  );

  return v_doc_id;
end;
$$;

alter function public.record_agronomic_document_ingestion_failure(
  uuid, text, text, text, integer, text, text, text, text
) owner to postgres;
revoke all on function public.record_agronomic_document_ingestion_failure(
  uuid, text, text, text, integer, text, text, text, text
) from public, anon, authenticated, service_role;
grant execute on function public.record_agronomic_document_ingestion_failure(
  uuid, text, text, text, integer, text, text, text, text
) to authenticated;

------------------------------------------------------------------------------------------------
-- 5. Update Published-Only RAG Search to Enforce `ingestion_status = 'indexed'`
------------------------------------------------------------------------------------------------
drop function if exists public.search_published_agronomic_standards(
  text, text, text, text, text, extensions.vector, integer
);

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
  extraction_version text,
  provenance_verification_status text,
  original_file_sha256 text,
  storage_object_path text,
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
    d.extraction_version,
    d.provenance_verification_status,
    d.original_file_sha256,
    d.storage_object_path,
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
    and d.ingestion_status = 'indexed'
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
