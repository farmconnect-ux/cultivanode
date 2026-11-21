-- CultivaNode 3.0, Batch 03.2H: Database-Enforced Document Provenance Trust Boundary
--
-- Forward-only migration resolving the Batch 03.2G database trust-boundary gap:
-- 1. Strictly separates staff assertion (`public.ingest_agronomic_standard_document`, `authenticated`)
--    from trusted file-hash verification (`public.complete_verified_agronomic_document_ingestion`,
--    `service_role`-only, delegating to `private.complete_verified_agronomic_document_ingestion`).
-- 2. Ordinary `authenticated` callers can NEVER assign `file_hash_verified` or `authority_verified`,
--    even if they supply 64-hex hashes or reference an existing `storage.objects` row.
-- 3. Adds verification audit columns (`file_hash_verified_by`, `file_hash_verified_at`,
--    `verification_trace_id`) and uniqueness constraints preventing replay of verification traces
--    or reuse of a Storage object path across multiple active/verified documents.
-- 4. Strengthens `private.guard_agronomic_rag_integrity()` trigger:
--    - Verified source metadata (`original_file_sha256`, `extracted_text_sha256`, `storage_bucket_id`,
--      `storage_object_path`, `extraction_method`, `extraction_version`, `file_hash_verified_by`,
--      `file_hash_verified_at`, `verification_trace_id`) is immutable once verified.
--    - Documents CANNOT enter `ingestion_status = 'indexed'` unless at least 1 chunk exists.
--    - Chunks CANNOT be inserted/updated/deleted on an already verified & indexed document, nor
--      inserted into a `failed` or `reconciliation_required` document.
-- 5. Inside `private.complete_verified_agronomic_document_ingestion`:
--    - Verifies active staff actor (`private.account_active` + `standards.publish`/`crops.manage`).
--    - Verifies `storage.objects` existence, canonical path binding (`<standard_id>/<original_file_sha256>.<ext>`),
--      AND `storage.objects.owner = p_actor_id` (preventing actor spoofing).
--    - Independently verifies every chunk's `content_sha256` against `extensions.digest(content, 'sha256')`.
--    - Transitions `extracted` -> `indexed` only after all chunks persist, and writes an explicit
--      `public.audit_log` record attributing `actor_id = p_actor_id` and `file_hash_verified_at`.
--
-- Explicit trust-boundary note:
-- PostgreSQL cannot directly read external Supabase Storage object bytes. Cryptographic byte
-- verification (upload -> download -> SHA-256 -> extract -> chunk) executes inside the restricted
-- Next.js server-side verification module (`apps/web/src/lib/rag/trusted-document-verifier.ts`),
-- while PostgreSQL enforces that ordinary authenticated callers cannot invoke the verification
-- RPC or self-assert `file_hash_verified`.
--
-- Rollback notes: Revoke/drop `public.complete_verified_agronomic_document_ingestion`,
-- `private.complete_verified_agronomic_document_ingestion`, and `private.profile_has_permission`,
-- and restore `20261122030000` trigger/RPC definitions. Added audit columns should not be dropped.

------------------------------------------------------------------------------------------------
-- 1. Verification Attribution Columns & Replay-Prevention Indexes
------------------------------------------------------------------------------------------------
alter table public.agronomic_standard_documents
  add column if not exists file_hash_verified_by uuid references public.profiles (id) on delete set null,
  add column if not exists file_hash_verified_at timestamptz,
  add column if not exists verification_trace_id uuid;

create unique index if not exists agronomic_std_docs_verification_trace_uidx
  on public.agronomic_standard_documents (verification_trace_id)
  where verification_trace_id is not null;

create unique index if not exists agronomic_std_docs_active_storage_path_uidx
  on public.agronomic_standard_documents (storage_bucket_id, storage_object_path)
  where storage_bucket_id is not null
    and storage_object_path is not null
    and ingestion_status not in ('failed', 'reconciliation_required');

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
        and file_hash_verified_by is not null
        and file_hash_verified_at is not null
        and verification_trace_id is not null
        and extraction_method <> 'staff_entered_text'
      )
    )
    and (
      provenance_verification_status <> 'authority_verified'
      or (authority_verified_by is not null and authority_verified_at is not null)
    )
  );

------------------------------------------------------------------------------------------------
-- 2. Private Permission Helper (for explicit actor validation under service_role)
------------------------------------------------------------------------------------------------
create or replace function private.profile_has_permission(
  p_profile_id uuid,
  p_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_profile_id is not null
    and exists (
      select 1
        from public.admin_roles a
       where a.profile_id = p_profile_id
         and (
           a.admin_role = 'super_admin'
           or exists (
             select 1
               from public.admin_role_permissions rp
              where rp.admin_role = a.admin_role
                and rp.permission = p_permission
           )
         )
    );
$$;

alter function private.profile_has_permission(uuid, text) owner to postgres;
revoke all on function private.profile_has_permission(uuid, text)
  from public, anon, authenticated, service_role;

------------------------------------------------------------------------------------------------
-- 3. Strengthened Immutability & Lifecycle Integrity Trigger
------------------------------------------------------------------------------------------------
create or replace function private.guard_agronomic_rag_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.agronomy_content_status;
  v_doc public.agronomic_standard_documents%rowtype;
  v_target_standard_id uuid;
begin
  v_target_standard_id := coalesce(new.standard_id, old.standard_id);

  if tg_table_name = 'agronomic_standard_documents' then
    if tg_op = 'UPDATE' then
      -- Verified source metadata is strictly immutable once verified.
      if old.provenance_verification_status in ('file_hash_verified', 'authority_verified') then
        if new.standard_id is distinct from old.standard_id
           or new.original_file_sha256 is distinct from old.original_file_sha256
           or new.extracted_text_sha256 is distinct from old.extracted_text_sha256
           or new.storage_bucket_id is distinct from old.storage_bucket_id
           or new.storage_object_path is distinct from old.storage_object_path
           or new.extraction_method is distinct from old.extraction_method
           or new.extraction_version is distinct from old.extraction_version
           or new.file_hash_verified_by is distinct from old.file_hash_verified_by
           or new.file_hash_verified_at is distinct from old.file_hash_verified_at
           or new.verification_trace_id is distinct from old.verification_trace_id
           or (
             old.provenance_verification_status = 'file_hash_verified'
             and new.provenance_verification_status = 'staff_asserted'
           )
           or (
             old.ingestion_status = 'indexed'
             and new.ingestion_status <> 'indexed'
           )
        then
          raise exception 'Verified agronomic document provenance metadata is immutable.'
            using errcode = '42501';
        end if;
      end if;
    end if;

    -- A document cannot enter `indexed` state unless at least one chunk exists for it.
    if tg_op in ('INSERT', 'UPDATE') and new.ingestion_status = 'indexed' then
      if not exists (
        select 1
          from public.agronomic_standard_chunks c
         where c.document_id = new.id
      ) then
        raise exception 'Document cannot transition to indexed without persisted chunks.'
          using errcode = '23514';
      end if;
    end if;
  end if;

  if tg_table_name = 'agronomic_standard_chunks' then
    select * into v_doc
      from public.agronomic_standard_documents
     where id = coalesce(new.document_id, old.document_id);

    if tg_op in ('INSERT', 'UPDATE') then
      if not found or v_doc.standard_id <> new.standard_id then
        raise exception 'Chunk standard_id must match parent document standard_id.' using errcode = '23514';
      end if;

      if v_doc.ingestion_status in ('failed', 'reconciliation_required') then
        raise exception 'Cannot attach chunks to a failed or reconciliation_required document.'
          using errcode = '23514';
      end if;
    end if;

    if found
       and v_doc.ingestion_status = 'indexed'
       and v_doc.provenance_verification_status in ('file_hash_verified', 'authority_verified')
    then
      raise exception 'Chunks of a verified and indexed agronomic document are immutable.'
        using errcode = '42501';
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

------------------------------------------------------------------------------------------------
-- 4. Staff Assertion RPC (authenticated ONLY — can NEVER assign file_hash_verified / authority_verified)
------------------------------------------------------------------------------------------------
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
  v_existing public.agronomic_standard_documents%rowtype;
  v_doc_id uuid;
  v_chunk jsonb;
  v_chunk_count integer := 0;
  v_chunk_content text;
  v_chunk_sha text;
  v_expected_chunk_sha text;
  v_embedding extensions.vector(1536);
  v_req_status text := lower(trim(coalesce(p_provenance_verification_status, 'staff_asserted')));
begin
  if v_uid is null or not private.account_active(v_uid) then
    raise exception 'Active authenticated staff account required.' using errcode = '42501';
  end if;

  if not (public.has_permission('standards.publish') or public.has_permission('crops.manage')) then
    raise exception 'Permission denied: standards.publish or crops.manage required.' using errcode = '42501';
  end if;

  -- Hard database trust boundary: ordinary authenticated callers can NEVER self-assign
  -- `file_hash_verified` or `authority_verified`.
  if v_req_status in ('file_hash_verified', 'authority_verified') then
    raise exception 'Authenticated callers cannot directly assign % provenance; use the trusted verification pipeline.', v_req_status
      using errcode = '42501';
  end if;

  if v_req_status <> 'staff_asserted' then
    raise exception 'Invalid provenance status requested.' using errcode = '22023';
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

  -- Prevent overwriting an already file_hash_verified or authority_verified document via staff-assertion path.
  select * into v_existing
    from public.agronomic_standard_documents
   where standard_id = p_standard_id
     and content_sha256 = lower(trim(p_content_sha256))
     for update;

  if found and v_existing.provenance_verification_status in ('file_hash_verified', 'authority_verified') then
    raise exception 'Cannot overwrite a verified agronomic document via staff-assertion ingestion.'
      using errcode = '42501';
  end if;

  -- Unconditionally strip any caller-supplied file hashes or Storage paths on the staff-assertion path:
  -- supplying arbitrary hashes or referencing existing Storage objects can NEVER produce verified status.
  insert into public.agronomic_standard_documents (
    standard_id, document_title, source_authority, mime_type,
    file_size_bytes, content_sha256, original_file_sha256, extracted_text_sha256,
    storage_bucket_id, storage_object_path, extraction_method, extraction_version,
    provenance_verification_status, ingestion_status, ingestion_error, external_uri, uploaded_by
  )
  values (
    p_standard_id, trim(p_document_title), trim(p_source_authority), p_mime_type,
    p_file_size_bytes, lower(trim(p_content_sha256)), null, null,
    null, null, 'staff_entered_text', coalesce(nullif(trim(p_extraction_version), ''), '1.0'),
    'staff_asserted', 'extracted', null, nullif(trim(p_external_uri), ''), v_uid
  )
  on conflict (standard_id, content_sha256) do update
    set document_title = excluded.document_title,
        original_file_sha256 = null,
        extracted_text_sha256 = null,
        storage_bucket_id = null,
        storage_object_path = null,
        extraction_method = 'staff_entered_text',
        extraction_version = excluded.extraction_version,
        provenance_verification_status = 'staff_asserted',
        ingestion_status = 'extracted',
        ingestion_error = null
  returning id into v_doc_id;

  delete from public.agronomic_standard_chunks where document_id = v_doc_id;

  for v_chunk in select value from jsonb_array_elements(p_chunks)
  loop
    v_chunk_content := v_chunk ->> 'content';
    v_chunk_sha := lower(trim(coalesce(v_chunk ->> 'content_sha256', '')));
    if v_chunk_content is null or char_length(trim(v_chunk_content)) = 0 then
      raise exception 'Chunk content cannot be empty.' using errcode = '22023';
    end if;

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
      (v_chunk ->> 'paragraph_index')::integer, v_chunk_content, v_chunk_sha,
      v_embedding, nullif(trim(v_chunk ->> 'embedding_model'), ''), nullif(trim(v_chunk ->> 'embedding_version'), '')
    );

    v_chunk_count := v_chunk_count + 1;
  end loop;

  -- Transition to `indexed` ONLY after chunks are persisted.
  update public.agronomic_standard_documents
     set ingestion_status = 'indexed'
   where id = v_doc_id;

  perform public.write_audit(
    'agronomy_standard_document_ingested',
    'agronomic_standard_documents',
    v_doc_id,
    jsonb_build_object(
      'standard_id', p_standard_id,
      'chunk_count', v_chunk_count,
      'mime_type', p_mime_type,
      'extraction_method', 'staff_entered_text',
      'provenance_verification_status', 'staff_asserted',
      'storage_object_path', null
    )
  );

  return jsonb_build_object(
    'document_id', v_doc_id,
    'standard_id', p_standard_id,
    'standard_status', v_std.status,
    'ingestion_status', 'indexed',
    'chunk_count', v_chunk_count,
    'provenance_verification_status', 'staff_asserted',
    'extraction_method', 'staff_entered_text'
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
-- 5. Restricted Trusted Verification Operation (service_role ONLY)
------------------------------------------------------------------------------------------------
create or replace function private.complete_verified_agronomic_document_ingestion(
  p_actor_id uuid,
  p_standard_id uuid,
  p_document_title text,
  p_source_authority text,
  p_mime_type text,
  p_file_size_bytes integer,
  p_original_file_sha256 text,
  p_extracted_text_sha256 text,
  p_storage_object_path text,
  p_extraction_method text,
  p_extraction_version text,
  p_verification_trace_id uuid,
  p_chunks jsonb,
  p_external_uri text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_std public.farm_agronomic_standards%rowtype;
  v_storage_obj record;
  v_doc_id uuid;
  v_verified_at timestamptz := clock_timestamp();
  v_orig_hash text := lower(trim(coalesce(p_original_file_sha256, '')));
  v_ext_hash text := lower(trim(coalesce(p_extracted_text_sha256, '')));
  v_storage_path text := trim(coalesce(p_storage_object_path, ''));
  v_method text := trim(coalesce(p_extraction_method, ''));
  v_version text := trim(coalesce(p_extraction_version, ''));
  v_chunk jsonb;
  v_chunk_count integer := 0;
  v_chunk_content text;
  v_chunk_sha text;
  v_computed_chunk_sha text;
  v_embedding extensions.vector(1536);
begin
  -- 1. Validate explicit actor identity & active staff permission inside PostgreSQL.
  if p_actor_id is null or not private.account_active(p_actor_id) then
    raise exception 'Active verified staff actor is required.' using errcode = '42501';
  end if;

  if not (
    private.profile_has_permission(p_actor_id, 'standards.publish')
    or private.profile_has_permission(p_actor_id, 'crops.manage')
  ) then
    raise exception 'Actor lacks standards.publish or crops.manage permission.' using errcode = '42501';
  end if;

  -- 2. Validate cryptographic hashes, trace ID, extraction method, and chunks.
  if p_verification_trace_id is null then
    raise exception 'verification_trace_id is required.' using errcode = '22023';
  end if;

  if v_orig_hash !~ '^[a-f0-9]{64}$' or v_ext_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Valid 64-character SHA-256 hashes are required for original_file_sha256 and extracted_text_sha256.'
      using errcode = '22023';
  end if;

  if v_method not in ('plain_text_file', 'markdown_file', 'json_structured_file') then
    raise exception 'Verified file ingestion requires a supported file extraction method.'
      using errcode = '22023';
  end if;

  if char_length(v_version) < 1 or char_length(v_version) > 64 then
    raise exception 'Valid extraction_version is required.' using errcode = '22023';
  end if;

  if p_chunks is null or jsonb_typeof(p_chunks) <> 'array' or jsonb_array_length(p_chunks) = 0 or jsonb_array_length(p_chunks) > 500 then
    raise exception 'p_chunks must be a non-empty array (max 500 chunks).' using errcode = '22023';
  end if;

  -- 3. Lock target standard and ensure it is still DRAFT.
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

  -- 4. Bind Storage object path to exact standard_id + original_file_sha256 AND verify ownership by p_actor_id.
  if v_storage_path !~ ('^' || p_standard_id::text || '/' || v_orig_hash || '\.(txt|md|json)$') then
    raise exception 'storage_object_path must be bound to <standard_id>/<original_file_sha256>.<ext>.'
      using errcode = '22023';
  end if;

  select o.id, o.owner
    into v_storage_obj
    from storage.objects o
   where o.bucket_id = 'agronomic-standard-sources'
     and o.name = v_storage_path;

  if not found then
    raise exception 'Archived source object not found in agronomic-standard-sources.'
      using errcode = '22023';
  end if;

  if v_storage_obj.owner is null or v_storage_obj.owner <> p_actor_id then
    raise exception 'Actor identity does not match the archived Storage object owner.'
      using errcode = '42501';
  end if;

  -- 5. Insert verified document in `extracted` state (never `indexed` until chunks succeed).
  insert into public.agronomic_standard_documents (
    standard_id, document_title, source_authority, mime_type,
    file_size_bytes, content_sha256, original_file_sha256, extracted_text_sha256,
    storage_bucket_id, storage_object_path, extraction_method, extraction_version,
    provenance_verification_status, ingestion_status, ingestion_error,
    external_uri, uploaded_by, file_hash_verified_by, file_hash_verified_at, verification_trace_id
  )
  values (
    p_standard_id, trim(p_document_title), trim(p_source_authority), p_mime_type,
    p_file_size_bytes, v_ext_hash, v_orig_hash, v_ext_hash,
    'agronomic-standard-sources', v_storage_path, v_method, v_version,
    'file_hash_verified', 'extracted', null,
    nullif(trim(p_external_uri), ''), p_actor_id, p_actor_id, v_verified_at, p_verification_trace_id
  )
  returning id into v_doc_id;

  -- 6. Validate and persist every chunk, verifying each chunk's SHA-256 against its exact content.
  for v_chunk in select value from jsonb_array_elements(p_chunks)
  loop
    v_chunk_content := v_chunk ->> 'content';
    v_chunk_sha := lower(trim(coalesce(v_chunk ->> 'content_sha256', '')));
    if v_chunk_content is null or char_length(trim(v_chunk_content)) = 0 then
      raise exception 'Chunk content cannot be empty.' using errcode = '22023';
    end if;

    v_computed_chunk_sha := encode(extensions.digest(v_chunk_content, 'sha256'), 'hex');
    if v_chunk_sha <> v_computed_chunk_sha then
      raise exception 'Chunk content_sha256 does not match chunk content.' using errcode = '22023';
    end if;

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
      (v_chunk ->> 'paragraph_index')::integer, v_chunk_content, v_chunk_sha,
      v_embedding, nullif(trim(v_chunk ->> 'embedding_model'), ''), nullif(trim(v_chunk ->> 'embedding_version'), '')
    );

    v_chunk_count := v_chunk_count + 1;
  end loop;

  -- 7. Transition to `indexed` ONLY after all verified chunks are persisted.
  update public.agronomic_standard_documents
     set ingestion_status = 'indexed'
   where id = v_doc_id;

  -- 8. Record explicit actor-attributed audit event.
  insert into public.audit_log (actor_id, action, entity, entity_id, metadata)
  values (
    p_actor_id,
    'agronomy_standard_document_file_hash_verified',
    'agronomic_standard_documents',
    v_doc_id,
    jsonb_build_object(
      'standard_id', p_standard_id,
      'verification_trace_id', p_verification_trace_id,
      'original_file_sha256', v_orig_hash,
      'extracted_text_sha256', v_ext_hash,
      'storage_bucket_id', 'agronomic-standard-sources',
      'storage_object_path', v_storage_path,
      'extraction_method', v_method,
      'extraction_version', v_version,
      'chunk_count', v_chunk_count,
      'provenance_verification_status', 'file_hash_verified',
      'file_hash_verified_at', v_verified_at
    )
  );

  return jsonb_build_object(
    'document_id', v_doc_id,
    'standard_id', p_standard_id,
    'standard_status', v_std.status,
    'ingestion_status', 'indexed',
    'chunk_count', v_chunk_count,
    'provenance_verification_status', 'file_hash_verified',
    'extraction_method', v_method,
    'extraction_version', v_version,
    'verification_trace_id', p_verification_trace_id,
    'file_hash_verified_by', p_actor_id,
    'file_hash_verified_at', v_verified_at
  );
end;
$$;

alter function private.complete_verified_agronomic_document_ingestion(
  uuid, uuid, text, text, text, integer, text, text, text, text, text, uuid, jsonb, text
) owner to postgres;
revoke all on function private.complete_verified_agronomic_document_ingestion(
  uuid, uuid, text, text, text, integer, text, text, text, text, text, uuid, jsonb, text
) from public, anon, authenticated, service_role;

-- Narrow public RPC wrapper granted EXCLUSIVELY to `service_role` (never `authenticated` or `anon`).
create or replace function public.complete_verified_agronomic_document_ingestion(
  p_actor_id uuid,
  p_standard_id uuid,
  p_document_title text,
  p_source_authority text,
  p_mime_type text,
  p_file_size_bytes integer,
  p_original_file_sha256 text,
  p_extracted_text_sha256 text,
  p_storage_object_path text,
  p_extraction_method text,
  p_extraction_version text,
  p_verification_trace_id uuid,
  p_chunks jsonb,
  p_external_uri text default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.complete_verified_agronomic_document_ingestion(
    p_actor_id,
    p_standard_id,
    p_document_title,
    p_source_authority,
    p_mime_type,
    p_file_size_bytes,
    p_original_file_sha256,
    p_extracted_text_sha256,
    p_storage_object_path,
    p_extraction_method,
    p_extraction_version,
    p_verification_trace_id,
    p_chunks,
    p_external_uri
  );
$$;

alter function public.complete_verified_agronomic_document_ingestion(
  uuid, uuid, text, text, text, integer, text, text, text, text, text, uuid, jsonb, text
) owner to postgres;
revoke all on function public.complete_verified_agronomic_document_ingestion(
  uuid, uuid, text, text, text, integer, text, text, text, text, text, uuid, jsonb, text
) from public, anon, authenticated, service_role;
grant execute on function public.complete_verified_agronomic_document_ingestion(
  uuid, uuid, text, text, text, integer, text, text, text, text, text, uuid, jsonb, text
) to service_role;
