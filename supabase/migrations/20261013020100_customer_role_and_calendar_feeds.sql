-- Marketplace customers: buy from the marketplace and see only their own orders.
-- Customers are auto-approved like farmers, so widen the auto-approve check.
do $$ begin
  execute 'alter table public.roles drop constraint roles_check';
  execute $c$alter table public.roles add constraint roles_check check ((not auto_approve) or (role = any (array['crop_farmer'::public.app_role, 'animal_farmer'::public.app_role, 'customer'::public.app_role])))$c$;
end $$;
insert into public.roles (role, description, auto_approve, requires_documents, min_verification_tier, available)
values ('customer', 'Buys from the marketplace; sees their own orders and deliveries', true, false, 0, true)
on conflict (role) do update set description = excluded.description, auto_approve = true, available = true;

-- Private calendar feed (iCalendar) per person, so field work shows up in Google Calendar on their phone.
create table if not exists public.calendar_feeds (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);
alter table public.calendar_feeds enable row level security;
create policy "calendar_feeds: own" on public.calendar_feeds
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- Events for a feed token: crop operations and field tasks on every farm the person can see.
-- Called by the public /api/calendar/<token>.ics route, so it runs as definer and checks the token itself.
create or replace function public.calendar_feed_events(p_token text)
returns table (
  uid text, kind text, title text, details text, starts_on date, ends_on date,
  farm_name text, location text, status text, updated_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  with me as (
    select profile_id from public.calendar_feeds where token = p_token and char_length(p_token) >= 32
  ),
  my_farms as (
    select f.id, f.name, concat_ws(', ', f.lga, f.state) as place
    from public.farms f, me
    where f.owner_id = me.profile_id
       or f.organization_id in (select m.organization_id from public.org_members m where m.profile_id = me.profile_id)
  )
  select 'op-' || o.id::text, 'crop_operation',
         o.name || ' · ' || initcap(replace(c.crop_id, '_', ' ')),
         concat_ws(E'\n', 'Stage: ' || o.stage, 'Farm: ' || f.name, nullif(o.required_machinery, ''), nullif(o.notes, '')),
         o.scheduled_date, o.scheduled_date, f.name, f.place, o.status, o.created_at
  from public.crop_cycle_operations o
  join public.crop_cycles c on c.id = o.crop_cycle_id
  join my_farms f on f.id = c.farm_id
  where o.scheduled_date is not null and o.status not in ('cancelled', 'skipped')
    and o.scheduled_date >= current_date - 60
  union all
  select 'task-' || t.id::text, 'task', t.title,
         concat_ws(E'\n', 'Farm: ' || f.name, 'Priority: ' || t.priority, nullif(t.description, '')),
         coalesce(t.start_date, t.due_date), coalesce(t.due_date, t.start_date), f.name, f.place, t.status, t.updated_at
  from public.farm_operational_tasks t
  join my_farms f on f.id = t.farm_id
  where coalesce(t.due_date, t.start_date) is not null and t.status <> 'cancelled'
    and coalesce(t.due_date, t.start_date) >= current_date - 60
$$;
revoke all on function public.calendar_feed_events(text) from public;
grant execute on function public.calendar_feed_events(text) to anon, authenticated;
