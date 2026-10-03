-- MVP week 3, master plan rules (decided 2026-10-03): booking needs tier 1 (NIN); before/after photos carry GPS
-- inside the farm boundary; either side disputes within 48 hours with a reason category and evidence photos;
-- only completed, paid jobs can be rated.
begin;
create extension if not exists pgtap with schema extensions;
select plan(40);

insert into auth.users (id, phone) values
  ('c4000000-0000-0000-0000-000000000004', '2348000004004'),  -- Kemi: farmer in Oyo
  ('c4000000-0000-0000-0000-000000000005', '2348000004005'),  -- Lanre: tractor owner, tier 2
  ('c4000000-0000-0000-0000-000000000007', '2348000004007');  -- Ada: third party
update public.profiles set onboarded_at = now(), full_name = v.n, state = 'Oyo', phone = v.ph
  from (values ('c4000000-0000-0000-0000-000000000004'::uuid, 'Kemi Adewale', '2348000004004'),
               ('c4000000-0000-0000-0000-000000000005'::uuid, 'Lanre Adeyemi', '2348000004005'),
               ('c4000000-0000-0000-0000-000000000007'::uuid, 'Ada Obi', '2348000004007')) v(i, n, ph)
 where id = v.i;
insert into public.user_roles (profile_id, role) values
  ('c4000000-0000-0000-0000-000000000004', 'crop_farmer'),
  ('c4000000-0000-0000-0000-000000000005', 'machinery_owner'),
  ('c4000000-0000-0000-0000-000000000007', 'crop_farmer');
update public.profiles set verification_tier = 2 where id = 'c4000000-0000-0000-0000-000000000005';
-- Kemi's farm has a mapped boundary (about 220 m square around the pin).
insert into public.farms (id, owner_id, name, location, boundary, state) values
  ('c4000000-0000-0000-0000-0000000000f4', 'c4000000-0000-0000-0000-000000000004', 'Kemi mapped farm',
   'SRID=4326;POINT(3.8967 7.3775)',
   'SRID=4326;POLYGON((3.8957 7.3765, 3.8977 7.3765, 3.8977 7.3785, 3.8957 7.3785, 3.8957 7.3765))', 'Oyo');
insert into public.listings (id, owner_id, kind, equipment_type, title, location, service_radius_km, status)
values
  ('c4000000-0000-0000-0000-0000000000a1', 'c4000000-0000-0000-0000-000000000005', 'equipment', 'tractor', 'Tractor one', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active'),
  ('c4000000-0000-0000-0000-0000000000a2', 'c4000000-0000-0000-0000-000000000005', 'equipment', 'tractor', 'Tractor two', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active'),
  ('c4000000-0000-0000-0000-0000000000a3', 'c4000000-0000-0000-0000-000000000005', 'equipment', 'tractor', 'Tractor three', 'SRID=4326;POINT(3.8967 7.42242)', 30, 'active');
insert into public.listing_rates (listing_id, unit, rate_kobo)
select id, 'hectare', 2500000 from public.listings where owner_id = 'c4000000-0000-0000-0000-000000000005';
update public.feature_flags set enabled = true, states = array['Oyo'] where key = 'marketplace_live';

create table pg_temp.ids (k text primary key, id uuid not null);
create function pg_temp.keep(p_k text, p_id uuid) returns void language sql security definer as $$
  insert into pg_temp.ids values (p_k, p_id) $$;
create function pg_temp.r(p_k text) returns uuid language sql stable security definer as $$
  select id from pg_temp.ids where k = p_k $$;
create function pg_temp.today() returns date language sql stable as $$ select (now() at time zone 'Africa/Lagos')::date $$;
grant execute on all functions in schema pg_temp to authenticated, service_role;
grant select on pg_temp.ids to authenticated;

---------------------------------------------------------------- 4. booking needs tier 1 (NIN)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000004"}', true);
select throws_ok($$ select public.request_booking('c4000000-0000-0000-0000-0000000000a1', 'c4000000-0000-0000-0000-0000000000f4',
  pg_temp.today(), 'hectare', 1, null) $$, '42501', 'Verify your NIN before you book a job.', 'a farmer without a verified NIN cannot book');
reset role;
update public.profiles set verification_tier = 1 where id = 'c4000000-0000-0000-0000-000000000004';
set local role authenticated;
do $$ begin
  perform pg_temp.keep('j1', public.request_booking('c4000000-0000-0000-0000-0000000000a1', 'c4000000-0000-0000-0000-0000000000f4', pg_temp.today(), 'hectare', 1, null));
  perform pg_temp.keep('j2', public.request_booking('c4000000-0000-0000-0000-0000000000a2', 'c4000000-0000-0000-0000-0000000000f4', pg_temp.today(), 'hectare', 1, null));
  perform pg_temp.keep('j3', public.request_booking('c4000000-0000-0000-0000-0000000000a3', 'c4000000-0000-0000-0000-0000000000f4', pg_temp.today(), 'hectare', 1, null));
end $$;
select is((select count(*)::int from pg_temp.ids), 3, 'with tier 1 she books three jobs for today');

select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000005"}', true);
do $$ begin
  perform public.accept_booking(pg_temp.r(k)) from pg_temp.ids;
  perform public.check_in_booking(pg_temp.r(k), 7.3776, 3.8968) from pg_temp.ids;
end $$;
select is((select count(*)::int from public.bookings where id in (select id from pg_temp.ids) and status = 'in_progress'), 3,
  'all three are in progress');

---------------------------------------------------------------- 3. proof photos carry GPS inside the farm
reset role;
insert into storage.objects (bucket_id, name)
select 'booking-proofs', id || '/c4000000-0000-0000-0000-000000000005/' || f
  from pg_temp.ids, unnest(array['before.jpg', 'after.jpg', 'extra.jpg', 'outside.jpg']) f;
set local role authenticated;
select throws_ok($$ select public.submit_proof(pg_temp.r('j1'), pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000005/before.jpg',
  'before', now()) $$, '22023', 'Photos must carry the phone''s location. Turn on GPS and take the photo again.',
  'a before photo without GPS is refused');
select throws_ok($$ select public.submit_proof(pg_temp.r('j1'), pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000005/outside.jpg',
  'after', now(), 7.3775, 3.9007) $$, '22023', 'That photo was not taken at the farm.',
  'a photo 440 m east of the pin, outside the mapped boundary, is refused');
select isnt(public.submit_proof(pg_temp.r('j1'), pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000005/before.jpg',
  'before', now(), 7.3776, 3.8968), null, 'a before photo inside the boundary is recorded');
select isnt(public.submit_proof(pg_temp.r('j1'), pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000005/extra.jpg',
  'extra', now()), null, 'an extra photo may go without GPS');
select isnt(public.submit_proof(pg_temp.r('j1'), pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000005/after.jpg',
  'after', now(), 7.3784, 3.8976), null, 'an after photo at the corner of the boundary is recorded');
do $$ begin
  perform public.submit_proof(pg_temp.r(k), pg_temp.r(k) || '/c4000000-0000-0000-0000-000000000005/before.jpg', 'before', now(), 7.3776, 3.8968),
          public.submit_proof(pg_temp.r(k), pg_temp.r(k) || '/c4000000-0000-0000-0000-000000000005/after.jpg', 'after', now(), 7.3776, 3.8968)
    from pg_temp.ids where k in ('j2', 'j3');
  perform public.finish_booking_work(pg_temp.r(k), null) from pg_temp.ids;
end $$;
select is((select count(*)::int from public.bookings where id in (select id from pg_temp.ids) and status = 'awaiting_confirmation'), 3,
  'the three jobs wait for the farmer');

---------------------------------------------------------------- 1. disputes: either side, reason category, 48 hours, evidence
select is((public.booking_detail(pg_temp.r('j1')) -> 'can' ->> 'dispute'), 'true', 'the provider may dispute within the 48 hours');
select throws_ok($$ select public.dispute_booking(pg_temp.r('j1'), 'something else', null) $$, '22023', 'Choose what went wrong.',
  'a reason outside the categories is refused');
select lives_ok($$ select public.dispute_booking(pg_temp.r('j1'), 'damage', 'A rock in the field broke the plough disc') $$,
  'the provider opens a damage dispute');
select is((select status::text || '/' || dispute_category from public.bookings where id = pg_temp.r('j1')), 'disputed/damage',
  'the job is disputed with its category');
select is((public.booking_detail(pg_temp.r('j1')) ->> 'disputed_by'), 'provider', 'the record says the provider opened it');
select throws_ok($$ select public.dispute_booking(pg_temp.r('j1'), 'damage', null) $$, '22023', 'This booking cannot be disputed now.',
  'no second dispute on the same job');
reset role;
select is((select count(*)::int from public.sms_outbox where booking_id = pg_temp.r('j1') and kind = 'booking_disputed'
             and profile_id = 'c4000000-0000-0000-0000-000000000004'), 1, 'the farmer gets an SMS about the dispute');
select is((select data ->> 'category' from public.notifications where booking_id = pg_temp.r('j1') and kind = 'booking_disputed'),
  'damage', 'the notice carries the category');

-- Evidence: either party, into their own folder, while the dispute is open.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000004"}', true);
select is((public.booking_detail(pg_temp.r('j1')) -> 'can' ->> 'add_evidence'), 'true', 'the farmer may add evidence');
select lives_ok($$ insert into storage.objects (bucket_id, name)
  values ('booking-proofs', pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000004/field.jpg') $$,
  'the farmer can upload evidence into her own folder of the disputed job');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('booking-proofs', pg_temp.r('j2') || '/c4000000-0000-0000-0000-000000000004/field.jpg') $$, '42501', null,
  'but not into a job that is not disputed');
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('booking-proofs', pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000005/fake.jpg') $$, '42501', null,
  'nor into the provider''s folder');
select isnt(public.add_dispute_evidence(pg_temp.r('j1'), pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000004/field.jpg',
  now(), 7.3776, 3.8968), null, 'the farmer''s evidence photo is recorded');
select throws_ok($$ select public.add_dispute_evidence(pg_temp.r('j2'), pg_temp.r('j2') || '/c4000000-0000-0000-0000-000000000004/field.jpg', now()) $$,
  '22023', 'Evidence can be added while a dispute is open.', 'evidence needs an open dispute');
select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ insert into storage.objects (bucket_id, name)
  values ('booking-proofs', pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000005/disc.jpg') $$,
  'the provider uploads his evidence too');
select isnt(public.add_dispute_evidence(pg_temp.r('j1'), pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000005/disc.jpg', now()),
  null, 'and records it (GPS is optional for evidence)');
select is((select jsonb_agg(p ->> 'by' order by p ->> 'by') from jsonb_array_elements(public.booking_detail(pg_temp.r('j1')) -> 'proofs') p
            where p ->> 'kind' = 'evidence'), '["farmer", "provider"]'::jsonb, 'each evidence photo shows who added it');
select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000007"}', true);
select throws_ok($$ insert into storage.objects (bucket_id, name)
  values ('booking-proofs', pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000007/x.jpg') $$, '42501', null,
  'a third party cannot upload evidence');
select throws_ok($$ select public.add_dispute_evidence(pg_temp.r('j1'), pg_temp.r('j1') || '/c4000000-0000-0000-0000-000000000007/x.jpg', now()) $$,
  'P0002', 'Booking not found.', 'or record any');
reset role;
select is((select count(*)::int from public.booking_events where booking_id = pg_temp.r('j1') and event = 'evidence_added'), 2,
  'both evidence photos are in the history');
select is((select count(*)::int from public.notifications where booking_id = pg_temp.r('j1') and kind = 'dispute_evidence_added'), 2,
  'each side is told the other added evidence');

-- The 48-hour window closes.
update public.bookings set confirm_by = now() - interval '1 minute' where id = pg_temp.r('j2');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000004"}', true);
select is((public.booking_detail(pg_temp.r('j2')) -> 'can' ->> 'dispute'), 'false', 'no dispute is offered after 48 hours');
select throws_ok($$ select public.dispute_booking(pg_temp.r('j2'), 'poor_quality', null) $$, '22023',
  'The 48 hours to raise a problem have passed.', 'and none can be opened');

---------------------------------------------------------------- 2. ratings only on completed, paid jobs
select lives_ok($$ select public.confirm_booking(pg_temp.r('j3')) $$, 'the farmer confirms j3');
select is((public.booking_detail(pg_temp.r('j3')) -> 'can' ->> 'rate'), 'false', 'a confirmed but unpaid job cannot be rated yet');
select throws_ok($$ select public.rate_booking(pg_temp.r('j3'), 5, '{}', null) $$, '22023',
  'You can rate after the job is completed and paid.', 'rating it is refused');
select lives_ok($$ select public.mark_paid(pg_temp.r('j3'), 2500000) $$, 'the farmer marks N25,000');
select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000005"}', true);
select lives_ok($$ select public.mark_paid(pg_temp.r('j3'), 2500000) $$, 'the provider marks the same');
select is((public.booking_detail(pg_temp.r('j3')) ->> 'status'), 'completed', 'the job is completed and paid');
select lives_ok($$ select public.rate_booking(pg_temp.r('j3'), 4, array['good_communication'], null) $$, 'now the provider can rate');
select set_config('request.jwt.claims', '{"sub":"c4000000-0000-0000-0000-000000000004"}', true);
select lives_ok($$ select public.rate_booking(pg_temp.r('j3'), 5, array['on_time'], null) $$, 'and the farmer');

select * from finish();
rollback;
