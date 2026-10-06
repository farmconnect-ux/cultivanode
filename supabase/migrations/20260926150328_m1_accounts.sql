-- CultivaNode: M1 accounts - onboarding, business staff, privacy requests, staff tools, assisted onboarding.
--
--   1. Onboarding: profiles.onboarded_at and complete_onboarding(), which records the person's details,
--      business account, consents and role requests in one transaction.
--   2. Role requests: only roles that are open can be requested; approval checks the role's minimum
--      verification tier and, where documents are required, at least one accepted document.
--   3. Business staff: owners add staff by phone number (the person signs up first) and list them.
--   4. Privacy (NDPA 2023): self-service data export and deletion requests handled by staff.
--   5. Staff tools: dashboard counts, admin sub-role grants, contact inbox handling.
--   6. Field-agent assisted onboarding: one-time codes texted to the farmer; the farmer reading the code
--      back to the agent is their agreement. Only the agent-onboard Edge Function (service role) calls these.

------------------------------------------------------------------------------------------------
-- 1. Onboarding
------------------------------------------------------------------------------------------------

alter table public.profiles add column onboarded_at timestamptz;
comment on column public.profiles.onboarded_at is 'Set by complete_onboarding() once details, consents and roles are recorded.';

-- Validates a roles array: [{"role": "...", "provider_type": "..."}]. Returns the distinct (role, type) pairs.
create or replace function private.parse_role_choices(p_roles jsonb, p_allowed public.app_role[] default null)
returns table (role public.app_role, provider_type public.provider_type)
language plpgsql stable
set search_path = ''
as $$
declare
  v_item jsonb;
  v_role public.app_role;
  v_type public.provider_type;
  v_seen text[] := '{}';
begin
  if p_roles is null or jsonb_typeof(p_roles) <> 'array' or jsonb_array_length(p_roles) = 0 then
    raise exception 'Choose at least one role.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_roles) > 10 then
    raise exception 'Too many roles.' using errcode = '22023';
  end if;
  for v_item in select * from jsonb_array_elements(p_roles) loop
    begin
      v_role := (v_item ->> 'role')::public.app_role;
      v_type := nullif(v_item ->> 'provider_type', '')::public.provider_type;
    exception when invalid_text_representation then
      raise exception 'Unknown role.' using errcode = '22023';
    end;
    if v_role is null then
      raise exception 'Unknown role.' using errcode = '22023';
    end if;
    if (v_role = 'service_provider') <> (v_type is not null) then
      raise exception 'Choose the kind of service you offer.' using errcode = '22023';
    end if;
    if p_allowed is not null and not (v_role = any (p_allowed)) then
      raise exception 'That role cannot be chosen here.' using errcode = '22023';
    end if;
    if not exists (select 1 from public.roles r where r.role = v_role and r.available) then
      raise exception 'That role is not open yet.' using errcode = '22023';
    end if;
    if not (v_role::text || ':' || coalesce(v_type::text, '') = any (v_seen)) then
      v_seen := v_seen || (v_role::text || ':' || coalesce(v_type::text, ''));
      role := v_role;
      provider_type := v_type;
      return next;
    end if;
  end loop;
end;
$$;

-- Validates a consents object {"terms_of_use": true, ...}; terms and privacy must be accepted.
create or replace function private.check_consents(p_consents jsonb)
returns void
language plpgsql stable
set search_path = ''
as $$
declare
  v_key text;
  v_value jsonb;
begin
  if p_consents is null or jsonb_typeof(p_consents) <> 'object' then
    raise exception 'Consents are missing.' using errcode = '22023';
  end if;
  for v_key, v_value in select * from jsonb_each(p_consents) loop
    if not (v_key = any (enum_range(null::public.consent_type)::text[])) or jsonb_typeof(v_value) <> 'boolean' then
      raise exception 'Unknown consent choice.' using errcode = '22023';
    end if;
  end loop;
  if coalesce((p_consents ->> 'terms_of_use')::boolean, false) is false
     or coalesce((p_consents ->> 'privacy_policy')::boolean, false) is false then
    raise exception 'Accept the terms of use and the privacy policy to continue.' using errcode = '22023';
  end if;
end;
$$;

create or replace function private.clean_place(p_value text)
returns text
language plpgsql immutable
set search_path = ''
as $$
begin
  if p_value is not null and char_length(trim(p_value)) > 60 then
    raise exception 'State and LGA names must be 60 characters or fewer.' using errcode = '22023';
  end if;
  return nullif(trim(p_value), '');
end;
$$;

create or replace function public.complete_onboarding(
  p_full_name         text,
  p_account_type      public.account_type,
  p_business_name     text,
  p_cac_number        text,
  p_state             text,
  p_lga               text,
  p_language          public.app_language,
  p_roles             jsonb,
  p_consents          jsonb,
  p_document_version  text,
  p_channel           text default 'web'
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_name  text := trim(coalesce(p_full_name, ''));
  v_org   uuid;
  v_key   text;
  v_value jsonb;
  v_pick  record;
  v_out   jsonb := '[]'::jsonb;
  v_req   public.role_requests;
begin
  if v_uid is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = v_uid and onboarded_at is not null) then
    raise exception 'Your account is already set up.' using errcode = 'P0001';
  end if;
  if char_length(v_name) not between 2 and 120 then
    raise exception 'Enter your full name (2 to 120 characters).' using errcode = '22023';
  end if;
  if p_channel not in ('web', 'mobile') then
    raise exception 'Unknown channel.' using errcode = '22023';
  end if;
  if p_document_version is null or char_length(trim(p_document_version)) not between 1 and 40 then
    raise exception 'Missing document version.' using errcode = '22023';
  end if;
  if p_account_type = 'business'
     and char_length(trim(coalesce(p_business_name, ''))) not between 2 and 160 then
    raise exception 'Enter the business name (2 to 160 characters).' using errcode = '22023';
  end if;
  if p_cac_number is not null and char_length(trim(p_cac_number)) > 40 then
    raise exception 'The CAC number is too long.' using errcode = '22023';
  end if;
  perform private.check_consents(p_consents);

  update public.profiles
     set full_name = v_name,
         state = private.clean_place(p_state),
         lga = private.clean_place(p_lga),
         preferred_language = coalesce(p_language, 'en'),
         onboarded_at = now()
   where id = v_uid;

  if p_account_type = 'business' then
    insert into public.organizations (name, cac_number, owner_id)
    values (trim(p_business_name), nullif(trim(p_cac_number), ''), v_uid)
    returning id into v_org;
  end if;

  for v_key, v_value in select * from jsonb_each(p_consents) loop
    insert into public.consents (profile_id, consent_type, granted, document_version, channel)
    values (v_uid, v_key::public.consent_type, (v_value)::text::boolean, trim(p_document_version), p_channel);
  end loop;

  for v_pick in select * from private.parse_role_choices(p_roles) loop
    if not exists (select 1 from public.user_roles r
                    where r.profile_id = v_uid and r.role = v_pick.role
                      and r.provider_type is not distinct from v_pick.provider_type)
       and not exists (select 1 from public.role_requests r
                        where r.profile_id = v_uid and r.role = v_pick.role and r.status = 'pending'
                          and r.provider_type is not distinct from v_pick.provider_type) then
      insert into public.role_requests (profile_id, role, provider_type)
      values (v_uid, v_pick.role, v_pick.provider_type)
      returning * into v_req;
      select * into v_req from public.role_requests where id = v_req.id;  -- status after auto-approval
      v_out := v_out || jsonb_build_object('id', v_req.id, 'role', v_req.role,
                                           'provider_type', v_req.provider_type, 'status', v_req.status);
    end if;
  end loop;

  perform public.write_audit('onboarding_completed', 'profile', v_uid,
    jsonb_build_object('account_type', p_account_type, 'channel', p_channel, 'organization_id', v_org));
  return jsonb_build_object('organization_id', v_org, 'requests', v_out);
end;
$$;

------------------------------------------------------------------------------------------------
-- 2. Role requests: open roles only; approval needs the minimum tier and accepted documents
------------------------------------------------------------------------------------------------

create or replace function public.before_role_request_insert()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.roles r where r.role = new.role and r.available) then
    raise exception 'This role is not open yet.' using errcode = '22023';
  end if;
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

create or replace function public.approve_role_request(p_request_id uuid, p_note text default null)
returns public.role_requests
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req  public.role_requests;
  v_role public.roles;
  v_tier smallint;
begin
  if not public.has_permission('roles.review') then
    raise exception 'You do not have permission to approve role requests.' using errcode = '42501';
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

  select * into v_role from public.roles where role = v_req.role;
  select verification_tier into v_tier from public.profiles where id = v_req.profile_id;
  if coalesce(v_tier, 0) < v_role.min_verification_tier then
    raise exception 'The applicant must reach verification tier % first.', v_role.min_verification_tier
      using errcode = '22023';
  end if;
  if v_role.requires_documents and not exists (
       select 1 from public.verification_documents d
        where d.role_request_id = v_req.id and d.status = 'accepted') then
    raise exception 'Accept at least one supporting document before approving.' using errcode = '22023';
  end if;

  insert into public.user_roles (profile_id, role, provider_type, request_id, granted_by)
  values (v_req.profile_id, v_req.role, v_req.provider_type, v_req.id, auth.uid())
  on conflict on constraint user_roles_unique do nothing;

  update public.role_requests
     set status = 'approved', review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_request_id
  returning * into v_req;

  perform public.write_audit('role_approved', 'role_request', v_req.id,
    jsonb_build_object('role', v_req.role, 'provider_type', v_req.provider_type, 'profile_id', v_req.profile_id),
    jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'approved'));
  perform private.record_admin_action('roles.review', 'role_approved', 'role_request', v_req.id, v_req.review_note);
  return v_req;
end;
$$;

------------------------------------------------------------------------------------------------
-- 3. Business staff
------------------------------------------------------------------------------------------------

create or replace function public.add_org_member(p_org uuid, p_phone text, p_role public.org_member_role)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_phone   text := private.normalize_ng_phone(p_phone);
  v_profile public.profiles;
begin
  if public.org_role(p_org) is distinct from 'owner' then
    raise exception 'Only the business owner can add staff.' using errcode = '42501';
  end if;
  if p_role = 'owner' then
    raise exception 'A business has one owner.' using errcode = '22023';
  end if;
  if v_phone is null or v_phone = 'invalid' then
    raise exception 'Enter a Nigerian mobile number.' using errcode = '22023';
  end if;
  select * into v_profile from public.profiles where phone = v_phone;
  if not found then
    raise exception 'No account uses that number. Ask them to sign up first.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.org_members where organization_id = p_org and profile_id = v_profile.id) then
    raise exception 'That person is already on your staff list.' using errcode = 'P0001';
  end if;

  insert into public.org_members (organization_id, profile_id, member_role, added_by)
  values (p_org, v_profile.id, p_role, auth.uid());
  perform public.write_audit('org_member_added', 'organization', p_org,
    jsonb_build_object('profile_id', v_profile.id, 'member_role', p_role));
  return jsonb_build_object('profile_id', v_profile.id, 'full_name', v_profile.full_name, 'member_role', p_role);
end;
$$;

-- Staff list for members of the business (profiles of other people are otherwise private).
create or replace function public.org_member_list(p_org uuid)
returns table (profile_id uuid, full_name text, phone_hint text, member_role public.org_member_role, added_at timestamptz)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if public.org_role(p_org) is null and not public.has_permission('users.read') then
    raise exception 'You are not part of this business.' using errcode = '42501';
  end if;
  return query
    select m.profile_id, p.full_name,
           case when p.phone is null then null else '0' || substr(p.phone, 4, 3) || '****' || right(p.phone, 3) end,
           m.member_role, m.created_at
      from public.org_members m
      join public.profiles p on p.id = m.profile_id
     where m.organization_id = p_org
     order by (m.member_role = 'owner') desc, m.created_at;
end;
$$;

------------------------------------------------------------------------------------------------
-- 4. Privacy: export and deletion requests
------------------------------------------------------------------------------------------------

create type public.data_request_kind as enum ('export', 'deletion');
create type public.data_request_status as enum ('open', 'completed', 'rejected', 'cancelled');

insert into public.permissions (permission, description) values
  ('privacy.manage', 'Handle data export and account deletion requests');
insert into public.admin_role_permissions (admin_role, permission) values
  ('support_disputes', 'privacy.manage');

create table public.data_requests (
  id               uuid primary key default gen_random_uuid(),
  -- Kept (with profile_id cleared) after an account is deleted, as the record of the request.
  profile_id       uuid default auth.uid() references public.profiles (id) on delete set null,
  kind             public.data_request_kind not null,
  status           public.data_request_status not null default 'open',
  reason           text check (reason is null or char_length(reason) <= 1000),
  resolution_note  text check (resolution_note is null or char_length(resolution_note) <= 1000),
  handled_by       uuid references public.profiles (id) on delete set null,
  handled_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index data_requests_one_open on public.data_requests (profile_id, kind) where status = 'open';
create index data_requests_status_idx on public.data_requests (status, created_at);
create index data_requests_handled_by_idx on public.data_requests (handled_by);
create trigger data_requests_updated_at before update on public.data_requests
  for each row execute function public.set_updated_at();
comment on table public.data_requests is 'NDPA data subject requests (export, deletion) and how staff handled them.';

alter table public.data_requests enable row level security;
create policy "data_requests: own or privacy.manage" on public.data_requests
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('privacy.manage')));
revoke all on public.data_requests from anon, authenticated;
grant select on public.data_requests to authenticated;

create or replace function public.request_account_deletion(p_reason text default null)
returns public.data_requests
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req public.data_requests;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if p_reason is not null and char_length(p_reason) > 1000 then
    raise exception 'Please keep the reason under 1000 characters.' using errcode = '22023';
  end if;
  if exists (select 1 from public.data_requests where profile_id = auth.uid() and kind = 'deletion' and status = 'open') then
    raise exception 'You already have an open deletion request.' using errcode = 'P0001';
  end if;
  insert into public.data_requests (profile_id, kind, reason)
  values (auth.uid(), 'deletion', nullif(trim(p_reason), ''))
  returning * into v_req;
  perform public.write_audit('deletion_requested', 'data_request', v_req.id, '{}'::jsonb);
  return v_req;
end;
$$;

create or replace function public.cancel_data_request(p_request_id uuid)
returns public.data_requests
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req public.data_requests;
begin
  update public.data_requests set status = 'cancelled'
   where id = p_request_id and profile_id = auth.uid() and status = 'open'
  returning * into v_req;
  if not found then
    raise exception 'No open request of yours with that id.' using errcode = 'P0002';
  end if;
  perform public.write_audit('data_request_cancelled', 'data_request', v_req.id, '{}'::jsonb);
  return v_req;
end;
$$;

-- Everything the platform holds about the caller, as one JSON document. ID and account numbers are
-- already stored masked; ID fingerprints and staff notes about other people are left out.
create or replace function public.export_my_data()
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_doc jsonb;
begin
  if v_uid is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'onboarded_by' from public.profiles p where p.id = v_uid),
    'businesses', coalesce((select jsonb_agg(jsonb_build_object('name', o.name, 'cac_number', o.cac_number,
                                    'your_role', m.member_role, 'joined_at', m.created_at))
                              from public.org_members m join public.organizations o on o.id = m.organization_id
                             where m.profile_id = v_uid), '[]'::jsonb),
    'roles', coalesce((select jsonb_agg(jsonb_build_object('role', r.role, 'provider_type', r.provider_type,
                                'granted_at', r.granted_at)) from public.user_roles r where r.profile_id = v_uid), '[]'::jsonb),
    'role_requests', coalesce((select jsonb_agg(jsonb_build_object('role', r.role, 'provider_type', r.provider_type,
                                'status', r.status, 'review_note', r.review_note, 'details', r.details,
                                'created_at', r.created_at, 'reviewed_at', r.reviewed_at))
                                 from public.role_requests r where r.profile_id = v_uid), '[]'::jsonb),
    'documents', coalesce((select jsonb_agg(jsonb_build_object('document_type', d.document_type, 'status', d.status,
                                'review_note', d.review_note, 'mime_type', d.mime_type, 'size_bytes', d.size_bytes,
                                'uploaded_at', d.created_at))
                             from public.verification_documents d where d.profile_id = v_uid), '[]'::jsonb),
    'identity_checks', coalesce((select jsonb_agg(jsonb_build_object('kind', v.kind, 'status', v.status,
                                'masked_number', v.masked_value, 'checked_at', v.created_at, 'verified_at', v.verified_at))
                                   from public.verifications v where v.profile_id = v_uid), '[]'::jsonb),
    'bank_accounts', coalesce((select jsonb_agg(jsonb_build_object('bank_name', b.bank_name, 'account_name', b.account_name,
                                'account_number_last4', b.account_number_last4, 'status', b.status, 'added_at', b.created_at))
                                 from public.bank_accounts b where b.profile_id = v_uid), '[]'::jsonb),
    'consents', coalesce((select jsonb_agg(jsonb_build_object('consent', c.consent_type, 'granted', c.granted,
                                'document_version', c.document_version, 'channel', c.channel, 'at', c.created_at)
                                order by c.created_at)
                            from public.consents c where c.profile_id = v_uid), '[]'::jsonb),
    'farms', coalesce((select jsonb_agg(jsonb_build_object('name', f.name, 'state', f.state, 'lga', f.lga,
                                'location', extensions.st_astext(f.location), 'area_ha', f.area_ha,
                                'zone', f.zone, 'created_at', f.created_at,
                                'plots', coalesce((select jsonb_agg(jsonb_build_object('name', pl.name, 'area_ha', pl.area_ha,
                                    'soil_records', coalesce((select jsonb_agg(to_jsonb(s) - 'plot_id' - 'id' - 'created_by')
                                                                from public.soil_records s where s.plot_id = pl.id), '[]'::jsonb)))
                                                     from public.plots pl where pl.farm_id = f.id), '[]'::jsonb)))
                         from public.farms f where f.owner_id = v_uid), '[]'::jsonb),
    'listings', coalesce((select jsonb_agg(jsonb_build_object('title', l.title, 'status', l.status, 'created_at', l.created_at))
                            from public.listings l where l.owner_id = v_uid), '[]'::jsonb),
    'privacy_requests', coalesce((select jsonb_agg(jsonb_build_object('kind', d.kind, 'status', d.status,
                                'created_at', d.created_at, 'resolution_note', d.resolution_note))
                                    from public.data_requests d where d.profile_id = v_uid), '[]'::jsonb)
  ) into v_doc;

  insert into public.data_requests (profile_id, kind, status, handled_at, resolution_note)
  values (v_uid, 'export', 'completed', now(), 'Self-service download');
  perform public.write_audit('data_exported', 'profile', v_uid, '{}'::jsonb);
  return v_doc;
end;
$$;

create or replace function public.admin_resolve_data_request(
  p_request_id uuid, p_status public.data_request_status, p_note text
)
returns public.data_requests
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req public.data_requests;
begin
  perform private.require_permission('privacy.manage');
  if p_status not in ('completed', 'rejected') then
    raise exception 'Choose completed or rejected.' using errcode = '22023';
  end if;
  if p_note is null or char_length(trim(p_note)) not between 5 and 1000 then
    raise exception 'Write what was done (5 to 1000 characters).' using errcode = '22023';
  end if;
  update public.data_requests
     set status = p_status, resolution_note = trim(p_note), handled_by = auth.uid(), handled_at = now()
   where id = p_request_id and status = 'open'
  returning * into v_req;
  if not found then
    raise exception 'No open request with that id.' using errcode = 'P0002';
  end if;
  perform public.write_audit('data_request_' || p_status::text, 'data_request', v_req.id,
    jsonb_build_object('kind', v_req.kind, 'profile_id', v_req.profile_id),
    jsonb_build_object('status', 'open'), jsonb_build_object('status', p_status));
  perform private.record_admin_action('privacy.manage', 'data_request_' || p_status::text, 'data_request', v_req.id, v_req.resolution_note);
  return v_req;
end;
$$;

------------------------------------------------------------------------------------------------
-- 5. Staff tools
------------------------------------------------------------------------------------------------

-- Queue sizes for the admin overview; each number only for staff who may act on it.
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admin_roles where profile_id = auth.uid()) then
    raise exception 'Staff only.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'pending_role_requests', case when public.has_permission('roles.review')
      then (select count(*) from public.role_requests where status = 'pending') end,
    'pending_documents', case when public.has_permission('verification.review')
      then (select count(*) from public.verification_documents where status = 'pending') end,
    'open_contact_messages', case when public.has_permission('website_inbox.manage')
      then (select count(*) from public.contact_messages where handled_at is null) end,
    'waitlist_signups', case when public.has_permission('website_inbox.manage')
      then (select count(*) from public.waitlist_signups) end,
    'open_data_requests', case when public.has_permission('privacy.manage')
      then (select count(*) from public.data_requests where status = 'open') end,
    'users', case when public.has_permission('users.read')
      then (select count(*) from public.profiles) end,
    'users_last_7_days', case when public.has_permission('users.read')
      then (select count(*) from public.profiles where created_at > now() - interval '7 days') end
  );
end;
$$;

create or replace function public.admin_grant_admin_role(p_profile uuid, p_role public.admin_role, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.require_permission('admin.manage');
  if p_role = 'super_admin' and not exists (
       select 1 from public.admin_roles where profile_id = auth.uid() and admin_role = 'super_admin') then
    raise exception 'Only a super admin can create another super admin.' using errcode = '42501';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 5 then
    raise exception 'Give a reason (at least 5 characters).' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile and onboarded_at is not null) then
    raise exception 'Staff must have a set-up account first.' using errcode = 'P0002';
  end if;
  insert into public.admin_roles (profile_id, admin_role, granted_by)
  values (p_profile, p_role, auth.uid())
  on conflict do nothing;
  perform private.record_admin_action('admin.manage', 'admin_role_granted:' || p_role::text, 'profile', p_profile, trim(p_reason));
end;
$$;

create or replace function public.admin_revoke_admin_role(p_profile uuid, p_role public.admin_role, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.require_permission('admin.manage');
  if p_role = 'super_admin' and not exists (
       select 1 from public.admin_roles where profile_id = auth.uid() and admin_role = 'super_admin') then
    raise exception 'Only a super admin can remove a super admin.' using errcode = '42501';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 5 then
    raise exception 'Give a reason (at least 5 characters).' using errcode = '22023';
  end if;
  if p_role = 'super_admin'
     and (select count(*) from public.admin_roles where admin_role = 'super_admin' and profile_id <> p_profile) = 0 then
    raise exception 'The platform needs at least one super admin.' using errcode = 'P0001';
  end if;
  delete from public.admin_roles where profile_id = p_profile and admin_role = p_role;
  if not found then
    raise exception 'That person does not hold this staff role.' using errcode = 'P0002';
  end if;
  perform private.record_admin_action('admin.manage', 'admin_role_revoked:' || p_role::text, 'profile', p_profile, trim(p_reason));
end;
$$;

create or replace function public.admin_set_contact_handled(p_message_id uuid, p_handled boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.require_permission('website_inbox.manage');
  update public.contact_messages
     set handled_at = case when p_handled then now() end,
         handled_by = case when p_handled then auth.uid() end
   where id = p_message_id;
  if not found then
    raise exception 'Message not found.' using errcode = 'P0002';
  end if;
  perform private.record_admin_action('website_inbox.manage',
    case when p_handled then 'contact_handled' else 'contact_reopened' end, 'contact_message', p_message_id, null);
end;
$$;

-- Staff mark contact messages through admin_set_contact_handled() only.
revoke update on public.contact_messages from authenticated;

------------------------------------------------------------------------------------------------
-- 6. Field-agent assisted onboarding (service role only)
------------------------------------------------------------------------------------------------

create table public.agent_onboarding_codes (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.profiles (id) on delete cascade,
  phone       text not null check (phone ~ '^234[0-9]{10}$'),
  -- HMAC of phone and code (key in Vault); the code itself is never stored
  code_hash   text not null check (char_length(code_hash) between 32 and 128),
  attempts    smallint not null default 0,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index agent_onboarding_codes_agent_idx on public.agent_onboarding_codes (agent_id, created_at desc);
create index agent_onboarding_codes_phone_idx on public.agent_onboarding_codes (phone, created_at desc);
comment on table public.agent_onboarding_codes is 'One-time codes texted to farmers registered by a field agent. Service role only.';

alter table public.agent_onboarding_codes enable row level security;
revoke all on public.agent_onboarding_codes from anon, authenticated;

create or replace function public.agent_onboarding_start(p_agent uuid, p_phone text, p_code_hash text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_phone text := private.normalize_ng_phone(p_phone);
  v_agent public.profiles;
begin
  select * into v_agent from public.profiles where id = p_agent;
  if not found or not exists (select 1 from public.user_roles where profile_id = p_agent and role = 'field_agent') then
    raise exception 'not_field_agent' using errcode = '42501';
  end if;
  if v_phone is null or v_phone = 'invalid' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if v_phone = v_agent.phone then
    raise exception 'own_number' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles where phone = v_phone) then
    raise exception 'already_registered' using errcode = 'P0001';
  end if;
  if (select count(*) from public.agent_onboarding_codes
       where agent_id = p_agent and created_at > now() - interval '1 hour') >= 20
     or (select count(*) from public.agent_onboarding_codes
          where phone = v_phone and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.agent_onboarding_codes (agent_id, phone, code_hash, expires_at)
  values (p_agent, v_phone, p_code_hash, now() + interval '10 minutes');
  return jsonb_build_object('phone', v_phone, 'agent_name', coalesce(v_agent.full_name, 'A field agent'));
end;
$$;

create or replace function public.agent_onboarding_verify(p_agent uuid, p_phone text, p_code_hash text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_phone text := private.normalize_ng_phone(p_phone);
  v_row   public.agent_onboarding_codes;
begin
  select * into v_row from public.agent_onboarding_codes
   where agent_id = p_agent and phone = v_phone and used_at is null and expires_at > now()
   order by created_at desc limit 1
   for update;
  if not found then
    raise exception 'code_expired' using errcode = 'P0002';
  end if;
  if v_row.attempts >= 5 then
    raise exception 'too_many_attempts' using errcode = 'P0001';
  end if;
  if v_row.code_hash <> p_code_hash then
    update public.agent_onboarding_codes set attempts = attempts + 1 where id = v_row.id;
    return jsonb_build_object('ok', false);
  end if;
  update public.agent_onboarding_codes set used_at = now() where id = v_row.id;
  return jsonb_build_object('ok', true, 'phone', v_phone);
end;
$$;

-- Called after the Edge Function has created the farmer's sign-in (phone confirmed by the code).
create or replace function public.agent_onboarding_complete(
  p_agent             uuid,
  p_profile           uuid,
  p_full_name         text,
  p_state             text,
  p_lga               text,
  p_language          public.app_language,
  p_roles             jsonb,
  p_consents          jsonb,
  p_document_version  text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name  text := trim(coalesce(p_full_name, ''));
  v_key   text;
  v_value jsonb;
  v_pick  record;
begin
  if not exists (select 1 from public.user_roles where profile_id = p_agent and role = 'field_agent') then
    raise exception 'not_field_agent' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile and onboarded_at is null and onboarded_by is null) then
    raise exception 'profile_not_new' using errcode = 'P0001';
  end if;
  if char_length(v_name) not between 2 and 120 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if p_document_version is null or char_length(trim(p_document_version)) not between 1 and 40 then
    raise exception 'invalid_version' using errcode = '22023';
  end if;
  perform private.check_consents(p_consents);

  update public.profiles
     set full_name = v_name, state = private.clean_place(p_state), lga = private.clean_place(p_lga),
         preferred_language = coalesce(p_language, 'en'), onboarded_by = p_agent, onboarded_at = now()
   where id = p_profile;

  for v_key, v_value in select * from jsonb_each(p_consents) loop
    insert into public.consents (profile_id, consent_type, granted, document_version, channel, created_by)
    values (p_profile, v_key::public.consent_type, (v_value)::text::boolean, trim(p_document_version), 'field_agent', p_agent);
  end loop;

  -- Agents register farmers only; other roles need the person's own documents.
  for v_pick in select * from private.parse_role_choices(p_roles, array['crop_farmer', 'animal_farmer']::public.app_role[]) loop
    insert into public.role_requests (profile_id, role, provider_type, created_by)
    values (p_profile, v_pick.role, v_pick.provider_type, p_agent);
  end loop;

  insert into public.audit_log (actor_id, action, entity, entity_id, metadata)
  values (p_agent, 'agent_onboarded_farmer', 'profile', p_profile, jsonb_build_object('channel', 'field_agent'));
  return jsonb_build_object('profile_id', p_profile);
end;
$$;

------------------------------------------------------------------------------------------------
-- Grants
------------------------------------------------------------------------------------------------

revoke execute on function
  private.parse_role_choices(jsonb, public.app_role[]),
  private.check_consents(jsonb),
  private.clean_place(text)
  from public, anon, authenticated;

revoke execute on function
  public.complete_onboarding(text, public.account_type, text, text, text, text, public.app_language, jsonb, jsonb, text, text),
  public.add_org_member(uuid, text, public.org_member_role),
  public.org_member_list(uuid),
  public.request_account_deletion(text),
  public.cancel_data_request(uuid),
  public.export_my_data(),
  public.admin_resolve_data_request(uuid, public.data_request_status, text),
  public.admin_dashboard(),
  public.admin_grant_admin_role(uuid, public.admin_role, text),
  public.admin_revoke_admin_role(uuid, public.admin_role, text),
  public.admin_set_contact_handled(uuid, boolean),
  public.agent_onboarding_start(uuid, text, text),
  public.agent_onboarding_verify(uuid, text, text),
  public.agent_onboarding_complete(uuid, uuid, text, text, text, public.app_language, jsonb, jsonb, text)
  from public, anon;

grant execute on function
  public.complete_onboarding(text, public.account_type, text, text, text, text, public.app_language, jsonb, jsonb, text, text),
  public.add_org_member(uuid, text, public.org_member_role),
  public.org_member_list(uuid),
  public.request_account_deletion(text),
  public.cancel_data_request(uuid),
  public.export_my_data(),
  public.admin_resolve_data_request(uuid, public.data_request_status, text),
  public.admin_dashboard(),
  public.admin_grant_admin_role(uuid, public.admin_role, text),
  public.admin_revoke_admin_role(uuid, public.admin_role, text),
  public.admin_set_contact_handled(uuid, boolean)
  to authenticated;

revoke execute on function
  public.agent_onboarding_start(uuid, text, text),
  public.agent_onboarding_verify(uuid, text, text),
  public.agent_onboarding_complete(uuid, uuid, text, text, text, public.app_language, jsonb, jsonb, text)
  from authenticated;
grant execute on function
  public.agent_onboarding_start(uuid, text, text),
  public.agent_onboarding_verify(uuid, text, text),
  public.agent_onboarding_complete(uuid, uuid, text, text, text, public.app_language, jsonb, jsonb, text)
  to service_role;
