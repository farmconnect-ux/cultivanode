-- MVP week 3: check-in by GPS, proof photos, confirm/dispute, marked-paid, ratings — through the
-- transition functions only; forged changes, wrong actors, distance and time rules are enforced
-- by the database; the auto-confirm sweep and the provider rating card work.
begin;
create extension if not exists pgtap with schema extensions;
select plan(97);

insert into auth.users (id, phone) values
  ('c3000000-0000-0000-0000-000000000001', '2348000003001'),  -- Sade: super admin
  ('c3000000-0000-0000-0000-000000000002', '2348000003002'),  -- Tunde: support and disputes (bookings.read)
  ('c3000000-0000-0000-0000-000000000004', '2348000003004'),  -- Kemi: farmer in Oyo
  ('c3000000-0000-0000-0000-000000000005', '2348000003005'),  -- Lanre: tractor owner in Oyo, tier 2
  ('c3000000-0000-0000-0000-000000000007', '2348000003007');  -- Ada: another farmer (third party)
insert into public.admin_roles (profile_id, admin_role) values
  ('c3000000-0000-0000-0000-000000000001', 'super_admin'),
  ('c3000000-0000-0000-0000-000000000002', 'support_disputes');
update public.profiles set onboarded_at = now(), full_name = v.n, state = v.s, phone = v.ph
  from (values ('c3000000-0000-0000-0000-000000000001'::uuid, 'Sade Admin', 'Lagos', '2348000003001'),
               ('c3000000-0000-0000-0000-000000000002'::uuid, 'Tunde Support', 'Oyo', '2348000003002'),
               ('c3000000-0000-0000-0000-000000000004'::uuid, 'Kemi Adewale', 'Oyo', '2348000003004'),
               ('c3000000-0000-0000-0000-000000000005'::uuid, 'Lanre Adeyemi', 'Oyo', '2348000003005'),
               ('c3000000-0000-0000-0000-000000000007'::uuid, 'Ada Obi', 'Oyo', '2348000003007')) v(i, n, s, ph)
 where id = v.i;
insert into public.user_roles (profile_id, role) values
  ('c3000000-0000-0000-0000-000000000004', 'crop_farmer'),
  ('c3000000-0000-0000-0000-000000000005', 'machinery_owner'),
  ('c3000000-0000-0000-0000-000000000007', 'crop_farmer');
update public.profiles set verification_tier = 2 where id = 'c3000000-0000-0000-0000-000000000005';
-- Farmers have verified their NIN (tier 1): booking needs it (master plan tier table).
update public.profiles set verification_tier = 1 where id in ('c3000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000007');
insert into public.farms (id, owner_id, name, location, state, address_hint) values
  ('c3000000-0000-0000-0000-0000000000f4', 'c3000000-0000-0000-0000-000000000004', 'Kemi maize', 'SRID=4326;POINT(3.8967 7.3775)', 'Oyo', 'Behind the church'),
  ('c3000000-0000-0000-0000-0000000000f9', 'c3000000-0000-0000-0000-000000000004', 'Kemi second', 'SRID=4326;POINT(3.8970 7.3780)', 'Oyo', null);
insert into public.listings (id, owner_id, kind, equipment_type, title, location, service_radius_km, status)
values ('c3000000-0000-0000-0000-0000000000a1', 'c3000000-0000-0000-0000-000000000005', 'equipment', 'tractor',
        'Lanre 75hp tractor', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active');
insert into public.listing_rates (listing_id, unit, rate_kobo) values
  ('c3000000-0000-0000-0000-0000000000a1', 'hectare', 2500000),
  ('c3000000-0000-0000-0000-0000000000a1', 'day', 9000000);
update public.feature_flags set enabled = true, states = array['Oyo'] where key = 'marketplace_live';

create function pg_temp.day(n integer) returns date language sql stable as $$
  select (now() at time zone 'Africa/Lagos')::date + n $$;
-- Booking ids are kept in a temporary table: psql variables are not filled in inside the $$ strings
-- that pgTAP runs, so every check reads them through pg_temp.r().
create table pg_temp.ids (k text primary key, id uuid not null);
create function pg_temp.keep(p_k text, p_id uuid) returns void language sql security definer as $$
  insert into pg_temp.ids values (p_k, p_id) $$;
create function pg_temp.r(p_k text) returns uuid language sql stable security definer as $$
  select id from pg_temp.ids where k = p_k $$;
grant execute on all functions in schema pg_temp to authenticated, service_role;

---------------------------------------------------------------- 0. four agreed jobs
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
do $$ begin perform pg_temp.keep('r1', public.request_booking('c3000000-0000-0000-0000-0000000000a1', 'c3000000-0000-0000-0000-0000000000f4',
  pg_temp.day(0), 'hectare', 2.5, null)); end $$;
do $$ begin perform pg_temp.keep('r2', public.request_booking('c3000000-0000-0000-0000-0000000000a1', 'c3000000-0000-0000-0000-0000000000f9',
  pg_temp.day(1), 'day', 1, null)); end $$;
do $$ begin perform pg_temp.keep('r3', public.request_booking('c3000000-0000-0000-0000-0000000000a1', 'c3000000-0000-0000-0000-0000000000f9',
  pg_temp.day(2), 'hectare', 1, null)); end $$;
do $$ begin perform pg_temp.keep('r4', public.request_booking('c3000000-0000-0000-0000-0000000000a1', 'c3000000-0000-0000-0000-0000000000f9',
  pg_temp.day(3), 'day', 1, null)); end $$;
select isnt(pg_temp.r('r1'), null, 'r1: a job for today');
select isnt(pg_temp.r('r2'), null, 'r2: a job for tomorrow');
select isnt(pg_temp.r('r3'), null, 'r3: a job in two days');
select isnt(pg_temp.r('r4'), null, 'r4: a job in three days');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ select public.accept_booking(pg_temp.r('r1')) $$, 'the provider accepts r1');
select lives_ok($$ select public.accept_booking(pg_temp.r('r2')) $$, '... r2');
select lives_ok($$ select public.accept_booking(pg_temp.r('r3')) $$, '... r3');
select lives_ok($$ select public.accept_booking(pg_temp.r('r4')) $$, '... r4');

---------------------------------------------------------------- 1. check-in
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
select throws_ok($$ select public.check_in_booking(pg_temp.r('r1'), 7.3775, 3.8967) $$, '42501', 'Only the provider can check in.',
  'the farmer cannot check in');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ select public.check_in_booking(pg_temp.r('r4'), 7.3775, 3.8967) $$, '22023', 'Check in on the day of the job.',
  'check-in before the job day is refused');
select throws_ok($$ select public.check_in_booking(pg_temp.r('r1'), 7.3775, 3.95) $$, '22023',
  'You are more than 1 km from the farm. Check in when you arrive.', 'check-in 6 km away is refused');
select throws_ok($$ select public.check_in_booking(pg_temp.r('r1'), null, null) $$, '22023',
  'We could not read your location. Turn on GPS and try again.', 'check-in without GPS is refused');
select throws_ok($$ select public.submit_proof(pg_temp.r('r4'), pg_temp.r('r4') || '/c3000000-0000-0000-0000-000000000005/x.jpg', 'before', now()) $$,
  '22023', 'Check in at the farm first.', 'proof needs a check-in first');
select lives_ok($$ select public.check_in_booking(pg_temp.r('r1'), 7.3775, 3.8967) $$, 'the provider checks in at the farm pin');
select is((select status::text from public.bookings where id = pg_temp.r('r1')), 'in_progress', 'the job is in progress');
select ok((select checked_in_at is not null and check_in_distance_m = 0 from public.bookings where id = pg_temp.r('r1')),
  'the check-in time and distance are recorded');
select throws_ok($$ select public.check_in_booking(pg_temp.r('r1'), 7.3775, 3.8967) $$, '22023', 'This booking has already moved on.',
  'no second check-in');
reset role;
select is((select count(*)::int from public.notifications where booking_id = pg_temp.r('r1') and kind = 'job_checked_in'), 1,
  'the farmer is told the provider arrived');
select is((select count(*)::int from public.booking_events where booking_id = pg_temp.r('r1') and event = 'checked_in'), 1,
  'the check-in is in the history');

---------------------------------------------------------------- 2. proof photos
insert into storage.objects (bucket_id, name) values
  ('booking-proofs', pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/before1.jpg'),
  ('booking-proofs', pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/after1.jpg');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
select throws_ok($$ select public.submit_proof(pg_temp.r('r1'), pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/before1.jpg', 'before', now(), 7.3776, 3.8968) $$,
  '42501', 'Only the provider can add proof.', 'the farmer cannot add proof');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ select public.submit_proof(pg_temp.r('r1'), pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/before1.jpg', 'sideways', now()) $$,
  '22023', 'Unknown photo kind.', 'a bad photo kind is refused');
select throws_ok($$ select public.submit_proof(pg_temp.r('r1'), pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000004/before1.jpg', 'before', now()) $$,
  '22023', 'That photo does not belong to this booking.', 'a photo in someone else''s folder is refused');
select throws_ok($$ select public.submit_proof(pg_temp.r('r1'), pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/missing.jpg', 'before', now()) $$,
  '22023', 'The photo did not upload. Try again.', 'a photo that never uploaded is refused');
select throws_ok($$ select public.submit_proof(pg_temp.r('r1'), pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/before1.jpg', 'before',
  now() - interval '3 hours') $$, '22023', 'The photo time does not fit this job.', 'a photo older than the check-in is refused');
select throws_ok($$ select public.submit_proof(pg_temp.r('r1'), pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/before1.jpg', 'before',
  now(), 7.3775, 3.95) $$, '22023', 'That photo was not taken at the farm.', 'a photo 6 km away is refused');
select isnt(public.submit_proof(pg_temp.r('r1'), pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/before1.jpg', 'before',
  now(), 7.3775, 3.8967), null, 'the before photo is recorded');
select throws_ok($$ select public.finish_booking_work(pg_temp.r('r1'), null) $$, '22023',
  'Add at least one before and one after photo first.', 'finishing needs before and after photos');
select isnt(public.submit_proof(pg_temp.r('r1'), pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/after1.jpg', 'after',
  now(), 7.3775, 3.8967), null, 'the after photo is recorded');
select throws_ok($$ select public.submit_proof(pg_temp.r('r1'), pg_temp.r('r1') || '/c3000000-0000-0000-0000-000000000005/after1.jpg', 'after', now(), 7.3775, 3.8967) $$,
  '23505', null, 'the same photo cannot be recorded twice');
select lives_ok($$ select public.finish_booking_work(pg_temp.r('r1'), 2.5) $$, 'the provider finishes the job');
select is((select status::text from public.bookings where id = pg_temp.r('r1')), 'awaiting_confirmation', 'the job waits for the farmer');
select ok((select confirm_by > now() + interval '47 hours' and hectares_done = 2.5 from public.bookings where id = pg_temp.r('r1')),
  'the 48-hour window and the hectares are recorded');
reset role;
select is((select count(*)::int from public.sms_outbox where booking_id = pg_temp.r('r1') and kind = 'proof_submitted'), 1,
  'the farmer gets an SMS that the proof is ready');

---------------------------------------------------------------- 3. confirm and payment (matching)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ select public.confirm_booking(pg_temp.r('r1')) $$, '42501', 'Only the farmer can confirm the job.',
  'the provider cannot confirm his own work');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
select throws_ok($$ select public.mark_paid(pg_temp.r('r1'), 6250000) $$, '22023', 'The farmer confirms the finished work first.',
  'payment cannot be marked before confirmation');
select throws_ok($$ select public.rate_booking(pg_temp.r('r1'), 5, '{}', null) $$, '22023', 'You can rate after the job is completed and paid.',
  'rating before the job is completed and paid is refused');
select lives_ok($$ select public.confirm_booking(pg_temp.r('r1')) $$, 'the farmer confirms the job');
select is((select status::text from public.bookings where id = pg_temp.r('r1')), 'confirmed', 'the job is confirmed');
reset role;
select is((select count(*)::int from public.notifications where booking_id = pg_temp.r('r1') and kind = 'booking_confirmed'), 1,
  'the provider is told');
set local role authenticated;
select lives_ok($$ select public.mark_paid(pg_temp.r('r1'), 6250000) $$, 'the farmer marks what she paid');
select is((select status::text from public.bookings where id = pg_temp.r('r1')), 'confirmed', 'one mark does not complete the job');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ select public.mark_paid(pg_temp.r('r1'), 0) $$, '22023', 'Enter the amount in naira.', 'a zero amount is refused');
select lives_ok($$ select public.mark_paid(pg_temp.r('r1'), 6250000) $$, 'the provider marks the same amount');
reset role;
select is((select status::text from public.bookings where id = pg_temp.r('r1')), 'completed', 'matching amounts complete the job');
select is((select count(*)::int from public.notifications where booking_id = pg_temp.r('r1') and kind = 'booking_completed'), 2,
  'both sides are told the job is complete');
set local role authenticated;
select throws_ok($$ select public.mark_paid(pg_temp.r('r1'), 6250000) $$, '22023', 'You already marked this job.', 'no second mark');

---------------------------------------------------------------- 4. ratings
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
select lives_ok($$ select public.rate_booking(pg_temp.r('r1'), 5, array['on_time', 'good_work'], 'Clean work') $$,
  'the farmer rates the provider');
select throws_ok($$ select public.rate_booking(pg_temp.r('r1'), 4, '{}', null) $$, '22023', 'You already rated this job.',
  'one rating per side');
select throws_ok($$ select public.rate_booking(pg_temp.r('r1'), 6, '{}', null) $$, '22023', 'Choose 1 to 5 stars.', 'six stars is refused');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ select public.rate_booking(pg_temp.r('r1'), 4, array['good_communication'], null) $$, 'the provider rates the farmer');
select is((select private.provider_card('c3000000-0000-0000-0000-000000000005') -> 'rating' ->> 'avg'), '5.0',
  'the provider card shows the average');
select is((select private.provider_card('c3000000-0000-0000-0000-000000000005') -> 'rating' ->> 'count'), '1',
  '... and the number of ratings');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000007"}', true);
select is((select count(*)::int from public.ratings), 0, 'a third party cannot read ratings');
reset role;
select is((select count(*)::int from public.booking_events where booking_id = pg_temp.r('r1') and event = 'rated'), 2,
  'both ratings are in the history');

---------------------------------------------------------------- 5. payment mismatch (r3, moved to today)
update public.bookings set job_date = pg_temp.day(0) where id = pg_temp.r('r3');
insert into storage.objects (bucket_id, name) values
  ('booking-proofs', pg_temp.r('r3') || '/c3000000-0000-0000-0000-000000000005/before1.jpg'),
  ('booking-proofs', pg_temp.r('r3') || '/c3000000-0000-0000-0000-000000000005/after1.jpg');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ select public.check_in_booking(pg_temp.r('r3'), 7.378, 3.897) $$, 'r3: check-in');
select lives_ok($$ select public.submit_proof(pg_temp.r('r3'), pg_temp.r('r3') || '/c3000000-0000-0000-0000-000000000005/before1.jpg', 'before', now(), 7.3776, 3.8968) $$,
  'r3: before photo');
select lives_ok($$ select public.submit_proof(pg_temp.r('r3'), pg_temp.r('r3') || '/c3000000-0000-0000-0000-000000000005/after1.jpg', 'after', now(), 7.3776, 3.8968) $$,
  'r3: after photo');
select lives_ok($$ select public.finish_booking_work(pg_temp.r('r3'), null) $$, 'r3: work finished');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
select lives_ok($$ select public.confirm_booking(pg_temp.r('r3')) $$, 'r3: confirmed');
select lives_ok($$ select public.mark_paid(pg_temp.r('r3'), 2500000) $$, 'the farmer marks N25,000');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ select public.mark_paid(pg_temp.r('r3'), 2500001) $$, 'the provider marks one kobo more');
reset role;
select is((select payment_disputed from public.bookings where id = pg_temp.r('r3')), true, 'a mismatch flags the booking');
select is((select status::text from public.bookings where id = pg_temp.r('r3')), 'confirmed', '... and the job stays open');
select is((select count(*)::int from public.notifications where booking_id = pg_temp.r('r3') and kind = 'payment_mismatch'), 2,
  'both sides are told about the mismatch');

---------------------------------------------------------------- 6. auto-confirm after 48 hours of silence (r5, today again: r1 is completed)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
do $$ begin perform pg_temp.keep('r5', public.request_booking('c3000000-0000-0000-0000-0000000000a1', 'c3000000-0000-0000-0000-0000000000f4',
  pg_temp.day(0), 'hectare', 1, null)); end $$;
select isnt(pg_temp.r('r5'), null, 'r5: a new job for today (r1 is completed)');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ select public.accept_booking(pg_temp.r('r5')) $$, 'r5: accepted');
select lives_ok($$ select public.check_in_booking(pg_temp.r('r5'), 7.3776, 3.8968) $$, 'r5: checked in');
reset role;
insert into storage.objects (bucket_id, name) values
  ('booking-proofs', pg_temp.r('r5') || '/c3000000-0000-0000-0000-000000000005/before1.jpg'),
  ('booking-proofs', pg_temp.r('r5') || '/c3000000-0000-0000-0000-000000000005/after1.jpg');
set local role authenticated;
select lives_ok($$ select public.submit_proof(pg_temp.r('r5'), pg_temp.r('r5') || '/c3000000-0000-0000-0000-000000000005/before1.jpg', 'before', now(), 7.3776, 3.8968) $$,
  'r5: before photo');
select lives_ok($$ select public.submit_proof(pg_temp.r('r5'), pg_temp.r('r5') || '/c3000000-0000-0000-0000-000000000005/after1.jpg', 'after', now(), 7.3776, 3.8968) $$,
  'r5: after photo');
select lives_ok($$ select public.finish_booking_work(pg_temp.r('r5'), null) $$, 'r5: work finished');
reset role;
update public.bookings set confirm_by = now() - interval '1 minute' where id = pg_temp.r('r5');
select is(private.auto_confirm_bookings(), 1, 'the sweep confirms the silent job');
select is((select status::text from public.bookings where id = pg_temp.r('r5')), 'confirmed', 'the job is confirmed without the farmer');
select is((select actor_id from public.booking_events where booking_id = pg_temp.r('r5') and event = 'auto_confirmed'), null,
  'the system is recorded as the actor');
select is((select count(*)::int from public.notifications where booking_id = pg_temp.r('r5') and kind = 'booking_auto_confirmed'), 1,
  'the farmer is told why');

---------------------------------------------------------------- 7. disputes (r2: accepted, but the job day passed with no check-in)
update public.bookings set job_date = pg_temp.day(-1) where id = pg_temp.r('r2');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
select throws_ok($$ select public.dispute_booking(pg_temp.r('r2'), 'it was bad', null) $$, '22023',
  'Choose what went wrong.', 'a dispute needs one of the reason categories');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ select public.dispute_booking(pg_temp.r('r2'), 'no_show', 'He says I never came') $$, '22023',
  'This booking cannot be disputed now.', 'only the farmer can report a no-show on an accepted job');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
select lives_ok($$ select public.dispute_booking(pg_temp.r('r2'), 'no_show', 'He never came and my day is gone') $$, 'the farmer disputes the no-show');
reset role;
select is((select status::text from public.bookings where id = pg_temp.r('r2')), 'disputed', 'the job is disputed');
select is((select count(*)::int from public.sms_outbox where booking_id = pg_temp.r('r2') and kind = 'booking_disputed'), 1,
  'the provider gets an SMS about the dispute');
set local role authenticated;
select throws_ok($$ select public.mark_paid(pg_temp.r('r2'), 9000000) $$, '22023', 'The farmer confirms the finished work first.',
  'a disputed job cannot be marked paid');
select throws_ok($$ select public.rate_booking(pg_temp.r('r2'), 1, '{}', null) $$, '22023', 'You can rate after the job is completed and paid.',
  'a disputed job cannot be rated');

---------------------------------------------------------------- 8. what each side sees
select is((public.booking_detail(pg_temp.r('r1')) -> 'payment' -> 'mine' ->> 'kobo'), '6250000', 'the farmer sees her own payment mark');
select is((select jsonb_array_length(public.booking_detail(pg_temp.r('r1')) -> 'proofs')), 2, 'the farmer sees the two proofs');
select is((public.booking_detail(pg_temp.r('r1')) -> 'my_rating' ->> 'stars'), '5', 'she sees her own rating');
select is((public.booking_detail(pg_temp.r('r1')) -> 'their_rating' ->> 'stars'), '4', 'and the provider''s');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select is((public.booking_detail(pg_temp.r('r4')) -> 'can' ->> 'check_in'), 'false', 'check-in is only offered on the job day');
select is((public.booking_detail(pg_temp.r('r1')) -> 'can' ->> 'rate'), 'false', 'rating is not offered twice');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000007"}', true);
select throws_ok($$ select public.booking_detail(pg_temp.r('r1')) $$, 'P0002', 'Booking not found.', 'a third party cannot open the booking');
select is((select count(*)::int from public.booking_proofs), 0, 'or read its proofs');

---------------------------------------------------------------- 9. storage policies and grants
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('booking-proofs', pg_temp.r('r4') || '/c3000000-0000-0000-0000-000000000005/plan.jpg') $$, '42501', null,
  'the provider cannot upload before checking in');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000004"}', true);
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('booking-proofs', pg_temp.r('r4') || '/c3000000-0000-0000-0000-000000000004/evil.jpg') $$, '42501', null,
  'the farmer cannot upload proof photos');
select is((select count(*)::int from storage.objects where bucket_id = 'booking-proofs'), 6,
  'the farmer reads the proofs of her bookings');
select set_config('request.jwt.claims', '{"sub":"c3000000-0000-0000-0000-000000000007"}', true);
select is((select count(*)::int from storage.objects where bucket_id = 'booking-proofs'), 0, 'a third party reads none');
set local role anon;
select throws_ok($$ select public.check_in_booking(pg_temp.r('r1'), 7.3775, 3.8967) $$, '42501', null, 'anonymous visitors cannot check in');
select throws_ok($$ select public.rate_booking(pg_temp.r('r1'), 5, '{}', null) $$, '42501', null, 'or rate');
select throws_ok($$ select * from public.ratings $$, '42501', null, 'or read ratings');
reset role;
select ok((select kind = 'payment' and implemented and not test_only from public.integration_providers where code = 'paystack'),
  'Paystack is registered as a live payment provider');

select * from finish();
rollback;
