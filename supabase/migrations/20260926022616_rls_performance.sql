-- CultivaNode: Row Level Security performance fixes flagged by the Supabase advisor.
--
-- 1. Wrap auth.uid() (and row-independent helper calls) in a sub-select so Postgres evaluates
--    them once per query instead of once per row (lint 0003_auth_rls_initplan).
--    Behaviour is unchanged; pgTAP tests 01-03 cover every policy touched here.
-- 2. Index foreign keys that had no covering index (lint 0001_unindexed_foreign_keys).

-- profiles
alter policy "profiles: read own, onboarded, or as staff" on public.profiles
  using (id = (select auth.uid()) or onboarded_by = (select auth.uid()) or (select public.is_admin()));
alter policy "profiles: update own" on public.profiles
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- organizations
alter policy "organizations: create as owner" on public.organizations
  with check (owner_id = (select auth.uid()));
alter policy "organizations: owner updates" on public.organizations
  using (public.org_role(id) = 'owner') with check (owner_id = (select auth.uid()));

-- admin_roles
alter policy "admin_roles: staff read" on public.admin_roles
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- role_requests
alter policy "role_requests: read own or as verification staff" on public.role_requests
  using (profile_id = (select auth.uid()) or (select public.is_admin('verification_officer')));
alter policy "role_requests: create own" on public.role_requests
  with check (profile_id = (select auth.uid()) and status = 'pending');

-- user_roles
alter policy "user_roles: read own or as staff" on public.user_roles
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- verifications
alter policy "verifications: read own or as verification staff" on public.verifications
  using (profile_id = (select auth.uid()) or (select public.is_admin('verification_officer')));

-- farms
alter policy "farms: farmers or their field agents create" on public.farms
  with check (
    (
      owner_id = (select auth.uid())
      and onboarded_by is null
      and public.is_farmer_profile((select auth.uid()))
      and (organization_id is null or public.org_role(organization_id) in ('owner', 'farm_manager'))
    )
    or (
      onboarded_by = (select auth.uid())
      and public.is_my_onboarded_profile(owner_id)
      and public.is_farmer_profile(owner_id)
      and organization_id is null
    )
  );
alter policy "farms: owner deletes" on public.farms
  using (owner_id = (select auth.uid()));

-- listings
alter policy "listings: active for all, rest for owner and staff" on public.listings
  using (status = 'active' or owner_id = (select auth.uid()) or (select public.is_admin()));
alter policy "listings: approved providers create their own" on public.listings
  with check (
    owner_id = (select auth.uid())
    and status in ('draft', 'active')
    and public.can_create_listing(kind, provider_type)
  );
alter policy "listings: owners update" on public.listings
  using (owner_id = (select auth.uid()) and status <> 'suspended')
  with check (owner_id = (select auth.uid()) and status <> 'suspended');
alter policy "listings: owners delete" on public.listings
  using (owner_id = (select auth.uid()));

-- Foreign-key indexes
create index if not exists admin_roles_granted_by_idx    on public.admin_roles (granted_by);
create index if not exists audit_log_actor_idx           on public.audit_log (actor_id);
create index if not exists farms_onboarded_by_idx        on public.farms (onboarded_by);
create index if not exists org_members_added_by_idx      on public.org_members (added_by);
create index if not exists organizations_owner_idx       on public.organizations (owner_id);
create index if not exists profiles_onboarded_by_idx     on public.profiles (onboarded_by);
create index if not exists role_requests_reviewed_by_idx on public.role_requests (reviewed_by);
create index if not exists soil_records_created_by_idx   on public.soil_records (created_by);
create index if not exists user_roles_granted_by_idx     on public.user_roles (granted_by);
create index if not exists user_roles_request_idx        on public.user_roles (request_id);
