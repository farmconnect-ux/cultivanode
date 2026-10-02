-- CultivaNode MVP week 3: the job is done, proven and confirmed.
--
--   1. The provider checks in on the job day, by GPS, within 1 km of the farm pin (PostGIS).
--   2. Proof photos live in a private booking-proofs bucket (booking_id/provider_id/...). The apps strip
--      EXIF before upload; submit_proof() checks the file exists, its path, the time and the GPS, and
--      records it. finish_booking_work() needs at least one 'before' and one 'after' photo.
--   3. The farmer confirms or disputes within 48 hours; pg_cron auto-confirms after 48 hours of silence.
--      A farmer can also dispute an accepted job whose day passed with no check-in (a no-show), or a job
--      in progress that went wrong.
--   4. mark_paid(): each side records what was paid/received directly (no money moves through CultivaNode
--      in the pilot). Matching amounts complete the booking; a mismatch flags it for staff.
--   5. Ratings: one per side per booking, only after confirmation; the provider's average shows in search
--      through the provider card.
--
-- Errors carry a stable code in HINT, which the apps translate. The new booking states were added in
-- 20261002093000_w3_enums.sql.

------------------------------------------------------------------------------------------------
-- 1. Bookings: job execution, confirmation and payment columns
------------------------------------------------------------------------------------------------

alter table public.bookings
  add column checked_in_at        timestamptz,
  add column check_in_location    extensions.geography(Point, 4326),
  add column check_in_distance_m  integer check (check_in_distance_m is null or check_in_distance_m between 0 and 100000),
  add column work_submitted_at    timestamptz,
  add column confirm_by           timestamptz,
  add column hectares_done        numeric(10, 2) check (hectares_done is null or (hectares_done > 0 and hectares_done <= 10000)),
  add column disputed_at          timestamptz,
  add column dispute_reason       text check (dispute_reason is null or char_length(dispute_reason) <= 500),
  add column farmer_paid_at       timestamptz,
  add column farmer_paid_kobo     bigint check (farmer_paid_kobo is null or farmer_paid_kobo > 0),
  add column provider_paid_at     timestamptz,
  add column provider_paid_kobo   bigint check (provider_paid_kobo is null or provider_paid_kobo > 0),
  add column payment_disputed     boolean not null default false;

create index bookings_awaiting_idx on public.bookings (confirm_by) where status = 'awaiting_confirmation';
create index bookings_payment_disputed_idx on public.bookings (payment_disputed) where payment_disputed;

comment on column public.bookings.check_in_location is 'The provider''s GPS at check-in. Not readable through the API; booking_detail() shows the distance, not the point.';
comment on column public.bookings.confirm_by is 'The farmer''s 48-hour window to confirm or dispute after proof is submitted. pg_cron confirms after it.';
comment on column public.bookings.payment_disputed is 'The two sides marked different amounts. Staff see this in the admin console (week 4).';

-- The history learns the new steps.
alter table public.booking_events drop constraint booking_events_event_check;
alter table public.booking_events add constraint booking_events_event_check
  check (event in ('requested', 'accepted', 'declined', 'cancelled', 'expired', 'checked_in', 'proof_submitted',
                   'confirmed', 'auto_confirmed', 'disputed', 'marked_paid', 'completed', 'rated'));

------------------------------------------------------------------------------------------------
-- 2. Proof photos
------------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-proofs', 'booking-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create table public.booking_proofs (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings (id) on delete restrict,
  uploader_id  uuid not null references public.profiles (id) on delete restrict,
  kind         text not null check (kind in ('before', 'after', 'extra')),
  storage_path text not null check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9A-Za-z._-]{1,80}$'),
  taken_at     timestamptz not null,
  gps          extensions.geography(Point, 4326),
  gps_distance_m integer check (gps_distance_m is null or gps_distance_m between 0 and 1000000),
  hectares     numeric(10, 2) check (hectares is null or (hectares > 0 and hectares <= 10000)),
  created_at   timestamptz not null default now(),
  unique (booking_id, storage_path)
);
create index booking_proofs_booking_idx on public.booking_proofs (booking_id, created_at);
create index booking_proofs_uploader_idx on public.booking_proofs (uploader_id);
comment on table public.booking_proofs is
  'Proof-of-work photos: one row per uploaded picture, written by submit_proof() after checks. EXIF is stripped by the app before upload; GPS and time are stored here instead.';

alter table public.booking_proofs enable row level security;
create policy "booking_proofs: the two parties and staff" on public.booking_proofs
  for select to authenticated
  using (exists (select 1 from public.bookings b
                  where b.id = booking_id
                    and ((select auth.uid()) in (b.farmer_id, b.provider_id)
                         or (select public.has_permission('bookings.read')))));
revoke all on public.booking_proofs from anon, authenticated;
grant select on public.booking_proofs to authenticated;

-- Storage: the provider uploads into booking_id/their-own-id/ while the job is running; the two parties
-- and staff read. Paths that are not a uuid pair never match, so the uuid cast cannot fail.
create policy "proofs: provider uploads into the booking folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'booking-proofs'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (select 1 from public.bookings b
                 where b.id = (storage.foldername(name))[1]::uuid
                   and b.provider_id = (select auth.uid())
                   and b.status in ('accepted', 'in_progress')));
create policy "proofs: the two parties and staff read" on storage.objects
  for select to authenticated
  using (bucket_id = 'booking-proofs'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$'
    and exists (select 1 from public.bookings b
                 where b.id = (storage.foldername(name))[1]::uuid
                   and ((select auth.uid()) in (b.farmer_id, b.provider_id)
                        or (select public.has_permission('bookings.read')))));

------------------------------------------------------------------------------------------------
-- 3. Check-in and proof
------------------------------------------------------------------------------------------------

-- The provider arrives: on the job day, within 1 km of the farm pin.
create or replace function public.check_in_booking(p_booking uuid, p_lat double precision, p_lng double precision)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
  v_point   extensions.geography;
  v_dist    integer;
begin
  if v_booking.provider_id <> auth.uid() then
    perform private.booking_error('Only the provider can check in.', 'not_allowed', '42501');
  end if;
  if v_booking.status <> 'accepted' then
    perform private.booking_error('This booking has already moved on.', 'wrong_status');
  end if;
  if v_booking.job_date <> private.lagos_today() then
    perform private.booking_error('Check in on the day of the job.', 'not_job_day');
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    perform private.booking_error('We could not read your location. Turn on GPS and try again.', 'no_gps');
  end if;
  if not private.account_active(v_booking.farmer_id) then
    perform private.booking_error('The farmer''s account is not active.', 'counterpart_unavailable');
  end if;

  v_point := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  v_dist := round(extensions.st_distance(v_booking.job_location, v_point))::integer;
  if v_dist > 1000 then
    perform private.booking_error('You are more than 1 km from the farm. Check in when you arrive.', 'too_far_from_farm');
  end if;

  update public.bookings
     set status = 'in_progress', checked_in_at = now(), check_in_location = v_point, check_in_distance_m = v_dist
   where id = p_booking;
  perform private.booking_event(p_booking, 'checked_in', 'accepted', 'in_progress', null);
  perform private.notify(v_booking.farmer_id, 'job_checked_in', p_booking,
                         private.booking_message_data(v_booking, v_booking.provider_id), true);
end;
$$;

-- One photo of proof. The app uploads the stripped file first; this records and checks it.
create or replace function public.submit_proof(
  p_booking  uuid,
  p_path     text,
  p_kind     text,
  p_taken_at timestamptz,
  p_lat      double precision default null,
  p_lng      double precision default null,
  p_hectares numeric default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
  v_dist    integer;
  v_id      uuid;
begin
  if v_booking.provider_id <> auth.uid() then
    perform private.booking_error('Only the provider can add proof.', 'not_allowed', '42501');
  end if;
  if v_booking.status <> 'in_progress' then
    perform private.booking_error('Check in at the farm first.', 'wrong_status');
  end if;
  if p_kind not in ('before', 'after', 'extra') then
    perform private.booking_error('Unknown photo kind.', 'bad_kind');
  end if;
  if p_path is null or p_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9A-Za-z._-]{1,80}$'
     or (storage.foldername(p_path))[1] <> p_booking::text
     or (storage.foldername(p_path))[2] <> auth.uid()::text then
    perform private.booking_error('That photo does not belong to this booking.', 'proof_not_found');
  end if;
  if not exists (select 1 from storage.objects o
                  where o.bucket_id = 'booking-proofs' and o.name = p_path) then
    perform private.booking_error('The photo did not upload. Try again.', 'proof_not_found');
  end if;
  if (select count(*) from public.booking_proofs pr where pr.booking_id = p_booking) >= 20 then
    perform private.booking_error('20 photos are enough for one job.', 'too_many_proofs');
  end if;
  if p_taken_at is null or p_taken_at > now() + interval '5 minutes'
     or p_taken_at < v_booking.checked_in_at - interval '2 hours' then
    perform private.booking_error('The photo time does not fit this job.', 'bad_photo_time');
  end if;
  if (p_lat is null) <> (p_lng is null) then
    perform private.booking_error('We could not read the photo location.', 'no_gps');
  end if;
  if p_lat is not null then
    if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
      perform private.booking_error('We could not read the photo location.', 'no_gps');
    end if;
    v_dist := round(extensions.st_distance(v_booking.job_location,
        extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography))::integer;
    if v_dist > 2000 then
      perform private.booking_error('That photo was taken more than 2 km from the farm.', 'photo_too_far');
    end if;
  end if;

  insert into public.booking_proofs (booking_id, uploader_id, kind, storage_path, taken_at, gps, gps_distance_m, hectares)
  values (p_booking, auth.uid(), p_kind, p_path, p_taken_at,
          case when p_lat is not null
               then extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography end,
          v_dist, p_hectares)
  returning id into v_id;
  return v_id;
end;
$$;

-- The job is done: needs at least one 'before' and one 'after' photo. The farmer's 48 hours start now.
create or replace function public.finish_booking_work(p_booking uuid, p_hectares numeric default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
begin
  if v_booking.provider_id <> auth.uid() then
    perform private.booking_error('Only the provider can finish the job.', 'not_allowed', '42501');
  end if;
  if v_booking.status <> 'in_progress' then
    perform private.booking_error('This booking has already moved on.', 'wrong_status');
  end if;
  if not exists (select 1 from public.booking_proofs pr where pr.booking_id = p_booking and pr.kind = 'before')
     or not exists (select 1 from public.booking_proofs pr where pr.booking_id = p_booking and pr.kind = 'after') then
    perform private.booking_error('Add at least one before and one after photo first.', 'proof_needed');
  end if;

  update public.bookings
     set status = 'awaiting_confirmation', work_submitted_at = now(), confirm_by = now() + interval '48 hours',
         hectares_done = coalesce(p_hectares, (select max(pr.hectares) from public.booking_proofs pr where pr.booking_id = p_booking))
   where id = p_booking;
  perform private.booking_event(p_booking, 'proof_submitted', 'in_progress', 'awaiting_confirmation', null);
  perform private.notify(v_booking.farmer_id, 'proof_submitted', p_booking,
                         private.booking_message_data(v_booking, v_booking.provider_id), true);
end;
$$;

------------------------------------------------------------------------------------------------
-- 4. Confirm, dispute, auto-confirm
------------------------------------------------------------------------------------------------

create or replace function public.confirm_booking(p_booking uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
begin
  if v_booking.farmer_id <> auth.uid() then
    perform private.booking_error('Only the farmer can confirm the job.', 'not_allowed', '42501');
  end if;
  if v_booking.status <> 'awaiting_confirmation' then
    perform private.booking_error('There is no finished work to confirm yet.', 'wrong_status');
  end if;

  update public.bookings set status = 'confirmed' where id = p_booking;
  perform private.booking_event(p_booking, 'confirmed', 'awaiting_confirmation', 'confirmed', null);
  perform private.notify(v_booking.provider_id, 'booking_confirmed', p_booking,
                         private.booking_message_data(v_booking, v_booking.farmer_id), true);
end;
$$;

-- A problem with the job: finished work within the 48-hour window, a job in progress that went wrong,
-- or an accepted job whose day passed with no check-in (a no-show). Resolution is staff work (week 4).
create or replace function public.dispute_booking(p_booking uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
  v_reason  text := nullif(left(trim(coalesce(p_reason, '')), 500), '');
begin
  if v_booking.farmer_id <> auth.uid() then
    perform private.booking_error('Only the farmer can open a dispute.', 'not_allowed', '42501');
  end if;
  if v_reason is null or char_length(v_reason) < 5 then
    perform private.booking_error('Say what went wrong (at least 5 characters).', 'reason_needed');
  end if;
  if not (v_booking.status in ('in_progress', 'awaiting_confirmation')
          or (v_booking.status = 'accepted' and v_booking.job_date < private.lagos_today())) then
    perform private.booking_error('This booking cannot be disputed now.', 'wrong_status');
  end if;

  update public.bookings set status = 'disputed', disputed_at = now(), dispute_reason = v_reason where id = p_booking;
  perform private.booking_event(p_booking, 'disputed', v_booking.status, 'disputed', v_reason);
  perform private.notify(v_booking.provider_id, 'booking_disputed', p_booking,
                         private.booking_message_data(v_booking, v_booking.farmer_id) || jsonb_build_object('reason', v_reason), true);
end;
$$;

-- Silence means consent: 48 hours after the proof went in, the job is confirmed. Run by pg_cron.
create or replace function private.auto_confirm_bookings()
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
     where status = 'awaiting_confirmation' and confirm_by <= now()
     order by confirm_by
     limit 500
     for update skip locked
  loop
    update public.bookings set status = 'confirmed' where id = v_booking.id;
    insert into public.booking_events (booking_id, actor_id, event, from_status, to_status, note)
    values (v_booking.id, null, 'auto_confirmed', 'awaiting_confirmation', 'confirmed', 'No answer within 48 hours');
    perform private.notify(v_booking.provider_id, 'booking_confirmed', v_booking.id,
                           private.booking_message_data(v_booking, v_booking.farmer_id)
                           || jsonb_build_object('auto', true), true);
    perform private.notify(v_booking.farmer_id, 'booking_auto_confirmed', v_booking.id,
                           private.booking_message_data(v_booking, v_booking.provider_id), false);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

------------------------------------------------------------------------------------------------
-- 5. Marked paid (no money moves through CultivaNode in the pilot)
------------------------------------------------------------------------------------------------

-- Each side records what was paid or received, in kobo. Matching amounts complete the booking;
-- a mismatch flags it for staff instead.
create or replace function public.mark_paid(p_booking uuid, p_amount_kobo bigint)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
  v_me      uuid := auth.uid();
  v_other   uuid;
begin
  if v_booking.status not in ('confirmed', 'completed') then
    perform private.booking_error('The farmer confirms the finished work first.', 'wrong_status');
  end if;
  if p_amount_kobo is null or p_amount_kobo <= 0 or p_amount_kobo > 1000000000000 then
    perform private.booking_error('Enter the amount in naira.', 'bad_amount');
  end if;

  if v_me = v_booking.farmer_id then
    if v_booking.farmer_paid_at is not null then
      perform private.booking_error('You already marked this job.', 'wrong_status');
    end if;
    update public.bookings set farmer_paid_at = now(), farmer_paid_kobo = p_amount_kobo where id = p_booking;
    v_other := v_booking.provider_id;
  else
    if v_booking.provider_paid_at is not null then
      perform private.booking_error('You already marked this job.', 'wrong_status');
    end if;
    update public.bookings set provider_paid_at = now(), provider_paid_kobo = p_amount_kobo where id = p_booking;
    v_other := v_booking.farmer_id;
  end if;
  perform private.booking_event(p_booking, 'marked_paid', v_booking.status, v_booking.status, null);

  select * into v_booking from public.bookings where id = p_booking;
  if v_booking.farmer_paid_at is not null and v_booking.provider_paid_at is not null then
    if v_booking.farmer_paid_kobo = v_booking.provider_paid_kobo then
      update public.bookings set status = 'completed' where id = p_booking;
      perform private.booking_event(p_booking, 'completed', 'confirmed', 'completed', null);
      perform private.notify(v_booking.farmer_id, 'booking_completed', p_booking,
                             private.booking_message_data(v_booking, v_booking.provider_id), true);
      perform private.notify(v_booking.provider_id, 'booking_completed', p_booking,
                             private.booking_message_data(v_booking, v_booking.farmer_id), true);
    else
      update public.bookings set payment_disputed = true where id = p_booking;
      perform private.notify(v_other, 'payment_mismatch', p_booking,
                             private.booking_message_data(v_booking, v_me), true);
      perform private.notify(v_me, 'payment_mismatch', p_booking,
                             private.booking_message_data(v_booking, v_other), false);
    end if;
  else
    perform private.notify(v_other, 'payment_marked', p_booking,
                           private.booking_message_data(v_booking, v_me), true);
  end if;
end;
$$;

------------------------------------------------------------------------------------------------
-- 6. Ratings
------------------------------------------------------------------------------------------------

create table public.ratings (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete restrict,
  rater_id    uuid not null references public.profiles (id) on delete restrict,
  ratee_id    uuid not null references public.profiles (id) on delete restrict,
  stars       smallint not null check (stars between 1 and 5),
  tags        text[] not null default '{}'
              check (tags <@ array['on_time', 'good_work', 'careful', 'fair_price', 'good_communication',
                                   'late', 'poor_work', 'overcharged', 'rude', 'no_show']::text[]
                     and cardinality(tags) <= 5),
  comment     text check (comment is null or char_length(comment) <= 500),
  created_at  timestamptz not null default now(),
  unique (booking_id, rater_id),
  constraint ratings_two_people check (rater_id <> ratee_id)
);
create index ratings_ratee_idx on public.ratings (ratee_id);
create index ratings_booking_idx on public.ratings (booking_id);
comment on table public.ratings is 'One rating per side per booking, only after the farmer confirmed the work. The provider average shows in search through the provider card.';

alter table public.ratings enable row level security;
create policy "ratings: the two parties and staff" on public.ratings
  for select to authenticated
  using ((select auth.uid()) in (rater_id, ratee_id) or (select public.has_permission('bookings.read')));
revoke all on public.ratings from anon, authenticated;
grant select on public.ratings to authenticated;

create or replace function public.rate_booking(
  p_booking uuid,
  p_stars   integer,
  p_tags    text[] default '{}',
  p_comment text default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
  v_me      uuid := auth.uid();
  v_other   uuid := case when v_me = v_booking.farmer_id then v_booking.provider_id else v_booking.farmer_id end;
begin
  if v_booking.status not in ('confirmed', 'completed') then
    perform private.booking_error('You can rate after the job is confirmed.', 'wrong_status');
  end if;
  if p_stars is null or p_stars < 1 or p_stars > 5 then
    perform private.booking_error('Choose 1 to 5 stars.', 'bad_rating');
  end if;

  begin
    insert into public.ratings (booking_id, rater_id, ratee_id, stars, tags, comment)
    values (p_booking, v_me, v_other, p_stars,
            coalesce(p_tags, '{}'), nullif(left(trim(coalesce(p_comment, '')), 500), ''));
  exception when unique_violation then
    perform private.booking_error('You already rated this job.', 'already_rated');
    when check_violation then
    perform private.booking_error('Unknown rating tag.', 'bad_rating');
  end;

  perform private.booking_event(p_booking, 'rated', v_booking.status, v_booking.status, null);
  perform private.notify(v_other, 'rating_received', p_booking,
                         private.booking_message_data(v_booking, v_me) || jsonb_build_object('stars', p_stars), false);
end;
$$;

-- The public provider card gains the rating average (null when nobody rated yet).
create or replace function private.provider_card(p_profile uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'name', coalesce(split_part(trim(p.full_name), ' ', 1), ''),
           'state', p.state,
           'tier', p.verification_tier,
           'rating', (select jsonb_build_object('avg', round(avg(r.stars)::numeric, 1), 'count', count(*))
                        from public.ratings r where r.ratee_id = p.id))
    from public.profiles p
   where p.id = p_profile and p.suspended_at is null;
$$;

------------------------------------------------------------------------------------------------
-- 7. booking_detail learns the job flow
------------------------------------------------------------------------------------------------

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
  -- Once agreed, both sides keep the pin and each other's phone through the job and its records.
  v_agreed := v_status in ('accepted', 'in_progress', 'awaiting_confirmation', 'confirmed', 'disputed', 'completed');
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
    'checked_in_at', v_b.checked_in_at, 'check_in_distance_m', v_b.check_in_distance_m,
    'work_submitted_at', v_b.work_submitted_at, 'confirm_by', v_b.confirm_by,
    'hectares_done', v_b.hectares_done,
    'disputed_at', v_b.disputed_at, 'dispute_reason', v_b.dispute_reason,
    'payment', jsonb_build_object(
      'mine', case when v_side = 'farmer' and v_b.farmer_paid_at is not null
                   then jsonb_build_object('at', v_b.farmer_paid_at, 'kobo', v_b.farmer_paid_kobo)
                   when v_side = 'provider' and v_b.provider_paid_at is not null
                   then jsonb_build_object('at', v_b.provider_paid_at, 'kobo', v_b.provider_paid_kobo)
                   when v_side = 'staff'
                   then jsonb_build_object('farmer', v_b.farmer_paid_kobo, 'provider', v_b.provider_paid_kobo) end,
      'theirs_marked', case when v_side = 'farmer' then v_b.provider_paid_at is not null
                            when v_side = 'provider' then v_b.farmer_paid_at is not null
                            else null end,
      'disputed', v_b.payment_disputed),
    'other', v_contact,
    'location', case when v_side <> 'provider' or v_agreed then jsonb_build_object(
        'lat', extensions.st_y(v_b.job_location::extensions.geometry),
        'lng', extensions.st_x(v_b.job_location::extensions.geometry),
        'hint', (select f.address_hint from public.farms f where f.id = v_b.farm_id)) end,
    'proofs', coalesce((select jsonb_agg(jsonb_build_object(
                 'id', pr.id, 'kind', pr.kind, 'path', pr.storage_path, 'taken_at', pr.taken_at,
                 'gps_distance_m', pr.gps_distance_m, 'hectares', pr.hectares) order by pr.created_at)
                 from public.booking_proofs pr where pr.booking_id = v_b.id), '[]'::jsonb),
    'my_rating', (select jsonb_build_object('stars', r.stars, 'tags', r.tags, 'comment', r.comment)
                    from public.ratings r where r.booking_id = v_b.id and r.rater_id = v_uid),
    'their_rating', (select jsonb_build_object('stars', r.stars, 'tags', r.tags, 'comment', r.comment)
                       from public.ratings r where r.booking_id = v_b.id and r.ratee_id = v_uid),
    'can', jsonb_build_object(
        'accept', v_side = 'provider' and v_status = 'requested',
        'decline', v_side = 'provider' and v_status = 'requested',
        'cancel', (v_side = 'farmer' and v_status = 'requested')
                  or (v_side in ('farmer', 'provider') and v_status = 'accepted' and v_b.job_date >= private.lagos_today()),
        'check_in', v_side = 'provider' and v_status = 'accepted' and v_b.job_date = private.lagos_today(),
        'submit_proof', v_side = 'provider' and v_status = 'in_progress',
        'confirm', v_side = 'farmer' and v_status = 'awaiting_confirmation',
        'dispute', v_side = 'farmer' and (v_status in ('in_progress', 'awaiting_confirmation')
                   or (v_status = 'accepted' and v_b.job_date < private.lagos_today())),
        'mark_paid', v_side in ('farmer', 'provider') and v_status in ('confirmed', 'completed')
                     and case when v_side = 'farmer' then v_b.farmer_paid_at is null
                              else v_b.provider_paid_at is null end,
        'rate', v_side in ('farmer', 'provider') and v_status in ('confirmed', 'completed')
                and not exists (select 1 from public.ratings r where r.booking_id = v_b.id and r.rater_id = v_uid)),
    'events', coalesce((select jsonb_agg(jsonb_build_object(
                 'event', e.event, 'at', e.created_at, 'note', e.note,
                 'by', case when e.actor_id is null then 'system' when e.actor_id = v_b.farmer_id then 'farmer'
                            when e.actor_id = v_b.provider_id then 'provider' else 'staff' end) order by e.id)
                 from public.booking_events e where e.booking_id = v_b.id), '[]'::jsonb));
end;
$$;

-- Staff overview gains the new queues.
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
    'in_progress', (select count(*) from public.bookings where status = 'in_progress'),
    'awaiting_confirmation', (select count(*) from public.bookings where status = 'awaiting_confirmation'),
    'disputed', (select count(*) from public.bookings where status = 'disputed'),
    'payment_disputed', (select count(*) from public.bookings where payment_disputed),
    'last_7_days', (select count(*) from public.bookings where created_at > now() - interval '7 days'),
    'accept_rate_30d', (select round(100.0 * count(*) filter (where status in ('accepted', 'cancelled') and responded_at is not null)
                                     / nullif(count(*) filter (where status <> 'requested'), 0))
                          from public.bookings where created_at > now() - interval '30 days'),
    'sms_failed_24h', (select count(*) from public.sms_outbox where status = 'failed' and created_at > now() - interval '24 hours'),
    'sms_waiting', (select count(*) from public.sms_outbox where status in ('queued', 'sending')));
end;
$$;

------------------------------------------------------------------------------------------------
-- 8. Paystack registered as the payment provider (test mode first; the adapter itself is M5 work)
------------------------------------------------------------------------------------------------

insert into public.integration_providers (code, kind, name, description, docs_url, implemented, test_only, config_fields, secret_fields, sort_order)
values ('paystack', 'payment', 'Paystack',
        'Nigerian-licensed collections and payouts: card, bank transfer and USSD. Registered now so keys can be held in the Vault; the charge, escrow and payout adapters are built in M5 after legal sign-off. PAYMENT_MODE stays test until then.',
        'https://paystack.com/docs', false, false,
        '[{"key":"public_key","label":"Public key","required":true,"help":"Starts with pk_test_ or pk_live_. Paystack Dashboard > Settings > API keys."},
          {"key":"base_url","label":"API address","required":true,"default":"https://api.paystack.co","help":"Leave as it is."}]'::jsonb,
        '[{"key":"secret_key","label":"Secret key","required":true,"help":"Starts with sk_test_ or sk_live_. Never shared with the apps."}]'::jsonb,
        40)
on conflict (code) do nothing;

------------------------------------------------------------------------------------------------
-- 9. Schedules
------------------------------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_catalog.pg_available_extensions where name = 'pg_cron') then
    execute $q$select cron.schedule('cultivanode-autoconfirm-bookings', '*/15 * * * *', 'select private.auto_confirm_bookings()')$q$;
  end if;
end $$;

------------------------------------------------------------------------------------------------
-- 10. Grants
------------------------------------------------------------------------------------------------

revoke execute on function private.auto_confirm_bookings() from public, anon, authenticated;

revoke execute on function
  public.check_in_booking(uuid, double precision, double precision),
  public.submit_proof(uuid, text, text, timestamptz, double precision, double precision, numeric),
  public.finish_booking_work(uuid, numeric),
  public.confirm_booking(uuid),
  public.dispute_booking(uuid, text),
  public.mark_paid(uuid, bigint),
  public.rate_booking(uuid, integer, text[], text)
  from public, anon;
grant execute on function
  public.check_in_booking(uuid, double precision, double precision),
  public.submit_proof(uuid, text, text, timestamptz, double precision, double precision, numeric),
  public.finish_booking_work(uuid, numeric),
  public.confirm_booking(uuid),
  public.dispute_booking(uuid, text),
  public.mark_paid(uuid, bigint),
  public.rate_booking(uuid, integer, text[], text)
  to authenticated;
