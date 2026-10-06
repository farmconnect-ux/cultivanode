-- CultivaNode: identity
-- profiles, business accounts (organizations + staff), admin roles, platform roles,
-- role requests with admin approval, identity verifications, audit log.
--
-- Security model
--   * Every table has Row Level Security on.
--   * Supabase grants ALL on new public tables to anon/authenticated by default, so each table
--     first revokes everything and then grants back only what the app needs (column-level where
--     it matters). Anything that changes roles, tiers or approvals goes through SECURITY DEFINER
--     functions that check permissions themselves.

------------------------------------------------------------------------------------------------
-- Tables
------------------------------------------------------------------------------------------------

create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  account_type       public.account_type not null default 'individual',
  full_name          text check (full_name is null or char_length(full_name) between 2 and 120),
  phone              text unique,
  email              text,
  state              text,
  lga                text,
  preferred_language public.app_language not null default 'en',
  -- 0 registered, 1 NIN verified, 2 payout-ready (NIN + BVN), 3 trusted (set by admin)
  verification_tier  smallint not null default 0 check (verification_tier between 0 and 3),
  -- Field agent who registered this person on their behalf (assisted onboarding).
  onboarded_by       uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.profiles is 'One row per signed-up person. Created automatically from auth.users.';

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 160),
  cac_number  text,
  owner_id    uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.organizations is 'Business accounts (company farms, dealers, service companies).';

create table public.org_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  member_role     public.org_member_role not null,
  added_by        uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  primary key (organization_id, profile_id)
);
-- Exactly one owner per business.
create unique index org_members_one_owner on public.org_members (organization_id) where member_role = 'owner';
create index org_members_profile_idx on public.org_members (profile_id);

create table public.admin_roles (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  admin_role  public.admin_role not null,
  granted_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (profile_id, admin_role)
);
comment on table public.admin_roles is 'Staff powers. Granted only by a super_admin or directly in the database.';

create table public.role_requests (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  role           public.app_role not null,
  provider_type  public.provider_type,
  status         public.request_status not null default 'pending',
  -- Supporting details: document storage paths, equipment description, licence number, etc.
  details        jsonb not null default '{}'::jsonb,
  review_note    text,
  reviewed_by    uuid references public.profiles (id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint role_requests_provider_type_matches check (
    (role = 'service_provider') = (provider_type is not null)
  ),
  constraint role_requests_details_is_object check (jsonb_typeof(details) = 'object')
);
-- Only one open request per role (and provider type) per person.
create unique index role_requests_one_pending
  on public.role_requests (profile_id, role, provider_type) nulls not distinct
  where status = 'pending';
create index role_requests_status_idx on public.role_requests (status, created_at);

create table public.user_roles (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  role           public.app_role not null,
  provider_type  public.provider_type,
  request_id     uuid references public.role_requests (id) on delete set null,
  granted_by     uuid references public.profiles (id) on delete set null,
  granted_at     timestamptz not null default now(),
  constraint user_roles_provider_type_matches check (
    (role = 'service_provider') = (provider_type is not null)
  ),
  constraint user_roles_unique unique nulls not distinct (profile_id, role, provider_type)
);
comment on table public.user_roles is 'Roles a person currently holds. Written only by approval functions.';

create table public.verifications (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  kind          public.verification_kind not null,
  status        public.verification_status not null default 'pending',
  provider      text,            -- e.g. 'smile_id', 'dojah', 'prembly'
  reference     text,            -- the provider's job/reference id
  -- Never store full NIN/BVN numbers. Keep only a masked form, e.g. '*******4417'.
  masked_value  text check (masked_value is null or masked_value ~ '^\*+[0-9A-Za-z]{0,4}$'),
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index verifications_profile_idx on public.verifications (profile_id, kind);
comment on table public.verifications is 'Results from the ID provider. Written by server code (service role) only.';

create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

------------------------------------------------------------------------------------------------
-- updated_at triggers
------------------------------------------------------------------------------------------------

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger role_requests_updated_at before update on public.role_requests
  for each row execute function public.set_updated_at();
create trigger verifications_updated_at before update on public.verifications
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------------------------------
-- Helper functions used by policies (SECURITY DEFINER avoids RLS recursion)
------------------------------------------------------------------------------------------------

create or replace function public.is_admin(p_role public.admin_role default null)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_roles a
    where a.profile_id = auth.uid()
      and (p_role is null or a.admin_role = p_role or a.admin_role = 'super_admin')
  );
$$;

create or replace function public.has_role(p_role public.app_role, p_provider_type public.provider_type default null)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.profile_id = auth.uid()
      and r.role = p_role
      and (p_provider_type is null or r.provider_type = p_provider_type)
  );
$$;

create or replace function public.org_role(p_org uuid)
returns public.org_member_role
language sql stable security definer
set search_path = ''
as $$
  select m.member_role from public.org_members m
  where m.organization_id = p_org and m.profile_id = auth.uid();
$$;

create or replace function public.my_verification_tier()
returns smallint
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select p.verification_tier from public.profiles p where p.id = auth.uid()), 0::smallint);
$$;

-- True if the current user is a field agent who onboarded this profile.
create or replace function public.is_my_onboarded_profile(p_profile uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_profile and p.onboarded_by = auth.uid()
  ) and public.has_role('field_agent');
$$;

-- Internal: write an audit entry. Not callable by app users.
create or replace function public.write_audit(p_action text, p_entity text, p_entity_id uuid, p_details jsonb default '{}'::jsonb)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;

------------------------------------------------------------------------------------------------
-- New sign-up -> profile
------------------------------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, phone, email, full_name, account_type, preferred_language)
  values (
    new.id,
    new.phone,
    new.email,
    nullif(trim(v_meta ->> 'full_name'), ''),
    case when v_meta ->> 'account_type' = 'business' then 'business'::public.account_type
         else 'individual'::public.account_type end,
    case when v_meta ->> 'preferred_language' in ('en', 'yo', 'pcm')
         then (v_meta ->> 'preferred_language')::public.app_language
         else 'en'::public.app_language end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------------------------------
-- Business accounts: the creator becomes owner automatically
------------------------------------------------------------------------------------------------

create or replace function public.handle_new_organization()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.org_members (organization_id, profile_id, member_role, added_by)
  values (new.id, new.owner_id, 'owner', new.owner_id);

  update public.profiles set account_type = 'business' where id = new.owner_id;
  return new;
end;
$$;

create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

------------------------------------------------------------------------------------------------
-- Role requests
------------------------------------------------------------------------------------------------

-- Farmer roles unlock farm tools only (no money, no listings), so they are approved instantly.
-- Everything else waits for a verification officer.
create or replace function public.role_is_auto_approved(p_role public.app_role)
returns boolean
language sql immutable
set search_path = ''
as $$
  select p_role in ('crop_farmer', 'animal_farmer');
$$;

create or replace function public.before_role_request_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.user_roles r
    where r.profile_id = new.profile_id
      and r.role = new.role
      and r.provider_type is not distinct from new.provider_type
  ) then
    raise exception 'You already hold this role.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger role_requests_before_insert
  before insert on public.role_requests
  for each row execute function public.before_role_request_insert();

create or replace function public.after_role_request_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'pending' and public.role_is_auto_approved(new.role) then
    insert into public.user_roles (profile_id, role, provider_type, request_id, granted_by)
    values (new.profile_id, new.role, new.provider_type, new.id, null);

    update public.role_requests
       set status = 'approved', reviewed_at = now(), review_note = 'Approved automatically'
     where id = new.id;

    insert into public.audit_log (actor_id, action, entity, entity_id, details)
    values (new.profile_id, 'role_auto_approved', 'role_request', new.id,
            jsonb_build_object('role', new.role));
  end if;
  return new;
end;
$$;

create trigger role_requests_after_insert
  after insert on public.role_requests
  for each row execute function public.after_role_request_insert();

create or replace function public.approve_role_request(p_request_id uuid, p_note text default null)
returns public.role_requests
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req public.role_requests;
begin
  if not public.is_admin('verification_officer') then
    raise exception 'Only a verification officer can approve role requests.' using errcode = '42501';
  end if;

  select * into v_req from public.role_requests where id = p_request_id for update;
  if not found then
    raise exception 'Role request not found.' using errcode = 'P0002';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'This request is already %.', v_req.status using errcode = 'P0001';
  end if;
  if v_req.profile_id = auth.uid() then
    raise exception 'You cannot approve your own request.' using errcode = '42501';
  end if;

  insert into public.user_roles (profile_id, role, provider_type, request_id, granted_by)
  values (v_req.profile_id, v_req.role, v_req.provider_type, v_req.id, auth.uid())
  on conflict on constraint user_roles_unique do nothing;

  update public.role_requests
     set status = 'approved', review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_request_id
  returning * into v_req;

  perform public.write_audit('role_approved', 'role_request', v_req.id,
    jsonb_build_object('role', v_req.role, 'provider_type', v_req.provider_type, 'profile_id', v_req.profile_id));
  return v_req;
end;
$$;

create or replace function public.reject_role_request(p_request_id uuid, p_note text)
returns public.role_requests
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req public.role_requests;
begin
  if not public.is_admin('verification_officer') then
    raise exception 'Only a verification officer can reject role requests.' using errcode = '42501';
  end if;
  if p_note is null or char_length(trim(p_note)) < 5 then
    raise exception 'Give the applicant a reason (at least 5 characters).' using errcode = '22023';
  end if;

  update public.role_requests
     set status = 'rejected', review_note = trim(p_note), reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_request_id and status = 'pending'
  returning * into v_req;
  if not found then
    raise exception 'No pending request with that id.' using errcode = 'P0002';
  end if;

  perform public.write_audit('role_rejected', 'role_request', v_req.id,
    jsonb_build_object('role', v_req.role, 'profile_id', v_req.profile_id, 'note', v_req.review_note));
  return v_req;
end;
$$;

create or replace function public.cancel_role_request(p_request_id uuid)
returns public.role_requests
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req public.role_requests;
begin
  update public.role_requests
     set status = 'cancelled'
   where id = p_request_id and profile_id = auth.uid() and status = 'pending'
  returning * into v_req;
  if not found then
    raise exception 'No pending request of yours with that id.' using errcode = 'P0002';
  end if;
  return v_req;
end;
$$;

------------------------------------------------------------------------------------------------
-- Verification tier: recomputed whenever a verification result changes
------------------------------------------------------------------------------------------------

create or replace function public.refresh_verification_tier()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_nin boolean;
  v_bvn boolean;
  v_tier smallint;
begin
  select bool_or(kind = 'nin' and status = 'verified'),
         bool_or(kind = 'bvn' and status = 'verified')
    into v_nin, v_bvn
    from public.verifications where profile_id = new.profile_id;

  v_tier := case when coalesce(v_nin, false) and coalesce(v_bvn, false) then 2
                 when coalesce(v_nin, false) then 1
                 else 0 end;

  -- Tier 3 (trusted) is granted by staff and is not removed by this trigger.
  update public.profiles
     set verification_tier = case when verification_tier = 3 then 3 else v_tier end
   where id = new.profile_id;
  return new;
end;
$$;

create trigger verifications_refresh_tier
  after insert or update of status on public.verifications
  for each row execute function public.refresh_verification_tier();

------------------------------------------------------------------------------------------------
-- Row Level Security
------------------------------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.organizations  enable row level security;
alter table public.org_members    enable row level security;
alter table public.admin_roles    enable row level security;
alter table public.role_requests  enable row level security;
alter table public.user_roles     enable row level security;
alter table public.verifications  enable row level security;
alter table public.audit_log      enable row level security;

-- profiles
create policy "profiles: read own, onboarded, or as staff" on public.profiles
  for select to authenticated
  using (id = auth.uid() or onboarded_by = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- organizations
create policy "organizations: members and staff read" on public.organizations
  for select to authenticated
  using (public.org_role(id) is not null or public.is_admin());
create policy "organizations: create as owner" on public.organizations
  for insert to authenticated
  with check (owner_id = auth.uid());
create policy "organizations: owner updates" on public.organizations
  for update to authenticated
  using (public.org_role(id) = 'owner') with check (owner_id = auth.uid());

-- org_members
create policy "org_members: members and staff read" on public.org_members
  for select to authenticated
  using (public.org_role(organization_id) is not null or public.is_admin());
create policy "org_members: owner adds staff" on public.org_members
  for insert to authenticated
  with check (public.org_role(organization_id) = 'owner' and member_role <> 'owner');
create policy "org_members: owner changes staff" on public.org_members
  for update to authenticated
  using (public.org_role(organization_id) = 'owner' and member_role <> 'owner')
  with check (member_role <> 'owner');
create policy "org_members: owner removes staff" on public.org_members
  for delete to authenticated
  using (public.org_role(organization_id) = 'owner' and member_role <> 'owner');

-- admin_roles: staff can see who is staff; nobody writes through the API
create policy "admin_roles: staff read" on public.admin_roles
  for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());

-- role_requests
create policy "role_requests: read own or as verification staff" on public.role_requests
  for select to authenticated
  using (profile_id = auth.uid() or public.is_admin('verification_officer'));
create policy "role_requests: create own" on public.role_requests
  for insert to authenticated
  with check (profile_id = auth.uid() and status = 'pending');

-- user_roles
create policy "user_roles: read own or as staff" on public.user_roles
  for select to authenticated
  using (profile_id = auth.uid() or public.is_admin());

-- verifications
create policy "verifications: read own or as verification staff" on public.verifications
  for select to authenticated
  using (profile_id = auth.uid() or public.is_admin('verification_officer'));

-- audit_log
create policy "audit_log: staff read" on public.audit_log
  for select to authenticated
  using (public.is_admin());

------------------------------------------------------------------------------------------------
-- Grants (revoke Supabase's broad defaults, then grant back the minimum)
------------------------------------------------------------------------------------------------

revoke all on public.profiles, public.organizations, public.org_members, public.admin_roles,
              public.role_requests, public.user_roles, public.verifications, public.audit_log
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, email, state, lga, preferred_language) on public.profiles to authenticated;

grant select, insert (name, cac_number, owner_id) on public.organizations to authenticated;
grant update (name, cac_number) on public.organizations to authenticated;

grant select, insert, update (member_role), delete on public.org_members to authenticated;

grant select on public.admin_roles to authenticated;

grant select, insert (role, provider_type, details) on public.role_requests to authenticated;

grant select on public.user_roles to authenticated;
grant select on public.verifications to authenticated;
grant select on public.audit_log to authenticated;

-- Functions: nothing is executable by default; grant what the app calls.
revoke execute on function
  public.is_admin(public.admin_role),
  public.has_role(public.app_role, public.provider_type),
  public.org_role(uuid),
  public.my_verification_tier(),
  public.is_my_onboarded_profile(uuid),
  public.write_audit(text, text, uuid, jsonb),
  public.handle_new_user(),
  public.handle_new_organization(),
  public.before_role_request_insert(),
  public.after_role_request_insert(),
  public.refresh_verification_tier(),
  public.approve_role_request(uuid, text),
  public.reject_role_request(uuid, text),
  public.cancel_role_request(uuid)
  from public, anon;

grant execute on function
  public.is_admin(public.admin_role),
  public.has_role(public.app_role, public.provider_type),
  public.org_role(uuid),
  public.my_verification_tier(),
  public.is_my_onboarded_profile(uuid),
  public.approve_role_request(uuid, text),
  public.reject_role_request(uuid, text),
  public.cancel_role_request(uuid)
  to authenticated;
