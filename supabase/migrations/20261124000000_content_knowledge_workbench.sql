-- CultivaNode: Content & Knowledge workbench (/admin/content)
--
-- Makes the knowledge section of /admin/content work on real data. Forward-only; no existing data changed.
--
-- 1. Agronomic standards (extends 20261103120000):
--    - private.validate_standard_parameters(): checks stages, nutrient plan and protection notes, and refuses a
--      nutrient plan whose nitrogen total exceeds the standard's max_nitrogen_kg_ha.
--    - public.agronomy_update_standard_draft(): edit a draft (drafts only).
--    - public.agronomy_approve_standard(): in_review -> approved. The author can never approve their own standard
--      (no super-admin override, per ADR-021 in docs/architecture/batch-04).
--    - public.agronomy_return_standard(): in_review/approved -> draft with a recorded reason.
--    - public.agronomy_standard_history(): audit trail for one standard code, readable by standards staff
--      (audit_log itself needs audit.read).
-- 2. Agrochemical register (public.agrochemical_products): staff-only reference list.
--    draft -> pending_review -> approved (by a different person) -> withdrawn. Not readable by farmers and not used
--    by the AI assistant. Products whose active ingredient is on the banned list cannot be added or approved.
-- 3. Translation queue (public.content_translations): request -> translate -> review by a different person.
--
-- Every write goes through a SECURITY DEFINER function with SET search_path = '' that checks the caller's
-- permission inside the database and records an audit_log entry and an admin_actions entry.

------------------------------------------------------------------------------------------------
-- 1. Agronomic standards
------------------------------------------------------------------------------------------------
create or replace function private.validate_standard_parameters(p_parameters jsonb, p_max_n numeric)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_el      jsonb;
  v_start   integer;
  v_end     integer;
  v_rate    numeric;
  v_n       numeric;
  v_total_n numeric := 0;
begin
  if p_parameters is null or jsonb_typeof(p_parameters) <> 'object' then
    raise exception 'Standard parameters must be an object.' using errcode = '22023';
  end if;
  if pg_column_size(p_parameters) > 65536 then
    raise exception 'Standard parameters are too large.' using errcode = '22023';
  end if;

  if p_parameters ? 'stages' then
    if jsonb_typeof(p_parameters -> 'stages') <> 'array' then
      raise exception 'Stages must be a list of at most 20.' using errcode = '22023';
    end if;
    if jsonb_array_length(p_parameters -> 'stages') > 20 then
      raise exception 'Stages must be a list of at most 20.' using errcode = '22023';
    end if;
    for v_el in select value from jsonb_array_elements(p_parameters -> 'stages') loop
      if jsonb_typeof(v_el) <> 'object' or char_length(trim(coalesce(v_el ->> 'name', ''))) not between 1 and 120 then
        raise exception 'Each stage needs a name of up to 120 characters.' using errcode = '22023';
      end if;
      begin
        v_start := (v_el ->> 'start_day')::integer;
        v_end := (v_el ->> 'end_day')::integer;
      exception when others then
        raise exception 'Stage "%": start and end days must be whole numbers.', v_el ->> 'name' using errcode = '22023';
      end;
      if v_start is null or v_end is null or v_start < -60 or v_end > 730 or v_end < v_start then
        raise exception 'Stage "%": days must be between -60 and 730, and the end cannot be before the start.', v_el ->> 'name'
          using errcode = '22023';
      end if;
      if char_length(coalesce(v_el ->> 'description', '')) > 2000 then
        raise exception 'Stage "%": description is longer than 2,000 characters.', v_el ->> 'name' using errcode = '22023';
      end if;
    end loop;
  end if;

  if p_parameters ? 'nutrient_plan' then
    if jsonb_typeof(p_parameters -> 'nutrient_plan') <> 'array' then
      raise exception 'The nutrient plan must be a list of at most 12 applications.' using errcode = '22023';
    end if;
    if jsonb_array_length(p_parameters -> 'nutrient_plan') > 12 then
      raise exception 'The nutrient plan must be a list of at most 12 applications.' using errcode = '22023';
    end if;
    for v_el in select value from jsonb_array_elements(p_parameters -> 'nutrient_plan') loop
      if jsonb_typeof(v_el) <> 'object'
         or char_length(trim(coalesce(v_el ->> 'timing', ''))) not between 1 and 80
         or char_length(trim(coalesce(v_el ->> 'product', ''))) not between 1 and 120 then
        raise exception 'Each nutrient application needs a timing and a product.' using errcode = '22023';
      end if;
      begin
        v_rate := (v_el ->> 'rate_kg_ha')::numeric;
        v_n := coalesce((v_el ->> 'n_kg_ha')::numeric, 0);
      exception when others then
        raise exception 'Nutrient application "%": rates must be numbers.', v_el ->> 'product' using errcode = '22023';
      end;
      if v_rate is null or v_rate <= 0 or v_rate > 2000 or v_n < 0 or v_n > 500 then
        raise exception 'Nutrient application "%": product rate must be above 0 and at most 2,000 kg/ha; nitrogen between 0 and 500 kg/ha.',
          v_el ->> 'product' using errcode = '22023';
      end if;
      if char_length(coalesce(v_el ->> 'notes', '')) > 500 then
        raise exception 'Nutrient application "%": notes are longer than 500 characters.', v_el ->> 'product' using errcode = '22023';
      end if;
      v_total_n := v_total_n + v_n;
    end loop;
    if p_max_n is not null and v_total_n > p_max_n then
      raise exception 'The nutrient plan supplies % kg N/ha, above this standard''s maximum of % kg N/ha.', v_total_n, p_max_n
        using errcode = '22023';
    end if;
  end if;

  if p_parameters ? 'protection_notes' then
    if jsonb_typeof(p_parameters -> 'protection_notes') <> 'array' then
      raise exception 'Crop protection notes must be a list of at most 20.' using errcode = '22023';
    end if;
    if jsonb_array_length(p_parameters -> 'protection_notes') > 20 then
      raise exception 'Crop protection notes must be a list of at most 20.' using errcode = '22023';
    end if;
    for v_el in select value from jsonb_array_elements(p_parameters -> 'protection_notes') loop
      if jsonb_typeof(v_el) <> 'object'
         or char_length(trim(coalesce(v_el ->> 'title', ''))) not between 1 and 120
         or char_length(trim(coalesce(v_el ->> 'text', ''))) not between 1 and 2000 then
        raise exception 'Each crop protection note needs a title (up to 120 characters) and text (up to 2,000).' using errcode = '22023';
      end if;
    end loop;
  end if;
end;
$$;

alter function private.validate_standard_parameters(jsonb, numeric) owner to postgres;
revoke all on function private.validate_standard_parameters(jsonb, numeric) from public, anon, authenticated, service_role;

create or replace function public.agronomy_update_standard_draft(
  p_standard_id uuid,
  p_title text,
  p_description text,
  p_agro_zone text,
  p_source_authority text,
  p_parameters jsonb,
  p_mandated_operations text[],
  p_restricted_chemicals text[],
  p_max_nitrogen_kg_ha numeric
)
returns public.farm_agronomic_standards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_old public.farm_agronomic_standards;
  v_row public.farm_agronomic_standards;
begin
  if v_uid is null or not (public.has_permission('crops.manage') or public.has_permission('standards.publish')) then
    raise exception 'Permission denied: crops.manage or standards.publish required.' using errcode = '42501';
  end if;

  select * into v_old from public.farm_agronomic_standards where id = p_standard_id for update;
  if not found then
    raise exception 'Standard not found.' using errcode = 'P0002';
  end if;
  if v_old.status <> 'draft' then
    raise exception 'Only draft standards can be edited. Create a new version instead.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_title, ''))) not between 3 and 200 then
    raise exception 'The title must be 3 to 200 characters.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_description, '')) > 2000 then
    raise exception 'The description is longer than 2,000 characters.' using errcode = '22023';
  end if;
  if p_max_nitrogen_kg_ha is not null and (p_max_nitrogen_kg_ha < 0 or p_max_nitrogen_kg_ha > 500) then
    raise exception 'Maximum nitrogen must be between 0 and 500 kg N/ha.' using errcode = '22023';
  end if;
  if coalesce(array_length(p_mandated_operations, 1), 0) > 30 or coalesce(array_length(p_restricted_chemicals, 1), 0) > 50 then
    raise exception 'Too many operations or restricted chemicals.' using errcode = '22023';
  end if;

  perform private.validate_standard_parameters(coalesce(p_parameters, '{}'::jsonb), p_max_nitrogen_kg_ha);

  update public.farm_agronomic_standards
     set title = trim(p_title),
         description = nullif(trim(coalesce(p_description, '')), ''),
         agro_zone = coalesce(nullif(trim(coalesce(p_agro_zone, '')), ''), 'all'),
         source_authority = coalesce(nullif(trim(coalesce(p_source_authority, '')), ''), source_authority),
         parameters = coalesce(p_parameters, '{}'::jsonb),
         mandated_operations = (
           select coalesce(array_agg(trim(o)) filter (where trim(o) <> ''), '{}')
             from unnest(coalesce(p_mandated_operations, '{}'::text[])) o
         ),
         restricted_chemicals = (
           select coalesce(array_agg(distinct lower(trim(c))) filter (where trim(c) <> ''), '{}')
             from unnest(coalesce(p_restricted_chemicals, '{}'::text[])) c
         ),
         max_nitrogen_kg_ha = p_max_nitrogen_kg_ha
   where id = p_standard_id
  returning * into v_row;

  perform public.write_audit(
    'agronomy_standard_draft_updated', 'farm_agronomic_standards', v_row.id,
    jsonb_build_object('code', v_row.standard_code, 'version', v_row.version),
    jsonb_build_object('title', v_old.title, 'max_nitrogen_kg_ha', v_old.max_nitrogen_kg_ha, 'parameters', v_old.parameters),
    jsonb_build_object('title', v_row.title, 'max_nitrogen_kg_ha', v_row.max_nitrogen_kg_ha, 'parameters', v_row.parameters)
  );
  perform private.record_admin_action('crops.manage', 'standard_draft_updated', 'farm_agronomic_standards', v_row.id, null);
  return v_row;
end;
$$;

create or replace function public.agronomy_approve_standard(p_standard_id uuid, p_notes text default null)
returns public.farm_agronomic_standards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.farm_agronomic_standards;
begin
  if v_uid is null or not public.has_permission('standards.publish') then
    raise exception 'Permission denied: standards.publish required.' using errcode = '42501';
  end if;

  select * into v_row from public.farm_agronomic_standards where id = p_standard_id for update;
  if not found then
    raise exception 'Standard not found.' using errcode = 'P0002';
  end if;
  if v_row.status <> 'in_review' then
    raise exception 'Only standards in review can be approved.' using errcode = '22023';
  end if;
  -- Four-eyes without override: the author never approves their own standard.
  if v_row.author_id = v_uid then
    raise exception 'You wrote this standard. A different reviewer must approve it.' using errcode = '42501';
  end if;

  update public.farm_agronomic_standards
     set status = 'approved',
         reviewer_id = v_uid,
         change_notes = coalesce(nullif(trim(coalesce(p_notes, '')), ''), change_notes)
   where id = p_standard_id
  returning * into v_row;

  perform public.write_audit('agronomy_standard_approved', 'farm_agronomic_standards', v_row.id,
    jsonb_build_object('code', v_row.standard_code, 'version', v_row.version));
  perform private.record_admin_action('standards.publish', 'standard_approved', 'farm_agronomic_standards', v_row.id, p_notes);
  return v_row;
end;
$$;

create or replace function public.agronomy_return_standard(p_standard_id uuid, p_reason text)
returns public.farm_agronomic_standards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.farm_agronomic_standards;
begin
  if v_uid is null or not public.has_permission('standards.publish') then
    raise exception 'Permission denied: standards.publish required.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) not between 10 and 1000 then
    raise exception 'Give a reason of 10 to 1,000 characters so the author knows what to change.' using errcode = '22023';
  end if;

  select * into v_row from public.farm_agronomic_standards where id = p_standard_id for update;
  if not found then
    raise exception 'Standard not found.' using errcode = 'P0002';
  end if;
  if v_row.status not in ('in_review', 'approved') then
    raise exception 'Only standards in review or approved can be returned for revision.' using errcode = '22023';
  end if;

  update public.farm_agronomic_standards
     set status = 'draft',
         reviewer_id = v_uid,
         change_notes = 'Returned for revision: ' || trim(p_reason)
   where id = p_standard_id
  returning * into v_row;

  perform public.write_audit('agronomy_standard_returned', 'farm_agronomic_standards', v_row.id,
    jsonb_build_object('code', v_row.standard_code, 'version', v_row.version, 'reason', trim(p_reason)));
  perform private.record_admin_action('standards.publish', 'standard_returned', 'farm_agronomic_standards', v_row.id, trim(p_reason));
  return v_row;
end;
$$;

create or replace function public.agronomy_standard_history(p_standard_code text)
returns table (
  happened_at timestamptz,
  action text,
  actor_name text,
  standard_id uuid,
  version text,
  details jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not (public.has_permission('crops.manage') or public.has_permission('standards.publish')) then
    raise exception 'Permission denied: crops.manage or standards.publish required.' using errcode = '42501';
  end if;

  return query
  select a.created_at, a.action, coalesce(p.full_name, 'Staff member'), s.id, s.version, coalesce(a.metadata, '{}'::jsonb)
    from public.audit_log a
    join public.farm_agronomic_standards s on s.id = a.entity_id
    left join public.profiles p on p.id = a.actor_id
   where a.entity = 'farm_agronomic_standards'
     and s.standard_code = trim(p_standard_code)
   order by a.created_at desc
   limit 200;
end;
$$;

------------------------------------------------------------------------------------------------
-- 2. Agrochemical register
------------------------------------------------------------------------------------------------
create table if not exists public.agrochemical_products (
  id                 uuid primary key default gen_random_uuid(),
  trade_name         text not null check (char_length(trim(trade_name)) between 2 and 120),
  product_category   text not null check (product_category in (
                       'herbicide', 'insecticide', 'fungicide', 'nematicide', 'rodenticide', 'fertiliser', 'biostimulant', 'other')),
  formulation        text check (formulation is null or char_length(formulation) <= 40),
  active_ingredients text not null check (char_length(trim(active_ingredients)) between 2 and 300),
  manufacturer       text check (manufacturer is null or char_length(manufacturer) <= 160),
  nafdac_reg_no      text check (nafdac_reg_no is null or nafdac_reg_no ~ '^[A-Za-z0-9/. -]{3,40}$'),
  label_rate_value   numeric check (label_rate_value is null or (label_rate_value > 0 and label_rate_value <= 10000)),
  label_rate_unit    text check (label_rate_unit is null or label_rate_unit in ('L/ha', 'ml/ha', 'kg/ha', 'g/ha', 'ml/16L', 'g/16L')),
  rei_hours          integer check (rei_hours is null or rei_hours between 0 and 720),
  phi_days           integer check (phi_days is null or phi_days between 0 and 365),
  who_hazard_class   text check (who_hazard_class is null or who_hazard_class in ('Ia', 'Ib', 'II', 'III', 'U', 'not_classified')),
  target_crops       text[] not null default '{}',
  target_pests       text[] not null default '{}',
  label_source       text not null check (char_length(trim(label_source)) between 3 and 500),
  status             text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'withdrawn')),
  created_by         uuid references public.profiles (id) on delete set null,
  submitted_at       timestamptz,
  reviewed_by        uuid references public.profiles (id) on delete set null,
  reviewed_at        timestamptz,
  review_notes       text check (review_notes is null or char_length(review_notes) <= 1000),
  withdrawn_reason   text check (withdrawn_reason is null or char_length(withdrawn_reason) <= 1000),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint agrochemical_rate_pair_check check ((label_rate_value is null) = (label_rate_unit is null))
);

create unique index if not exists agrochemical_products_nafdac_live_uidx
  on public.agrochemical_products (upper(nafdac_reg_no))
  where nafdac_reg_no is not null and status <> 'withdrawn';
create index if not exists agrochemical_products_status_idx on public.agrochemical_products (status, trade_name);
create index if not exists agrochemical_products_created_by_idx on public.agrochemical_products (created_by);
create index if not exists agrochemical_products_reviewed_by_idx on public.agrochemical_products (reviewed_by);

drop trigger if exists agrochemical_products_updated_at on public.agrochemical_products;
create trigger agrochemical_products_updated_at before update on public.agrochemical_products
  for each row execute function public.set_updated_at();

alter table public.agrochemical_products owner to postgres;
alter table public.agrochemical_products enable row level security;
alter table public.agrochemical_products force row level security;
revoke all on table public.agrochemical_products from public, anon, authenticated, service_role;
grant select on table public.agrochemical_products to authenticated;

drop policy if exists agrochemical_products_staff_read on public.agrochemical_products;
create policy agrochemical_products_staff_read on public.agrochemical_products
  for select to authenticated
  using ((select public.has_permission('crops.manage')) or (select public.has_permission('standards.publish')));

-- Mirrors BANNED_CHEMICAL_NAMES in packages/shared/src/engines/ai-assistant/chemical-guardrail.ts.
create or replace function private.agrochemical_banned_match(p_active_ingredients text)
returns text
language sql
immutable
set search_path = ''
as $$
  select b
    from unnest(array['paraquat', 'carbofuran', 'ddt', 'endosulfan', 'lindane', 'monocrotophos', 'aldrin']) b
   where lower(coalesce(p_active_ingredients, '')) like '%' || b || '%'
   limit 1;
$$;

alter function private.agrochemical_banned_match(text) owner to postgres;
revoke all on function private.agrochemical_banned_match(text) from public, anon, authenticated, service_role;

create or replace function public.agrochemical_save_draft(
  p_id uuid,
  p_trade_name text,
  p_product_category text,
  p_formulation text,
  p_active_ingredients text,
  p_manufacturer text,
  p_nafdac_reg_no text,
  p_label_rate_value numeric,
  p_label_rate_unit text,
  p_rei_hours integer,
  p_phi_days integer,
  p_who_hazard_class text,
  p_target_crops text[],
  p_target_pests text[],
  p_label_source text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_banned text;
  v_id uuid;
  v_status text;
begin
  if v_uid is null or not (public.has_permission('crops.manage') or public.has_permission('standards.publish')) then
    raise exception 'Permission denied: crops.manage or standards.publish required.' using errcode = '42501';
  end if;

  v_banned := private.agrochemical_banned_match(p_active_ingredients);
  if v_banned is not null then
    raise exception 'The active ingredient "%" is on CultivaNode''s banned list and cannot be added.', v_banned using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_trade_name, ''))) not between 2 and 120 then
    raise exception 'Trade name must be 2 to 120 characters.' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_label_source, ''))) not between 3 and 500 then
    raise exception 'Say where the details come from (for example the product label or the NAFDAC register).' using errcode = '22023';
  end if;
  if (p_label_rate_value is null) <> (nullif(trim(coalesce(p_label_rate_unit, '')), '') is null) then
    raise exception 'Give both a label rate and its unit, or neither.' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.agrochemical_products (
      trade_name, product_category, formulation, active_ingredients, manufacturer, nafdac_reg_no,
      label_rate_value, label_rate_unit, rei_hours, phi_days, who_hazard_class, target_crops, target_pests,
      label_source, status, created_by
    ) values (
      trim(p_trade_name), p_product_category, nullif(trim(coalesce(p_formulation, '')), ''), trim(p_active_ingredients),
      nullif(trim(coalesce(p_manufacturer, '')), ''), nullif(upper(trim(coalesce(p_nafdac_reg_no, ''))), ''),
      p_label_rate_value, nullif(trim(coalesce(p_label_rate_unit, '')), ''), p_rei_hours, p_phi_days, p_who_hazard_class,
      coalesce(p_target_crops, '{}'), coalesce(p_target_pests, '{}'), trim(p_label_source), 'draft', v_uid
    )
    returning id into v_id;
    perform public.write_audit('agrochemical_draft_created', 'agrochemical_products', v_id, jsonb_build_object('trade_name', trim(p_trade_name)));
    perform private.record_admin_action('crops.manage', 'agrochemical_draft_created', 'agrochemical_products', v_id, null);
  else
    select status into v_status from public.agrochemical_products where id = p_id for update;
    if not found then
      raise exception 'Product not found.' using errcode = 'P0002';
    end if;
    if v_status <> 'draft' then
      raise exception 'Only drafts can be edited.' using errcode = '22023';
    end if;
    update public.agrochemical_products
       set trade_name = trim(p_trade_name),
           product_category = p_product_category,
           formulation = nullif(trim(coalesce(p_formulation, '')), ''),
           active_ingredients = trim(p_active_ingredients),
           manufacturer = nullif(trim(coalesce(p_manufacturer, '')), ''),
           nafdac_reg_no = nullif(upper(trim(coalesce(p_nafdac_reg_no, ''))), ''),
           label_rate_value = p_label_rate_value,
           label_rate_unit = nullif(trim(coalesce(p_label_rate_unit, '')), ''),
           rei_hours = p_rei_hours,
           phi_days = p_phi_days,
           who_hazard_class = p_who_hazard_class,
           target_crops = coalesce(p_target_crops, '{}'),
           target_pests = coalesce(p_target_pests, '{}'),
           label_source = trim(p_label_source)
     where id = p_id;
    v_id := p_id;
    perform public.write_audit('agrochemical_draft_updated', 'agrochemical_products', v_id, jsonb_build_object('trade_name', trim(p_trade_name)));
    perform private.record_admin_action('crops.manage', 'agrochemical_draft_updated', 'agrochemical_products', v_id, null);
  end if;
  return v_id;
exception
  when unique_violation then
    raise exception 'Another active product already uses this NAFDAC registration number.' using errcode = '22023';
  when check_violation then
    raise exception 'One of the values is outside the allowed range or format.' using errcode = '22023';
end;
$$;

create or replace function public.agrochemical_submit_for_review(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if auth.uid() is null or not (public.has_permission('crops.manage') or public.has_permission('standards.publish')) then
    raise exception 'Permission denied: crops.manage or standards.publish required.' using errcode = '42501';
  end if;
  select status into v_status from public.agrochemical_products where id = p_id for update;
  if not found then
    raise exception 'Product not found.' using errcode = 'P0002';
  end if;
  if v_status <> 'draft' then
    raise exception 'Only drafts can be submitted for review.' using errcode = '22023';
  end if;
  update public.agrochemical_products set status = 'pending_review', submitted_at = now(), review_notes = null where id = p_id;
  perform public.write_audit('agrochemical_submitted', 'agrochemical_products', p_id);
  perform private.record_admin_action('crops.manage', 'agrochemical_submitted', 'agrochemical_products', p_id, null);
end;
$$;

create or replace function public.agrochemical_review(p_id uuid, p_approve boolean, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.agrochemical_products;
  v_banned text;
begin
  if v_uid is null or not public.has_permission('standards.publish') then
    raise exception 'Permission denied: standards.publish required.' using errcode = '42501';
  end if;
  select * into v_row from public.agrochemical_products where id = p_id for update;
  if not found then
    raise exception 'Product not found.' using errcode = 'P0002';
  end if;
  if v_row.status <> 'pending_review' then
    raise exception 'Only products waiting for review can be reviewed.' using errcode = '22023';
  end if;
  if v_row.created_by = v_uid then
    raise exception 'You added this product. A different reviewer must check it.' using errcode = '42501';
  end if;

  if coalesce(p_approve, false) then
    v_banned := private.agrochemical_banned_match(v_row.active_ingredients);
    if v_banned is not null then
      raise exception 'The active ingredient "%" is on CultivaNode''s banned list.', v_banned using errcode = '22023';
    end if;
    update public.agrochemical_products
       set status = 'approved', reviewed_by = v_uid, reviewed_at = now(), review_notes = nullif(trim(coalesce(p_notes, '')), '')
     where id = p_id;
    perform public.write_audit('agrochemical_approved', 'agrochemical_products', p_id, jsonb_build_object('trade_name', v_row.trade_name));
    perform private.record_admin_action('standards.publish', 'agrochemical_approved', 'agrochemical_products', p_id, p_notes);
  else
    if char_length(trim(coalesce(p_notes, ''))) not between 10 and 1000 then
      raise exception 'Give a reason of 10 to 1,000 characters so the author knows what to fix.' using errcode = '22023';
    end if;
    update public.agrochemical_products
       set status = 'draft', reviewed_by = v_uid, reviewed_at = now(), review_notes = trim(p_notes)
     where id = p_id;
    perform public.write_audit('agrochemical_returned', 'agrochemical_products', p_id, jsonb_build_object('reason', trim(p_notes)));
    perform private.record_admin_action('standards.publish', 'agrochemical_returned', 'agrochemical_products', p_id, trim(p_notes));
  end if;
end;
$$;

create or replace function public.agrochemical_withdraw(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if auth.uid() is null or not public.has_permission('standards.publish') then
    raise exception 'Permission denied: standards.publish required.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) not between 10 and 1000 then
    raise exception 'Give a reason of 10 to 1,000 characters.' using errcode = '22023';
  end if;
  select status into v_status from public.agrochemical_products where id = p_id for update;
  if not found then
    raise exception 'Product not found.' using errcode = 'P0002';
  end if;
  if v_status <> 'approved' then
    raise exception 'Only approved products can be withdrawn.' using errcode = '22023';
  end if;
  update public.agrochemical_products set status = 'withdrawn', withdrawn_reason = trim(p_reason) where id = p_id;
  perform public.write_audit('agrochemical_withdrawn', 'agrochemical_products', p_id, jsonb_build_object('reason', trim(p_reason)));
  perform private.record_admin_action('standards.publish', 'agrochemical_withdrawn', 'agrochemical_products', p_id, trim(p_reason));
end;
$$;

------------------------------------------------------------------------------------------------
-- 3. Translation queue
------------------------------------------------------------------------------------------------
create table if not exists public.content_translations (
  id              uuid primary key default gen_random_uuid(),
  source_key      text not null check (source_key ~ '^[a-z0-9_.:-]{3,200}$'),
  source_text     text not null check (char_length(trim(source_text)) between 1 and 2000),
  domain          text not null default 'general' check (domain in ('pest', 'fertility', 'safety', 'weather', 'standard', 'general')),
  target_lang     text not null check (target_lang in ('yo', 'ha', 'ig', 'pcm')),
  translated_text text check (translated_text is null or char_length(translated_text) between 1 and 2000),
  status          text not null default 'pending' check (status in ('pending', 'submitted', 'approved', 'rejected')),
  requested_by    uuid references public.profiles (id) on delete set null,
  translated_by   uuid references public.profiles (id) on delete set null,
  translated_at   timestamptz,
  reviewed_by     uuid references public.profiles (id) on delete set null,
  reviewed_at     timestamptz,
  review_notes    text check (review_notes is null or char_length(review_notes) <= 1000),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (source_key, target_lang)
);

create index if not exists content_translations_status_idx on public.content_translations (status, target_lang);
create index if not exists content_translations_requested_by_idx on public.content_translations (requested_by);
create index if not exists content_translations_translated_by_idx on public.content_translations (translated_by);
create index if not exists content_translations_reviewed_by_idx on public.content_translations (reviewed_by);

drop trigger if exists content_translations_updated_at on public.content_translations;
create trigger content_translations_updated_at before update on public.content_translations
  for each row execute function public.set_updated_at();

alter table public.content_translations owner to postgres;
alter table public.content_translations enable row level security;
alter table public.content_translations force row level security;
revoke all on table public.content_translations from public, anon, authenticated, service_role;
grant select on table public.content_translations to authenticated;

drop policy if exists content_translations_staff_read on public.content_translations;
create policy content_translations_staff_read on public.content_translations
  for select to authenticated
  using (
    (select public.has_permission('knowledge.manage'))
    or (select public.has_permission('crops.manage'))
    or (select public.has_permission('standards.publish'))
  );

create or replace function public.content_translation_request(
  p_source_key text,
  p_source_text text,
  p_domain text,
  p_target_lang text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null or not public.has_permission('knowledge.manage') then
    raise exception 'Permission denied: knowledge.manage required.' using errcode = '42501';
  end if;
  if coalesce(p_source_key, '') !~ '^[a-z0-9_.:-]{3,200}$' then
    raise exception 'The key may use lower-case letters, numbers and . _ : - only (3 to 200 characters).' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_source_text, ''))) not between 1 and 2000 then
    raise exception 'The English text must be 1 to 2,000 characters.' using errcode = '22023';
  end if;
  if coalesce(p_target_lang, '') not in ('yo', 'ha', 'ig', 'pcm') then
    raise exception 'Choose Yoruba, Hausa, Igbo or Pidgin.' using errcode = '22023';
  end if;
  if coalesce(p_domain, '') not in ('pest', 'fertility', 'safety', 'weather', 'standard', 'general') then
    raise exception 'Unknown topic.' using errcode = '22023';
  end if;

  insert into public.content_translations (source_key, source_text, domain, target_lang, requested_by)
  values (p_source_key, trim(p_source_text), p_domain, p_target_lang, v_uid)
  on conflict (source_key, target_lang) do update
     set source_text = excluded.source_text,
         domain = excluded.domain,
         -- A changed English source invalidates the old translation.
         status = case when public.content_translations.source_text <> excluded.source_text then 'pending' else public.content_translations.status end,
         translated_text = case when public.content_translations.source_text <> excluded.source_text then null else public.content_translations.translated_text end,
         reviewed_by = case when public.content_translations.source_text <> excluded.source_text then null else public.content_translations.reviewed_by end,
         reviewed_at = case when public.content_translations.source_text <> excluded.source_text then null else public.content_translations.reviewed_at end
  returning id into v_id;

  perform public.write_audit('translation_requested', 'content_translations', v_id,
    jsonb_build_object('key', p_source_key, 'lang', p_target_lang));
  return v_id;
end;
$$;

create or replace function public.content_translation_submit(p_id uuid, p_text text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
begin
  if v_uid is null or not public.has_permission('knowledge.manage') then
    raise exception 'Permission denied: knowledge.manage required.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_text, ''))) not between 1 and 2000 then
    raise exception 'The translation must be 1 to 2,000 characters.' using errcode = '22023';
  end if;
  select status into v_status from public.content_translations where id = p_id for update;
  if not found then
    raise exception 'Translation not found.' using errcode = 'P0002';
  end if;
  if v_status = 'approved' then
    raise exception 'This translation is already approved. Change the English source to reopen it.' using errcode = '22023';
  end if;
  update public.content_translations
     set translated_text = trim(p_text), translated_by = v_uid, translated_at = now(), status = 'submitted',
         reviewed_by = null, reviewed_at = null
   where id = p_id;
  perform public.write_audit('translation_submitted', 'content_translations', p_id);
end;
$$;

create or replace function public.content_translation_review(p_id uuid, p_approve boolean, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.content_translations;
begin
  if v_uid is null or not public.has_permission('knowledge.manage') then
    raise exception 'Permission denied: knowledge.manage required.' using errcode = '42501';
  end if;
  select * into v_row from public.content_translations where id = p_id for update;
  if not found then
    raise exception 'Translation not found.' using errcode = 'P0002';
  end if;
  if v_row.status <> 'submitted' then
    raise exception 'Only submitted translations can be reviewed.' using errcode = '22023';
  end if;
  if v_row.translated_by = v_uid then
    raise exception 'You wrote this translation. A different reviewer must check it.' using errcode = '42501';
  end if;
  if not coalesce(p_approve, false) and char_length(trim(coalesce(p_notes, ''))) not between 5 and 1000 then
    raise exception 'Say what needs changing (5 to 1,000 characters).' using errcode = '22023';
  end if;

  update public.content_translations
     set status = case when coalesce(p_approve, false) then 'approved' else 'rejected' end,
         reviewed_by = v_uid, reviewed_at = now(), review_notes = nullif(trim(coalesce(p_notes, '')), '')
   where id = p_id;
  perform public.write_audit(case when coalesce(p_approve, false) then 'translation_approved' else 'translation_rejected' end,
    'content_translations', p_id);
end;
$$;

------------------------------------------------------------------------------------------------
-- 4. Ownership and grants
------------------------------------------------------------------------------------------------
do $$
declare
  v_sig text;
begin
  foreach v_sig in array array[
    'public.agronomy_update_standard_draft(uuid, text, text, text, text, jsonb, text[], text[], numeric)',
    'public.agronomy_approve_standard(uuid, text)',
    'public.agronomy_return_standard(uuid, text)',
    'public.agronomy_standard_history(text)',
    'public.agrochemical_save_draft(uuid, text, text, text, text, text, text, numeric, text, integer, integer, text, text[], text[], text)',
    'public.agrochemical_submit_for_review(uuid)',
    'public.agrochemical_review(uuid, boolean, text)',
    'public.agrochemical_withdraw(uuid, text)',
    'public.content_translation_request(text, text, text, text)',
    'public.content_translation_submit(uuid, text)',
    'public.content_translation_review(uuid, boolean, text)'
  ] loop
    execute format('alter function %s owner to postgres', v_sig);
    execute format('revoke all on function %s from public, anon, service_role', v_sig);
    execute format('grant execute on function %s to authenticated', v_sig);
  end loop;
end $$;
