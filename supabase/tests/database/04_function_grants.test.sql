-- Function exposure: internal and trigger functions must not be callable through the API.
-- Supabase's default privileges grant EXECUTE to anon/authenticated on every new function,
-- so this test guards against a future migration forgetting to revoke.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select ok(not has_function_privilege('authenticated', 'public.write_audit(text, text, uuid, jsonb)', 'execute'),
  'signed-in users cannot write audit entries directly');
select ok(not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
  'handle_new_user() is not exposed');
select ok(not has_function_privilege('authenticated', 'public.handle_new_organization()', 'execute'),
  'handle_new_organization() is not exposed');
select ok(not has_function_privilege('authenticated', 'public.before_role_request_insert()', 'execute'),
  'before_role_request_insert() is not exposed');
select ok(not has_function_privilege('authenticated', 'public.after_role_request_insert()', 'execute'),
  'after_role_request_insert() is not exposed');
select ok(not has_function_privilege('authenticated', 'public.refresh_verification_tier()', 'execute'),
  'refresh_verification_tier() is not exposed');
select ok(not has_function_privilege('authenticated', 'public.compute_area_from_boundary()', 'execute'),
  'compute_area_from_boundary() is not exposed');
select ok(not has_function_privilege('anon', 'public.approve_role_request(uuid, text)', 'execute'),
  'anonymous visitors cannot call approve_role_request()');
select ok(has_function_privilege('authenticated', 'public.nearby_listings(double precision, double precision, numeric, public.listing_kind, text, integer)', 'execute'),
  'signed-in users can still run the nearby search');

-- The triggers still work after the revoke: a sign-up still creates a profile.
insert into auth.users (id, phone) values ('99999999-0000-0000-0000-000000000009', '2348000000999');
select ok(exists (select 1 from public.profiles where id = '99999999-0000-0000-0000-000000000009'),
  'the sign-up trigger still creates a profile');

select * from finish();
rollback;
