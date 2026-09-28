-- CultivaNode MVP week 2: a booking is agreed.
--
--   1. Twilio joins Termii as a working SMS provider (adapter in supabase/functions/_shared/providers/sms.ts).
--   2. bookings and append-only booking_events. Nobody writes to them directly: request_booking, accept_booking,
--      decline_booking and cancel_booking check the actor, the status and the time window, refuse suspended
--      accounts and respect the marketplace kill switch. The provider sees the farm pin and the farmer's phone
--      only once they accept.
--   3. notifications (in-app inbox) and sms_outbox (booking SMS). The send-notifications Edge Function drains
--      the outbox through whichever SMS provider staff made active.
--   4. Unanswered requests expire (end of the job day, or 24 hours, whichever comes first). pg_cron runs the
--      expiry and wakes the SMS worker where the extensions exist (the hosted project); locally they are skipped.
--
-- Errors carry a stable code in HINT (for example 'marketplace_closed'), which the apps translate.

------------------------------------------------------------------------------------------------
-- 1. Twilio
------------------------------------------------------------------------------------------------

update public.integration_providers
   set implemented = true,
       description = 'International SMS gateway. Works with a Twilio number, an approved alphanumeric sender ID or a Messaging Service. Test mode takes Twilio''s test credentials: nothing is sent or charged.',
       config_fields = '[{"key":"account_sid","label":"Account SID","required":true,"help":"Starts with AC. Twilio Console > Account info. In test mode use the test Account SID."},
         {"key":"from","label":"Sender","required":true,"help":"A Twilio phone number (+1...), an alphanumeric sender ID registered for Nigeria, or a Messaging Service SID (MG...)."},
         {"key":"base_url","label":"API address","required":true,"default":"https://api.twilio.com","help":"Leave as it is unless Twilio support gives you a regional address."},
         {"key":"message_template","label":"Sign-in message","required":true,"default":"Your {brand} code is {code}. Do not share it with anyone.","help":"{brand} and {code} are filled in. Keep it under 160 characters."}]'::jsonb,
       secret_fields = '[{"key":"auth_token","label":"Auth token","required":true}]'::jsonb
 where code = 'twilio';

------------------------------------------------------------------------------------------------
-- 2. Bookings
------------------------------------------------------------------------------------------------

create type public.booking_status as enum ('requested', 'accepted', 'declined', 'cancelled', 'expired');

create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  farmer_id        uuid not null references public.profiles (id) on delete restrict,
  provider_id      uuid not null references public.profiles (id) on delete restrict,
  listing_id       uuid references public.listings (id) on delete set null,
  farm_id          uuid references public.farms (id) on delete set null,
  organization_id  uuid references public.organizations (id) on delete set null,
  -- Snapshots at request time: the booking keeps its meaning if the listing or farm changes later.
  listing_title    text not null check (char_length(listing_title) between 3 and 120),
  listing_kind     public.listing_kind not null,
  equipment_type   public.equipment_type,
  provider_type    public.provider_type,
  farm_name        text not null check (char_length(farm_name) between 1 and 120),
  job_location     extensions.geography(Point, 4326) not null,
  job_state        text,
  job_lga          text,
  distance_km      numeric(6, 1) not null check (distance_km >= 0),
  job_date         date not null,
  unit             public.pricing_unit not null,
  quantity         numeric(10, 2) not null check (quantity > 0 and quantity <= 10000),
  rate_kobo        bigint not null check (rate_kobo > 0),
  total_kobo       bigint not null check (total_kobo > 0 and total_kobo <= 1000000000000),
  farmer_note      text check (farmer_note is null or char_length(farmer_note) <= 500),
  status           public.booking_status not null default 'requested',
  expires_at       timestamptz not null,
  responded_at     timestamptz,
  closed_reason    text check (closed_reason is null or char_length(closed_reason) <= 500),
  cancelled_by     uuid references public.profiles (id) on delete restrict,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint bookings_two_parties check (farmer_id <> provider_id)
);
create index bookings_farmer_idx on public.bookings (farmer_id, created_at desc);
create index bookings_provider_idx on public.bookings (provider_id, created_at desc);
create index bookings_open_idx on public.bookings (expires_at) where status = 'requested';
create index bookings_listing_idx on public.bookings (listing_id);
create index bookings_farm_idx on public.bookings (farm_id);
create index bookings_org_idx on public.bookings (organization_id);
create index bookings_cancelled_by_idx on public.bookings (cancelled_by);
-- One open request or agreed job per farmer, listing and day.
create unique index bookings_one_open_per_day on public.bookings (farmer_id, listing_id, job_date)
  where status in ('requested', 'accepted');
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
comment on table public.bookings is
  'A farmer''s request for a listing on a day, and its answer. Money is recorded in kobo; no money moves through CultivaNode in the pilot. Changed only through the booking functions.';
comment on column public.bookings.job_location is 'Farm pin at request time. Not readable through the API: booking_detail() shows it to the farmer, and to the provider once accepted.';

create table public.booking_events (
  id           bigint generated always as identity primary key,
  booking_id   uuid not null references public.bookings (id) on delete restrict,
  actor_id     uuid references public.profiles (id) on delete restrict, -- null: the system (expiry)
  event        text not null check (event in ('requested', 'accepted', 'declined', 'cancelled', 'expired')),
  from_status  public.booking_status,
  to_status    public.booking_status not null,
  note         text check (note is null or char_length(note) <= 500),
  created_at   timestamptz not null default now()
);
create index booking_events_booking_idx on public.booking_events (booking_id, id);
create index booking_events_actor_idx on public.booking_events (actor_id);
create trigger booking_events_append_only before update or delete on public.booking_events
  for each row execute function private.forbid_change();
comment on table public.booking_events is 'Every booking status change: who, when, from and to. Append-only.';

alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;

create policy "bookings: the two parties and staff with bookings.read" on public.bookings
  for select to authenticated
  using (farmer_id = (select auth.uid()) or provider_id = (select auth.uid())
         or (select public.has_permission('bookings.read')));
create policy "booking_events: visible with the booking" on public.booking_events
  for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id));

-- No insert, update or delete for anyone through the API; job_location is left out of the readable columns.
revoke all on public.bookings, public.booking_events from anon, authenticated;
grant select (id, farmer_id, provider_id, listing_id, farm_id, organization_id, listing_title, listing_kind,
              equipment_type, provider_type, farm_name, job_state, job_lga, distance_km, job_date, unit, quantity,
              rate_kobo, total_kobo, farmer_note, status, expires_at, responded_at, closed_reason, cancelled_by,
              created_at, updated_at)
  on public.bookings to authenticated;
grant select on public.booking_events to authenticated;

------------------------------------------------------------------------------------------------
-- 3. Notifications and the SMS outbox
------------------------------------------------------------------------------------------------

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  kind        text not null check (kind ~ '^[a-z][a-z_]{2,40}$'),
  booking_id  uuid references public.bookings (id) on delete cascade,
  -- Facts for the message (listing title, date, first name). The apps word it in the reader's language.
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_profile_idx on public.notifications (profile_id, created_at desc);
create index notifications_unread_idx on public.notifications (profile_id) where read_at is null;
create index notifications_booking_idx on public.notifications (booking_id);
comment on table public.notifications is 'In-app inbox. Written by the database functions; people only read and mark them read.';

alter table public.notifications enable row level security;
create policy "notifications: my own" on public.notifications
  for select to authenticated using (profile_id = (select auth.uid()));
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;

create table public.sms_outbox (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  kind             text not null check (kind ~ '^[a-z][a-z_]{2,40}$'),
  booking_id       uuid references public.bookings (id) on delete cascade,
  data             jsonb not null default '{}'::jsonb,
  status           text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  attempts         smallint not null default 0 check (attempts between 0 and 10),
  next_attempt_at  timestamptz not null default now(),
  locked_at        timestamptz,
  provider         text check (provider is null or provider ~ '^[a-z][a-z0-9_]{1,39}$'),
  message_id       text check (message_id is null or char_length(message_id) <= 100),
  error_code       text check (error_code is null or char_length(error_code) <= 80),
  created_at       timestamptz not null default now(),
  sent_at          timestamptz
);
create index sms_outbox_due_idx on public.sms_outbox (next_attempt_at) where status in ('queued', 'sending');
create index sms_outbox_profile_idx on public.sms_outbox (profile_id);
create index sms_outbox_booking_idx on public.sms_outbox (booking_id);
comment on table public.sms_outbox is
  'Booking SMS waiting for the send-notifications worker. No phone numbers here: the worker reads them at send time. Service role only.';

alter table public.sms_outbox enable row level security;
revoke all on public.sms_outbox from anon, authenticated;

-- One notification, and optionally one SMS, for a person.
create or replace function private.notify(p_profile uuid, p_kind text, p_booking uuid, p_data jsonb, p_sms boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.notifications (profile_id, kind, booking_id, data) values (p_profile, p_kind, p_booking, p_data);
  if p_sms then
    insert into public.sms_outbox (profile_id, kind, booking_id, data) values (p_profile, p_kind, p_booking, p_data);
  end if;
end;
$$;

-- What both sides' messages say about a booking. p_name is the other person's first name.
create or replace function private.booking_message_data(p_booking public.bookings, p_name_of uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'title', p_booking.listing_title,
           'job_date', p_booking.job_date,
           'unit', p_booking.unit,
           'quantity', p_booking.quantity,
           'total_kobo', p_booking.total_kobo,
           'name', coalesce((select nullif(split_part(trim(p.full_name), ' ', 1), '') from public.profiles p where p.id = p_name_of), ''));
$$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_n integer;
begin
  update public.notifications
     set read_at = now()
   where profile_id = auth.uid() and read_at is null and (p_ids is null or id = any (p_ids));
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

------------------------------------------------------------------------------------------------
-- 4. Transitions
------------------------------------------------------------------------------------------------

create or replace function private.booking_error(p_message text, p_code text, p_state text default '22023')
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception '%', p_message using errcode = p_state, hint = p_code;
end;
$$;

create or replace function private.lagos_today()
returns date
language sql stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Lagos')::date;
$$;

create or replace function private.booking_event(p_booking uuid, p_event text, p_from public.booking_status,
                                                 p_to public.booking_status, p_note text)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.booking_events (booking_id, actor_id, event, from_status, to_status, note)
  values (p_booking, auth.uid(), p_event, p_from, p_to, p_note);
$$;

-- A farmer asks for a listing on a day. Price comes from the listing, never from the caller.
create or replace function public.request_booking(
  p_listing   uuid,
  p_farm      uuid,
  p_job_date  date,
  p_unit      public.pricing_unit,
  p_quantity  numeric,
  p_note      text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_listing  public.listings;
  v_farm     public.farms;
  v_rate     bigint;
  v_distance numeric;
  v_qty      numeric := round(p_quantity, 2);
  v_today    date := private.lagos_today();
  v_booking  public.bookings;
begin
  if v_uid is null then
    perform private.booking_error('Sign in first.', 'not_signed_in', '42501');
  end if;
  if not private.account_active(v_uid) then
    perform private.booking_error('Your account is suspended.', 'account_suspended', '42501');
  end if;
  if not (public.has_role('crop_farmer') or public.has_role('animal_farmer')) then
    perform private.booking_error('Only farmers can request a job.', 'farmer_role_needed', '42501');
  end if;
  if not private.flag_on_for('marketplace_live', v_uid) then
    perform private.booking_error('Hiring is not open in your area yet.', 'marketplace_closed', '42501');
  end if;

  select * into v_farm from public.farms f
   where f.id = p_farm
     and (f.owner_id = v_uid or (f.organization_id is not null and public.org_role(f.organization_id) is not null));
  if not found then
    perform private.booking_error('Farm not found.', 'farm_not_found', 'P0002');
  end if;

  select * into v_listing from public.listings l where l.id = p_listing and l.status = 'active' for share;
  if not found or not private.account_active(v_listing.owner_id) then
    perform private.booking_error('This listing is not available.', 'listing_unavailable', 'P0002');
  end if;
  if v_listing.owner_id = v_uid then
    perform private.booking_error('You cannot book your own listing.', 'own_listing');
  end if;

  select r.rate_kobo into v_rate from public.listing_rates r where r.listing_id = p_listing and r.unit = p_unit;
  if v_rate is null then
    perform private.booking_error('This listing has no price for that unit.', 'bad_unit');
  end if;
  if v_qty is null or v_qty <= 0 or v_qty > 10000 then
    perform private.booking_error('Enter how much work you need.', 'bad_quantity');
  end if;
  if p_job_date is null or p_job_date < v_today or p_job_date > v_today + 60 then
    perform private.booking_error('Pick a day from today to 60 days ahead.', 'bad_date');
  end if;

  v_distance := round((extensions.st_distance(v_listing.location, v_farm.location) / 1000.0)::numeric, 1);
  if v_distance > v_listing.service_radius_km then
    perform private.booking_error('Your farm is outside this provider''s area.', 'out_of_range');
  end if;

  if (select count(*) from public.bookings b where b.farmer_id = v_uid and b.status = 'requested' and b.expires_at > now()) >= 10 then
    perform private.booking_error('You have 10 requests waiting for an answer. Wait for replies or cancel some.', 'too_many_requests');
  end if;

  begin
    insert into public.bookings (farmer_id, provider_id, listing_id, farm_id, organization_id, listing_title, listing_kind,
                                 equipment_type, provider_type, farm_name, job_location, job_state, job_lga, distance_km,
                                 job_date, unit, quantity, rate_kobo, total_kobo, farmer_note, expires_at)
    values (v_uid, v_listing.owner_id, v_listing.id, v_farm.id, v_farm.organization_id, v_listing.title, v_listing.kind,
            v_listing.equipment_type, v_listing.provider_type, v_farm.name, v_farm.location, v_farm.state, v_farm.lga, v_distance,
            p_job_date, p_unit, v_qty, v_rate, round(v_rate * v_qty)::bigint, nullif(left(trim(coalesce(p_note, '')), 500), ''),
            least(now() + interval '24 hours', ((p_job_date + 1)::timestamp at time zone 'Africa/Lagos')))
    returning * into v_booking;
  exception when unique_violation then
    perform private.booking_error('You already asked for this on that day.', 'duplicate_request');
  end;

  perform private.booking_event(v_booking.id, 'requested', null, 'requested', null);
  perform private.notify(v_booking.provider_id, 'booking_requested', v_booking.id,
                         private.booking_message_data(v_booking, v_uid), true);
  return v_booking.id;
end;
$$;

-- Loads a booking for a change by one of its parties, or refuses without saying whether it exists.
create or replace function private.booking_for_change(p_booking uuid)
returns public.bookings
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking for update;
  if not found or auth.uid() is null or auth.uid() not in (v_booking.farmer_id, v_booking.provider_id) then
    perform private.booking_error('Booking not found.', 'not_found', 'P0002');
  end if;
  if not private.account_active(auth.uid()) then
    perform private.booking_error('Your account is suspended.', 'account_suspended', '42501');
  end if;
  return v_booking;
end;
$$;

create or replace function public.accept_booking(p_booking uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
begin
  if v_booking.provider_id <> auth.uid() then
    perform private.booking_error('Only the provider can accept.', 'not_allowed', '42501');
  end if;
  if v_booking.status <> 'requested' then
    perform private.booking_error('This request was already answered.', 'wrong_status');
  end if;
  if v_booking.expires_at <= now() then
    perform private.booking_error('This request has expired.', 'expired');
  end if;
  -- The switch is judged where the job is (the farmer's state), as in search.
  if not private.flag_on_for('marketplace_live', v_booking.farmer_id) then
    perform private.booking_error('Hiring is paused in this area.', 'marketplace_closed', '42501');
  end if;
  if not private.account_active(v_booking.farmer_id) then
    perform private.booking_error('This farmer''s account is not active.', 'counterpart_unavailable');
  end if;
  if exists (select 1 from public.listings l where l.id = v_booking.listing_id and l.status = 'suspended') then
    perform private.booking_error('This listing is suspended.', 'listing_unavailable');
  end if;

  update public.bookings set status = 'accepted', responded_at = now() where id = p_booking;
  perform private.booking_event(p_booking, 'accepted', 'requested', 'accepted', null);
  perform private.notify(v_booking.farmer_id, 'booking_accepted', p_booking,
                         private.booking_message_data(v_booking, v_booking.provider_id), true);
end;
$$;

create or replace function public.decline_booking(p_booking uuid, p_reason text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
  v_reason  text := nullif(left(trim(coalesce(p_reason, '')), 500), '');
begin
  if v_booking.provider_id <> auth.uid() then
    perform private.booking_error('Only the provider can decline.', 'not_allowed', '42501');
  end if;
  if v_booking.status <> 'requested' then
    perform private.booking_error('This request was already answered.', 'wrong_status');
  end if;

  update public.bookings set status = 'declined', responded_at = now(), closed_reason = v_reason where id = p_booking;
  perform private.booking_event(p_booking, 'declined', 'requested', 'declined', v_reason);
  perform private.notify(v_booking.farmer_id, 'booking_declined', p_booking,
                         private.booking_message_data(v_booking, v_booking.provider_id), true);
end;
$$;

-- The farmer withdraws a request; either side calls off an agreed job up to the end of the job day
-- (with a reason). Cancellation windows and strikes come in week 4.
create or replace function public.cancel_booking(p_booking uuid, p_reason text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
  v_reason  text;
  v_other   uuid;
begin
  if v_booking.status = 'requested' then
    if v_booking.farmer_id <> auth.uid() then
      perform private.booking_error('Decline the request instead.', 'not_allowed', '42501');
    end if;
    v_reason := nullif(left(trim(coalesce(p_reason, '')), 500), '');
  elsif v_booking.status = 'accepted' then
    if v_booking.job_date < private.lagos_today() then
      perform private.booking_error('The job day has passed.', 'too_late');
    end if;
    if p_reason is null or char_length(trim(p_reason)) < 5 then
      perform private.booking_error('Say why you are cancelling (at least 5 characters).', 'reason_needed');
    end if;
    v_reason := left(trim(p_reason), 500);
  else
    perform private.booking_error('This booking is already closed.', 'wrong_status');
  end if;

  update public.bookings set status = 'cancelled', closed_reason = v_reason, cancelled_by = auth.uid() where id = p_booking;
  perform private.booking_event(p_booking, 'cancelled', v_booking.status, 'cancelled', v_reason);
  v_other := case when auth.uid() = v_booking.farmer_id then v_booking.provider_id else v_booking.farmer_id end;
  -- A withdrawn request is only an inbox note; a called-off job also goes by SMS.
  perform private.notify(v_other, 'booking_cancelled', p_booking,
                         private.booking_message_data(v_booking, auth.uid()), v_booking.status = 'accepted');
end;
$$;

-- Unanswered requests close at expires_at. Run by pg_cron; safe to run at any time.
create or replace function private.expire_bookings()
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_n       integer := 0;
begin
  for v_booking in
    select * from public.bookings
     where status = 'requested' and expires_at <= now()
     order by expires_at
     limit 500
     for update skip locked
  loop
    update public.bookings set status = 'expired' where id = v_booking.id;
    insert into public.booking_events (booking_id, actor_id, event, from_status, to_status)
    values (v_booking.id, null, 'expired', 'requested', 'expired');
    perform private.notify(v_booking.farmer_id, 'booking_expired', v_booking.id,
                           private.booking_message_data(v_booking, v_booking.provider_id), true);
    perform private.notify(v_booking.provider_id, 'booking_expired_provider', v_booking.id,
                           private.booking_message_data(v_booking, v_booking.farmer_id), false);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

------------------------------------------------------------------------------------------------
-- 5. Reading bookings
------------------------------------------------------------------------------------------------

-- Status as people should see it: a request past its deadline is expired even before the job runs.
create or replace function private.effective_status(p_status public.booking_status, p_expires timestamptz)
returns public.booking_status
language sql stable
set search_path = ''
as $$
  select case when p_status = 'requested' and p_expires <= now() then 'expired'::public.booking_status else p_status end;
$$;

-- My bookings as farmer and as provider, newest first.
create or replace function public.my_bookings(p_limit integer default 100)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) from (
    select b.id,
           case when b.farmer_id = auth.uid() then 'farmer' else 'provider' end as my_side,
           private.effective_status(b.status, b.expires_at) as status,
           b.listing_title as title, b.listing_kind as kind, b.equipment_type, b.provider_type,
           b.job_date, b.unit, b.quantity, b.rate_kobo, b.total_kobo, b.distance_km,
           b.farm_name, b.job_state, b.job_lga, b.expires_at, b.created_at,
           coalesce((select nullif(split_part(trim(p.full_name), ' ', 1), '') from public.profiles p
                      where p.id = case when b.farmer_id = auth.uid() then b.provider_id else b.farmer_id end), '') as other_name
      from public.bookings b
     where auth.uid() in (b.farmer_id, b.provider_id)
     order by b.created_at desc
     limit greatest(1, least(coalesce(p_limit, 100), 300))
  ) x;
$$;

-- One booking with its history. The pin, farm directions and the other person's phone are shown to the
-- farmer always (their own), and to the provider only while the job is agreed. Staff with bookings.read see all.
create or replace function public.booking_detail(p_booking uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_b       public.bookings;
  v_uid     uuid := auth.uid();
  v_staff   boolean := public.has_permission('bookings.read');
  v_side    text;
  v_status  public.booking_status;
  v_agreed  boolean;
  v_other   uuid;
  v_contact jsonb;
begin
  select * into v_b from public.bookings where id = p_booking;
  if not found or not (v_uid in (v_b.farmer_id, v_b.provider_id) or v_staff) then
    perform private.booking_error('Booking not found.', 'not_found', 'P0002');
  end if;
  v_side := case when v_uid = v_b.farmer_id then 'farmer' when v_uid = v_b.provider_id then 'provider' else 'staff' end;
  v_status := private.effective_status(v_b.status, v_b.expires_at);
  v_agreed := v_status = 'accepted';
  v_other := case when v_side = 'farmer' then v_b.provider_id else v_b.farmer_id end;

  select jsonb_build_object(
           'name', case when v_agreed or v_side = 'staff' then p.full_name
                        else coalesce(nullif(split_part(trim(p.full_name), ' ', 1), ''), '') end,
           'phone', case when v_agreed or v_side = 'staff' then p.phone end,
           'tier', p.verification_tier)
    into v_contact
    from public.profiles p where p.id = v_other;

  return jsonb_build_object(
    'id', v_b.id, 'my_side', v_side, 'status', v_status,
    'title', v_b.listing_title, 'kind', v_b.listing_kind, 'equipment_type', v_b.equipment_type,
    'provider_type', v_b.provider_type, 'listing_id', v_b.listing_id,
    'job_date', v_b.job_date, 'unit', v_b.unit, 'quantity', v_b.quantity, 'rate_kobo', v_b.rate_kobo,
    'total_kobo', v_b.total_kobo, 'distance_km', v_b.distance_km, 'farmer_note', v_b.farmer_note,
    'farm_name', v_b.farm_name, 'job_state', v_b.job_state, 'job_lga', v_b.job_lga,
    'expires_at', v_b.expires_at, 'responded_at', v_b.responded_at, 'closed_reason', v_b.closed_reason,
    'cancelled_by_me', v_b.cancelled_by = v_uid, 'created_at', v_b.created_at,
    'other', v_contact,
    'location', case when v_side <> 'provider' or v_agreed then jsonb_build_object(
        'lat', extensions.st_y(v_b.job_location::extensions.geometry),
        'lng', extensions.st_x(v_b.job_location::extensions.geometry),
        'hint', (select f.address_hint from public.farms f where f.id = v_b.farm_id)) end,
    'can', jsonb_build_object(
        'accept', v_side = 'provider' and v_status = 'requested',
        'decline', v_side = 'provider' and v_status = 'requested',
        'cancel', (v_side = 'farmer' and v_status = 'requested')
                  or (v_side in ('farmer', 'provider') and v_status = 'accepted' and v_b.job_date >= private.lagos_today())),
    'events', coalesce((select jsonb_agg(jsonb_build_object(
                 'event', e.event, 'at', e.created_at, 'note', e.note,
                 'by', case when e.actor_id is null then 'system' when e.actor_id = v_b.farmer_id then 'farmer'
                            when e.actor_id = v_b.provider_id then 'provider' else 'staff' end) order by e.id)
                 from public.booking_events e where e.booking_id = v_b.id), '[]'::jsonb));
end;
$$;

-- What the request form needs: the listing, its prices, the provider card and whether my farm is in range.
create or replace function public.listing_for_booking(p_listing uuid, p_farm uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_listing public.listings;
  v_farm    public.farms;
  v_card    jsonb;
  v_km      numeric;
begin
  select * into v_farm from public.farms f
   where f.id = p_farm
     and (f.owner_id = v_uid or (f.organization_id is not null and public.org_role(f.organization_id) is not null));
  if not found then
    perform private.booking_error('Farm not found.', 'farm_not_found', 'P0002');
  end if;
  select * into v_listing from public.listings where id = p_listing and status = 'active' and owner_id <> v_uid;
  v_card := case when found then private.provider_card(v_listing.owner_id) end;
  if v_card is null or not public.marketplace_open() then
    perform private.booking_error('This listing is not available.', 'listing_unavailable', 'P0002');
  end if;
  v_km := round((extensions.st_distance(v_listing.location, v_farm.location) / 1000.0)::numeric, 1);
  return jsonb_build_object(
    'id', v_listing.id, 'title', v_listing.title, 'description', v_listing.description, 'kind', v_listing.kind,
    'equipment_type', v_listing.equipment_type, 'provider_type', v_listing.provider_type,
    'operator_included', v_listing.operator_included, 'service_radius_km', v_listing.service_radius_km,
    'rates', coalesce((select jsonb_object_agg(r.unit, r.rate_kobo) from public.listing_rates r where r.listing_id = v_listing.id), '{}'::jsonb),
    'provider', v_card, 'farm', jsonb_build_object('id', v_farm.id, 'name', v_farm.name),
    'distance_km', v_km, 'in_range', v_km <= v_listing.service_radius_km,
    'today', private.lagos_today());
end;
$$;

------------------------------------------------------------------------------------------------
-- 6. SMS worker (service role only)
------------------------------------------------------------------------------------------------

-- Shared secret between pg_cron (which wakes the worker) and the send-notifications Edge Function.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'notify_worker_secret') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
                                'notify_worker_secret', 'CultivaNode: pg_cron -> send-notifications worker');
  end if;
end $$;

create or replace function public.notify_worker_authorized(p_secret text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(length(p_secret) >= 32
                  and p_secret = (select decrypted_secret from vault.decrypted_secrets where name = 'notify_worker_secret'), false);
$$;

-- Takes up to p_limit due messages for sending and returns them with the recipient's phone and language.
-- Messages for suspended accounts or people without a phone are skipped, not sent.
create or replace function public.claim_sms_outbox(p_limit integer default 50)
returns table (id uuid, kind text, data jsonb, phone text, language public.app_language, attempts smallint)
language plpgsql security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  -- A worker that died mid-batch leaves rows in 'sending'; give them back after 10 minutes.
  update public.sms_outbox o set status = 'queued', locked_at = null
   where o.status = 'sending' and o.locked_at < now() - interval '10 minutes';

  update public.sms_outbox o set status = 'skipped', error_code = 'no_recipient', locked_at = null
    from public.profiles p
   where p.id = o.profile_id and o.status = 'queued'
     and (p.phone is null or p.suspended_at is not null);

  return query
  with due as (
    select o.id from public.sms_outbox o
     where o.status = 'queued' and o.next_attempt_at <= now()
     order by o.created_at
     limit greatest(1, least(coalesce(p_limit, 50), 200))
     for update skip locked
  ), taken as (
    update public.sms_outbox o
       set status = 'sending', attempts = o.attempts + 1, locked_at = now()
      from due where o.id = due.id
    returning o.id, o.kind, o.data, o.profile_id, o.attempts
  )
  select t.id, t.kind, t.data, p.phone, p.preferred_language, t.attempts
    from taken t join public.profiles p on p.id = t.profile_id;
end;
$$;

-- Records the result. A retryable failure goes back in the queue (5, then 10 minutes later) up to 3 attempts.
create or replace function public.finish_sms_outbox(p_id uuid, p_ok boolean, p_provider text, p_message_id text,
                                                    p_error text, p_retry boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.sms_outbox o
     set status = case when p_ok then 'sent' when p_retry and o.attempts < 3 then 'queued' else 'failed' end,
         next_attempt_at = case when not p_ok and p_retry and o.attempts < 3
                                then now() + make_interval(mins => 5 * o.attempts) else o.next_attempt_at end,
         sent_at = case when p_ok then now() end,
         provider = nullif(left(p_provider, 40), ''),
         message_id = nullif(left(p_message_id, 100), ''),
         error_code = case when p_ok then null else left(coalesce(p_error, 'unknown'), 80) end,
         locked_at = null
   where o.id = p_id and o.status = 'sending';
end;
$$;

-- Wakes the worker through pg_net when messages are due. Needs the vault secret 'functions_base_url'
-- (https://<project-ref>.supabase.co/functions/v1). Does nothing without pg_net or that setting.
create or replace function private.wake_notify_worker()
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_url    text := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_base_url');
  v_secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'notify_worker_secret');
begin
  if v_url is null or v_secret is null or not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_net') then
    return false;
  end if;
  if not exists (select 1 from public.sms_outbox where status = 'queued' and next_attempt_at <= now()) then
    return false;
  end if;
  execute 'select net.http_post(url := $1, body := ''{}''::jsonb, headers := $2, timeout_milliseconds := 55000)'
    using rtrim(v_url, '/') || '/send-notifications',
          jsonb_build_object('Content-Type', 'application/json', 'x-worker-secret', v_secret);
  return true;
end;
$$;

-- Staff overview for the admin console (week 4 builds the full bookings pages on this).
create or replace function public.admin_booking_stats()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform private.require_permission('bookings.read');
  return jsonb_build_object(
    'requested', (select count(*) from public.bookings where status = 'requested' and expires_at > now()),
    'accepted', (select count(*) from public.bookings where status = 'accepted'),
    'last_7_days', (select count(*) from public.bookings where created_at > now() - interval '7 days'),
    'accept_rate_30d', (select round(100.0 * count(*) filter (where status in ('accepted', 'cancelled') and responded_at is not null)
                                     / nullif(count(*) filter (where status <> 'requested'), 0))
                          from public.bookings where created_at > now() - interval '30 days'),
    'sms_failed_24h', (select count(*) from public.sms_outbox where status = 'failed' and created_at > now() - interval '24 hours'),
    'sms_waiting', (select count(*) from public.sms_outbox where status in ('queued', 'sending')));
end;
$$;

------------------------------------------------------------------------------------------------
-- 7. Schedules (hosted project: pg_cron and pg_net; skipped where the extensions are not installed)
------------------------------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_catalog.pg_available_extensions where name = 'pg_net') then
    execute 'create extension if not exists pg_net with schema extensions';
  end if;
  if exists (select 1 from pg_catalog.pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron';
    execute $q$select cron.schedule('cultivanode-expire-bookings', '*/5 * * * *', 'select private.expire_bookings()')$q$;
    execute $q$select cron.schedule('cultivanode-wake-sms-worker', '* * * * *', 'select private.wake_notify_worker()')$q$;
  end if;
end $$;

------------------------------------------------------------------------------------------------
-- 8. Grants
------------------------------------------------------------------------------------------------

revoke execute on function
  private.notify(uuid, text, uuid, jsonb, boolean),
  private.booking_message_data(public.bookings, uuid),
  private.booking_error(text, text, text),
  private.lagos_today(),
  private.booking_event(uuid, text, public.booking_status, public.booking_status, text),
  private.booking_for_change(uuid),
  private.expire_bookings(),
  private.effective_status(public.booking_status, timestamptz),
  private.wake_notify_worker()
  from public, anon, authenticated;

revoke execute on function
  public.request_booking(uuid, uuid, date, public.pricing_unit, numeric, text),
  public.accept_booking(uuid),
  public.decline_booking(uuid, text),
  public.cancel_booking(uuid, text),
  public.my_bookings(integer),
  public.booking_detail(uuid),
  public.listing_for_booking(uuid, uuid),
  public.mark_notifications_read(uuid[]),
  public.admin_booking_stats()
  from public, anon;
grant execute on function
  public.request_booking(uuid, uuid, date, public.pricing_unit, numeric, text),
  public.accept_booking(uuid),
  public.decline_booking(uuid, text),
  public.cancel_booking(uuid, text),
  public.my_bookings(integer),
  public.booking_detail(uuid),
  public.listing_for_booking(uuid, uuid),
  public.mark_notifications_read(uuid[]),
  public.admin_booking_stats()
  to authenticated;

-- The worker's functions: service role only.
revoke execute on function
  public.notify_worker_authorized(text),
  public.claim_sms_outbox(integer),
  public.finish_sms_outbox(uuid, boolean, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function
  public.notify_worker_authorized(text),
  public.claim_sms_outbox(integer),
  public.finish_sms_outbox(uuid, boolean, text, text, text, boolean)
  to service_role;
