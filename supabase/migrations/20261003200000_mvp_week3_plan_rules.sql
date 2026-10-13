-- CultivaNode MVP week 3: follow the master plan (decided by Quadri, 2026-10-03).
--
--   1. Disputes: the farmer or the provider opens one within the 48 hours after the proof upload (or while the job
--      is running; the farmer also for a no-show), choosing a reason (job not done, poor quality, wrong area, damage,
--      no-show) and attaching evidence photos. Resolution stays staff work (week 4).
--   2. Ratings: only completed, paid jobs (both sides marked the same amount).
--   3. Proof photos: before and after photos must carry GPS within the farm boundary (100 m tolerance), or within
--      1 km of the pin when the farm has no mapped boundary; taken after check-in.
--   4. Booking needs verification tier 1 (NIN matched to the name), as in the plan's tier table.
--   5. Storage: the provider uploads proof only while the job is in progress; either party uploads dispute
--      evidence while the booking is disputed.
--
-- Errors carry a stable code in HINT (new: tier_needed, dispute_window_closed).

------------------------------------------------------------------------------------------------
-- 1. Disputes: who, why, evidence
------------------------------------------------------------------------------------------------

alter table public.bookings
  add column dispute_category text check (dispute_category is null or dispute_category in
    ('job_not_done', 'poor_quality', 'wrong_area', 'damage', 'no_show')),
  add column disputed_by uuid references public.profiles (id) on delete restrict;
create index bookings_disputed_by_idx on public.bookings (disputed_by);
grant select (dispute_category, disputed_by) on public.bookings to authenticated;

alter table public.booking_proofs drop constraint booking_proofs_kind_check;
alter table public.booking_proofs add constraint booking_proofs_kind_check
  check (kind in ('before', 'after', 'extra', 'evidence'));

alter table public.booking_events drop constraint booking_events_event_check;
alter table public.booking_events add constraint booking_events_event_check
  check (event in ('requested', 'accepted', 'declined', 'cancelled', 'expired', 'checked_in', 'proof_submitted',
                   'confirmed', 'auto_confirmed', 'disputed', 'evidence_added', 'marked_paid', 'completed', 'rated'));

drop function public.dispute_booking(uuid, text);

-- Either side, with a reason category: while the job runs, or within the farmer's 48-hour window after the
-- proof upload; the farmer also when an accepted job's day passed with no check-in (a no-show).
create function public.dispute_booking(p_booking uuid, p_category text, p_details text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
  v_me      uuid := auth.uid();
  v_other   uuid;
  v_details text := nullif(left(trim(coalesce(p_details, '')), 500), '');
begin
  if p_category is null or p_category not in ('job_not_done', 'poor_quality', 'wrong_area', 'damage', 'no_show') then
    perform private.booking_error('Choose what went wrong.', 'reason_needed');
  end if;
  if v_booking.status = 'awaiting_confirmation' and v_booking.confirm_by <= now() then
    perform private.booking_error('The 48 hours to raise a problem have passed.', 'dispute_window_closed');
  end if;
  if not (v_booking.status in ('in_progress', 'awaiting_confirmation')
          or (v_booking.status = 'accepted' and v_booking.job_date < private.lagos_today() and v_me = v_booking.farmer_id)) then
    perform private.booking_error('This booking cannot be disputed now.', 'wrong_status');
  end if;

  update public.bookings
     set status = 'disputed', disputed_at = now(), dispute_category = p_category, dispute_reason = v_details,
         disputed_by = v_me
   where id = p_booking;
  perform private.booking_event(p_booking, 'disputed', v_booking.status, 'disputed',
                                p_category || coalesce(': ' || v_details, ''));
  v_other := case when v_me = v_booking.farmer_id then v_booking.provider_id else v_booking.farmer_id end;
  perform private.notify(v_other, 'booking_disputed', p_booking,
                         private.booking_message_data(v_booking, v_me) || jsonb_build_object('category', p_category), true);
end;
$$;

-- Evidence for an open dispute, from either side: the app uploads the stripped photo into
-- booking_id/my-id/ first; this records it (up to 10 per person per booking).
create or replace function public.add_dispute_evidence(
  p_booking  uuid,
  p_path     text,
  p_taken_at timestamptz,
  p_lat      double precision default null,
  p_lng      double precision default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_change(p_booking);
  v_me      uuid := auth.uid();
  v_point   extensions.geography;
  v_id      uuid;
begin
  if v_booking.status <> 'disputed' then
    perform private.booking_error('Evidence can be added while a dispute is open.', 'wrong_status');
  end if;
  if p_path is null or p_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9A-Za-z._-]{1,80}$'
     or (storage.foldername(p_path))[1] <> p_booking::text
     or (storage.foldername(p_path))[2] <> v_me::text then
    perform private.booking_error('That photo does not belong to this booking.', 'proof_not_found');
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'booking-proofs' and o.name = p_path) then
    perform private.booking_error('The photo did not upload. Try again.', 'proof_not_found');
  end if;
  if (select count(*) from public.booking_proofs pr
       where pr.booking_id = p_booking and pr.kind = 'evidence' and pr.uploader_id = v_me) >= 10 then
    perform private.booking_error('10 evidence photos are enough.', 'too_many_proofs');
  end if;
  if p_taken_at is null or p_taken_at > now() + interval '5 minutes' then
    perform private.booking_error('The photo time does not fit this job.', 'bad_photo_time');
  end if;
  if (p_lat is null) <> (p_lng is null)
     or (p_lat is not null and (p_lat not between -90 and 90 or p_lng not between -180 and 180)) then
    perform private.booking_error('We could not read the photo location.', 'no_gps');
  end if;
  if p_lat is not null then
    v_point := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  end if;

  insert into public.booking_proofs (booking_id, uploader_id, kind, storage_path, taken_at, gps, gps_distance_m)
  values (p_booking, v_me, 'evidence', p_path, p_taken_at, v_point,
          case when v_point is not null then round(extensions.st_distance(v_booking.job_location, v_point))::integer end)
  returning id into v_id;
  perform private.booking_event(p_booking, 'evidence_added', 'disputed', 'disputed', null);
  perform private.notify(case when v_me = v_booking.farmer_id then v_booking.provider_id else v_booking.farmer_id end,
                         'dispute_evidence_added', p_booking, private.booking_message_data(v_booking, v_me), false);
  return v_id;
end;
$$;

------------------------------------------------------------------------------------------------
-- 2. Ratings only on completed, paid jobs
------------------------------------------------------------------------------------------------

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
  -- Master plan: "Only completed, paid jobs can be rated, so fake reviews are hard."
  if v_booking.status <> 'completed' then
    perform private.booking_error('You can rate after the job is completed and paid.', 'wrong_status');
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

------------------------------------------------------------------------------------------------
-- 3. Proof photos carry GPS inside the farm
------------------------------------------------------------------------------------------------

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
  v_point   extensions.geography;
  v_boundary extensions.geography;
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
  -- Master plan: proof "must carry GPS within the farm boundary". Before and after photos need GPS; it must fall
  -- within 100 m of the mapped boundary (phone GPS error), or within 1 km of the pin when no boundary is mapped.
  if (p_lat is null) <> (p_lng is null) or (p_lat is null and p_kind in ('before', 'after')) then
    perform private.booking_error('Photos must carry the phone''s location. Turn on GPS and take the photo again.', 'no_gps');
  end if;
  if p_lat is not null then
    if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
      perform private.booking_error('We could not read the photo location.', 'no_gps');
    end if;
    v_point := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
    v_dist := round(extensions.st_distance(v_booking.job_location, v_point))::integer;
    select f.boundary into v_boundary from public.farms f where f.id = v_booking.farm_id;
    if (v_boundary is not null and not extensions.st_dwithin(v_boundary, v_point, 100))
       or (v_boundary is null and v_dist > 1000) then
      perform private.booking_error('That photo was not taken at the farm.', 'photo_too_far');
    end if;
  end if;

  insert into public.booking_proofs (booking_id, uploader_id, kind, storage_path, taken_at, gps, gps_distance_m, hectares)
  values (p_booking, auth.uid(), p_kind, p_path, p_taken_at,
          v_point,
          v_dist, p_hectares)
  returning id into v_id;
  return v_id;
end;
$$;

------------------------------------------------------------------------------------------------
-- 4. Booking needs tier 1 (NIN)
------------------------------------------------------------------------------------------------

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
  -- Master plan tier table: tier 1 (NIN matched to name) unlocks booking.
  if public.my_verification_tier() < 1 then
    perform private.booking_error('Verify your NIN before you book a job.', 'tier_needed', '42501');
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

------------------------------------------------------------------------------------------------
-- booking_detail: dispute category and side, evidence uploader, who may dispute, add evidence, rate
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
    'disputed_at', v_b.disputed_at, 'dispute_reason', v_b.dispute_reason, 'dispute_category', v_b.dispute_category,
    'disputed_by', case when v_b.disputed_by is null then null when v_b.disputed_by = v_b.farmer_id then 'farmer'
                        when v_b.disputed_by = v_b.provider_id then 'provider' else 'staff' end,
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
                 'gps_distance_m', pr.gps_distance_m, 'hectares', pr.hectares,
                 'by', case when pr.uploader_id = v_b.farmer_id then 'farmer' else 'provider' end) order by pr.created_at)
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
        'dispute', (v_side in ('farmer', 'provider')
                    and (v_status = 'in_progress' or (v_status = 'awaiting_confirmation' and v_b.confirm_by > now())))
                   or (v_side = 'farmer' and v_status = 'accepted' and v_b.job_date < private.lagos_today()),
        'add_evidence', v_side in ('farmer', 'provider') and v_status = 'disputed'
                        and (select count(*) from public.booking_proofs pr
                              where pr.booking_id = v_b.id and pr.kind = 'evidence' and pr.uploader_id = v_uid) < 10,
        'mark_paid', v_side in ('farmer', 'provider') and v_status in ('confirmed', 'completed')
                     and case when v_side = 'farmer' then v_b.farmer_paid_at is null
                              else v_b.provider_paid_at is null end,
        'rate', v_side in ('farmer', 'provider') and v_status = 'completed'
                and not exists (select 1 from public.ratings r where r.booking_id = v_b.id and r.rater_id = v_uid)),
    'events', coalesce((select jsonb_agg(jsonb_build_object(
                 'event', e.event, 'at', e.created_at, 'note', e.note,
                 'by', case when e.actor_id is null then 'system' when e.actor_id = v_b.farmer_id then 'farmer'
                            when e.actor_id = v_b.provider_id then 'provider' else 'staff' end) order by e.id)
                 from public.booking_events e where e.booking_id = v_b.id), '[]'::jsonb));
end;
$$;

------------------------------------------------------------------------------------------------
-- 5. Storage: proof uploads while the job runs; evidence uploads by either party while disputed
------------------------------------------------------------------------------------------------

drop policy "proofs: provider uploads into the booking folder" on storage.objects;
create policy "proofs: provider uploads into the booking folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'booking-proofs'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (select 1 from public.bookings b
                 where b.id = (storage.foldername(name))[1]::uuid
                   and b.provider_id = (select auth.uid())
                   and b.status = 'in_progress'));
create policy "proofs: either party uploads dispute evidence" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'booking-proofs'
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (select 1 from public.bookings b
                 where b.id = (storage.foldername(name))[1]::uuid
                   and (select auth.uid()) in (b.farmer_id, b.provider_id)
                   and b.status = 'disputed'));

------------------------------------------------------------------------------------------------
-- Grants
------------------------------------------------------------------------------------------------

revoke execute on function
  public.dispute_booking(uuid, text, text),
  public.add_dispute_evidence(uuid, text, timestamptz, double precision, double precision)
  from public, anon;
grant execute on function
  public.dispute_booking(uuid, text, text),
  public.add_dispute_evidence(uuid, text, timestamptz, double precision, double precision)
  to authenticated;
