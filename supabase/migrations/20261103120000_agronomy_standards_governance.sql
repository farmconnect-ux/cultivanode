-- CultivaNode: Agronomic Content Governance & Standards Versioning
--
-- Implements Phase B of the Agronomy Content Master Plan:
-- 1. Status enum: draft -> in_review -> approved -> published -> superseded -> retired
-- 2. Extends public.farm_agronomic_standards with governance columns:
--    status, created_by, reviewer_id, approved_by, approved_at, published_at,
--    effective_from, effective_to, supersedes_id, change_notes, source_reference.
-- 3. Four-eyes governance with Super Admin override switch:
--    Option A & B built-in: enforces four-eyes (reviewer <> author) unless caller is super_admin.
-- 4. Publication, Draft creation, Review submission, and Immutability triggers.
-- 5. RLS: public/farmers only see 'published' records; staff with 'standards.publish' see all.

------------------------------------------------------------------------------------------------
-- 1. Types & Status
------------------------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'agronomy_content_status') then
    create type public.agronomy_content_status as enum (
      'draft', 'in_review', 'approved', 'published', 'superseded', 'retired'
    );
  end if;
end $$;

------------------------------------------------------------------------------------------------
-- 2. Schema Extensions on farm_agronomic_standards
------------------------------------------------------------------------------------------------
alter table public.farm_agronomic_standards
  add column if not exists status public.agronomy_content_status not null default 'draft',
  add column if not exists author_id uuid references public.profiles(id) on delete set null,
  add column if not exists reviewer_id uuid references public.profiles(id) on delete set null,
  add column if not exists approved_by_id uuid references public.profiles(id) on delete set null,
  add column if not exists approved_by_name text,
  add column if not exists approved_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists effective_from date,
  add column if not exists effective_to date,
  add column if not exists supersedes_id uuid references public.farm_agronomic_standards(id) on delete set null,
  add column if not exists change_notes text,
  add column if not exists external_partner_reference text,
  add column if not exists mandated_operations text[] not null default '{}',
  add column if not exists restricted_chemicals text[] not null default '{}',
  add column if not exists max_nitrogen_kg_ha numeric(8,2);

-- Update existing seeded standards to 'published' so live cycles continue smoothly
update public.farm_agronomic_standards
   set status = 'published',
       published_at = coalesce(created_at, now()),
       effective_from = coalesce(created_at::date, current_date)
 where status = 'draft';

create index if not exists farm_standards_status_idx
  on public.farm_agronomic_standards (status, crop_or_livestock_id, agro_zone);

------------------------------------------------------------------------------------------------
-- 3. Strict Immutability Trigger for Published / Superseded Standards
------------------------------------------------------------------------------------------------
create or replace function private.forbid_published_standard_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- If record was already published/superseded/retired, only status transition or retirement is permitted
  if old.status in ('published', 'superseded', 'retired') then
    if new.id <> old.id or
       new.standard_code <> old.standard_code or
       new.crop_or_livestock_id <> old.crop_or_livestock_id or
       new.version <> old.version or
       new.title <> old.title or
       new.parameters <> old.parameters or
       new.mandated_operations <> old.mandated_operations or
       new.restricted_chemicals <> old.restricted_chemicals then
      raise exception 'Published agronomic standards are immutable. Create a new version draft instead.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists farm_standards_immutability on public.farm_agronomic_standards;
create trigger farm_standards_immutability
  before update on public.farm_agronomic_standards
  for each row execute function private.forbid_published_standard_mutation();

------------------------------------------------------------------------------------------------
-- 4. Governance & Publishing RPCs (With Super Admin Single-Signer Mode Built-in)
------------------------------------------------------------------------------------------------

-- Helper: Check if caller is super_admin
create or replace function private.is_super_admin(p_uid uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_roles
     where profile_id = p_uid and admin_role = 'super_admin'
  );
$$;

-- Create draft (either new or cloned from an existing standard for a new version)
create or replace function public.agronomy_create_standard_draft(
  p_standard_code text,
  p_crop_or_livestock_id text,
  p_agro_zone text,
  p_version text,
  p_title text,
  p_description text default null,
  p_parameters jsonb default '{}'::jsonb,
  p_mandated_operations text[] default '{}',
  p_restricted_chemicals text[] default '{}',
  p_max_nitrogen_kg_ha numeric default null,
  p_source_authority text default 'IITA_NIHORT_GAP',
  p_supersedes_id uuid default null
)
returns public.farm_agronomic_standards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.farm_agronomic_standards;
begin
  if not (public.has_permission('standards.publish') or public.has_permission('crops.manage')) then
    raise exception 'Permission denied: crops.manage or standards.publish required.'
      using errcode = '42501';
  end if;

  if trim(coalesce(p_standard_code, '')) = '' or trim(coalesce(p_version, '')) = '' then
    raise exception 'Standard code and version are required.' using errcode = '22023';
  end if;

  insert into public.farm_agronomic_standards (
    standard_code, crop_or_livestock_id, agro_zone, version,
    title, description, source_authority, is_active, parameters,
    status, author_id, supersedes_id,
    mandated_operations, restricted_chemicals, max_nitrogen_kg_ha,
    created_at
  )
  values (
    trim(p_standard_code), trim(p_crop_or_livestock_id), coalesce(nullif(trim(p_agro_zone), ''), 'all'),
    trim(p_version), trim(p_title), trim(p_description), trim(p_source_authority),
    false, p_parameters, 'draft', v_uid, p_supersedes_id,
    p_mandated_operations, p_restricted_chemicals, p_max_nitrogen_kg_ha,
    now()
  )
  returning * into v_row;

  perform public.write_audit(
    'agronomy_standard_draft_created', 'farm_agronomic_standards', v_row.id,
    jsonb_build_object('code', v_row.standard_code, 'version', v_row.version, 'crop', v_row.crop_or_livestock_id)
  );
  perform private.record_admin_action('standards.publish', 'standard_draft_created', 'farm_agronomic_standards', v_row.id);

  return v_row;
end;
$$;

-- Submit standard for review
create or replace function public.agronomy_submit_standard_for_review(
  p_standard_id uuid,
  p_notes text default null
)
returns public.farm_agronomic_standards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.farm_agronomic_standards;
begin
  if not (public.has_permission('standards.publish') or public.has_permission('crops.manage')) then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  select * into v_row from public.farm_agronomic_standards where id = p_standard_id for update;
  if not found then
    raise exception 'Standard not found.' using errcode = 'P0002';
  end if;

  if v_row.status <> 'draft' then
    raise exception 'Only draft standards can be submitted for review.' using errcode = '22023';
  end if;

  update public.farm_agronomic_standards
     set status = 'in_review',
         change_notes = coalesce(p_notes, change_notes)
   where id = p_standard_id
  returning * into v_row;

  perform public.write_audit('agronomy_standard_submitted_review', 'farm_agronomic_standards', v_row.id);
  perform private.record_admin_action('standards.publish', 'standard_submitted_review', 'farm_agronomic_standards', v_row.id, p_notes);

  return v_row;
end;
$$;

-- Approve and publish standard
-- Enforces Option A (peer reviewer <> author) unless caller is Super Admin (Option A/B hybrid for pilot)
create or replace function public.agronomy_publish_standard(
  p_standard_id uuid,
  p_approver_title text default null,
  p_partner_reference text default null,
  p_notes text default null
)
returns public.farm_agronomic_standards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_super boolean;
  v_row public.farm_agronomic_standards;
  v_approver_name text;
begin
  if not public.has_permission('standards.publish') then
    raise exception 'Permission denied: standards.publish required.' using errcode = '42501';
  end if;

  select * into v_row from public.farm_agronomic_standards where id = p_standard_id for update;
  if not found then
    raise exception 'Standard not found.' using errcode = 'P0002';
  end if;

  if v_row.status in ('published', 'superseded', 'retired') then
    raise exception 'Standard is already %.', v_row.status using errcode = '22023';
  end if;

  v_is_super := private.is_super_admin(v_uid);

  -- Option A Four-Eyes Rule: Author cannot self-approve unless caller is Super Admin
  if v_row.author_id = v_uid and not v_is_super then
    raise exception 'Four-eyes approval required: author cannot approve their own standard without Super Admin override.'
      using errcode = '42501';
  end if;

  select full_name into v_approver_name from public.profiles where id = v_uid;
  v_approver_name := coalesce(p_approver_title, v_approver_name, 'Agronomy Reviewer');

  -- If this standard supersedes a previous active version, retire/supersede the old one
  if v_row.supersedes_id is not null then
    update public.farm_agronomic_standards
       set status = 'superseded',
           is_active = false,
           effective_to = current_date
     where id = v_row.supersedes_id;
  end if;

  -- Also supersede any older published version with same code & zone
  update public.farm_agronomic_standards
     set status = 'superseded',
         is_active = false,
         effective_to = current_date
   where standard_code = v_row.standard_code
     and agro_zone = v_row.agro_zone
     and id <> v_row.id
     and status = 'published';

  -- Publish this standard
  update public.farm_agronomic_standards
     set status = 'published',
         is_active = true,
         approved_by_id = v_uid,
         approved_by_name = v_approver_name,
         approved_at = now(),
         published_at = now(),
         effective_from = coalesce(effective_from, current_date),
         external_partner_reference = coalesce(p_partner_reference, external_partner_reference),
         change_notes = coalesce(p_notes, change_notes)
   where id = p_standard_id
  returning * into v_row;

  perform public.write_audit(
    'agronomy_standard_published', 'farm_agronomic_standards', v_row.id,
    jsonb_build_object(
      'code', v_row.standard_code, 'version', v_row.version,
      'approver', v_approver_name, 'is_super_admin_override', v_is_super
    )
  );
  perform private.record_admin_action('standards.publish', 'standard_published', 'farm_agronomic_standards', v_row.id, p_notes);

  return v_row;
end;
$$;

------------------------------------------------------------------------------------------------
-- 5. Row Level Security Policies
------------------------------------------------------------------------------------------------
drop policy if exists farm_standards_read on public.farm_agronomic_standards;
drop policy if exists farm_standards_manage on public.farm_agronomic_standards;

-- General users only see published & active standards
create policy farm_standards_read on public.farm_agronomic_standards
  for select to authenticated
  using (status = 'published' or (select public.has_permission('standards.publish')));

-- Staff with standards.publish can insert/update/manage drafts
create policy farm_standards_manage on public.farm_agronomic_standards
  for all to authenticated
  using ((select public.has_permission('standards.publish')))
  with check ((select public.has_permission('standards.publish')));

------------------------------------------------------------------------------------------------
-- 6. Function Grants
------------------------------------------------------------------------------------------------
revoke execute on function
  public.agronomy_create_standard_draft(text, text, text, text, text, text, jsonb, text[], text[], numeric, text, uuid),
  public.agronomy_submit_standard_for_review(uuid, text),
  public.agronomy_publish_standard(uuid, text, text, text)
  from public, anon;

grant execute on function
  public.agronomy_create_standard_draft(text, text, text, text, text, text, jsonb, text[], text[], numeric, text, uuid),
  public.agronomy_submit_standard_for_review(uuid, text),
  public.agronomy_publish_standard(uuid, text, text, text)
  to authenticated;
