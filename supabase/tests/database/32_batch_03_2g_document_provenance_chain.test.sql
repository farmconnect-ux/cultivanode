-- Batch 03.2G + 03.2H pgTAP tests: Database-Enforced Document Provenance Trust Boundary
-- Covers all 12 required negative tests and all 7 required positive tests.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- Seed: Staff 1 (super_admin), Staff 2 (super_admin), Farmer (non-staff).
insert into auth.users (id, phone)
values
  ('32200000-0000-4000-8000-000000000001', '2348032200001'),
  ('32200000-0000-4000-8000-000000000002', '2348032200002'),
  ('32200000-0000-4000-8000-000000000003', '2348032200003')
on conflict (id) do nothing;

insert into public.admin_roles (profile_id, admin_role)
values
  ('32200000-0000-4000-8000-000000000001', 'super_admin'),
  ('32200000-0000-4000-8000-000000000003', 'super_admin')
on conflict do nothing;

insert into public.farm_agronomic_standards (
  id, standard_code, crop_or_livestock_id, agro_zone, version, title, source_authority, status, is_active
) values
  ('32200000-0000-4000-8000-000000000201', 'STD-PROV-TEST', 'cassava', 'rainforest', '1.0', 'Cassava Provenance Standard', 'IITA', 'draft', false),
  ('32200000-0000-4000-8000-000000000202', 'STD-PROV-OTHER', 'cassava', 'rainforest', '1.0', 'Other Cassava Standard', 'IITA', 'draft', false)
on conflict (id) do nothing;

-- Seed an archived Storage object owned by Staff 1 for STD-PROV-TEST.
insert into storage.objects (bucket_id, name, owner, metadata)
values (
  'agronomic-standard-sources',
  '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
  '32200000-0000-4000-8000-000000000001',
  '{"mimetype":"text/markdown"}'::jsonb
);

------------------------------------------------------------------------------------------------
-- Privilege & Bucket Checks
------------------------------------------------------------------------------------------------
-- 1. Private Storage bucket exists with public = false and 10MB limit.
select ok(
  exists (
    select 1 from storage.buckets
     where id = 'agronomic-standard-sources' and public = false and file_size_limit = 10485760
  ),
  'private agronomic-standard-sources Storage bucket exists with 10MB limit'
);

-- 2. [Negative Test 10a] Trusted verification RPC is executable ONLY by service_role (never authenticated or anon).
select ok(
  not has_function_privilege('anon', 'public.complete_verified_agronomic_document_ingestion(uuid,uuid,text,text,text,integer,text,text,text,text,text,uuid,jsonb,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.complete_verified_agronomic_document_ingestion(uuid,uuid,text,text,text,integer,text,text,text,text,text,uuid,jsonb,text)', 'execute')
  and has_function_privilege('service_role', 'public.complete_verified_agronomic_document_ingestion(uuid,uuid,text,text,text,integer,text,text,text,text,text,uuid,jsonb,text)', 'execute'),
  'complete_verified_agronomic_document_ingestion is restricted exclusively to service_role'
);

-- 3. Failure recording RPC is revoked from anon and granted to authenticated.
select ok(
  not has_function_privilege('anon', 'public.record_agronomic_document_ingestion_failure(uuid,text,text,text,integer,text,text,text,text)', 'execute')
  and has_function_privilege('authenticated', 'public.record_agronomic_document_ingestion_failure(uuid,text,text,text,integer,text,text,text,text)', 'execute'),
  'record_agronomic_document_ingestion_failure RPC grants restricted to authenticated'
);

------------------------------------------------------------------------------------------------
-- Negative Tests for Authenticated Staff Caller (Direct Bypass Attempts)
------------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', '32200000-0000-4000-8000-000000000001', true);

-- 4. [Negative Test 1] Authenticated staff caller cannot directly assign file_hash_verified even with existing Storage object.
select throws_ok(
  $$
    select public.ingest_agronomic_standard_document(
      '32200000-0000-4000-8000-000000000201',
      'Direct Bypass Attempt', 'IITA', 'text/markdown', 256, repeat('3', 64),
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'bypass', 'content_sha256', encode(extensions.digest('bypass', 'sha256'), 'hex'))),
      null, repeat('f', 64), '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
      'markdown_file', 'file_hash_verified', '1.0', repeat('3', 64)
    )
  $$,
  '42501',
  null,
  'authenticated staff caller cannot directly assign file_hash_verified even when Storage object exists'
);

-- 5. [Negative Test 2] Authenticated caller cannot assign authority_verified.
select throws_ok(
  $$
    select public.ingest_agronomic_standard_document(
      '32200000-0000-4000-8000-000000000201',
      'Authority Claim Doc', 'IITA', 'text/plain', 100, repeat('a', 64),
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'hello', 'content_sha256', repeat('b', 64))),
      null, null, null, 'staff_entered_text', 'authority_verified'
    )
  $$,
  '42501',
  null,
  'ordinary ingestion cannot self-assign authority_verified'
);

-- 6. [Negative Tests 3 & 4 + Positive Test 1] Supplying arbitrary SHA-256 or existing Storage path to authenticated RPC stays staff_asserted with null file hashes/path.
select is(
  (public.ingest_agronomic_standard_document(
    '32200000-0000-4000-8000-000000000201',
    'Staff Text Doc', 'IITA', 'text/plain', 100, repeat('1', 64),
    jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'Plant cassava stems at 1m x 1m.', 'content_sha256', repeat('2', 64))),
    null, repeat('f', 64), '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
    'markdown_file', 'staff_asserted', '1.0', repeat('1', 64)
  ) ->> 'provenance_verification_status'),
  'staff_asserted',
  'authenticated RPC with arbitrary hash and existing Storage path still produces staff_asserted'
);

-- 7. Confirm caller-supplied unverified file hash and Storage path were stripped on staff_asserted row.
select ok(
  exists (
    select 1 from public.agronomic_standard_documents
     where standard_id = '32200000-0000-4000-8000-000000000201'
       and content_sha256 = repeat('1', 64)
       and provenance_verification_status = 'staff_asserted'
       and extraction_method = 'staff_entered_text'
       and original_file_sha256 is null
       and storage_object_path is null
  ),
  'staff_asserted row strips unverified original_file_sha256 and storage_object_path'
);

------------------------------------------------------------------------------------------------
-- Negative Tests on Trusted Verification Operation (service_role)
------------------------------------------------------------------------------------------------
reset role;
set local role service_role;

-- 8. [Negative Test 5] Cannot substitute an unrelated Storage object path (wrong standard_id prefix).
select throws_ok(
  $$
    select public.complete_verified_agronomic_document_ingestion(
      '32200000-0000-4000-8000-000000000001',
      '32200000-0000-4000-8000-000000000202',
      'Substituted Path Doc', 'IITA', 'text/markdown', 256,
      repeat('f', 64), repeat('3', 64),
      '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
      'markdown_file', '1.0', '32200000-0000-4000-8000-000000000901',
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'Verified cassava weed management.', 'content_sha256', encode(extensions.digest('Verified cassava weed management.', 'sha256'), 'hex')))
    )
  $$,
  '22023',
  null,
  'cannot substitute a Storage object path belonging to another standard'
);

-- 9. [Negative Test 10b] Non-staff actor (ordinary farmer) rejected even when invoked via service_role.
select throws_ok(
  $$
    select public.complete_verified_agronomic_document_ingestion(
      '32200000-0000-4000-8000-000000000002',
      '32200000-0000-4000-8000-000000000201',
      'Farmer Actor Doc', 'IITA', 'text/markdown', 256,
      repeat('f', 64), repeat('3', 64),
      '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
      'markdown_file', '1.0', '32200000-0000-4000-8000-000000000902',
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'Verified cassava weed management.', 'content_sha256', encode(extensions.digest('Verified cassava weed management.', 'sha256'), 'hex')))
    )
  $$,
  '42501',
  null,
  'actor without standards.publish or crops.manage permission is rejected'
);

-- 10. [Negative Test 11] Cannot spoof another staff user's actor identity (Staff 3 != Storage owner Staff 1).
select throws_ok(
  $$
    select public.complete_verified_agronomic_document_ingestion(
      '32200000-0000-4000-8000-000000000003',
      '32200000-0000-4000-8000-000000000201',
      'Spoofed Actor Doc', 'IITA', 'text/markdown', 256,
      repeat('f', 64), repeat('3', 64),
      '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
      'markdown_file', '1.0', '32200000-0000-4000-8000-000000000903',
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'Verified cassava weed management.', 'content_sha256', encode(extensions.digest('Verified cassava weed management.', 'sha256'), 'hex')))
    )
  $$,
  '42501',
  null,
  'cannot spoof another staff actor identity whose UID does not match Storage object owner'
);

-- 11. Chunk content_sha256 mismatch against chunk content is rejected by PostgreSQL.
select throws_ok(
  $$
    select public.complete_verified_agronomic_document_ingestion(
      '32200000-0000-4000-8000-000000000001',
      '32200000-0000-4000-8000-000000000201',
      'Tampered Chunk Hash Doc', 'IITA', 'text/markdown', 256,
      repeat('f', 64), repeat('3', 64),
      '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
      'markdown_file', '1.0', '32200000-0000-4000-8000-000000000904',
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'Verified cassava weed management.', 'content_sha256', repeat('0', 64)))
    )
  $$,
  '22023',
  null,
  'mismatched chunk content_sha256 is rejected inside PostgreSQL'
);

------------------------------------------------------------------------------------------------
-- Positive Tests 2, 3, 4, 6: Legitimate Trusted Verification, Immutability, & Audit Attribution
------------------------------------------------------------------------------------------------
-- 12. [Positive Tests 2 & 3] Legitimate trusted verification succeeds, records file_hash_verified, and transitions to indexed.
select is(
  (public.complete_verified_agronomic_document_ingestion(
    '32200000-0000-4000-8000-000000000001',
    '32200000-0000-4000-8000-000000000201',
    'Archived Verified Doc', 'IITA', 'text/markdown', 256,
    repeat('f', 64), repeat('3', 64),
    '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
    'markdown_file', '1.0', '32200000-0000-4000-8000-000000000910',
    jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'Verified cassava weed management.', 'content_sha256', encode(extensions.digest('Verified cassava weed management.', 'sha256'), 'hex')))
  ) ->> 'provenance_verification_status'),
  'file_hash_verified',
  'legitimate service_role trusted verification records file_hash_verified and indexes verified chunks'
);

-- 13. [Positive Test 6] Audit log records actual actor_id and verification_trace_id.
reset role;
select ok(
  exists (
    select 1 from public.audit_log
     where action = 'agronomy_standard_document_file_hash_verified'
       and actor_id = '32200000-0000-4000-8000-000000000001'
       and metadata ->> 'verification_trace_id' = '32200000-0000-4000-8000-000000000910'
       and metadata ->> 'file_hash_verified_at' is not null
  ),
  'audit_log records verified actor_id, verification_trace_id, and file_hash_verified_at'
);

-- 14. [Negative Test 6 + Positive Test 4] Cannot change original_file_sha256 after verification.
select throws_ok(
  $$
    update public.agronomic_standard_documents
       set original_file_sha256 = repeat('e', 64)
     where verification_trace_id = '32200000-0000-4000-8000-000000000910'
  $$,
  '42501',
  null,
  'cannot mutate original_file_sha256 after file_hash_verified'
);

-- 15. [Negative Test 7 + Positive Test 4] Cannot change extracted_text_sha256 after verification.
select throws_ok(
  $$
    update public.agronomic_standard_documents
       set extracted_text_sha256 = repeat('d', 64)
     where verification_trace_id = '32200000-0000-4000-8000-000000000910'
  $$,
  '42501',
  null,
  'cannot mutate extracted_text_sha256 after file_hash_verified'
);

-- 16. [Negative Test 8] Cannot attach unrelated chunks to an already verified and indexed document.
select throws_ok(
  $$
    insert into public.agronomic_standard_chunks (
      standard_id, document_id, chunk_index, content, content_sha256
    )
    select standard_id, id, 99, 'Injected unrelated chunk', encode(extensions.digest('Injected unrelated chunk', 'sha256'), 'hex')
      from public.agronomic_standard_documents
     where verification_trace_id = '32200000-0000-4000-8000-000000000910'
  $$,
  '42501',
  null,
  'cannot attach unrelated chunks to a verified and indexed document'
);

-- 17. [Negative Test 12] Failed verification records reconciliation_required with zero chunks.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32200000-0000-4000-8000-000000000001', true);

select ok(
  public.record_agronomic_document_ingestion_failure(
    '32200000-0000-4000-8000-000000000201',
    'Failed Source Doc', 'IITA', 'text/plain', 50, repeat('9', 64),
    'reconciliation_required', 'Storage hash mismatch'
  ) is not null,
  'record_agronomic_document_ingestion_failure records reconciliation_required document'
);

-- 18. [Negative Test 9] Cannot transition an incomplete document (zero chunks) directly to indexed.
reset role;
select throws_ok(
  $$
    update public.agronomic_standard_documents
       set ingestion_status = 'indexed'
     where standard_id = '32200000-0000-4000-8000-000000000201'
       and content_sha256 = repeat('9', 64)
  $$,
  '23514',
  null,
  'cannot transition a document with zero chunks directly to indexed'
);

-- 19. Cannot attach chunks to a reconciliation_required document.
select throws_ok(
  $$
    insert into public.agronomic_standard_chunks (
      standard_id, document_id, chunk_index, content, content_sha256
    )
    select standard_id, id, 0, 'Orphan chunk', encode(extensions.digest('Orphan chunk', 'sha256'), 'hex')
      from public.agronomic_standard_documents
     where standard_id = '32200000-0000-4000-8000-000000000201'
       and content_sha256 = repeat('9', 64)
  $$,
  '23514',
  null,
  'cannot attach chunks to a failed or reconciliation_required document'
);

------------------------------------------------------------------------------------------------
-- Positive Tests 5 & 7: Publication, Effective-Date Controls, & Farmer RLS
------------------------------------------------------------------------------------------------
update public.farm_agronomic_standards
   set status = 'published', is_active = true, published_at = now(), effective_from = current_date
 where id = '32200000-0000-4000-8000-000000000201';

set local role authenticated;
select set_config('request.jwt.claim.sub', '32200000-0000-4000-8000-000000000002', true);

-- 20. Published search returns indexed docs ONLY (excludes reconciliation_required).
select is(
  (select count(*)::int from public.search_published_agronomic_standards('cassava', 'rainforest', 'IITA', 'STD-PROV-TEST', null, null, 10)),
  2,
  'published RAG search returns indexed documents only and excludes failed/reconciliation_required documents'
);

-- 21. Published search preserves file_hash_verified provenance, original_file_sha256, and storage_object_path.
select ok(
  exists (
    select 1 from public.search_published_agronomic_standards('cassava', 'rainforest', 'IITA', 'STD-PROV-TEST', 'weed', null, 10)
     where provenance_verification_status = 'file_hash_verified'
       and original_file_sha256 = repeat('f', 64)
       and storage_object_path = '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md'
  ),
  'published RAG search preserves file_hash_verified provenance, original_file_sha256, and storage_object_path'
);

-- 22. Non-staff farmer denied record_agronomic_document_ingestion_failure.
select throws_ok(
  $$
    select public.record_agronomic_document_ingestion_failure(
      '32200000-0000-4000-8000-000000000201',
      'Bad', 'IITA', 'text/plain', 50, repeat('8', 64), 'failed', 'nope'
    )
  $$,
  '42501',
  null,
  'non-staff farmer denied record_agronomic_document_ingestion_failure'
);

select * from finish();
rollback;
