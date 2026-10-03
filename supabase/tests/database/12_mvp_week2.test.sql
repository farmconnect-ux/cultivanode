-- MVP week 2: bookings are agreed through the transition functions only; each side is told (inbox and SMS);
-- third parties see nothing; forged changes, the kill switch, suspension and expiry are enforced by the database.
begin;
create extension if not exists pgtap with schema extensions;
select plan(76);

insert into auth.users (id, phone) values
  ('c2000000-0000-0000-0000-000000000001', '2348000002001'),  -- Sade: super admin
  ('c2000000-0000-0000-0000-000000000002', '2348000002002'),  -- Tunde: support and disputes (bookings.read)
  ('c2000000-0000-0000-0000-000000000004', '2348000002004'),  -- Kemi: farmer in Oyo
  ('c2000000-0000-0000-0000-000000000005', '2348000002005'),  -- Lanre: tractor owner in Oyo, tier 2
  ('c2000000-0000-0000-0000-000000000006', '2348000002006'),  -- Musa: farmer in Oyo, farm 53 km away
  ('c2000000-0000-0000-0000-000000000007', '2348000002007'),  -- Ada: another farmer in Oyo (third party)
  ('c2000000-0000-0000-0000-000000000008', '2348000002008');  -- Bisi: farmer in Lagos (marketplace closed there)
insert into public.admin_roles (profile_id, admin_role) values
  ('c2000000-0000-0000-0000-000000000001', 'super_admin'),
  ('c2000000-0000-0000-0000-000000000002', 'support_disputes');
update public.profiles set onboarded_at = now(), full_name = v.n, state = v.s, phone = v.ph
  from (values ('c2000000-0000-0000-0000-000000000001'::uuid, 'Sade Admin', 'Lagos', '2348000002001'),
               ('c2000000-0000-0000-0000-000000000002'::uuid, 'Tunde Support', 'Oyo', '2348000002002'),
               ('c2000000-0000-0000-0000-000000000004'::uuid, 'Kemi Adewale', 'Oyo', '2348000002004'),
               ('c2000000-0000-0000-0000-000000000005'::uuid, 'Lanre Adeyemi', 'Oyo', '2348000002005'),
               ('c2000000-0000-0000-0000-000000000006'::uuid, 'Musa Bello', 'Oyo', '2348000002006'),
               ('c2000000-0000-0000-0000-000000000007'::uuid, 'Ada Obi', 'Oyo', '2348000002007'),
               ('c2000000-0000-0000-0000-000000000008'::uuid, 'Bisi Lagos', 'Lagos', '2348000002008')) v(i, n, s, ph)
 where id = v.i;
insert into public.user_roles (profile_id, role) values
  ('c2000000-0000-0000-0000-000000000004', 'crop_farmer'),
  ('c2000000-0000-0000-0000-000000000005', 'machinery_owner'),
  ('c2000000-0000-0000-0000-000000000006', 'crop_farmer'),
  ('c2000000-0000-0000-0000-000000000007', 'crop_farmer'),
  ('c2000000-0000-0000-0000-000000000008', 'crop_farmer');
update public.profiles set verification_tier = 2 where id = 'c2000000-0000-0000-0000-000000000005';
-- Farmers have verified their NIN (tier 1): booking needs it (master plan tier table).
update public.profiles set verification_tier = 1 where id in ('c2000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000007', 'c2000000-0000-0000-0000-000000000008');
insert into public.farms (id, owner_id, name, location, state, address_hint) values
  ('c2000000-0000-0000-0000-0000000000f4', 'c2000000-0000-0000-0000-000000000004', 'Kemi maize', 'SRID=4326;POINT(3.8967 7.3775)', 'Oyo', 'Behind the church'),
  ('c2000000-0000-0000-0000-0000000000f6', 'c2000000-0000-0000-0000-000000000006', 'Musa cassava', 'SRID=4326;POINT(3.8967 6.9)', 'Oyo', null),
  ('c2000000-0000-0000-0000-0000000000f7', 'c2000000-0000-0000-0000-000000000007', 'Ada yam', 'SRID=4326;POINT(3.90 7.38)', 'Oyo', null),
  ('c2000000-0000-0000-0000-0000000000f8', 'c2000000-0000-0000-0000-000000000008', 'Bisi farm', 'SRID=4326;POINT(3.90 7.38)', 'Lagos', null);
insert into public.listings (id, owner_id, kind, equipment_type, title, location, service_radius_km, status)
values ('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-000000000005', 'equipment', 'tractor',
        'Lanre 75hp tractor', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active');
insert into public.listing_rates (listing_id, unit, rate_kobo) values
  ('c2000000-0000-0000-0000-0000000000a1', 'hectare', 2500000),
  ('c2000000-0000-0000-0000-0000000000a1', 'day', 9000000);
update public.feature_flags set enabled = true, states = array['Oyo'] where key = 'marketplace_live';

create function pg_temp.day(n integer) returns date language sql stable as $$
  select (now() at time zone 'Africa/Lagos')::date + n $$;
create function pg_temp.bk(n integer) returns uuid language sql stable security definer as $$
  select id from public.bookings where job_date = pg_temp.day(n) order by created_at desc limit 1 $$;
grant execute on all functions in schema pg_temp to authenticated, service_role;

---------------------------------------------------------------- 1. requesting
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000004"}', true);

select isnt(public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
              pg_temp.day(3), 'hectare', 2.5, 'Ploughing before planting'), null, 'a farmer requests a tractor for her farm');
select is((select total_kobo from public.bookings where id = pg_temp.bk(3)), 6250000::bigint,
  'the price comes from the listing: N25,000 x 2.5 ha = N62,500');
select is((select status::text from public.bookings where id = pg_temp.bk(3)), 'requested', 'the booking starts as requested');
select is((select distance_km from public.bookings where id = pg_temp.bk(3)), 5.0, 'the distance is recorded');
select ok((select expires_at <= now() + interval '24 hours' from public.bookings where id = pg_temp.bk(3)),
  'an unanswered request expires within 24 hours');

select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(3), 'hectare', 1, null) $$, '22023', 'You already asked for this on that day.', 'a duplicate request is refused');
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(9), 'hour', 3, null) $$, '22023', 'This listing has no price for that unit.', 'an unpriced unit is refused');
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(-1), 'hectare', 1, null) $$, '22023', 'Pick a day from today to 60 days ahead.', 'a past day is refused');
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(61), 'hectare', 1, null) $$, '22023', 'Pick a day from today to 60 days ahead.', 'more than 60 days ahead is refused');
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(9), 'hectare', 0, null) $$, '22023', 'Enter how much work you need.', 'a zero quantity is refused');
select throws_ok($$ insert into public.bookings (farmer_id, provider_id, listing_title, listing_kind, farm_name, job_location,
  distance_km, job_date, unit, quantity, rate_kobo, total_kobo, expires_at)
  values ('c2000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000005', 'Cheap tractor', 'equipment', 'x',
          'SRID=4326;POINT(3.8967 7.3775)', 1, pg_temp.day(10), 'hectare', 1, 1, 1, now() + interval '1 day') $$,
  '42501', null, 'a booking with a made-up price cannot be inserted directly');

select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000006"}', true);
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f6',
  pg_temp.day(3), 'hectare', 1, null) $$, '22023', 'Your farm is outside this provider''s area.',
  'a farm 53 km away is outside the 30 km service area');

select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000007"}', true);
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(3), 'hectare', 1, null) $$, 'P0002', 'Farm not found.', 'nobody can book for someone else''s farm');

select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000008"}', true);
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f8',
  pg_temp.day(3), 'hectare', 1, null) $$, '42501', 'Hiring is not open in your area yet.',
  'a farmer where the marketplace is closed cannot request');

select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(3), 'hectare', 1, null) $$, '42501', 'Only farmers can request a job.', 'only farmers can request');

---------------------------------------------------------------- 2. who sees what before the answer
select is((select count(*)::int from public.notifications where kind = 'booking_requested'), 1, 'the provider has a new-request notification');
select is((public.booking_detail(pg_temp.bk(3)) ->> 'location'), null, 'before accepting, the provider does not see the farm pin');
select is((public.booking_detail(pg_temp.bk(3)) -> 'other' ->> 'phone'), null, '... nor the farmer''s phone');
select is((public.booking_detail(pg_temp.bk(3)) -> 'other' ->> 'name'), 'Kemi', '... only her first name');
select throws_ok($$ select job_location from public.bookings $$, '42501', null, 'the pin column cannot be read through the API');
select throws_ok($$ update public.bookings set status = 'accepted' where id = pg_temp.bk(3) $$, '42501', null,
  'a provider cannot forge the status change');

select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000007"}', true);
select is((select count(*)::int from public.bookings), 0, 'a third user sees no bookings');
select is((select count(*)::int from public.booking_events), 0, '... and no booking history');
select throws_ok($$ select public.booking_detail(pg_temp.bk(3)) $$, 'P0002', 'Booking not found.', '... and cannot open one');
select throws_ok($$ select public.accept_booking(pg_temp.bk(3)) $$, 'P0002', 'Booking not found.', '... or accept it');

select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000004"}', true);
select ok((public.booking_detail(pg_temp.bk(3)) -> 'location' ->> 'lat') is not null, 'the farmer sees her own pin');
select throws_ok($$ select public.accept_booking(pg_temp.bk(3)) $$, '42501', 'Only the provider can accept.',
  'the farmer cannot accept her own request');

---------------------------------------------------------------- 3. accept, then call off
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ select public.accept_booking(pg_temp.bk(3)) $$, 'the provider accepts');
select is((public.booking_detail(pg_temp.bk(3)) ->> 'status'), 'accepted', 'the booking is accepted');
select is((public.booking_detail(pg_temp.bk(3)) -> 'other' ->> 'phone'), '2348000002004', 'now the provider sees the farmer''s phone');
select is((public.booking_detail(pg_temp.bk(3)) -> 'location' ->> 'hint'), 'Behind the church', '... and the farm directions');
select throws_ok($$ select public.accept_booking(pg_temp.bk(3)) $$, '22023', 'This request was already answered.', 'no second accept');
select throws_ok($$ select public.decline_booking(pg_temp.bk(3), null) $$, '22023', 'This request was already answered.',
  'an accepted job cannot be declined');
select throws_ok($$ select public.cancel_booking(pg_temp.bk(3), 'no') $$, '22023',
  'Say why you are cancelling (at least 5 characters).', 'calling off an agreed job needs a reason');

select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000004"}', true);
select is((select count(*)::int from public.notifications where kind = 'booking_accepted'), 1, 'the farmer is told in the app');
select is((public.booking_detail(pg_temp.bk(3)) -> 'other' ->> 'phone'), '2348000002005', 'and sees the provider''s phone');

select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ select public.cancel_booking(pg_temp.bk(3), 'Tractor broke down') $$, 'the provider calls off the job with a reason');
select is((select array_agg(event order by id) from public.booking_events where booking_id = pg_temp.bk(3)),
  array['requested', 'accepted', 'cancelled'], 'every step is in the history');
select is((public.booking_detail(pg_temp.bk(3)) ->> 'location'), null, 'after the job is called off the pin is hidden again');

---------------------------------------------------------------- 4. withdraw and decline
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000004"}', true);
select lives_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(4), 'day', 1, null) $$, 'a second request, for a day');
select lives_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(5), 'day', 1, null) $$, 'a third request');
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ select public.cancel_booking(pg_temp.bk(4), null) $$, '42501', 'Decline the request instead.',
  'a provider declines rather than cancels a request');
select lives_ok($$ select public.decline_booking(pg_temp.bk(5), 'Booked elsewhere that day') $$, 'the provider declines');
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000004"}', true);
select lives_ok($$ select public.cancel_booking(pg_temp.bk(4), null) $$, 'the farmer withdraws a request without a reason');
select is((public.booking_detail(pg_temp.bk(5)) ->> 'closed_reason'), 'Booked elsewhere that day', 'the farmer sees why');

---------------------------------------------------------------- 5. kill switch and suspension
select lives_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(6), 'day', 1, null) $$, 'a request made while the marketplace is open');
reset role;
update public.feature_flags set enabled = false where key = 'marketplace_live';
set local role authenticated;
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(7), 'day', 1, null) $$, '42501', 'Hiring is not open in your area yet.', 'the kill switch stops new requests');
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ select public.accept_booking(pg_temp.bk(6)) $$, '42501', 'Hiring is paused in this area.',
  '... and stops accepting open ones');
reset role;
update public.feature_flags set enabled = true where key = 'marketplace_live';
update public.profiles set suspended_at = now() where id = 'c2000000-0000-0000-0000-000000000004';
set local role authenticated;
select throws_ok($$ select public.accept_booking(pg_temp.bk(6)) $$, '22023', 'This farmer''s account is not active.',
  'a job for a suspended farmer cannot be accepted');
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000004"}', true);
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(8), 'day', 1, null) $$, '42501', 'Your account is suspended.', 'a suspended farmer cannot request');
reset role;
update public.profiles set suspended_at = null where id = 'c2000000-0000-0000-0000-000000000004';

---------------------------------------------------------------- 6. expiry
update public.bookings set expires_at = now() - interval '1 minute' where id = pg_temp.bk(6);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000004"}', true);
select is((select x ->> 'status' from jsonb_array_elements(public.my_bookings()) x where (x ->> 'id')::uuid = pg_temp.bk(6)), 'expired',
  'a request past its deadline shows as expired at once');
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000005"}', true);
select throws_ok($$ select public.accept_booking(pg_temp.bk(6)) $$, '22023', 'This request has expired.', 'an expired request cannot be accepted');
reset role;
select is(private.expire_bookings(), 1, 'the scheduled sweep closes the expired request');
select is((select actor_id from public.booking_events where booking_id = pg_temp.bk(6) and event = 'expired'), null,
  'the system is recorded as the actor');
select throws_ok($$ update public.booking_events set note = 'edited' $$, '42501', null, 'booking history cannot be edited');

---------------------------------------------------------------- 7. inbox
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000004"}', true);
select is((select array_agg(kind order by created_at, kind) from public.notifications),
  array['booking_accepted', 'booking_cancelled', 'booking_declined', 'booking_expired'], 'the farmer''s inbox has her four updates');
select is(public.mark_notifications_read(), 4, 'she marks them read');
select throws_ok($$ update public.notifications set read_at = null $$, '42501', null, 'notifications cannot be changed directly');
select throws_ok($$ select * from public.sms_outbox $$, '42501', null, 'the SMS outbox is not readable by users');

---------------------------------------------------------------- 8. staff
select throws_ok($$ select public.admin_booking_stats() $$, '42501', null, 'users cannot see booking statistics');
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000002"}', true);
select is((select count(*)::int from public.bookings), 4, 'support (bookings.read) sees every booking');
select is((public.booking_detail(pg_temp.bk(3)) ->> 'my_side'), 'staff', 'and opens any of them as staff');

---------------------------------------------------------------- 9. SMS worker
select throws_ok($$ select * from public.claim_sms_outbox(10) $$, '42501', null, 'signed-in users cannot run the SMS worker');
reset role;
-- Queued so far: provider (new request x4), farmer (accepted, cancelled after agreement, declined, expired).
select is((select count(*)::int from public.sms_outbox where status = 'queued'), 8, 'eight booking SMS are waiting');
select decrypted_secret as worker_secret from vault.decrypted_secrets where name = 'notify_worker_secret' \gset
set local role service_role;
select is(public.notify_worker_authorized('wrong'), false, 'the worker refuses a wrong secret');
select is(public.notify_worker_authorized(:'worker_secret'),
  true, 'and accepts the one pg_cron sends');
reset role;
update public.profiles set suspended_at = now() where id = 'c2000000-0000-0000-0000-000000000005';
set local role service_role;
select is((select count(*)::int from public.claim_sms_outbox(50)), 4, 'messages for a suspended account are skipped, the rest claimed');
reset role;
select is((select count(*)::int from public.sms_outbox where status = 'skipped'), 4, 'the suspended provider''s four are skipped');
set local role service_role;
select lives_ok($$ select public.finish_sms_outbox(id, true, 'twilio', 'SM1', null, false)
                     from public.sms_outbox where status = 'sending' and kind = 'booking_accepted' $$, 'a sent message is recorded');
select lives_ok($$ select public.finish_sms_outbox(id, false, 'twilio', null, 'unavailable', true)
                     from public.sms_outbox where status = 'sending' and kind = 'booking_declined' $$, 'a failure is recorded');
reset role;
select is((select status || ':' || attempts from public.sms_outbox where kind = 'booking_declined'), 'queued:1',
  'a retryable failure goes back in the queue');
select is((select status from public.sms_outbox where kind = 'booking_accepted'), 'sent', 'the sent one is marked sent');

---------------------------------------------------------------- 10. anonymous callers and Twilio
set local role anon;
select throws_ok($$ select public.request_booking('c2000000-0000-0000-0000-0000000000a1', 'c2000000-0000-0000-0000-0000000000f4',
  pg_temp.day(3), 'hectare', 1, null) $$, '42501', null, 'anonymous visitors cannot request bookings');
select throws_ok($$ select public.my_bookings() $$, '42501', null, 'or list them');
reset role;
select ok((select implemented and not test_only from public.integration_providers where code = 'twilio'),
  'Twilio is now a working SMS provider');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c2000000-0000-0000-0000-000000000001"}', true);
select throws_ok($$ select public.admin_activate_integration('sms', 'twilio') $$, '22023',
  'provider is not ready: key:auth_token, setting:account_sid, setting:from', 'Twilio needs its SID, sender and token first');

select * from finish();
rollback;
