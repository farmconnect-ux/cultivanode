-- Batch 05 (part 4) pgTAP tests: email providers, farm alert email queue, opt-out and worker RPCs.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, phone, raw_user_meta_data) values
  ('42000000-0000-4000-8000-000000000001', '2348042000001', '{"full_name":"Farmer Tunde"}'),
  ('42000000-0000-4000-8000-000000000002', '2348042000002', '{"full_name":"Farmer Ngozi"}')
on conflict (id) do nothing;
update public.profiles set email = 'tunde@example.com' where id = '42000000-0000-4000-8000-000000000001';
update public.profiles set email = null where id = '42000000-0000-4000-8000-000000000002';

-- Providers
select is((select count(*)::int from public.integration_providers where kind = 'email' and code in ('resend', 'smtp', 'mock_email')), 3,
  'Resend, SMTP and the test provider are registered as email providers');
select is((select active_provider from public.integration_settings where kind = 'email'), 'resend', 'Resend is the default email provider');
select ok((select test_only from public.integration_providers where code = 'mock_email'), 'the test email provider is test-only');

-- Queueing
select private.notify('42000000-0000-4000-8000-000000000001', 'farm_stock_low', null,
  '{"title":"Urea 50kg","name":"Tunde Farm","note":"2 bags","event_id":"42000000-0000-4000-8000-0000000000e1","farm_id":"42000000-0000-4000-8000-0000000000f1"}', false);
select is((select count(*)::int from public.email_outbox where profile_id = '42000000-0000-4000-8000-000000000001' and status = 'queued'), 1,
  'a farm alert queues one email for a person with an email address');
select is((select data ->> 'note' from public.email_outbox where profile_id = '42000000-0000-4000-8000-000000000001'), '2 bags',
  'the email carries the alert data');
select ok(not exists (select 1 from public.email_outbox o, public.profiles p where p.id = o.profile_id and o.data::text like '%' || p.email || '%'),
  'the queue holds no email address');

select private.notify('42000000-0000-4000-8000-000000000001', 'booking_requested', null, '{"title":"Tractor"}', false);
select is((select count(*)::int from public.email_outbox where profile_id = '42000000-0000-4000-8000-000000000001'), 1,
  'other notification kinds do not queue an email');

select private.notify('42000000-0000-4000-8000-000000000002', 'farm_stock_low', null, '{"title":"NPK"}', false);
select is((select count(*)::int from public.email_outbox where profile_id = '42000000-0000-4000-8000-000000000002'), 0,
  'nothing is queued for a person without an email address');

-- Worker RPCs are for the service role only.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"42000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$ select * from public.claim_email_outbox(10) $$, '42501', null, 'farmers cannot claim the email queue');
select throws_ok($$ select public.finish_email_outbox(array[]::uuid[], true, 'resend', null, null, false) $$, '42501', null,
  'farmers cannot finish email rows');
select throws_ok($$ select 1 from public.email_outbox $$, '42501', null, 'farmers cannot read the email queue');
reset role;

set local role service_role;
select is((select count(*)::int from public.claim_email_outbox(10) where email = 'tunde@example.com' and kind = 'farm_stock_low'), 1,
  'the worker claims the queued email with the address read at send time');
select public.finish_email_outbox(array(select id from public.email_outbox where profile_id = '42000000-0000-4000-8000-000000000001'),
  false, 'resend', null, 'unavailable', true);
reset role;
select is((select status from public.email_outbox where profile_id = '42000000-0000-4000-8000-000000000001'), 'queued',
  'a retryable failure goes back in the queue');
select ok((select next_attempt_at > now() from public.email_outbox where profile_id = '42000000-0000-4000-8000-000000000001'),
  'and waits before the next attempt');

update public.email_outbox set next_attempt_at = now() - interval '1 minute' where profile_id = '42000000-0000-4000-8000-000000000001';
set local role service_role;
select count(*) from public.claim_email_outbox(10);
select public.finish_email_outbox(array(select id from public.email_outbox where profile_id = '42000000-0000-4000-8000-000000000001'),
  true, 'resend', 'msg-1', null, false);
reset role;
select is((select status || ':' || message_id from public.email_outbox where profile_id = '42000000-0000-4000-8000-000000000001'), 'sent:msg-1',
  'a sent email is recorded with the provider message id');

-- Stale rows are dropped, not sent.
insert into public.email_outbox (profile_id, kind, data, created_at)
values ('42000000-0000-4000-8000-000000000001', 'farm_task_overdue', '{}', now() - interval '4 days');
set local role service_role;
select is((select count(*)::int from public.claim_email_outbox(10)), 0, 'alerts older than 3 days are not sent');
reset role;
select is((select error_code from public.email_outbox where kind = 'farm_task_overdue' and profile_id = '42000000-0000-4000-8000-000000000001'),
  'expired', 'and are marked expired');

-- Opt-out
select private.notify('42000000-0000-4000-8000-000000000001', 'farm_weather_risk', null, '{"title":"Spray"}', false);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"42000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select public.set_farm_alert_email(false);
select is((select farm_alert_email from public.notification_preferences), false, 'a farmer can turn farm alert emails off and read the choice');
reset role;
select is((select error_code from public.email_outbox where kind = 'farm_weather_risk'), 'opted_out',
  'turning emails off drops emails still waiting');
select private.notify('42000000-0000-4000-8000-000000000001', 'farm_stock_expiring', null, '{"title":"Herbicide"}', false);
select is((select count(*)::int from public.email_outbox where kind = 'farm_stock_expiring'), 0,
  'no email is queued after opting out');

select * from finish();
rollback;
