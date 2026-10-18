-- Stand count on crop cycles, and livestock work on the task board. Applied on hosted 17 Oct 2026; idempotent.

-- 1. How many plants were established, and how many are still alive at the last count (lowered when plants die).
alter table public.crop_cycles
  add column if not exists plants_planted integer,
  add column if not exists plants_alive integer,
  add column if not exists plants_counted_on date;
comment on column public.crop_cycles.plants_planted is 'Number of plants/stands established at planting (optional).';
comment on column public.crop_cycles.plants_alive is 'Plants still standing at the last stand count; updated when plants die.';
do $$ begin
  alter table public.crop_cycles add constraint crop_cycles_plants_planted_check check (plants_planted is null or plants_planted >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.crop_cycles add constraint crop_cycles_plants_alive_check check (plants_alive is null or plants_alive >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.crop_cycles add constraint crop_cycles_alive_le_planted
    check (plants_alive is null or plants_planted is null or plants_alive <= plants_planted);
exception when duplicate_object then null; end $$;
grant insert (plants_planted, plants_alive, plants_counted_on), update (plants_planted, plants_alive, plants_counted_on)
  on public.crop_cycles to authenticated;

-- 2. Tasks can be livestock work (feeding, vaccination, cleaning…) on a group, assigned to staff like field work.
alter table public.farm_operational_tasks
  add column if not exists livestock_group_id uuid references public.farm_livestock_groups (id) on delete set null;
create index if not exists farm_operational_tasks_livestock_group_idx on public.farm_operational_tasks (livestock_group_id);
grant insert (livestock_group_id), update (livestock_group_id) on public.farm_operational_tasks to authenticated;

create or replace function private.task_group_same_farm()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.livestock_group_id is not null and not exists (
    select 1 from public.farm_livestock_groups g where g.id = new.livestock_group_id and g.farm_id = new.farm_id) then
    raise exception 'That livestock group is not on this farm.' using errcode = '22023';
  end if;
  return new;
end $$;
revoke execute on function private.task_group_same_farm() from public, anon, authenticated;
drop trigger if exists farm_operational_tasks_group_same_farm on public.farm_operational_tasks;
create trigger farm_operational_tasks_group_same_farm
  before insert or update of livestock_group_id, farm_id on public.farm_operational_tasks
  for each row execute function private.task_group_same_farm();
