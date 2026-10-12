-- Farm Operations: Executive Dashboard Operations Tracker
-- Stores field operations for the executive dashboard (fertilizer applications, crop protection, weeding, scouting, etc.)

create type public.farm_operation_status as enum (
  'planned',
  'ready_to_execute',
  'in_progress',
  'weather_hold',
  'completed',
  'cancelled'
);

create table if not exists public.farm_operations (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete set null,
  crop_cycle_id uuid references public.crop_cycles(id) on delete set null,
  name text not null,
  subtext text,
  crop_area text,
  timeline text,
  timing_note text,
  resource text,
  resource_icon text,
  location text,
  status public.farm_operation_status not null default 'planned',
  action_label text,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists farm_operations_farm_idx on public.farm_operations(farm_id, status);
create index if not exists farm_operations_plot_idx on public.farm_operations(plot_id);
create index if not exists farm_operations_crop_cycle_idx on public.farm_operations(crop_cycle_id);
create index if not exists farm_operations_scheduled_idx on public.farm_operations(scheduled_at);

alter table public.farm_operations enable row level security;

create policy "farm_operations_authenticated" on public.farm_operations
  for all to authenticated
  using (true) with check (true);

grant all on public.farm_operations to authenticated, anon, service_role;

create trigger farm_operations_updated_at
  before update on public.farm_operations
  for each row execute function public.set_updated_at();

comment on table public.farm_operations is 'Field operations tracked on the executive dashboard: fertilizer applications, crop protection sprays, mechanical weeding, scouting, livestock health events, etc.';