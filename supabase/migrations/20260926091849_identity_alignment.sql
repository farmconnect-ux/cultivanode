-- Tillmate: align identity and administration with the Phase 1 master specification.
--
--   1. Role and admin sub-role names follow the spec (buyer_offtaker, vet, extension_agent,
--      support_disputes, agronomy_editor).
--   2. Platform roles become a reference table (`roles`) so approval rules live in data, not code.
--   3. Staff access is permission-based: `permissions` + `admin_role_permissions` + has_permission().
--      Every policy and approval function now asks for a permission instead of an admin sub-role.
--   4. Audit log: metadata, old/new values, IP and user agent; append-only for everybody.
--      `admin_actions` records staff decisions with their reason.
--   5. New identity tables: verification_documents (+ private storage bucket), bank_accounts, consents.
--   6. Tier 2 now needs NIN + BVN + a verified bank account, as the spec requires.
--   7. created_by on user-created records; `source` provenance on farm records; farm_zones
--      reference table with admin zone correction.

------------------------------------------------------------------------------------------------
-- 1. Names
------------------------------------------------------------------------------------------------

alter type public.app_role rename value 'buyer' to 'buyer_offtaker';
alter type public.provider_type rename value 'vet_doctor' to 'vet';
alter type public.provider_type add value if not exists 'extension_agent' after 'agronomist';
alter type public.admin_role rename value 'support_officer' to 'support_disputes';
alter type public.admin_role rename value 'content_editor' to 'agronomy_editor';

------------------------------------------------------------------------------------------------
-- 2. Permissions
------------------------------------------------------------------------------------------------

create table public.permissions (
  permission   text primary key check (permission ~ '^[a-z_]+\.[a-z_]+$'),
  description  text not null,
  created_at   timestamptz not null default now()
);
comment on table public.permissions is 'Every staff capability. Policies and functions check these, never admin sub-role names.';

create table public.admin_role_permissions (
  admin_role  public.admin_role not null,
  permission  text not null references public.permissions (permission) on delete cascade,
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  primary key (admin_role, permission)
);
comment on table public.admin_role_permissions is 'Which permissions each admin sub-role has. super_admin implicitly has all.';

insert into public.permissions (permission, description) values
  ('users.read',            'View people, business accounts and their roles'),
  ('roles.review',          'Approve or reject role requests'),
  ('roles.configure',       'Change role settings such as automatic approval'),
  ('verification.review',   'Review identity verifications and uploaded documents'),
  ('farms.read',            'View any farm and its plots'),
  ('farms.correct_zone',    'Correct the farming zone of a farm'),
  ('listings.moderate',     'Pause, suspend or restore marketplace listings'),
  ('bookings.read',         'View bookings'),
  ('disputes.decide',       'Decide booking disputes'),
  ('website_inbox.manage',  'Read and handle contact messages and waitlist sign-ups'),
  ('crops.manage',          'Edit crops, varieties and crop templates'),
  ('standards.publish',     'Publish and version agronomic standards'),
  ('products.manage',       'Edit the fertiliser and agrochemical product list'),
  ('knowledge.manage',      'Approve or retire AI knowledge documents'),
  ('bank_accounts.read',    'View provider bank accounts (masked)'),
  ('payments.read',         'View payments and escrow'),
  ('payouts.approve',       'Approve provider payouts'),
  ('ledger.read',           'View the platform ledger'),
  ('reports.read',          'View operational and financial reports'),
  ('notifications.send',    'Send platform notifications'),
  ('audit.read',            'Read the audit log and admin actions'),
  ('admin.manage',          'Grant admin sub-roles and change their permissions'),
  ('settings.manage',       'Change platform settings (commissions, cancellation rules)');

insert into public.admin_role_permissions (admin_role, permission) values
  ('verification_officer', 'users.read'),
  ('verification_officer', 'roles.review'),
  ('verification_officer', 'verification.review'),
  ('verification_officer', 'farms.read'),
  ('support_disputes',     'users.read'),
  ('support_disputes',     'farms.read'),
  ('support_disputes',     'listings.moderate'),
  ('support_disputes',     'bookings.read'),
  ('support_disputes',     'disputes.decide'),
  ('support_disputes',     'website_inbox.manage'),
  ('agronomy_editor',      'farms.read'),
  ('agronomy_editor',      'farms.correct_zone'),
  ('agronomy_editor',      'crops.manage'),
  ('agronomy_editor',      'standards.publish'),
  ('agronomy_editor',      'products.manage'),
  ('agronomy_editor',      'knowledge.manage'),
  ('finance_officer',      'users.read'),
  ('finance_officer',      'bank_accounts.read'),
  ('finance_officer',      'payments.read'),
  ('finance_officer',      'payouts.approve'),
  ('finance_officer',      'ledger.read'),
  ('finance_officer',      'reports.read');

create or replace function public.has_permission(p_permission text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_roles a
     where a.profile_id = auth.uid()
       and (a.admin_role = 'super_admin'
            or exists (select 1 from public.admin_role_permissions rp
                        where rp.admin_role = a.admin_role and rp.permission = p_permission))
  );
$$;
comment on function public.has_permission is 'True if the caller holds an admin sub-role with this permission (super_admin has all).';

create or replace function public.my_permissions()
returns setof text
language sql stable security definer
set search_path = ''
as $$
  select p.permission from public.permissions p
   where public.has_permission(p.permission)
   order by 1;
$$;

------------------------------------------------------------------------------------------------
-- 3. Roles reference table (approval rules as data)
------------------------------------------------------------------------------------------------

create table public.roles (
  role                   public.app_role primary key,
  description            text not null,
  -- Only farm-tool roles may ever skip review: sensitive roles are never granted automatically.
  auto_approve           boolean not null default false
                         check (not auto_approve or role in ('crop_farmer', 'animal_farmer')),
  requires_documents     boolean not null default false,
  min_verification_tier  smallint not null default 0 check (min_verification_tier between 0 and 3),
  -- false = recorded for the future (Phase 2+), not yet offered in onboarding.
  available              boolean not null default true,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  updated_by             uuid references public.profiles (id) on delete set null
);
comment on table public.roles is 'Platform roles and how they are approved. Edited by staff with roles.configure.';

insert into public.roles (role, description, auto_approve, requires_documents, min_verification_tier, available) values
  ('crop_farmer',           'Grows crops; uses farm, crop, weather, inventory and hiring tools', true,  false, 0, true),
  ('animal_farmer',         'Keeps livestock or fish (livestock tools arrive in Phase 2)',       true,  false, 0, true),
  ('machinery_owner',       'Lists tractors and other equipment for hire',                      false, true,  0, true),
  ('service_provider',      'Offers farm services (operator, spraying, mechanic, agronomist, ...)', false, true, 0, true),
  ('input_supplier',        'Sells seeds, fertiliser and agrochemicals (Phase 2 marketplace)',  false, true,  0, false),
  ('buyer_offtaker',        'Buys produce (Phase 2 marketplace)',                               false, false, 0, false),
  ('logistics_provider',    'Moves produce and inputs (Phase 2)',                               false, true,  0, false),
  ('field_agent',           'Registers and supports farmers in the field for Tillmate',         false, true,  1, true),
  ('institutional_partner', 'Government, NGO or development partner (Phase 2)',                  false, true,  0, false),
  ('investor',              'Invests in farms or the platform (Phase 3)',                        false, true,  0, false);

create trigger roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();

create or replace function public.role_is_auto_approved(p_role public.app_role)
returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce((select r.auto_approve from public.roles r where r.role = p_role), false);
$$;

------------------------------------------------------------------------------------------------
-- 4. Audit log and admin actions
------------------------------------------------------------------------------------------------

alter table public.audit_log rename column details to metadata;
alter table public.audit_log
  add column old_values  jsonb,
  add column new_values  jsonb,
  add column ip          inet,
  add column user_agent  text check (user_agent is null or char_length(user_agent) <= 400);
create index audit_log_created_idx on public.audit_log (created_at desc);
drop index if exists public.audit_log_actor_idx;
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);

create table public.admin_actions (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  permission  text not null references public.permissions (permission),
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  reason      text check (reason is null or char_length(reason) <= 2000),
  created_at  timestamptz not null default now()
);
create index admin_actions_created_idx on public.admin_actions (created_at desc);
create index admin_actions_entity_idx on public.admin_actions (entity, entity_id);
comment on table public.admin_actions is 'Staff decisions and the permission used. Append-only.';

-- Append-only: nobody (including service code) may change or remove history.
create or replace function private.forbid_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only.', tg_table_name using errcode = '42501';
end;
$$;

create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function private.forbid_change();
create trigger admin_actions_append_only before update or delete on public.admin_actions
  for each row execute function private.forbid_change();

-- Request details (IP, user agent) come from PostgREST's request.headers when available.
create or replace function private.request_context(out ip inet, out user_agent text)
language plpgsql stable
set search_path = ''
as $$
declare
  v_headers jsonb;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := null;
  end;
  if v_headers is null then
    return;
  end if;
  user_agent := left(v_headers ->> 'user-agent', 400);
  begin
    ip := nullif(trim(split_part(coalesce(v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip', ''), ',', 1)), '')::inet;
  exception when others then
    ip := null;
  end;
end;
$$;

drop function public.write_audit(text, text, uuid, jsonb);
create function public.write_audit(
  p_action     text,
  p_entity     text,
  p_entity_id  uuid,
  p_metadata   jsonb default '{}'::jsonb,
  p_old_values jsonb default null,
  p_new_values jsonb default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_ctx record;
begin
  select * into v_ctx from private.request_context();
  insert into public.audit_log (actor_id, action, entity, entity_id, metadata, old_values, new_values, ip, user_agent)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_metadata, '{}'::jsonb),
          p_old_values, p_new_values, v_ctx.ip, v_ctx.user_agent);
end;
$$;
revoke execute on function public.write_audit(text, text, uuid, jsonb, jsonb, jsonb) from public, anon, authenticated;

create or replace function private.record_admin_action(
  p_permission text, p_action text, p_entity text, p_entity_id uuid, p_reason text default null
)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.admin_actions (actor_id, permission, action, entity, entity_id, reason)
  values (auth.uid(), p_permission, p_action, p_entity, p_entity_id, p_reason);
$$;

-- Generic row audit for configuration and permission tables.
create or replace function private.audit_row_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform public.write_audit(
    tg_table_name || '_' || lower(tg_op),
    tg_table_name,
    case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'id') else (to_jsonb(new) ->> 'id') end::uuid,
    '{}'::jsonb,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger admin_roles_audit after insert or update or delete on public.admin_roles
  for each row execute function private.audit_row_change();
create trigger admin_role_permissions_audit after insert or update or delete on public.admin_role_permissions
  for each row execute function private.audit_row_change();
create trigger roles_audit after update on public.roles
  for each row execute function private.audit_row_change();

------------------------------------------------------------------------------------------------
-- Role request functions: permission checks, admin actions, new audit columns
------------------------------------------------------------------------------------------------

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

    perform public.write_audit('role_auto_approved', 'role_request', new.id,
      jsonb_build_object('role', new.role, 'profile_id', new.profile_id));
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
  v_req public.role_requests;
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

  insert into public.user_roles (profile_id, role, provider_type, request_id, granted_by)
  values (v_req.profile_id, v_req.role, v_req.provider_type, v_req.id, auth.uid())
  on conflict on constraint user_roles_unique do nothing;

  update public.role_requests
     set status = 'approved', review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_request_id
  returning * into v_req;

  perform public.write_audit('role_approved', 'role_request', v_req.id,
    jsonb_build_object('role', v_req.role, 'provider_type', v_req.provider_type, 'profile_id', v_req.profile_id),
    jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'approved'));
  perform private.record_admin_action('roles.review', 'role_approved', 'role_request', v_req.id, p_note);
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
  if not public.has_permission('roles.review') then
    raise exception 'You do not have permission to reject role requests.' using errcode = '42501';
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
    jsonb_build_object('role', v_req.role, 'profile_id', v_req.profile_id),
    jsonb_build_object('status', 'pending'), jsonb_build_object('status', 'rejected'));
  perform private.record_admin_action('roles.review', 'role_rejected', 'role_request', v_req.id, v_req.review_note);
  return v_req;
end;
$$;

------------------------------------------------------------------------------------------------
-- 5a. Verification documents (+ private storage bucket)
------------------------------------------------------------------------------------------------

create type public.verification_document_type as enum (
  'national_id', 'cac_certificate', 'proof_of_address', 'equipment_ownership',
  'professional_licence', 'photo', 'other'
);
create type public.review_status as enum ('pending', 'accepted', 'rejected');

create table public.verification_documents (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  role_request_id  uuid references public.role_requests (id) on delete set null,
  document_type    public.verification_document_type not null,
  -- Path inside the private `verification-documents` bucket: '<profile_id>/<file name>'.
  storage_path     text not null unique check (char_length(storage_path) between 38 and 300),
  mime_type        text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes       integer not null check (size_bytes between 1 and 5242880),
  status           public.review_status not null default 'pending',
  review_note      text check (review_note is null or char_length(review_note) <= 1000),
  reviewed_by      uuid references public.profiles (id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid default auth.uid() references public.profiles (id) on delete set null,
  constraint verification_documents_path_is_own check (storage_path like profile_id::text || '/%')
);
create index verification_documents_profile_idx on public.verification_documents (profile_id, created_at desc);
create index verification_documents_request_idx on public.verification_documents (role_request_id);
create index verification_documents_pending_idx on public.verification_documents (created_at) where status = 'pending';
create trigger verification_documents_updated_at before update on public.verification_documents
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-documents', 'verification-documents', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "verification documents: owner uploads to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verification-documents'
              and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "verification documents: owner or reviewer reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'verification-documents'
         and ((storage.foldername(name))[1] = (select auth.uid())::text
              or (select public.has_permission('verification.review'))));

create or replace function public.review_verification_document(
  p_document_id uuid, p_status public.review_status, p_note text default null
)
returns public.verification_documents
language plpgsql security definer
set search_path = ''
as $$
declare
  v_doc public.verification_documents;
begin
  if not public.has_permission('verification.review') then
    raise exception 'You do not have permission to review documents.' using errcode = '42501';
  end if;
  if p_status = 'pending' then
    raise exception 'Choose accepted or rejected.' using errcode = '22023';
  end if;
  if p_status = 'rejected' and (p_note is null or char_length(trim(p_note)) < 5) then
    raise exception 'Give the applicant a reason (at least 5 characters).' using errcode = '22023';
  end if;

  update public.verification_documents
     set status = p_status, review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_document_id and status = 'pending' and profile_id <> auth.uid()
  returning * into v_doc;
  if not found then
    raise exception 'No pending document with that id that you may review.' using errcode = 'P0002';
  end if;

  perform public.write_audit('verification_document_' || p_status::text, 'verification_document', v_doc.id,
    jsonb_build_object('profile_id', v_doc.profile_id, 'document_type', v_doc.document_type),
    jsonb_build_object('status', 'pending'), jsonb_build_object('status', p_status));
  perform private.record_admin_action('verification.review', 'verification_document_' || p_status::text,
    'verification_document', v_doc.id, v_doc.review_note);
  return v_doc;
end;
$$;

------------------------------------------------------------------------------------------------
-- 5b. Bank accounts (written by server code after the payment provider resolves the account)
------------------------------------------------------------------------------------------------

create table public.bank_accounts (
  id                       uuid primary key default gen_random_uuid(),
  profile_id               uuid not null references public.profiles (id) on delete restrict,
  bank_code                text not null check (bank_code ~ '^[0-9A-Za-z]{2,10}$'),
  bank_name                text not null check (char_length(bank_name) between 2 and 120),
  account_name             text not null check (char_length(account_name) between 2 and 160),
  -- Never the full account number: only the last four digits.
  account_number_last4     text not null check (account_number_last4 ~ '^[0-9]{4}$'),
  provider                 text not null check (provider in ('paystack', 'flutterwave', 'test')),
  provider_recipient_code  text,
  status                   public.verification_status not null default 'pending',
  verified_at              timestamptz,
  is_default               boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  created_by               uuid default auth.uid() references public.profiles (id) on delete set null
);
create index bank_accounts_profile_idx on public.bank_accounts (profile_id);
create unique index bank_accounts_one_default on public.bank_accounts (profile_id) where is_default;
create trigger bank_accounts_updated_at before update on public.bank_accounts
  for each row execute function public.set_updated_at();
create trigger bank_accounts_audit after insert or update or delete on public.bank_accounts
  for each row execute function private.audit_row_change();
comment on table public.bank_accounts is 'Payout accounts. Server-written only; apps can read their own.';

------------------------------------------------------------------------------------------------
-- 6. Verification tier: NIN -> 1; NIN + BVN + verified bank account -> 2; 3 is kept only while 2 holds
------------------------------------------------------------------------------------------------

create or replace function private.recompute_verification_tier(p_profile uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_nin  boolean;
  v_bvn  boolean;
  v_bank boolean;
  v_base smallint;
begin
  select coalesce(bool_or(kind = 'nin' and status = 'verified'), false),
         coalesce(bool_or(kind = 'bvn' and status = 'verified'), false)
    into v_nin, v_bvn
    from public.verifications where profile_id = p_profile;
  select exists (select 1 from public.bank_accounts b where b.profile_id = p_profile and b.status = 'verified')
    into v_bank;

  v_base := case when v_nin and v_bvn and v_bank then 2
                 when v_nin then 1
                 else 0 end;

  update public.profiles
     set verification_tier = case when verification_tier = 3 and v_base = 2 then 3 else v_base end
   where id = p_profile
     and verification_tier is distinct from (case when verification_tier = 3 and v_base = 2 then 3 else v_base end);
end;
$$;

create or replace function public.refresh_verification_tier()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.recompute_verification_tier(coalesce(new.profile_id, old.profile_id));
  return coalesce(new, old);
end;
$$;

create trigger bank_accounts_refresh_tier
  after insert or update of status or delete on public.bank_accounts
  for each row execute function public.refresh_verification_tier();

------------------------------------------------------------------------------------------------
-- 5c. Consents (NDPA 2023). Append-only: the latest row per type is the current choice.
------------------------------------------------------------------------------------------------

create type public.consent_type as enum (
  'terms_of_use', 'privacy_policy', 'data_processing', 'marketing_messages',
  'share_with_lenders', 'share_with_buyers', 'share_with_investors', 'share_with_partners'
);

create table public.consents (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  consent_type      public.consent_type not null,
  granted           boolean not null,
  document_version  text not null check (char_length(document_version) between 1 and 40),
  channel           text not null default 'web' check (channel in ('web', 'mobile', 'field_agent', 'sms', 'admin')),
  -- clock_timestamp(), not now(): two choices in one transaction must still have an order.
  created_at        timestamptz not null default clock_timestamp(),
  created_by        uuid default auth.uid() references public.profiles (id) on delete set null
);
create index consents_profile_type_idx on public.consents (profile_id, consent_type, created_at desc);
create trigger consents_append_only before update or delete on public.consents
  for each row execute function private.forbid_change();

create view public.current_consents with (security_invoker = true) as
  select distinct on (profile_id, consent_type)
         profile_id, consent_type, granted, document_version, channel, created_at
    from public.consents
   order by profile_id, consent_type, created_at desc, id;

------------------------------------------------------------------------------------------------
-- 7. created_by, provenance, farm zones
------------------------------------------------------------------------------------------------

alter table public.organizations add column created_by uuid default auth.uid() references public.profiles (id) on delete set null;
alter table public.role_requests add column created_by uuid default auth.uid() references public.profiles (id) on delete set null;
alter table public.farms         add column created_by uuid default auth.uid() references public.profiles (id) on delete set null;
alter table public.plots         add column created_by uuid default auth.uid() references public.profiles (id) on delete set null;
alter table public.listings      add column created_by uuid default auth.uid() references public.profiles (id) on delete set null;
create index organizations_created_by_idx on public.organizations (created_by);
create index role_requests_created_by_idx on public.role_requests (created_by);
create index farms_created_by_idx on public.farms (created_by);
create index plots_created_by_idx on public.plots (created_by);
create index listings_created_by_idx on public.listings (created_by);

-- Where a record came from. Future credit profiles weigh verified data above self-reported data.
create type public.record_source as enum ('self_reported', 'agent_verified', 'platform_verified', 'payment_verified');

alter table public.farms        add column source public.record_source not null default 'self_reported';
alter table public.soil_records add column source public.record_source not null default 'self_reported';

create or replace function private.set_farm_source()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null then  -- app users cannot choose provenance; server code (service role) may
    new.source := case when new.onboarded_by is not null and new.onboarded_by = auth.uid()
                       then 'agent_verified' else 'self_reported' end;
  end if;
  return new;
end;
$$;
create trigger farms_set_source before insert on public.farms
  for each row execute function private.set_farm_source();

create or replace function private.set_soil_record_source()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.source := case
      when exists (select 1 from public.farms f join public.plots p on p.farm_id = f.id
                    where p.id = new.plot_id and f.onboarded_by = auth.uid())
       and public.has_role('field_agent')
      then 'agent_verified' else 'self_reported' end;
  end if;
  return new;
end;
$$;
create trigger soil_records_set_source before insert on public.soil_records
  for each row execute function private.set_soil_record_source();

create table public.farm_zones (
  zone         public.farm_zone primary key,
  name         text not null,
  description  text not null,
  -- Filled from an agronomist-approved map; while empty, farmers or staff choose the zone.
  boundary     extensions.geography(MultiPolygon, 4326),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index farm_zones_boundary_gix on public.farm_zones using gist (boundary);
create trigger farm_zones_updated_at before update on public.farm_zones
  for each row execute function public.set_updated_at();
insert into public.farm_zones (zone, name, description) values
  ('rainforest',      'Rainforest',      'Humid forest belt: Ogun, Ondo, Osun, southern Oyo, Ekiti, Lagos'),
  ('derived_savanna', 'Derived savanna', 'Forest-savanna transition: northern Oyo, northern Ogun, parts of Osun and Ekiti'),
  ('other',           'Other / not set', 'Outside the pilot zones or not yet determined');

alter table public.farms
  add column zone_corrected_by uuid references public.profiles (id) on delete set null,
  add column zone_corrected_at timestamptz;
create index farms_zone_corrected_by_idx on public.farms (zone_corrected_by);

-- Detect the zone from the map when one covers the farm, unless staff have corrected it.
create or replace function private.detect_farm_zone()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_zone public.farm_zone;
begin
  if new.zone_corrected_at is null then
    select z.zone into v_zone from public.farm_zones z
     where z.boundary is not null and extensions.st_covers(z.boundary, new.location)
     limit 1;
    if v_zone is not null then
      new.zone := v_zone;
    end if;
  end if;
  return new;
end;
$$;
create trigger farms_detect_zone before insert or update of location on public.farms
  for each row execute function private.detect_farm_zone();

create or replace function public.correct_farm_zone(p_farm_id uuid, p_zone public.farm_zone, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_old public.farm_zone;
begin
  if not public.has_permission('farms.correct_zone') then
    raise exception 'You do not have permission to correct farm zones.' using errcode = '42501';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 5 then
    raise exception 'Give a reason (at least 5 characters).' using errcode = '22023';
  end if;
  select zone into v_old from public.farms where id = p_farm_id for update;
  if not found then
    raise exception 'Farm not found.' using errcode = 'P0002';
  end if;
  update public.farms
     set zone = p_zone, zone_corrected_by = auth.uid(), zone_corrected_at = now()
   where id = p_farm_id;
  perform public.write_audit('farm_zone_corrected', 'farm', p_farm_id, jsonb_build_object('reason', p_reason),
    jsonb_build_object('zone', v_old), jsonb_build_object('zone', p_zone));
  perform private.record_admin_action('farms.correct_zone', 'farm_zone_corrected', 'farm', p_farm_id, p_reason);
end;
$$;

------------------------------------------------------------------------------------------------
-- Policies: staff access by permission
------------------------------------------------------------------------------------------------

drop policy "profiles: read own, onboarded, or as staff" on public.profiles;
create policy "profiles: read own, onboarded, or with users.read" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or onboarded_by = (select auth.uid()) or (select public.has_permission('users.read')));

drop policy "organizations: members and staff read" on public.organizations;
create policy "organizations: members or users.read" on public.organizations
  for select to authenticated
  using (public.org_role(id) is not null or (select public.has_permission('users.read')));

drop policy "org_members: members and staff read" on public.org_members;
create policy "org_members: members or users.read" on public.org_members
  for select to authenticated
  using (public.org_role(organization_id) is not null or (select public.has_permission('users.read')));

drop policy "admin_roles: staff read" on public.admin_roles;
create policy "admin_roles: own or admin.manage" on public.admin_roles
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('admin.manage')));

drop policy "role_requests: read own or as verification staff" on public.role_requests;
create policy "role_requests: own or roles.review" on public.role_requests
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('roles.review')));

drop policy "user_roles: read own or as staff" on public.user_roles;
create policy "user_roles: own or users.read" on public.user_roles
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('users.read')));

drop policy "verifications: read own or as verification staff" on public.verifications;
create policy "verifications: own or verification.review" on public.verifications
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('verification.review')));

drop policy "audit_log: staff read" on public.audit_log;
create policy "audit_log: audit.read" on public.audit_log
  for select to authenticated
  using ((select public.has_permission('audit.read')));

drop policy "listings: active for all, rest for owner and staff" on public.listings;
create policy "listings: active for all, rest for owner or listings.moderate" on public.listings
  for select to authenticated
  using (status = 'active' or owner_id = (select auth.uid()) or (select public.has_permission('listings.moderate')));
drop policy "listings: staff moderate" on public.listings;
create policy "listings: listings.moderate" on public.listings
  for update to authenticated
  using ((select public.has_permission('listings.moderate')))
  with check ((select public.has_permission('listings.moderate')));

drop policy "contact: staff read" on public.contact_messages;
drop policy "contact: staff mark handled" on public.contact_messages;
create policy "contact: website_inbox.manage reads" on public.contact_messages
  for select to authenticated using ((select public.has_permission('website_inbox.manage')));
create policy "contact: website_inbox.manage marks handled" on public.contact_messages
  for update to authenticated
  using ((select public.has_permission('website_inbox.manage')))
  with check ((select public.has_permission('website_inbox.manage')));
drop policy "waitlist: staff read" on public.waitlist_signups;
create policy "waitlist: website_inbox.manage reads" on public.waitlist_signups
  for select to authenticated using ((select public.has_permission('website_inbox.manage')));

create or replace function private.can_view_farm(p_farm uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.farms f
    where f.id = p_farm
      and (
        f.owner_id = auth.uid()
        or (f.organization_id is not null and public.org_role(f.organization_id) is not null)
        or (f.onboarded_by = auth.uid() and public.has_role('field_agent'))
        or public.has_permission('farms.read')
      )
  );
$$;

-- New tables
alter table public.permissions             enable row level security;
alter table public.admin_role_permissions  enable row level security;
alter table public.roles                   enable row level security;
alter table public.admin_actions           enable row level security;
alter table public.verification_documents  enable row level security;
alter table public.bank_accounts           enable row level security;
alter table public.consents                enable row level security;
alter table public.farm_zones              enable row level security;

create policy "permissions: signed-in users read" on public.permissions
  for select to authenticated using (true);
create policy "admin_role_permissions: signed-in users read" on public.admin_role_permissions
  for select to authenticated using (true);
create policy "admin_role_permissions: admin.manage adds" on public.admin_role_permissions
  for insert to authenticated with check ((select public.has_permission('admin.manage')));
create policy "admin_role_permissions: admin.manage removes" on public.admin_role_permissions
  for delete to authenticated using ((select public.has_permission('admin.manage')));

create policy "roles: everyone reads" on public.roles
  for select to anon, authenticated using (true);
create policy "roles: roles.configure edits" on public.roles
  for update to authenticated
  using ((select public.has_permission('roles.configure')))
  with check ((select public.has_permission('roles.configure')));

create policy "admin_actions: audit.read" on public.admin_actions
  for select to authenticated using ((select public.has_permission('audit.read')));

create policy "verification_documents: own or verification.review" on public.verification_documents
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('verification.review')));
create policy "verification_documents: upload own" on public.verification_documents
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and status = 'pending'
    and (role_request_id is null
         or exists (select 1 from public.role_requests r
                     where r.id = role_request_id and r.profile_id = (select auth.uid())))
  );

create policy "bank_accounts: own or bank_accounts.read" on public.bank_accounts
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('bank_accounts.read')));

create policy "consents: own or users.read" on public.consents
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.has_permission('users.read')));
create policy "consents: record own" on public.consents
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "farm_zones: everyone reads" on public.farm_zones
  for select to anon, authenticated using (true);

------------------------------------------------------------------------------------------------
-- Grants
------------------------------------------------------------------------------------------------

revoke all on public.permissions, public.admin_role_permissions, public.roles, public.admin_actions,
              public.verification_documents, public.bank_accounts, public.consents, public.farm_zones,
              public.current_consents
  from anon, authenticated;

grant select on public.permissions to authenticated;
grant select, insert (admin_role, permission), delete on public.admin_role_permissions to authenticated;
grant select on public.roles to anon, authenticated;
grant update (description, auto_approve, requires_documents, min_verification_tier, available) on public.roles to authenticated;
grant select on public.admin_actions to authenticated;
grant select, insert (role_request_id, document_type, storage_path, mime_type, size_bytes)
  on public.verification_documents to authenticated;
grant select on public.bank_accounts to authenticated;
grant select, insert (consent_type, granted, document_version, channel) on public.consents to authenticated;
grant select on public.current_consents to authenticated;
grant select on public.farm_zones to anon, authenticated;

-- is_admin() is replaced by has_permission().
drop function public.is_admin(public.admin_role);

revoke execute on all functions in schema private from public, anon;
-- Internal helpers are called only by triggers and SECURITY DEFINER functions.
revoke execute on function
  private.forbid_change(),
  private.request_context(),
  private.record_admin_action(text, text, text, uuid, text),
  private.audit_row_change(),
  private.recompute_verification_tier(uuid),
  private.set_farm_source(),
  private.set_soil_record_source(),
  private.detect_farm_zone()
  from authenticated;
grant execute on function
  public.has_permission(text),
  public.my_permissions(),
  public.review_verification_document(uuid, public.review_status, text),
  public.correct_farm_zone(uuid, public.farm_zone, text)
  to authenticated;
revoke execute on function
  public.has_permission(text),
  public.my_permissions(),
  public.review_verification_document(uuid, public.review_status, text),
  public.correct_farm_zone(uuid, public.farm_zone, text),
  public.role_is_auto_approved(public.app_role)
  from public, anon;

-- Indexes for foreign keys on the new tables.
create index admin_role_permissions_permission_idx on public.admin_role_permissions (permission);
create index admin_role_permissions_created_by_idx on public.admin_role_permissions (created_by);
create index roles_updated_by_idx on public.roles (updated_by);
create index admin_actions_actor_idx on public.admin_actions (actor_id);
create index admin_actions_permission_idx on public.admin_actions (permission);
create index verification_documents_reviewed_by_idx on public.verification_documents (reviewed_by);
create index verification_documents_created_by_idx on public.verification_documents (created_by);
create index bank_accounts_created_by_idx on public.bank_accounts (created_by);
create index consents_created_by_idx on public.consents (created_by);
