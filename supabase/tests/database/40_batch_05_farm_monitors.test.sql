-- Batch 05 (part 1) pgTAP tests: farm monitors, intelligence events, dedup and consent gating.
-- PRO-AC-01 (positive, negative, boundary fixtures), PRO-AC-02 (no duplicate within cooldown),
-- PRO-AC-03 (consent and active account only; tenant isolation), PRO-AC-07 (run ledger).
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- Fixtures: Ade (consented), Bisi (no consent), Femi (stranger).
insert into auth.users (id, phone, raw_user_meta_data) values
  ('40000000-0000-4000-8000-000000000001', '2348040000001', '{"full_name":"Farmer Ade"}'),
  ('40000000-0000-4000-8000-000000000002', '2348040000002', '{"full_name":"Farmer Bisi"}'),
  ('40000000-0000-4000-8000-000000000003', '2348040000003', '{"full_name":"Stranger Femi"}')
on conflict (id) do nothing;

insert into public.consents (profile_id, consent_type, granted, document_version, created_by)
values ('40000000-0000-4000-8000-000000000001', 'ai_intelligence', true, 'test-40', '40000000-0000-4000-8000-000000000001');

insert into public.farms (id, owner_id, name, location, area_ha, zone, state, lga) values
  ('40000000-0000-4000-8000-000000000101', '40000000-0000-4000-8000-000000000001', 'Ade Farm 40',
   'SRID=4326;POINT(3.89 7.37)', 2.0, 'derived_savanna', 'Oyo', 'Ibadan'),
  ('40000000-0000-4000-8000-000000000102', '40000000-0000-4000-8000-000000000002', 'Bisi Farm 40',
   'SRID=4326;POINT(3.90 7.38)', 2.0, 'derived_savanna', 'Oyo', 'Ibadan');

insert into public.plots (id, farm_id, name, area_ha) values
  ('40000000-0000-4000-8000-000000000201', '40000000-0000-4000-8000-000000000101', 'North plot', 1.0),
  ('40000000-0000-4000-8000-000000000202', '40000000-0000-4000-8000-000000000102', 'Bisi plot', 1.0);

insert into public.crop_cycles (id, farm_id, plot_id, crop_id, season, status, target_area_ha, planting_date, expected_harvest_date, target_yield_kg) values
  ('40000000-0000-4000-8000-000000000301', '40000000-0000-4000-8000-000000000101', '40000000-0000-4000-8000-000000000201',
   'maize', 'early_rainy', 'maintenance', 1.0, current_date - 30, current_date + 75, 3000),
  ('40000000-0000-4000-8000-000000000302', '40000000-0000-4000-8000-000000000102', '40000000-0000-4000-8000-000000000202',
   'maize', 'early_rainy', 'maintenance', 1.0, current_date - 30, current_date + 75, 3000);

insert into public.crop_cycle_operations (id, crop_cycle_id, operation_type, name, stage, status, scheduled_date) values
  -- Ade: due in 5 days (7-day alert), due in 2 days (2-day alert), 3 days late, 61 days late (too old),
  -- completed and late (never alerted), fertiliser in 10 days with no soil test, due in 8 days (outside window).
  ('40000000-0000-4000-8000-000000000401', '40000000-0000-4000-8000-000000000301', 'weed_control', 'Second weeding', 'Vegetative', 'pending', current_date + 5),
  ('40000000-0000-4000-8000-000000000402', '40000000-0000-4000-8000-000000000301', 'pest_control', 'Scout for armyworm', 'Vegetative', 'pending', current_date + 2),
  ('40000000-0000-4000-8000-000000000403', '40000000-0000-4000-8000-000000000301', 'weed_control', 'First weeding', 'Vegetative', 'pending', current_date - 3),
  ('40000000-0000-4000-8000-000000000404', '40000000-0000-4000-8000-000000000301', 'land_prep', 'Old clearing', 'Pre-planting', 'pending', current_date - 61),
  ('40000000-0000-4000-8000-000000000405', '40000000-0000-4000-8000-000000000301', 'planting', 'Planting', 'Planting', 'completed', current_date - 20),
  ('40000000-0000-4000-8000-000000000406', '40000000-0000-4000-8000-000000000301', 'fertiliser', 'Top-dress with urea', 'Vegetative', 'pending', current_date + 10),
  ('40000000-0000-4000-8000-000000000407', '40000000-0000-4000-8000-000000000301', 'harvest', 'Harvest', 'Harvest', 'pending', current_date + 8),
  -- Bisi (no consent): overdue and upcoming, must never alert.
  ('40000000-0000-4000-8000-000000000411', '40000000-0000-4000-8000-000000000302', 'weed_control', 'Bisi weeding', 'Vegetative', 'pending', current_date - 3),
  ('40000000-0000-4000-8000-000000000412', '40000000-0000-4000-8000-000000000302', 'fertiliser', 'Bisi fertiliser', 'Vegetative', 'pending', current_date + 3);

insert into public.farm_operational_tasks (id, farm_id, title, category, priority, status, start_date, due_date) values
  ('40000000-0000-4000-8000-000000000501', '40000000-0000-4000-8000-000000000101', 'Fix the fence', 'maintenance', 'medium', 'planned', current_date - 10, current_date - 1);

-- Structure.
select has_table('public', 'fie_intelligence_events', 'fie_intelligence_events exists');
select ok((select relforcerowsecurity from pg_class where oid = 'public.fie_intelligence_events'::regclass), 'events table forces RLS');
select is((select count(*)::int from private.scheduled_task_registry where task_name = 'farm_monitors' and is_enabled), 1,
  'farm_monitors task is registered and enabled');

-- Run with the fixture date so the cases below are deterministic.
select lives_ok($$ select private.run_farm_monitors(gen_random_uuid(), current_date) $$, 'monitors run for a fixed date');

-- Positive, negative and boundary cases (PRO-AC-01).
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '40000000-0000-4000-8000-000000000401' and dedup_key like '%:7d:%'), 1,
  'operation in 5 days raises the 7-day alert');
select is((select severity from public.fie_intelligence_events where subject_id = '40000000-0000-4000-8000-000000000402'), 'warning',
  'operation in 2 days raises a 2-day warning');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '40000000-0000-4000-8000-000000000403' and monitor_key = 'overdue_operation'), 1,
  'operation 3 days late is overdue');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '40000000-0000-4000-8000-000000000404'), 0,
  'operation more than 60 days late is not alerted');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '40000000-0000-4000-8000-000000000405'), 0,
  'completed operation is not alerted');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '40000000-0000-4000-8000-000000000407'), 0,
  'operation 8 days away is outside the upcoming window');
select is((select count(*)::int from public.fie_intelligence_events where monitor_key = 'soil_test_stale' and crop_cycle_id = '40000000-0000-4000-8000-000000000301'), 1,
  'fertiliser in 10 days with no soil test raises soil_test_stale');
select is((select count(*)::int from public.fie_intelligence_events where subject_id = '40000000-0000-4000-8000-000000000501' and subject_type = 'farm_operational_task'), 1,
  'farm task past its due date is overdue');

-- PRO-AC-03: no consent, no events.
select is((select count(*)::int from public.fie_intelligence_events where farm_id = '40000000-0000-4000-8000-000000000102'), 0,
  'farm without ai_intelligence consent is not monitored');

-- The owner gets an in-app notification per event.
select is((select count(*)::int from public.notifications where profile_id = '40000000-0000-4000-8000-000000000001' and kind like 'farm_%'),
          (select count(*)::int from public.fie_intelligence_events where farm_id = '40000000-0000-4000-8000-000000000101'),
  'one in-app notification per event');

-- PRO-AC-02: a second run creates nothing; a direct duplicate is refused.
select is((private.run_farm_monitors(gen_random_uuid(), current_date) ->> 'overdue_operation')::int, 0, 'second run raises no duplicate');
select throws_ok($$
  insert into public.fie_intelligence_events (farm_id, monitor_key, monitor_version, event_type, severity, subject_type, subject_id, dedup_key, cooldown_until)
  select farm_id, monitor_key, 1, 'need', 'info', subject_type, subject_id, dedup_key, now() + interval '1 day'
    from public.fie_intelligence_events where subject_id = '40000000-0000-4000-8000-000000000403' limit 1
$$, '23505', null, 'duplicate inside the cooldown is refused by the database');

-- Run through the allowlisted wrapper as the scheduler would (PRO-AC-07). It uses Lagos "today".
select is((private.run_scheduled_task('farm_monitors') ->> 'status'), 'completed', 'farm_monitors run completes');
select is((select count(*)::int from private.scheduled_task_runs where task_name = 'farm_monitors' and status = 'completed'), 1,
  'the run is in the ledger');

-- Boundary: a soil test just over 2 years old still counts as stale.
insert into public.soil_records (plot_id, tested_on, soil_type, ph)
values ('40000000-0000-4000-8000-000000000202', current_date - 731, 'loam', 6.0);
insert into public.consents (profile_id, consent_type, granted, document_version, created_by)
values ('40000000-0000-4000-8000-000000000002', 'ai_intelligence', true, 'test-40', '40000000-0000-4000-8000-000000000002');
select private.run_farm_monitors(gen_random_uuid(), current_date);
select is((select count(*)::int from public.fie_intelligence_events where monitor_key = 'soil_test_stale' and farm_id = '40000000-0000-4000-8000-000000000102'), 1,
  'a soil test older than 2 years still counts as stale');

-- Tenant isolation and the farmer response path.
select set_config('test.ade_event', (select id::text from public.fie_intelligence_events
                                      where subject_id = '40000000-0000-4000-8000-000000000403' limit 1), true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*)::int from public.fie_intelligence_events), 0, 'a stranger sees no events');
select throws_ok($$
  select public.respond_to_intelligence_event(current_setting('test.ade_event')::uuid, 'useful')
$$, 'P0002', null, 'a stranger cannot respond to another farm''s alert');
select throws_ok($$
  update public.fie_intelligence_events set status = 'resolved'
$$, '42501', null, 'farmers cannot update events directly');

select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select ok((select count(*) from public.fie_intelligence_events) > 0, 'the owner sees their events');
select lives_ok($$
  select public.respond_to_intelligence_event(current_setting('test.ade_event')::uuid, 'done')
$$, 'the owner can mark an alert done');

select * from finish();
rollback;
