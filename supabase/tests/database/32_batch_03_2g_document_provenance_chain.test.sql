-- Batch 03.2G pgTAP tests: Verifiable Document-to-Passage Provenance Chain & Storage Governance (Finding 6)
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, phone)
values
  ('32200000-0000-4000-8000-000000000001', '2348032200001'),
  ('32200000-0000-4000-8000-000000000002', '2348032200002')
on conflict (id) do nothing;

insert into public.admin_roles (profile_id, admin_role)
values ('32200000-0000-4000-8000-000000000001', 'super_admin')
on conflict do nothing;

insert into public.farm_agronomic_standards (
  id, standard_code, crop_or_livestock_id, agro_zone, version, title, source_authority, status, is_active
) values (
  '32200000-0000-4000-8000-000000000201', 'STD-PROV-TEST', 'cassava', 'rainforest', '1.0', 'Cassava Provenance Standard', 'IITA', 'draft', false
) on conflict (id) do nothing;

-- 1. Private Storage bucket exists with public = false.
select ok(
  exists (
    select 1 from storage.buckets
     where id = 'agronomic-standard-sources' and public = false and file_size_limit = 10485760
  ),
  'private agronomic-standard-sources Storage bucket exists with 10MB limit'
);

-- 2. Failure recording RPC is revoked from anon and granted to authenticated.
select ok(
  not has_function_privilege('anon', 'public.record_agronomic_document_ingestion_failure(uuid,text,text,text,integer,text,text,text,text)', 'execute')
  and has_function_privilege('authenticated', 'public.record_agronomic_document_ingestion_failure(uuid,text,text,text,integer,text,text,text,text)', 'execute'),
  'record_agronomic_document_ingestion_failure RPC grants restricted to authenticated'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '32200000-0000-4000-8000-000000000001', true);

-- 3. Staff cannot self-assign `authority_verified` via ordinary ingestion.
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

-- 4. Claiming file_hash_verified with a non-existent Storage object fails closed (22023).
select throws_ok(
  $$
    select public.ingest_agronomic_standard_document(
      '32200000-0000-4000-8000-000000000201',
      'Missing Storage Object Doc', 'IITA', 'text/markdown', 100, repeat('c', 64),
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'hello', 'content_sha256', repeat('d', 64))),
      null, repeat('e', 64), '32200000-0000-4000-8000-000000000201/missing.md', 'markdown_file', 'file_hash_verified', '1.0', repeat('c', 64)
    )
  $$,
  '22023',
  null,
  'file_hash_verified rejected when archived Storage object does not exist'
);

-- 5. Staff-entered text without Storage object is unconditionally forced to staff_asserted + staff_entered_text.
select is(
  (public.ingest_agronomic_standard_document(
    '32200000-0000-4000-8000-000000000201',
    'Staff Text Doc', 'IITA', 'text/plain', 100, repeat('1', 64),
    jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'Plant cassava stems at 1m x 1m.', 'content_sha256', repeat('2', 64))),
    null, null, null, 'markdown_file', 'staff_asserted'
  ) ->> 'provenance_verification_status'),
  'staff_asserted',
  'staff-entered text without Storage object remains staff_asserted'
);

-- 6. Seed an actual archived object in storage.objects and verify file_hash_verified succeeds.
reset role;
insert into storage.objects (bucket_id, name, owner, metadata)
values (
  'agronomic-standard-sources',
  '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
  '32200000-0000-4000-8000-000000000001',
  '{"mimetype":"text/markdown"}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '32200000-0000-4000-8000-000000000001', true);

select is(
  (public.ingest_agronomic_standard_document(
    '32200000-0000-4000-8000-000000000201',
    'Archived Source Doc', 'IITA', 'text/markdown', 256, repeat('3', 64),
    jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'Verified cassava weed management.', 'content_sha256', repeat('4', 64))),
    null, repeat('f', 64), '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md',
    'markdown_file', 'file_hash_verified', '1.0', repeat('3', 64)
  ) ->> 'provenance_verification_status'),
  'file_hash_verified',
  'archived Storage object + original & extracted hashes produce file_hash_verified'
);

-- 7. Durable failure recording creates a failed document row with zero chunks.
select ok(
  public.record_agronomic_document_ingestion_failure(
    '32200000-0000-4000-8000-000000000201',
    'Failed Source Doc', 'IITA', 'text/plain', 50, repeat('9', 64),
    'reconciliation_required', 'Storage hash mismatch'
  ) is not null,
  'record_agronomic_document_ingestion_failure records reconciliation_required document'
);

-- 8. Publish standard and verify search returns indexed docs ONLY (never failed/reconciliation_required) with provenance.
reset role;
update public.farm_agronomic_standards
   set status = 'published', is_active = true, published_at = now(), effective_from = current_date
 where id = '32200000-0000-4000-8000-000000000201';

set local role authenticated;
select set_config('request.jwt.claim.sub', '32200000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::int from public.search_published_agronomic_standards('cassava', 'rainforest', 'IITA', 'STD-PROV-TEST', null, null, 10)),
  2,
  'published RAG search returns indexed documents only and excludes failed/reconciliation_required documents'
);

select ok(
  exists (
    select 1 from public.search_published_agronomic_standards('cassava', 'rainforest', 'IITA', 'STD-PROV-TEST', 'weed', null, 10)
     where provenance_verification_status = 'file_hash_verified'
       and original_file_sha256 = repeat('f', 64)
       and storage_object_path = '32200000-0000-4000-8000-000000000201/' || repeat('f', 64) || '.md'
  ),
  'published RAG search preserves file_hash_verified provenance, original_file_sha256, and storage_object_path'
);

-- 10. Non-staff farmer cannot call record_agronomic_document_ingestion_failure.
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
