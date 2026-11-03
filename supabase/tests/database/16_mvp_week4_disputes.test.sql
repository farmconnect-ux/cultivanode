-- CultivaNode MVP week 4: staff dispute resolution in the database.
-- Destination: supabase/tests/database/16_mvp_week4_disputes.test.sql
--
-- Covers the four W4 RPCs end to end: permission denials, state-machine guards, the
-- settlement bounds, the event/notification/SMS/audit trail, reopen, the evidence
-- request loop, staff cancellation, and the staff booking view.
begin;
create extension if not exists pgtap with schema extensions;
select plan(54);

insert into auth.users (id, phone) values
  ('c4000000-0000-0000-0000-000000000004', '2348000004004'),  -- Kemi: farmer in Oyo
  ('c4000000-0000-0000-0000-000000000005', '2348000004005'),  -- Lanre: tractor owner
  ('c4000000-0000-0000-0000-000000000009', '2348000004009');  -- Bisi: support_disputes staff
update public.profiles set onboarded_at = now(), full_name = v.n, state = 'Oyo', phone = v.ph
  from (values ('c4000000-0000-0000-0000-000000000004'::uuid, 'Kemi Adewale', '2348000004004'),
               ('c4000000-0000-0000-0000-000000000005'::uuid, 'Lanre Adeyemi', '2348000004005'),
               ('c4000000-0000-0000-0000-000000000009'::uuid, 'Bisi Staff', '2348000004009')) v(i, n, ph)
 where id = v.i;
insert into public.user_roles (profile_id, role) values
  ('c4000000-0000-0000-0000-000000000004', 'crop_farmer'),
  ('c4000000-0000-0000-0000-000000000005', 'machinery_owner');
update public.profiles set verification_tier = 1 where id in ('c4000000-0000-0000-0000-000000000004',
                                                             'c4000000-0000-0000-0000-000000000005');
insert into public.admin_roles (profile_id, admin_role)
values ('c4000000-0000-0000-0000-000000000009', 'support_disputes');  -- has disputes.decide + bookings.read

insert into public.farms (id, owner_id, name, location, boundary, state) values
  ('c4000000-0000-0000-0000-0000000000f4', 'c4000000-0000-0000-0000-000000000004', 'Kemi mapped farm',
   'SRID=4326;POINT(3.8967 7.3775)',
   'SRID=4326;POLYGON((3.8957 7.3765, 3.8977 7.3765, 3.8977 7.3785, 3.8957 7.3785, 3.8957 7.3765))', 'Oyo');
insert into public.listings (id, owner_id, kind, equipment_type, title, location, service_radius_km, status)
values
  ('c4000000-0000-0000-0000-0000000000a1', 'c4000000-0000-0000-0000-000000000005', 'equipment', 'tractor', 'Tractor one', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active'),
  ('c4000000-0000-0000-0000-0000000000a2', 'c4000000-0000-0000-0000-000000000005', 'equipment', 'tractor', 'Tractor two', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active'),
  ('c4000000-0000-0000-0000-0000000000a3', 'c4000000-0000-0000-0000-000000000005', 'equipment', 'tractor', 'Tractor three', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active'),
  ('c4000000-0000-0000-0000-0000000000a4', 'c4000000-0000-0000-0000-000000000005', 'equipment', 'tractor', 'Tractor four', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active');
insert into public.listing_rates (listing_id, unit, rate_kobo)
select id, 'hectare', 2500000 from public.listings where owner_id = 'c4000000-0000-0000-0000-000000000005';
update public.feature_flags set enabled = true, states = array['Oyo'] where key = 'marketplace_live';

create table pg_temp.ids (k text primary key, id uuid not null);
create function pg_temp.keep(p_k text, p_id uuid) returns void language sql security definer as $$
  insert into pg_temp.ids values (p_k, p_id) $$;
create function pg_temp.r(p_k text) returns uuid language sql stable security definer as $$
  select id from pg_temp.ids where k = p_k $$;
create function pg_temp.today() returns date language sql stable as $$ select (now() at time zone 'Africa/Lagos')::date $$;
create function pg_temp.farmer() returns void language sql as $$ select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000004"}', true) $$;
create function pg_temp.provider() returns void language sql as $$ select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000005"}', true) $$;
create function pg_temp.staff() returns void language sql as $$ select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000009"}', true) $$;
grant execute on all functions in schema pg_temp to authenticated, service_role;
grant select on pg_temp.ids to authenticated;

-- Four jobs for today: j1 and j2 go through the full work flow and get disputed;
-- j3 stays in progress until staff cancel it; j4 is disputed and left open.
set local role authenticated;
select pg_temp.farmer();
do $$ begin
  perform pg_temp.keep('j1', public.request_booking('c4000000-0000-0000-0000-0000000000a1', 'c4000000-0000-0000-0000-0000000000f4', pg_temp.today(), 'hectare', 1, null));
  perform pg_temp.keep('j2', public.request_booking('c4000000-0000-0000-0000-0000000000a2', 'c4000000-0000-0000-0000-0000000000f4', pg_temp.today(), 'hectare', 1, null));
  perform pg_temp.keep('j3', public.request_booking('c4000000-0000-0000-0000-0000000000a3', 'c4000000-0000-0000-0000-0000000000f4', pg_temp.today(), 'hectare', 1, null));
  perform pg_temp.keep('j4', public.request_booking('c4000000-0000-0000-0000-0000000000a4', 'c4000000-0000-0000-0000-0000000000f4', pg_temp.today(), 'hectare', 1, null));
end $$;
select pg_temp.provider();
do $$ begin
  perform public.accept_booking(pg_temp.r(k)) from pg_temp.ids;
  perform public.check_in_booking(pg_temp.r(k), 7.3776, 3.8968) from pg_temp.ids;
end $$;

reset role;
insert into storage.objects (bucket_id, name)
select 'booking-proofs', id || '/c4000000-0000-0000-0000-000000000005/' || f
  from pg_temp.ids, unnest(array['before.jpg', 'after.jpg']) f;
set local role authenticated;
do $$ begin
  perform public.submit_proof(pg_temp.r(k), pg_temp.r(k) || '/c4000000-0000-0000-0000-000000000005/before.jpg', 'before', now(), 7.3776, 3.8968),
          public.submit_proof(pg_temp.r(k), pg_temp.r(k) || '/c4000000-0000-0000-0000-000000000005/after.jpg', 'after', now(), 7.3776, 3.8968)
    from pg_temp.ids where k in ('j1', 'j2');
  perform public.finish_booking_work(pg_temp.r(k), null) from pg_temp.ids where k in ('j1', 'j2');
end $$;

-- Kemi disputes j1; j2 waits for its own dispute further down.
select pg_temp.farmer();
select lives_ok($$ select public.dispute_booking(pg_temp.r('j1'), 'damage', 'The plough left the field uneven and half unbroken') $$,
  'the farmer opens the damage dispute on j1');

---------------------------------------------------------------- guards: permission and state
select throws_ok($$ select public.resolve_booking_dispute(pg_temp.r('j1'), 'uphold_provider', 'The evidence shows the work was done', null, null) $$,
  '42501', 'You do not have permission to decide disputes.', 'a farmer cannot resolve a dispute');
select pg_temp.staff();
select throws_ok($$ select public.resolve_booking_dispute(pg_temp.r('j2'), 'uphold_provider', 'The evidence shows the work was done', null, null) $$,
  '22023', 'This booking is not in a dispute.', 'staff cannot resolve a booking that is not disputed');
select throws_ok($$ select public.resolve_booking_dispute(pg_temp.r('j1'), 'split_it', 'The evidence shows the work was done', null, null) $$,
  '22023', 'Choose a decision.', 'a decision outside the three outcomes is refused');
select throws_ok($$ select public.resolve_booking_dispute(pg_temp.r('j1'), 'uphold_provider', 'ok', null, null) $$,
  '22023', 'Write down your reasoning (at least 10 characters).', 'a reason under 10 characters is refused');
select throws_ok($$ select public.resolve_booking_dispute(pg_temp.r('j1'), 'settlement', 'The parties agreed a lower price', null, null) $$,
  '22023', 'The settlement must be more than zero and at most the agreed price.', 'a settlement without an amount is refused');
select throws_ok($$ select public.resolve_booking_dispute(pg_temp.r('j1'), 'settlement', 'The parties agreed a lower price', null, 99000000) $$,
  '22023', 'The settlement must be more than zero and at most the agreed price.', 'a settlement above the agreed price is refused');
select throws_ok($$ select public.resolve_booking_dispute(pg_temp.r('j1'), 'uphold_provider', 'The evidence shows the work was done', null, 1000000) $$,
  '22023', 'Only a settlement has an amount.', 'an amount on a non-settlement decision is refused');

---------------------------------------------------------------- uphold_provider on j1
select lives_ok($$ select public.resolve_booking_dispute(pg_temp.r('j1'), 'uphold_provider',
  'GPS and the after photo show the whole plot ploughed', 'The work was done as agreed.') $$,
  'staff uphold the provider on j1');
reset role;
select is((select status::text || '/' || dispute_outcome || '/' || dispute_decided_by::text
             from public.bookings where id = pg_temp.r('j1')),
  'completed/uphold_provider/c4000000-0000-0000-0000-000000000009',
  'the booking completes with the outcome and the staff member recorded');
select is((select count(*)::int from public.booking_events where booking_id = pg_temp.r('j1') and event = 'dispute_resolved'), 1,
  'the resolution is in the history');
select is((select count(*)::int from public.notifications where booking_id = pg_temp.r('j1') and kind = 'dispute_resolved'), 2,
  'both parties are notified of the outcome');
select is((select count(*)::int from public.sms_outbox where booking_id = pg_temp.r('j1') and kind = 'dispute_resolved'), 2,
  'both parties get the resolution SMS');
select is((select count(*)::int from public.admin_actions
             where entity = 'booking' and entity_id = pg_temp.r('j1') and permission = 'disputes.decide'
               and action = 'dispute_resolved'), 1,
  'the staff decision is in admin_actions with its permission');
select is((select count(*)::int from public.audit_log
             where entity = 'booking' and entity_id = pg_temp.r('j1') and action = 'dispute_resolved'), 1,
  'the resolution is in the audit log');
set local role authenticated;
select pg_temp.farmer();
select is((public.booking_detail(pg_temp.r('j1')) -> 'dispute' ->> 'outcome'), 'uphold_provider',
  'the farmer reads the outcome on her booking');
select is((public.booking_detail(pg_temp.r('j1')) -> 'dispute' ->> 'decision'), 'The work was done as agreed.',
  'and the staff message to the parties');
select is((public.booking_detail(pg_temp.r('j1')) -> 'can' ->> 'rate'), 'true', 'an upheld job opens the rating flow');
select lives_ok($$ select public.mark_paid(pg_temp.r('j1'), 2500000) $$, 'the farmer pays the agreed price directly');
select lives_ok($$ select public.rate_booking(pg_temp.r('j1'), 5, array['on_time'], null) $$, 'and rates the provider');

---------------------------------------------------------------- reopen
select pg_temp.staff();
select throws_ok($$ select public.reopen_booking_dispute(pg_temp.r('j1'), 'wait') $$,
  '22023', 'Write down why the dispute is reopened (at least 10 characters).', 'a reopen needs a real reason');
select lives_ok($$ select public.reopen_booking_dispute(pg_temp.r('j1'), 'The provider called with a video of the whole plot') $$,
  'staff reopen the resolved dispute');
select is((select status::text || '/' || coalesce(dispute_outcome, '-') from public.bookings where id = pg_temp.r('j1')),
  'disputed/-', 'the booking is disputed again and the outcome cleared');
select pg_temp.farmer();
select is((public.booking_detail(pg_temp.r('j1')) -> 'can' ->> 'add_evidence'), 'true',
  'after the reopen the farmer can upload evidence again');
reset role;
select is((select count(*)::int from public.booking_events where booking_id = pg_temp.r('j1') and event = 'dispute_reopened'), 1,
  'the reopen is in the history');
select is((select count(*)::int from public.notifications where booking_id = pg_temp.r('j1') and kind = 'dispute_reopened'), 2,
  'both parties hear the dispute is open again');
set local role authenticated;
select pg_temp.staff();
select throws_ok($$ select public.reopen_booking_dispute(pg_temp.r('j2'), 'Nothing was ever resolved here') $$,
  '22023', 'Only a resolved dispute can be reopened.', 'a booking without a resolution cannot be reopened');

---------------------------------------------------------------- the evidence request loop
select throws_ok($$ select public.request_dispute_evidence(pg_temp.r('j2'), 'A close-up of the western half, please', 24, 'farmer') $$,
  '22023', 'This booking is not in a dispute.', 'evidence cannot be requested on a booking that is not disputed');
select throws_ok($$ select public.request_dispute_evidence(pg_temp.r('j1'), 'photo', 24, 'farmer') $$,
  '22023', 'Say what evidence you need (at least 10 characters).', 'a vague evidence request is refused');
select throws_ok($$ select public.request_dispute_evidence(pg_temp.r('j1'), 'A close-up of the western half, please', 0, 'farmer') $$,
  '22023', 'Give 1 to 168 hours to answer.', 'a zero-hour deadline is refused');
select throws_ok($$ select public.request_dispute_evidence(pg_temp.r('j1'), 'A close-up of the western half, please', 24, 'nobody') $$,
  '22023', 'Choose who should answer.', 'an unknown recipient is refused');
select lives_ok($$ select public.request_dispute_evidence(pg_temp.r('j1'),
  'Please send a close-up photo of the western half of the plot', 24, 'farmer') $$,
  'staff ask the farmer for a specific photo');
reset role;
select is((select count(*)::int from public.notifications where booking_id = pg_temp.r('j1') and kind = 'dispute_evidence_requested'), 1,
  'only the farmer is asked');
select is((select count(*)::int from public.booking_events where booking_id = pg_temp.r('j1') and event = 'evidence_requested'), 1,
  'the request is in the history');
set local role authenticated;
select pg_temp.staff();

---------------------------------------------------------------- settlement on j1
select lives_ok($$ select public.resolve_booking_dispute(pg_temp.r('j1'), 'settlement',
  'Half the plot was ploughed; the parties agreed half the price', 'You agreed the farmer pays half.',
  1500000) $$,
  'staff record a settlement of half the price');
select is((public.booking_detail(pg_temp.r('j1')) -> 'dispute' ->> 'settlement_kobo'), '1500000',
  'the settlement amount is part of the record');
select is((select status::text from public.bookings where id = pg_temp.r('j1')), 'completed',
  'a settled job is completed');

---------------------------------------------------------------- uphold_farmer on j2
select pg_temp.farmer();
select lives_ok($$ select public.dispute_booking(pg_temp.r('j2'), 'poor_quality', 'Only the eastern half was ploughed at all') $$,
  'the farmer disputes j2 as poor quality');
select pg_temp.staff();
select lives_ok($$ select public.resolve_booking_dispute(pg_temp.r('j2'), 'uphold_farmer',
  'The after photo shows most of the plot untouched', 'The provider did not do the work you paid for.') $$,
  'staff uphold the farmer on j2');
select is((select status::text || '/' || dispute_outcome from public.bookings where id = pg_temp.r('j2')),
  'cancelled/uphold_farmer', 'the booking is cancelled with the outcome recorded');
select is((select closed_reason from public.bookings where id = pg_temp.r('j2')) like 'Dispute:%', true,
  'the closed reason names the dispute');
select pg_temp.farmer();
select is((public.booking_detail(pg_temp.r('j2')) -> 'can' ->> 'rate'), 'false',
  'a job that was never done cannot be rated');

---------------------------------------------------------------- staff cancellation
select throws_ok($$ select public.admin_cancel_booking(pg_temp.r('j3'), 'Not needed any more, sorry') $$,
  '42501', 'You do not have permission to decide disputes.', 'a farmer cannot use the staff cancel');
select pg_temp.staff();
select throws_ok($$ select public.admin_cancel_booking(pg_temp.r('j3'), 'no') $$,
  '22023', 'Write down why staff cancelled this booking (at least 10 characters).', 'a staff cancel needs a real reason');
select lives_ok($$ select public.admin_cancel_booking(pg_temp.r('j3'), 'The provider is suspended; the farmer will rebook') $$,
  'staff cancel the requested booking');
select is((select status::text || '/' || closed_reason from public.bookings where id = pg_temp.r('j3')) like 'cancelled/Staff:%', true,
  'the booking is cancelled with the staff reason');
select is((select count(*)::int from public.booking_events where booking_id = pg_temp.r('j3') and event = 'cancelled'), 1,
  'the staff cancel is in the history');
select throws_ok($$ select public.admin_cancel_booking(pg_temp.r('j3'), 'Cancelling it twice for good measure') $$,
  '22023', 'This booking is already closed.', 'a closed booking cannot be cancelled again');

---------------------------------------------------------------- stats and the staff view
select pg_temp.farmer();
select throws_ok($$ select public.admin_booking_stats() $$, '42501',
  'You do not have permission to view bookings.', 'a farmer cannot read the staff stats');
select is((select count(*)::int from public.bookings where id = pg_temp.r('j4') and status = 'in_progress'), 1,
  'j4 is at check-in');
select lives_ok($$ select public.dispute_booking(pg_temp.r('j4'), 'no_show', 'Nobody came to the farm today') $$,
  'the farmer reports a no-show on j4');
reset role;
update public.bookings set disputed_at = now() - interval '49 hours' where id = pg_temp.r('j4');
set local role authenticated;
select pg_temp.staff();
select is((public.admin_booking_stats() ->> 'disputed_over_48h')::int > 0, true,
  'a dispute older than 48 hours raises the SLA flag');
select is((public.booking_detail(pg_temp.r('j4')) ->> 'my_side'), 'staff', 'staff see their own side of the record');
select is((public.booking_detail(pg_temp.r('j4')) -> 'can' ->> 'resolve_dispute'), 'true',
  'staff are offered the resolution action on an open dispute');

select * from finish();
rollback;
