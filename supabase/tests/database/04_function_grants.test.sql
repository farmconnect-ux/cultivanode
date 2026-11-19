-- Function exposure: internal and trigger functions must not be callable through the API.
-- Supabase's default privileges grant EXECUTE to anon/authenticated on every new function,
-- so this test guards against a future migration forgetting to revoke.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(30);

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

-- Farm RLS helper wrappers must not be callable by PUBLIC or anon, while authenticated retains EXECUTE.
select ok(
  not has_function_privilege('anon', 'public.can_edit_farm(uuid)', 'execute')
  and not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where n.nspname = 'public'
      and p.proname = 'can_edit_farm'
      and pg_get_function_identity_arguments(p.oid) = 'p_farm uuid'
      and a.grantee = 0
      and a.privilege_type = 'EXECUTE'
  )
  and has_function_privilege('authenticated', 'public.can_edit_farm(uuid)', 'execute'),
  'can_edit_farm() is restricted to authenticated callers');

select ok(
  not has_function_privilege('anon', 'public.can_view_farm(uuid)', 'execute')
  and not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where n.nspname = 'public'
      and p.proname = 'can_view_farm'
      and pg_get_function_identity_arguments(p.oid) = 'p_farm uuid'
      and a.grantee = 0
      and a.privilege_type = 'EXECUTE'
  )
  and has_function_privilege('authenticated', 'public.can_view_farm(uuid)', 'execute'),
  'can_view_farm() is restricted to authenticated callers');

select ok(
  not has_function_privilege('anon', 'public.plot_farm_id(uuid)', 'execute')
  and not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where n.nspname = 'public'
      and p.proname = 'plot_farm_id'
      and pg_get_function_identity_arguments(p.oid) = 'p_plot uuid'
      and a.grantee = 0
      and a.privilege_type = 'EXECUTE'
  )
  and has_function_privilege('authenticated', 'public.plot_farm_id(uuid)', 'execute'),
  'plot_farm_id() is restricted to authenticated callers');

-- feature_on() is intentionally exposed to anon/authenticated, with PUBLIC revoked.
select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where n.nspname = 'public'
      and p.proname = 'feature_on'
      and pg_get_function_identity_arguments(p.oid) = 'p_key text'
      and a.grantee = 0
      and a.privilege_type = 'EXECUTE'
  )
  and has_function_privilege('anon', 'public.feature_on(text)', 'execute')
  and has_function_privilege('authenticated', 'public.feature_on(text)', 'execute'),
  'feature_on() revokes PUBLIC while allowing anon and authenticated');

-- Cross-tenant isolation: an unrelated authenticated user cannot resolve another farm''s ID via plot_farm_id(),
-- while the farm owner and an authorised organisation member can.
insert into auth.users (id, phone) values
  ('99999999-0000-0000-0000-000000000010', '2348000000998'),
  ('99999999-0000-0000-0000-000000000011', '2348000000997');
insert into public.organizations (id, owner_id, name)
  values ('99999999-0000-0000-0000-000000000301', '99999999-0000-0000-0000-000000000009', 'Grant Isolation Coop');
insert into public.org_members (organization_id, profile_id, member_role)
  values ('99999999-0000-0000-0000-000000000301', '99999999-0000-0000-0000-000000000011', 'worker');
insert into public.farms (id, owner_id, organization_id, name, location)
  values ('99999999-0000-0000-0000-000000000101', '99999999-0000-0000-0000-000000000009', '99999999-0000-0000-0000-000000000301', 'Grant Isolation Farm', 'SRID=4326;POINT(3.90 7.40)');
insert into public.plots (id, farm_id, name)
  values ('99999999-0000-0000-0000-000000000201', '99999999-0000-0000-0000-000000000101', 'Grant Isolation Plot');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000010","role":"authenticated"}', true);
select is(public.plot_farm_id('99999999-0000-0000-0000-000000000201'::uuid), null::uuid,
  'unrelated authenticated users cannot resolve farm_id via plot_farm_id()');

select set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000009","role":"authenticated"}', true);
select is(public.plot_farm_id('99999999-0000-0000-0000-000000000201'::uuid), '99999999-0000-0000-0000-000000000101'::uuid,
  'farm owners can still resolve farm_id via plot_farm_id()');

select set_config('request.jwt.claims', '{"sub":"99999999-0000-0000-0000-000000000011","role":"authenticated"}', true);
select is(public.plot_farm_id('99999999-0000-0000-0000-000000000201'::uuid), '99999999-0000-0000-0000-000000000101'::uuid,
  'authorised organisation members can still resolve farm_id via plot_farm_id()');
reset role;

select * from finish();
rollback;
