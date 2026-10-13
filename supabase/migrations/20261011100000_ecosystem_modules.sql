-- CultivaNode: ecosystem modules behind the redesigned hubs.
--
--   Farm:        irrigation zones and events, machinery telemetry
--   Trade:       off-take contracts and deliveries, processing batches, market prices
--   People:      message threads, support tickets
--   Finance:     loan applications, insurance policies and claims, grants, investment offerings
--   Impact:      NGO programmes and beneficiaries, research trials, cooperative aggregation
--   Demo data:   profiles.is_demo and marketplace_sellers.is_demo mark sample records, and
--                private.purge_demo_data() removes every demo account and what it owns.
--
-- Every table has RLS. Money is in kobo. Owners act on their own rows; staff read through
-- has_permission(); public catalogues (open grants, open offerings, prices) are readable by
-- signed-in users.

------------------------------------------------------------------------------------------------
-- 0. Demo flags
------------------------------------------------------------------------------------------------
alter table public.profiles add column if not exists is_demo boolean not null default false;
alter table public.marketplace_sellers add column if not exists is_demo boolean not null default false;
comment on column public.profiles.is_demo is 'Sample account created by supabase/seed_demo.sql. Removed by private.purge_demo_data().';

------------------------------------------------------------------------------------------------
-- 1. Irrigation
------------------------------------------------------------------------------------------------
create table if not exists public.irrigation_zones (
  id                     uuid primary key default gen_random_uuid(),
  farm_id                uuid not null references public.farms (id) on delete cascade,
  plot_id                uuid references public.plots (id) on delete set null,
  name                   text not null check (char_length(name) between 2 and 80),
  method                 text not null check (method in ('drip','sprinkler','furrow','centre_pivot','manual')),
  water_source           text check (water_source in ('borehole','river','dam','rainwater_tank','municipal')),
  area_ha                numeric(8,2) check (area_ha is null or area_ha > 0),
  flow_rate_lpm          numeric(8,1) check (flow_rate_lpm is null or flow_rate_lpm >= 0),
  target_moisture_pct    numeric(5,1) check (target_moisture_pct is null or target_moisture_pct between 0 and 100),
  current_moisture_pct   numeric(5,1) check (current_moisture_pct is null or current_moisture_pct between 0 and 100),
  status                 text not null default 'idle' check (status in ('idle','irrigating','scheduled','fault','disabled')),
  schedule               jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists irrigation_zones_farm_idx on public.irrigation_zones (farm_id);

create table if not exists public.irrigation_events (
  id             uuid primary key default gen_random_uuid(),
  farm_id        uuid not null references public.farms (id) on delete cascade,
  zone_id        uuid not null references public.irrigation_zones (id) on delete cascade,
  started_at     timestamptz not null,
  ended_at       timestamptz,
  volume_litres  numeric(12,1) check (volume_litres is null or volume_litres >= 0),
  energy_kwh     numeric(8,2),
  trigger        text not null default 'manual' check (trigger in ('manual','schedule','sensor','weather')),
  status         text not null default 'completed' check (status in ('planned','running','completed','skipped','failed')),
  notes          text,
  created_at     timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index if not exists irrigation_events_farm_idx on public.irrigation_events (farm_id, started_at desc);

------------------------------------------------------------------------------------------------
-- 2. Machinery telemetry (GPS and engine readings from fleet trackers)
------------------------------------------------------------------------------------------------
create table if not exists public.machinery_telemetry (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references public.farms (id) on delete cascade,
  machinery_id  uuid not null references public.farm_machinery_assets (id) on delete cascade,
  recorded_at   timestamptz not null default now(),
  location      extensions.geography(Point, 4326),
  speed_kmh     numeric(6,1),
  heading_deg   numeric(5,1),
  fuel_pct      numeric(5,1) check (fuel_pct is null or fuel_pct between 0 and 100),
  engine_rpm    integer,
  engine_temp_c numeric(5,1),
  engine_hours  numeric(10,2),
  status        text not null default 'idle' check (status in ('idle','working','transit','off','alert'))
);
create index if not exists machinery_telemetry_asset_idx on public.machinery_telemetry (machinery_id, recorded_at desc);
create index if not exists machinery_telemetry_farm_idx on public.machinery_telemetry (farm_id, recorded_at desc);

------------------------------------------------------------------------------------------------
-- 3. Off-take contracts
------------------------------------------------------------------------------------------------
create table if not exists public.offtake_contracts (
  id                  uuid primary key default gen_random_uuid(),
  contract_number     text not null unique,
  buyer_id            uuid not null references public.profiles (id) on delete cascade,
  buyer_name          text not null,
  grower_id           uuid not null references public.profiles (id) on delete cascade,
  farm_id             uuid references public.farms (id) on delete set null,
  crop_cycle_id       uuid references public.crop_cycles (id) on delete set null,
  commodity           text not null,
  grade               text,
  contracted_kg       numeric(12,2) not null check (contracted_kg > 0),
  delivered_kg        numeric(12,2) not null default 0 check (delivered_kg >= 0),
  price_per_kg_kobo   bigint not null check (price_per_kg_kobo > 0),
  advance_paid_kobo   bigint not null default 0 check (advance_paid_kobo >= 0),
  delivery_start      date not null,
  delivery_end        date not null,
  delivery_point      text,
  status              text not null default 'draft' check (status in ('draft','offered','signed','active','delivering','completed','cancelled','breached')),
  terms               text,
  signed_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (delivery_end >= delivery_start)
);
create index if not exists offtake_contracts_buyer_idx on public.offtake_contracts (buyer_id, status);
create index if not exists offtake_contracts_grower_idx on public.offtake_contracts (grower_id, status);

create table if not exists public.contract_deliveries (
  id              uuid primary key default gen_random_uuid(),
  contract_id     uuid not null references public.offtake_contracts (id) on delete cascade,
  delivered_on    date not null default current_date,
  quantity_kg     numeric(12,2) not null check (quantity_kg > 0),
  grade           text,
  moisture_pct    numeric(5,2),
  weighbridge_ref text,
  accepted        boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists contract_deliveries_contract_idx on public.contract_deliveries (contract_id, delivered_on desc);

-- Keep a contract's delivered total in step with its delivery records.
create or replace function private.sync_contract_delivered()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contract uuid := coalesce(new.contract_id, old.contract_id);
begin
  update public.offtake_contracts c
     set delivered_kg = coalesce((select sum(d.quantity_kg) from public.contract_deliveries d
                                   where d.contract_id = v_contract and d.accepted), 0),
         updated_at = now()
   where c.id = v_contract;
  return null;
end;
$$;
create trigger contract_deliveries_sync
  after insert or update or delete on public.contract_deliveries
  for each row execute function private.sync_contract_delivered();

------------------------------------------------------------------------------------------------
-- 4. Processing
------------------------------------------------------------------------------------------------
create table if not exists public.processing_batches (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles (id) on delete cascade,
  batch_code      text not null,
  facility_name   text not null,
  input_commodity text not null,
  input_kg        numeric(12,2) not null check (input_kg > 0),
  output_product  text not null,
  output_kg       numeric(12,2) check (output_kg is null or output_kg >= 0),
  source_farm_id  uuid references public.farms (id) on delete set null,
  stage           text not null default 'received' check (stage in ('received','cleaning','drying','milling','packaging','quality_check','dispatched')),
  quality_grade   text,
  moisture_pct    numeric(5,2),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (owner_id, batch_code)
);
create index if not exists processing_batches_owner_idx on public.processing_batches (owner_id, started_at desc);

------------------------------------------------------------------------------------------------
-- 5. Market prices (reference data)
------------------------------------------------------------------------------------------------
create table if not exists public.market_prices (
  id           uuid primary key default gen_random_uuid(),
  commodity    text not null,
  market       text not null,
  state        text not null,
  unit         text not null,
  price_kobo   bigint not null check (price_kobo > 0),
  observed_on  date not null,
  source       text not null default 'CultivaNode field agents',
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (commodity, market, unit, observed_on)
);
create index if not exists market_prices_lookup_idx on public.market_prices (commodity, observed_on desc);

------------------------------------------------------------------------------------------------
-- 6. Messages
------------------------------------------------------------------------------------------------
create table if not exists public.message_threads (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null check (char_length(subject) between 2 and 160),
  context_type    text check (context_type in ('booking','order','contract','support','general')),
  context_id      uuid,
  created_by      uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create table if not exists public.message_participants (
  thread_id    uuid not null references public.message_threads (id) on delete cascade,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  primary key (thread_id, profile_id)
);
create index if not exists message_participants_profile_idx on public.message_participants (profile_id);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.message_threads (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists messages_thread_idx on public.messages (thread_id, created_at);

create or replace function public.is_thread_participant(p_thread uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.message_participants p
                  where p.thread_id = p_thread and p.profile_id = (select auth.uid()));
$$;
revoke all on function public.is_thread_participant(uuid) from public, anon;
grant execute on function public.is_thread_participant(uuid) to authenticated;

create or replace function private.touch_thread()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.message_threads set last_message_at = new.created_at where id = new.thread_id;
  return null;
end;
$$;
create trigger messages_touch_thread
  after insert on public.messages
  for each row execute function private.touch_thread();

------------------------------------------------------------------------------------------------
-- 7. Support desk
------------------------------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id            uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  subject       text not null check (char_length(subject) between 3 and 160),
  category      text not null check (category in ('account','booking','payment','marketplace','verification','technical','agronomy','other')),
  priority      text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status        text not null default 'open' check (status in ('open','pending','in_progress','resolved','closed')),
  channel       text not null default 'web' check (channel in ('web','phone','sms','whatsapp','agent','email')),
  assigned_to   uuid references public.profiles (id) on delete set null,
  sla_due_at    timestamptz,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists support_tickets_status_idx on public.support_tickets (status, priority, created_at desc);
create index if not exists support_tickets_requester_idx on public.support_tickets (requester_id);

create table if not exists public.support_ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 4000),
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists support_ticket_messages_ticket_idx on public.support_ticket_messages (ticket_id, created_at);

------------------------------------------------------------------------------------------------
-- 8. Finance hubs
------------------------------------------------------------------------------------------------
create table if not exists public.loan_applications (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique,
  applicant_id      uuid not null references public.profiles (id) on delete cascade,
  farm_id           uuid references public.farms (id) on delete set null,
  lender_name       text not null,
  product           text not null,
  purpose           text not null,
  amount_kobo       bigint not null check (amount_kobo > 0),
  tenor_months      integer not null check (tenor_months between 1 and 120),
  interest_rate_pct numeric(5,2) check (interest_rate_pct is null or interest_rate_pct between 0 and 100),
  readiness_score   integer check (readiness_score is null or readiness_score between 0 and 100),
  status            text not null default 'draft' check (status in ('draft','submitted','under_review','approved','disbursed','repaying','repaid','declined','withdrawn')),
  disbursed_kobo    bigint not null default 0,
  repaid_kobo       bigint not null default 0,
  submitted_at      timestamptz,
  decided_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists loan_applications_applicant_idx on public.loan_applications (applicant_id, status);

create table if not exists public.insurance_policies (
  id               uuid primary key default gen_random_uuid(),
  policy_number    text not null unique,
  holder_id        uuid not null references public.profiles (id) on delete cascade,
  farm_id          uuid references public.farms (id) on delete set null,
  insurer_name     text not null,
  product          text not null,
  cover_type       text not null check (cover_type in ('weather_index','multi_peril','livestock','equipment','area_yield')),
  crop_or_asset    text,
  sum_insured_kobo bigint not null check (sum_insured_kobo > 0),
  premium_kobo     bigint not null check (premium_kobo >= 0),
  start_date       date not null,
  end_date         date not null,
  status           text not null default 'active' check (status in ('quoted','active','lapsed','expired','cancelled')),
  trigger_terms    jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  check (end_date > start_date)
);
create index if not exists insurance_policies_holder_idx on public.insurance_policies (holder_id, status);

create table if not exists public.insurance_claims (
  id                  uuid primary key default gen_random_uuid(),
  claim_number        text not null unique,
  policy_id           uuid not null references public.insurance_policies (id) on delete cascade,
  holder_id           uuid not null references public.profiles (id) on delete cascade,
  incident_date       date not null,
  cause               text not null,
  description         text,
  amount_claimed_kobo bigint not null check (amount_claimed_kobo > 0),
  amount_paid_kobo    bigint not null default 0 check (amount_paid_kobo >= 0),
  status              text not null default 'submitted' check (status in ('submitted','assessing','approved','paid','rejected')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists insurance_claims_holder_idx on public.insurance_claims (holder_id, status);

create table if not exists public.grant_programmes (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles (id) on delete cascade,
  title           text not null,
  funder          text not null,
  description     text,
  focus_area      text not null,
  max_award_kobo  bigint not null check (max_award_kobo > 0),
  total_pool_kobo bigint check (total_pool_kobo is null or total_pool_kobo > 0),
  eligibility     text,
  states          text[] not null default '{}',
  opens_on        date not null,
  closes_on       date not null,
  status          text not null default 'open' check (status in ('draft','open','closed','awarded')),
  created_at      timestamptz not null default now(),
  check (closes_on >= opens_on)
);
create index if not exists grant_programmes_status_idx on public.grant_programmes (status, closes_on);

create table if not exists public.grant_applications (
  id                    uuid primary key default gen_random_uuid(),
  programme_id          uuid not null references public.grant_programmes (id) on delete cascade,
  applicant_id          uuid not null references public.profiles (id) on delete cascade,
  farm_id               uuid references public.farms (id) on delete set null,
  amount_requested_kobo bigint not null check (amount_requested_kobo > 0),
  amount_awarded_kobo   bigint,
  proposal              text,
  score                 integer check (score is null or score between 0 and 100),
  status                text not null default 'draft' check (status in ('draft','submitted','shortlisted','awarded','declined','withdrawn')),
  submitted_at          timestamptz,
  created_at            timestamptz not null default now(),
  unique (programme_id, applicant_id)
);
create index if not exists grant_applications_applicant_idx on public.grant_applications (applicant_id);

create table if not exists public.investment_offerings (
  id                  uuid primary key default gen_random_uuid(),
  sponsor_id          uuid not null references public.profiles (id) on delete cascade,
  title               text not null,
  commodity           text not null,
  structure           text not null check (structure in ('crop_finance','equipment_lease','processing_equity','warehouse_receipt','offtake_backed')),
  target_raise_kobo   bigint not null check (target_raise_kobo > 0),
  raised_kobo         bigint not null default 0 check (raised_kobo >= 0),
  min_ticket_kobo     bigint not null check (min_ticket_kobo > 0),
  expected_return_pct numeric(5,2) not null,
  tenor_months        integer not null check (tenor_months between 1 and 120),
  risk_rating         text not null default 'medium' check (risk_rating in ('low','medium','high')),
  closes_on           date not null,
  status              text not null default 'open' check (status in ('draft','open','funded','closed','repaid')),
  created_at          timestamptz not null default now()
);

create table if not exists public.investment_commitments (
  id           uuid primary key default gen_random_uuid(),
  offering_id  uuid not null references public.investment_offerings (id) on delete cascade,
  investor_id  uuid not null references public.profiles (id) on delete cascade,
  amount_kobo  bigint not null check (amount_kobo > 0),
  status       text not null default 'committed' check (status in ('committed','funded','returned','cancelled')),
  returned_kobo bigint not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists investment_commitments_investor_idx on public.investment_commitments (investor_id);

------------------------------------------------------------------------------------------------
-- 9. Impact: NGO programmes, research trials, cooperatives
------------------------------------------------------------------------------------------------
create table if not exists public.impact_programmes (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  organisation  text not null,
  focus         text not null,
  states        text[] not null default '{}',
  budget_kobo   bigint not null default 0 check (budget_kobo >= 0),
  spent_kobo    bigint not null default 0 check (spent_kobo >= 0),
  target_farmers integer not null default 0,
  start_date    date not null,
  end_date      date,
  status        text not null default 'active' check (status in ('planning','active','paused','completed')),
  created_at    timestamptz not null default now()
);

create table if not exists public.programme_beneficiaries (
  id             uuid primary key default gen_random_uuid(),
  programme_id   uuid not null references public.impact_programmes (id) on delete cascade,
  farmer_name    text not null,
  profile_id     uuid references public.profiles (id) on delete set null,
  state          text,
  lga            text,
  gender         text check (gender is null or gender in ('female','male','other')),
  support_type   text not null,
  value_kobo     bigint not null default 0,
  yield_before_kg_ha numeric(10,1),
  yield_after_kg_ha  numeric(10,1),
  enrolled_on    date not null default current_date,
  status         text not null default 'enrolled' check (status in ('enrolled','supported','graduated','exited')),
  created_at     timestamptz not null default now()
);
create index if not exists programme_beneficiaries_programme_idx on public.programme_beneficiaries (programme_id);

create table if not exists public.research_trials (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  title        text not null,
  institution  text not null,
  crop         text not null,
  design       text not null,
  treatments   jsonb not null default '[]'::jsonb,
  farm_id      uuid references public.farms (id) on delete set null,
  plot_id      uuid references public.plots (id) on delete set null,
  replicates   integer not null default 3,
  start_date   date not null,
  end_date     date,
  status       text not null default 'planned' check (status in ('planned','running','harvested','analysing','published')),
  findings     text,
  created_at   timestamptz not null default now()
);

create table if not exists public.cooperative_aggregations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  commodity        text not null,
  target_kg        numeric(12,2) not null check (target_kg > 0),
  pledged_kg       numeric(12,2) not null default 0,
  delivered_kg     numeric(12,2) not null default 0,
  member_count     integer not null default 0,
  price_per_kg_kobo bigint,
  buyer_name       text,
  collection_point text,
  closes_on        date,
  status           text not null default 'open' check (status in ('open','collecting','sold','closed')),
  created_at       timestamptz not null default now()
);
create index if not exists cooperative_aggregations_org_idx on public.cooperative_aggregations (organization_id);

------------------------------------------------------------------------------------------------
-- 10. Row level security
------------------------------------------------------------------------------------------------
-- Farm-scoped tables.
do $$
declare
  t text;
begin
  foreach t in array array['irrigation_zones','irrigation_events','machinery_telemetry'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.can_view_farm(farm_id))', t || '_view', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.can_edit_farm(farm_id))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.can_edit_farm(farm_id)) with check (public.can_edit_farm(farm_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.can_edit_farm(farm_id))', t || '_delete', t);
  end loop;
end $$;

-- Single-owner tables: the owner manages; staff with reports.read can read.
do $$
declare
  r record;
begin
  for r in select * from (values
      ('processing_batches','owner_id'), ('loan_applications','applicant_id'), ('insurance_policies','holder_id'),
      ('insurance_claims','holder_id'), ('impact_programmes','owner_id'), ('research_trials','owner_id'),
      ('investment_commitments','investor_id'), ('grant_applications','applicant_id')) as v(tbl, col) loop
    execute format('alter table public.%I enable row level security', r.tbl);
    execute format('create policy %I on public.%I for select to authenticated using (%I = (select auth.uid()) or (select public.has_permission(''reports.read'')))', r.tbl || '_view', r.tbl, r.col);
    execute format('create policy %I on public.%I for insert to authenticated with check (%I = (select auth.uid()))', r.tbl || '_insert', r.tbl, r.col);
    execute format('create policy %I on public.%I for update to authenticated using (%I = (select auth.uid())) with check (%I = (select auth.uid()))', r.tbl || '_update', r.tbl, r.col, r.col);
    execute format('create policy %I on public.%I for delete to authenticated using (%I = (select auth.uid()))', r.tbl || '_delete', r.tbl, r.col);
  end loop;
end $$;

-- Grant programme owners also see the applications to their programmes.
create policy grant_applications_programme_owner on public.grant_applications
  for select to authenticated
  using (exists (select 1 from public.grant_programmes g where g.id = programme_id and g.owner_id = (select auth.uid())));
-- Offering sponsors see the commitments to their offerings.
create policy investment_commitments_sponsor on public.investment_commitments
  for select to authenticated
  using (exists (select 1 from public.investment_offerings o where o.id = offering_id and o.sponsor_id = (select auth.uid())));

-- Public catalogues: open items readable by every signed-in user; owners manage their own.
alter table public.grant_programmes enable row level security;
create policy grant_programmes_view on public.grant_programmes for select to authenticated
  using (status in ('open','closed','awarded') or owner_id = (select auth.uid()));
create policy grant_programmes_manage on public.grant_programmes for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

alter table public.investment_offerings enable row level security;
create policy investment_offerings_view on public.investment_offerings for select to authenticated
  using (status <> 'draft' or sponsor_id = (select auth.uid()));
create policy investment_offerings_manage on public.investment_offerings for all to authenticated
  using (sponsor_id = (select auth.uid())) with check (sponsor_id = (select auth.uid()));

alter table public.market_prices enable row level security;
create policy market_prices_view on public.market_prices for select to authenticated using (true);
create policy market_prices_manage on public.market_prices for all to authenticated
  using ((select public.has_permission('knowledge.manage'))) with check ((select public.has_permission('knowledge.manage')));

-- Contracts: both parties read; the buyer drafts and edits; deliveries follow the contract.
alter table public.offtake_contracts enable row level security;
create policy offtake_contracts_view on public.offtake_contracts for select to authenticated
  using (buyer_id = (select auth.uid()) or grower_id = (select auth.uid()) or (select public.has_permission('reports.read')));
create policy offtake_contracts_insert on public.offtake_contracts for insert to authenticated
  with check (buyer_id = (select auth.uid()));
create policy offtake_contracts_update on public.offtake_contracts for update to authenticated
  using (buyer_id = (select auth.uid()) or grower_id = (select auth.uid()))
  with check (buyer_id = (select auth.uid()) or grower_id = (select auth.uid()));

alter table public.contract_deliveries enable row level security;
create policy contract_deliveries_view on public.contract_deliveries for select to authenticated
  using (exists (select 1 from public.offtake_contracts c where c.id = contract_id
                 and (c.buyer_id = (select auth.uid()) or c.grower_id = (select auth.uid()))));
create policy contract_deliveries_insert on public.contract_deliveries for insert to authenticated
  with check (exists (select 1 from public.offtake_contracts c where c.id = contract_id and c.buyer_id = (select auth.uid())));

-- Messages: participants only.
alter table public.message_threads enable row level security;
create policy message_threads_view on public.message_threads for select to authenticated
  using (public.is_thread_participant(id) or created_by = (select auth.uid()));
create policy message_threads_insert on public.message_threads for insert to authenticated
  with check (created_by = (select auth.uid()));

alter table public.message_participants enable row level security;
create policy message_participants_view on public.message_participants for select to authenticated
  using (public.is_thread_participant(thread_id));
create policy message_participants_insert on public.message_participants for insert to authenticated
  with check (exists (select 1 from public.message_threads t where t.id = thread_id and t.created_by = (select auth.uid())));
create policy message_participants_update on public.message_participants for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

alter table public.messages enable row level security;
create policy messages_view on public.messages for select to authenticated
  using (public.is_thread_participant(thread_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_thread_participant(thread_id));

-- Support: requester sees own tickets and public replies; staff with website_inbox.manage run the desk.
alter table public.support_tickets enable row level security;
create policy support_tickets_view on public.support_tickets for select to authenticated
  using (requester_id = (select auth.uid()) or (select public.has_permission('website_inbox.manage')));
create policy support_tickets_insert on public.support_tickets for insert to authenticated
  with check (requester_id = (select auth.uid()));
create policy support_tickets_staff_update on public.support_tickets for update to authenticated
  using ((select public.has_permission('website_inbox.manage'))) with check ((select public.has_permission('website_inbox.manage')));

alter table public.support_ticket_messages enable row level security;
create policy support_ticket_messages_view on public.support_ticket_messages for select to authenticated
  using ((select public.has_permission('website_inbox.manage'))
         or (not is_internal and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.requester_id = (select auth.uid()))));
create policy support_ticket_messages_insert on public.support_ticket_messages for insert to authenticated
  with check (author_id = (select auth.uid())
              and ((select public.has_permission('website_inbox.manage'))
                   or (not is_internal and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.requester_id = (select auth.uid())))));

-- NGO beneficiaries follow their programme.
alter table public.programme_beneficiaries enable row level security;
create policy programme_beneficiaries_view on public.programme_beneficiaries for select to authenticated
  using (exists (select 1 from public.impact_programmes p where p.id = programme_id and p.owner_id = (select auth.uid()))
         or (select public.has_permission('reports.read')));
create policy programme_beneficiaries_manage on public.programme_beneficiaries for all to authenticated
  using (exists (select 1 from public.impact_programmes p where p.id = programme_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.impact_programmes p where p.id = programme_id and p.owner_id = (select auth.uid())));

-- Cooperative aggregation: organisation members read; owners and farm managers manage.
alter table public.cooperative_aggregations enable row level security;
create policy cooperative_aggregations_view on public.cooperative_aggregations for select to authenticated
  using (public.org_role(organization_id) is not null or (select public.has_permission('reports.read')));
create policy cooperative_aggregations_manage on public.cooperative_aggregations for all to authenticated
  using (public.org_role(organization_id) in ('owner','farm_manager'))
  with check (public.org_role(organization_id) in ('owner','farm_manager'));

------------------------------------------------------------------------------------------------
-- 11. Regional statistics for government and NGO dashboards (aggregates only, no personal data)
------------------------------------------------------------------------------------------------
create or replace function public.regional_agri_stats()
returns table (state text, farms bigint, hectares numeric, active_cycles bigint, farmers bigint, bookings_90d bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select f.state,
         count(distinct f.id),
         coalesce(round(sum(f.area_ha), 1), 0),
         (select count(*) from public.crop_cycles c join public.farms f2 on f2.id = c.farm_id
           where f2.state = f.state and c.status not in ('completed','abandoned')),
         count(distinct f.owner_id),
         (select count(*) from public.bookings b join public.farms f3 on f3.id = b.farm_id
           where f3.state = f.state and b.created_at > now() - interval '90 days')
    from public.farms f
   where f.state is not null
   group by f.state
   order by 2 desc;
$$;
revoke all on function public.regional_agri_stats() from public, anon;
grant execute on function public.regional_agri_stats() to authenticated;

------------------------------------------------------------------------------------------------
-- 12. updated_at triggers
------------------------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['irrigation_zones','offtake_contracts','support_tickets','loan_applications','insurance_claims'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;
end $$;

