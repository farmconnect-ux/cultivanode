-- Test suite 17: Agronomic Content Governance & Standards Versioning
begin;
select plan(14);

-- Fixtures: Create user profiles and roles
-- 1. Dr. Bello (agronomy_editor with standards.publish)
-- 2. Dr. Adebayo (agronomy_editor with standards.publish)
-- 3. Super Admin
-- 4. Regular Farmer (crop_farmer)

insert into auth.users (id, phone) values
  ('a1000000-0000-0000-0000-000000000001', '2348000001001'),
  ('a1000000-0000-0000-0000-000000000002', '2348000001002'),
  ('a1000000-0000-0000-0000-000000000003', '2348000001003'),
  ('a1000000-0000-0000-0000-000000000004', '2348000001004')
on conflict (id) do nothing;

update public.profiles set onboarded_at = now(), full_name = v.n, phone = v.ph
  from (values
    ('a1000000-0000-0000-0000-000000000001'::uuid, 'Dr. Bello Author', '2348000001001'),
    ('a1000000-0000-0000-0000-000000000002'::uuid, 'Dr. Adebayo Reviewer', '2348000001002'),
    ('a1000000-0000-0000-0000-000000000003'::uuid, 'Super Admin', '2348000001003'),
    ('a1000000-0000-0000-0000-000000000004'::uuid, 'Kemi Farmer', '2348000001004')
  ) v(i, n, ph)
 where id = v.i;

insert into public.admin_roles (profile_id, admin_role) values
  ('a1000000-0000-0000-0000-000000000001', 'agronomy_editor'),
  ('a1000000-0000-0000-0000-000000000002', 'agronomy_editor'),
  ('a1000000-0000-0000-0000-000000000003', 'super_admin')
on conflict do nothing;

insert into public.user_roles (profile_id, role) values
  ('a1000000-0000-0000-0000-000000000004', 'crop_farmer')
on conflict do nothing;

create table pg_temp.agri_test (k text primary key, id uuid);

-- Helper functions for JWT switching
create or replace function pg_temp.as_author() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001"}', true);
$$;
create or replace function pg_temp.as_reviewer() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000002"}', true);
$$;
create or replace function pg_temp.as_super_admin() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000003"}', true);
$$;
create or replace function pg_temp.as_farmer() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000004"}', true);
$$;

set local role authenticated;

-- Test 1: Farmer cannot create standard draft (42501)
select pg_temp.as_farmer();
select throws_ok(
  $$ select public.agronomy_create_standard_draft('TEST_MAIZE_V1', 'maize', 'rainforest', '1.0', 'Test Maize Standard') $$,
  '42501',
  'Permission denied: crops.manage or standards.publish required.',
  'Farmer cannot create standard draft'
);

-- Test 2: Author creates standard draft
select pg_temp.as_author();
do $$
declare
  v_rec public.farm_agronomic_standards;
begin
  select * into v_rec from public.agronomy_create_standard_draft(
    'TEST_MAIZE_V1', 'maize', 'rainforest', '1.0',
    'GAP Maize Standard V1', 'Trial guidelines for testing',
    '{"basal_npk":200}'::jsonb,
    array['Ploughing', 'Planting'],
    array['paraquat'],
    120.0
  );
  insert into pg_temp.agri_test values ('std_1', v_rec.id);
end $$;

select is(
  (select status::text from public.farm_agronomic_standards where id = (select id from pg_temp.agri_test where k = 'std_1')),
  'draft',
  'Newly created standard is in draft status'
);

-- Test 3: Farmer cannot see draft standard due to RLS
select pg_temp.as_farmer();
select is(
  (select count(*)::int from public.farm_agronomic_standards where id = (select id from pg_temp.agri_test where k = 'std_1')),
  0,
  'Farmer cannot see unapproved draft standard'
);

-- Test 4: Submit draft for review
select pg_temp.as_author();
select lives_ok(
  $$ select public.agronomy_submit_standard_for_review((select id from pg_temp.agri_test where k = 'std_1'), 'Ready for review') $$,
  'Author submits standard draft for review'
);
select is(
  (select status::text from public.farm_agronomic_standards where id = (select id from pg_temp.agri_test where k = 'std_1')),
  'in_review',
  'Standard is now in_review status'
);

-- Test 5: Option A Four-Eyes rule: Author cannot self-approve/publish standard
select throws_ok(
  $$ select public.agronomy_publish_standard((select id from pg_temp.agri_test where k = 'std_1'), 'Chief Agronomist') $$,
  '42501',
  'Four-eyes approval required: author cannot approve their own standard without Super Admin override.',
  'Author cannot self-publish standard under Option A'
);

-- Test 6: Option A: Independent reviewer successfully approves & publishes
select pg_temp.as_reviewer();
select lives_ok(
  $$ select public.agronomy_publish_standard((select id from pg_temp.agri_test where k = 'std_1'), 'Dr. Adebayo Lead Reviewer', 'NIHORT/2026/01') $$,
  'Reviewer publishes standard'
);

select is(
  (select status::text || '/' || is_active::text from public.farm_agronomic_standards where id = (select id from pg_temp.agri_test where k = 'std_1')),
  'published/true',
  'Standard is active and published'
);

-- Test 7: Farmer can now see published standard
select pg_temp.as_farmer();
select is(
  (select count(*)::int from public.farm_agronomic_standards where id = (select id from pg_temp.agri_test where k = 'std_1')),
  1,
  'Farmer can view published standard'
);

-- Test 8: Immutability guard - Published standard cannot have parameters or title altered in-place
select throws_ok(
  $$ update public.farm_agronomic_standards set title = 'Sneaky edit' where id = (select id from pg_temp.agri_test where k = 'std_1') $$,
  '42501',
  'Published agronomic standards are immutable. Create a new version draft instead.',
  'Direct in-place update of published standard is forbidden'
);

-- Test 9: Create version 2 draft
select pg_temp.as_author();
do $$
declare
  v_rec public.farm_agronomic_standards;
begin
  select * into v_rec from public.agronomy_create_standard_draft(
    'TEST_MAIZE_V1', 'maize', 'rainforest', '2.0',
    'GAP Maize Standard V2', 'Updated fertilizer rate',
    '{"basal_npk":250}'::jsonb,
    array['Ploughing', 'Planting', 'Topdressing'],
    array['paraquat', 'carbofuran'],
    140.0,
    'IITA_NIHORT_GAP',
    (select id from pg_temp.agri_test where k = 'std_1')
  );
  insert into pg_temp.agri_test values ('std_2', v_rec.id);
end $$;

-- Test 10: Option B Super Admin override: Super Admin can act as Author AND Publisher in one go
select pg_temp.as_super_admin();
select lives_ok(
  $$ select public.agronomy_publish_standard((select id from pg_temp.agri_test where k = 'std_2'), 'Super Admin Override', 'OYSADEP-COUNCIL') $$,
  'Super Admin publishes version 2 directly via override'
);

-- Test 11: V1 is automatically superseded when V2 is published
select is(
  (select status::text || '/' || is_active::text from public.farm_agronomic_standards where id = (select id from pg_temp.agri_test where k = 'std_1')),
  'superseded/false',
  'Older version V1 is superseded and deactivated'
);

-- Test 12: V2 is published and active
select is(
  (select status::text || '/' || is_active::text from public.farm_agronomic_standards where id = (select id from pg_temp.agri_test where k = 'std_2')),
  'published/true',
  'Version 2 is published and active'
);

-- Test 13: Audit log verification
reset role;
select is(
  (select count(*)::int from public.admin_actions where entity = 'farm_agronomic_standards' and action = 'standard_published'),
  2,
  'Admin actions table tracked both standard publications'
);

select * from finish();
rollback;
