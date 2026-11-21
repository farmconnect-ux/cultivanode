-- Batch 03.2 pgTAP tests: Published Agronomic Standards RAG, Ingestion Governance & Audit Whitelist
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- Seed a super_admin staff user and a regular farmer user.
insert into auth.users (id, phone)
values
  ('32100000-0000-4000-8000-000000000001', '2348032100001'),
  ('32100000-0000-4000-8000-000000000002', '2348032100002')
on conflict (id) do nothing;

insert into public.admin_roles (profile_id, admin_role)
values ('32100000-0000-4000-8000-000000000001', 'super_admin')
on conflict do nothing;

insert into public.farms (id, owner_id, name, zone, state, location)
values (
  '32100000-0000-4000-8000-000000000101',
  '32100000-0000-4000-8000-000000000002',
  'Farmer RAG Farm',
  'derived_savanna',
  'Oyo',
  extensions.st_geogfromtext('POINT(3.947 7.3775)')
)
on conflict (id) do nothing;

-- 1. Documents and chunks tables have RLS enabled and forced.
select ok(
  exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'agronomic_standard_documents'
      and c.relrowsecurity = true and c.relforcerowsecurity = true
  )
  and exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'agronomic_standard_chunks'
      and c.relrowsecurity = true and c.relforcerowsecurity = true
  ),
  'agronomic_standard_documents and agronomic_standard_chunks have RLS enabled and forced'
);

-- 2. Anon has zero table/RPC privileges.
select ok(
  not has_table_privilege('anon', 'public.agronomic_standard_chunks', 'select')
  and not has_function_privilege('anon', 'public.search_published_agronomic_standards(text,text,text,text,text,extensions.vector,integer)', 'execute')
  and not has_function_privilege('anon', 'public.ingest_agronomic_standard_document(uuid,text,text,text,integer,text,jsonb,text,text,text,text,text,text,text)', 'execute'),
  'anon has zero access to agronomic RAG tables and RPCs'
);

-- Create two draft standards as super_admin: one will remain DRAFT, one will be PUBLISHED.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32100000-0000-4000-8000-000000000001', true);

insert into public.farm_agronomic_standards (
  id, standard_code, crop_or_livestock_id, agro_zone, version, title, source_authority, status, is_active
) values
  ('32100000-0000-4000-8000-000000000201', 'STD-MAIZE-DRAFT', 'maize', 'derived_savanna', '1.0', 'Draft Maize Guide', 'IITA', 'draft', false),
  ('32100000-0000-4000-8000-000000000202', 'STD-MAIZE-PUB', 'maize', 'derived_savanna', '1.0', 'Published Maize Guide', 'IITA', 'draft', false),
  ('32100000-0000-4000-8000-000000000203', 'STD-MAIZE-RET', 'maize', 'derived_savanna', '0.9', 'Retired Maize Guide', 'IITA', 'draft', false)
on conflict (id) do nothing;

-- 3. Staff can ingest chunks into a DRAFT standard; standard stays DRAFT (never auto-published).
select is(
  (public.ingest_agronomic_standard_document(
    '32100000-0000-4000-8000-000000000201',
    'Draft Maize Source Doc',
    'IITA',
    'text/plain',
    512,
    repeat('a', 64),
    jsonb_build_array(
      jsonb_build_object(
        'chunk_index', 0,
        'section_ref', 'Section 1',
        'page_number', 1,
        'paragraph_index', 0,
        'content', 'Draft-only maize planting depth recommendation.',
        'content_sha256', repeat('b', 64)
      )
    )
  ) ->> 'standard_status'),
  'draft',
  'ingesting document into draft standard keeps status as draft (never auto-published)'
);

-- 4. Ingest into the second standard (to be published) and third (to be retired).
select is(
  (public.ingest_agronomic_standard_document(
    '32100000-0000-4000-8000-000000000202',
    'Published Maize Source Doc',
    'IITA',
    'text/markdown',
    1024,
    repeat('c', 64),
    jsonb_build_array(
      jsonb_build_object(
        'chunk_index', 0,
        'section_ref', '2.1 Planting',
        'page_number', 4,
        'paragraph_index', 1,
        'content', 'Apply basal NPK 15-15-15 at planting for derived savanna maize.',
        'content_sha256', repeat('d', 64)
      )
    )
  ) ->> 'chunk_count')::int,
  1,
  'ingested 1 chunk into second draft standard'
);

select is(
  (public.ingest_agronomic_standard_document(
    '32100000-0000-4000-8000-000000000203',
    'Retired Maize Source Doc',
    'IITA',
    'text/plain',
    512,
    repeat('e', 64),
    jsonb_build_array(
      jsonb_build_object(
        'chunk_index', 0,
        'section_ref', 'Legacy',
        'content', 'Retired legacy maize recommendation.',
        'content_sha256', repeat('f', 64)
      )
    )
  ) ->> 'chunk_count')::int,
  1,
  'ingested 1 chunk into third draft standard'
);

-- Publish standard 202 and retire standard 203.
reset role;
update public.farm_agronomic_standards
   set status = 'published', is_active = true, published_at = now(), effective_from = current_date
 where id = '32100000-0000-4000-8000-000000000202';

update public.farm_agronomic_standards
   set status = 'retired', is_active = false
 where id = '32100000-0000-4000-8000-000000000203';

-- 5. Immutability: ingesting into an already published standard is rejected.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32100000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$
    select public.ingest_agronomic_standard_document(
      '32100000-0000-4000-8000-000000000202',
      'Mutated Doc', 'IITA', 'text/plain', 100, repeat('9', 64),
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'bad', 'content_sha256', repeat('8', 64)))
    )
  $$,
  '42501',
  null,
  'cannot ingest documents into an already published standard'
);

-- 5b. Batch 03.2H: authenticated callers cannot directly assign file_hash_verified.
select throws_ok(
  $$
    select public.ingest_agronomic_standard_document(
      '32100000-0000-4000-8000-000000000201',
      'Fake Verified Doc', 'IITA', 'text/plain', 100, repeat('5', 64),
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'x', 'content_sha256', repeat('6', 64))),
      null, null, null, 'plain_text_file', 'file_hash_verified'
    )
  $$,
  '42501',
  null,
  'authenticated caller cannot directly assign file_hash_verified provenance'
);

-- 6. Chunk-to-document standard_id mismatch rejected by trigger.
reset role;
select throws_ok(
  $$
    insert into public.agronomic_standard_chunks (
      standard_id, document_id, chunk_index, content, content_sha256
    ) values (
      '32100000-0000-4000-8000-000000000201',
      (select id from public.agronomic_standard_documents where standard_id = '32100000-0000-4000-8000-000000000202' limit 1),
      99, 'mismatched', repeat('7', 64)
    )
  $$,
  '23514',
  null,
  'chunk standard_id mismatch against document standard_id is rejected'
);

-- 7. Switch to ordinary farmer (User 2): cannot ingest documents.
set local role authenticated;
select set_config('request.jwt.claim.sub', '32100000-0000-4000-8000-000000000002', true);

select throws_ok(
  $$
    select public.ingest_agronomic_standard_document(
      '32100000-0000-4000-8000-000000000201',
      'Farmer Upload', 'Farmer', 'text/plain', 100, repeat('1', 64),
      jsonb_build_array(jsonb_build_object('chunk_index', 0, 'content', 'nope', 'content_sha256', repeat('2', 64)))
    )
  $$,
  '42501',
  null,
  'non-staff farmer cannot ingest agronomic standard documents'
);

-- 8. Farmer RLS SELECT sees ONLY published standard chunks (excludes draft and retired).
select is(
  (select count(*)::int from public.agronomic_standard_chunks
    where standard_id in (
      '32100000-0000-4000-8000-000000000201',
      '32100000-0000-4000-8000-000000000202',
      '32100000-0000-4000-8000-000000000203'
    )),
  1,
  'farmer RLS SELECT returns only published standard chunks'
);

-- 9. search_published_agronomic_standards returns ONLY published standard and preserves section/page provenance.
select is(
  (select count(*)::int from public.search_published_agronomic_standards(
    'maize', 'derived_savanna', 'IITA', null, 'maize', null, 10
  )),
  1,
  'search_published_agronomic_standards returns only published standard (excludes draft & retired)'
);

select is(
  (select standard_code || '|' || version || '|' || section_ref || '|' || page_number::text
     from public.search_published_agronomic_standards('maize', 'derived_savanna', 'IITA', null, 'NPK', null, 10)
    limit 1),
  'STD-MAIZE-PUB|1.0|2.1 Planting|4',
  'search_published_agronomic_standards preserves standard_code, version, section_ref, and page_number'
);

-- 10. Draft standard code explicitly returns 0 rows even when queried directly by standard_code.
select is(
  (select count(*)::int from public.search_published_agronomic_standards(
    null, null, null, 'STD-MAIZE-DRAFT', null, null, 10
  )),
  0,
  'draft standard cannot be retrieved via search_published_agronomic_standards even by exact code'
);

-- 11. Retired standard explicitly returns 0 rows.
select is(
  (select count(*)::int from public.search_published_agronomic_standards(
    null, null, null, 'STD-MAIZE-RET', null, null, 10
  )),
  0,
  'retired standard cannot be retrieved via search_published_agronomic_standards'
);

-- 12. Audit writer accepts Batch 03.2 sources (`farm_memory_items`, `agronomic_standard_chunks`).
reset role;
set local role service_role;
select ok(
  public.write_ai_audit_event(
    '32100000-0000-4000-8000-000000000002',
    '32100000-0000-4000-8000-000000000101',
    '32100000-0000-4000-8000-000000000999',
    'rule-engine',
    'grounding-deterministic',
    'grounding-v2',
    'completed',
    '{"status":"passed","blocked":false}'::jsonb,
    '[{"source":"farm_memory_items","record_id":"mem-1"},{"source":"agronomic_standard_chunks","record_id":"chunk-1"}]'::jsonb,
    array['32100000-0000-4000-8000-000000000888'::uuid],
    null
  ) is not null,
  'write_ai_audit_event accepts farm_memory_items and agronomic_standard_chunks context references'
);

select * from finish();
rollback;
