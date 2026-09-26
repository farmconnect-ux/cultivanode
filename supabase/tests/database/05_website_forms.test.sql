-- Public website forms: marketplace waitlist and contact messages.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

---------------------------------------------------------------- as an anonymous visitor
set local role anon;

select lives_ok($$ select public.join_waitlist('buyer', 'Funke Buyer', '0803 123 4567', null, 'Oyo', 'Tomatoes', 'yo') $$,
  'a visitor can join the buyer waitlist');
select lives_ok($$ select public.join_waitlist('buyer', 'Funke Again', '+234 803-123-4567') $$,
  'joining twice with the same number succeeds quietly');
select lives_ok($$ select public.join_waitlist('seller', 'Funke Seller', '08031234567') $$,
  'the same number can also join the seller waitlist');
select throws_ok($$ select public.join_waitlist('seller', 'Bad Phone', '12345') $$,
  '22023', null, 'a non-Nigerian phone number is rejected');
select throws_ok($$ select public.join_waitlist('seller', 'No Contact') $$,
  '22023', null, 'a phone or email is required');
select lives_ok($$ select public.send_contact_message('Ade Test', 'How do I hire a tractor?', null, 'Ade@Example.com') $$,
  'a visitor can send a contact message');
select throws_ok($$ select public.send_contact_message('Ade Test', 'Hi', null, 'ade@example.com') $$,
  '23514', null, 'a message must be at least 5 characters');
select throws_ok($$ select count(*) from public.waitlist_signups $$, '42501', null, 'visitors cannot read the waitlist');
select throws_ok($$ select count(*) from public.contact_messages $$, '42501', null, 'visitors cannot read contact messages');

---------------------------------------------------------------- stored values
reset role;
select is((select count(*)::int from public.waitlist_signups where phone = '2348031234567'), 2,
  'phone numbers are stored as 234XXXXXXXXXX and de-duplicated per side');
select is((select email from public.contact_messages limit 1), 'ade@example.com', 'emails are stored in lower case');

---------------------------------------------------------------- signed-in non-staff user
insert into auth.users (id, phone) values ('55555555-0000-0000-0000-000000000005', '2348000000555');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-0000-0000-0000-000000000005"}', true);
select is((select count(*)::int from public.waitlist_signups), 0, 'ordinary users cannot see the waitlist');

reset role;
select * from finish();
rollback;
