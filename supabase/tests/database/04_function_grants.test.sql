-- Function exposure: internal and trigger functions must not be callable through the API.
-- Supabase's default privileges grant EXECUTE to anon/authenticated on every new function,
-- so this test guards against a future migration forgetting to revoke.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

select ok(not has_function_privilege('authenticated', 'public.write_audit(text, text, uuid, jsonb, jsonb, jsonb)', 'execute'),
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
-- Visitors may evaluate it too (20261013020200): policies on public pages call it for anon requests.
select ok(has_function_privilege('authenticated', 'public.has_permission(text)', 'execute')
          and has_function_privilege('anon', 'public.has_permission(text)', 'execute'),
  'has_permission() can be evaluated by policies for signed-in users and visitors');
select ok(not has_function_privilege('authenticated', 'private.record_admin_action(text, text, text, uuid, text)', 'execute'),
  'signed-in users cannot forge admin actions');
select ok(not has_function_privilege('authenticated', 'private.recompute_verification_tier(uuid)', 'execute'),
  'signed-in users cannot recompute verification tiers');
select ok(to_regprocedure('public.is_admin(public.admin_role)') is null,
  'is_admin() has been replaced by permission checks');
select ok(has_function_privilege('authenticated', 'public.nearby_listings(double precision, double precision, numeric, public.listing_kind, public.equipment_type, public.provider_type, integer)', 'execute'),
  'signed-in users can still run the nearby search');

select ok(not has_function_privilege('authenticated', 'private.claim_id(text, text, uuid)', 'execute'),
  'signed-in users cannot claim an ID directly');
select ok(not has_function_privilege('authenticated', 'private.notify(uuid, text, uuid, jsonb, boolean)', 'execute'),
  'signed-in users cannot send notifications or SMS directly');
select ok(not has_function_privilege('authenticated', 'private.expire_bookings()', 'execute'),
  'signed-in users cannot run the booking expiry');
select ok(not has_function_privilege('authenticated', 'public.finish_sms_outbox(uuid, boolean, text, text, text, boolean)', 'execute')
          and has_function_privilege('service_role', 'public.finish_sms_outbox(uuid, boolean, text, text, text, boolean)', 'execute'),
  'only the service role records SMS results');
select ok(has_function_privilege('authenticated', 'public.add_dispute_evidence(uuid, text, timestamptz, double precision, double precision)', 'execute')
          and not has_function_privilege('anon', 'public.add_dispute_evidence(uuid, text, timestamptz, double precision, double precision)', 'execute'),
  'dispute evidence is for signed-in parties only');
select ok(to_regprocedure('public.dispute_booking(uuid, text)') is null
          and not has_function_privilege('anon', 'public.dispute_booking(uuid, text, text)', 'execute'),
  'the old free-text dispute function is gone; the category version is not public');
select ok(not has_function_privilege('authenticated', 'private.end_sessions(uuid)', 'execute'),
  'signed-in users cannot end other people''s sessions');

-- RLS helpers live in the private schema, which the Data API does not expose.
-- The real helper is private; production keeps a thin public wrapper that farm policies call.
select ok(to_regprocedure('private.plot_farm_id(uuid)') is not null
          and pg_get_functiondef('public.plot_farm_id(uuid)'::regprocedure) ilike '%public.plots%',
  'plot_farm_id() lives in the private schema, with a public wrapper for policies');
select ok(to_regprocedure('public.is_farmer_profile(uuid)') is null and to_regprocedure('private.is_farmer_profile(uuid)') is not null,
  'is_farmer_profile() moved out of the API schema');

-- The triggers still work after the revoke: a sign-up still creates a profile.
insert into auth.users (id, phone) values ('99999999-0000-0000-0000-000000000009', '2348000000999');
select ok(exists (select 1 from public.profiles where id = '99999999-0000-0000-0000-000000000009'),
  'the sign-up trigger still creates a profile');

select * from finish();
rollback;
