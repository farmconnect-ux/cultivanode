-- Home-page carousel, page-view counts and the admin analytics dashboard.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

insert into auth.users (id, phone) values
  ('90000000-0000-0000-0000-000000000001', '2348000000901'),  -- Ade: super admin
  ('90000000-0000-0000-0000-000000000002', '2348000000902'),  -- Bola: verification officer
  ('90000000-0000-0000-0000-000000000003', '2348000000903'),  -- Chika: farmer (web)
  ('90000000-0000-0000-0000-000000000004', '2348000000904'),  -- Dapo: farmer (mobile)
  ('90000000-0000-0000-0000-000000000005', '2348000000905'),  -- Eze: signed up, not finished
  ('90000000-0000-0000-0000-000000000006', '2348000000906');  -- Funmi: field agent
insert into public.admin_roles (profile_id, admin_role) values
  ('90000000-0000-0000-0000-000000000001', 'super_admin'),
  ('90000000-0000-0000-0000-000000000002', 'verification_officer');
update public.profiles set full_name = 'Staff', onboarded_at = now()
 where id in ('90000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002');
insert into public.user_roles (profile_id, role) values ('90000000-0000-0000-0000-000000000006', 'field_agent');
update public.profiles set full_name = 'Funmi Agent', onboarded_at = now() where id = '90000000-0000-0000-0000-000000000006';

---------------------------------------------------------------- onboarding channels (for analytics)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000003"}', true);
select public.complete_onboarding('Chika Web', 'individual', null, null, 'Oyo', 'Ido', 'en',
  '[{"role":"crop_farmer"}]', '{"terms_of_use":true,"privacy_policy":true}', 'v1');
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000004"}', true);
select public.complete_onboarding('Dapo Mobile', 'individual', null, null, 'Ogun', 'Ifo', 'yo',
  '[{"role":"crop_farmer"},{"role":"machinery_owner"}]', '{"terms_of_use":true,"privacy_policy":true}', 'v1', 'mobile');

---------------------------------------------------------------- carousel: permissions
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000003"}', true);
select throws_ok($$ select public.admin_save_hero_slide(null, 'hero/11111111-1111-1111-1111-111111111111.jpg',
  null, null, null, null, 'A farmer in a cassava field', null, null, true) $$,
  '42501', null, 'ordinary users cannot add slides');
select throws_ok($$ insert into public.hero_slides (image_path, alt_en) values
  ('hero/11111111-1111-1111-1111-111111111111.jpg', 'Sneaky slide') $$,
  '42501', null, 'the table cannot be written directly');
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000002"}', true);
select throws_ok($$ select public.admin_save_hero_slide(null, 'hero/11111111-1111-1111-1111-111111111111.jpg',
  null, null, null, null, 'A farmer in a cassava field', null, null, true) $$,
  '42501', null, 'staff without site_content.manage cannot add slides');

---------------------------------------------------------------- carousel: editing
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000001"}', true);
select throws_ok($$ select public.admin_save_hero_slide(null, 'uploads/evil.svg',
  null, null, null, null, 'A picture', null, null, true) $$,
  '23514', null, 'pictures must be jpg/png/webp files in the hero folder');
select throws_ok($$ select public.admin_save_hero_slide(null, 'hero/11111111-1111-1111-1111-111111111111.jpg',
  null, null, null, null, '  ', null, null, true) $$,
  '23514', null, 'a picture description is required');
select throws_ok($$ select public.admin_save_hero_slide(null, 'hero/11111111-1111-1111-1111-111111111111.jpg',
  null, null, null, null, 'A picture', null, 'javascript:alert(1)', true) $$,
  '23514', null, 'links must be site paths or https');
select throws_ok($$ select public.admin_save_hero_slide(null, null,
  null, null, null, null, 'A picture', null, null, true) $$,
  '22023', 'Choose a picture.', 'a new slide needs a picture');

select lives_ok($$ select public.admin_save_hero_slide(null, 'hero/11111111-1111-1111-1111-111111111111.jpg',
  ' Hire vetted hands ', '', 'Book help for weeding and harvest.', null, 'Farm hands weeding a cassava field', null,
  '/en/farmers', true) $$, 'a slide is created');
select lives_ok($$ select public.admin_save_hero_slide(null, 'hero/22222222-2222-2222-2222-222222222222.webp',
  null, null, null, null, 'A tractor ploughing', null, 'https://example.com/tractors', false) $$,
  'a hidden slide is created');
select lives_ok($$ select public.admin_save_hero_slide(null, 'hero/33333333-3333-3333-3333-333333333333.png',
  null, null, null, null, 'Market day', null, null, true) $$, 'a third slide is created');
select is((select title_en || '|' || coalesce(title_yo, 'null') from public.hero_slides where alt_en like 'Farm hands%'),
  'Hire vetted hands|null', 'text is trimmed and blanks become empty');
select is(array(select alt_en from public.hero_slides order by position),
  array['Farm hands weeding a cassava field', 'A tractor ploughing', 'Market day'], 'new slides go to the end');

select lives_ok($$ select public.admin_move_hero_slide((select id from public.hero_slides where alt_en = 'Market day'), true) $$,
  'a slide moves up');
select is(array(select alt_en from public.hero_slides order by position),
  array['Farm hands weeding a cassava field', 'Market day', 'A tractor ploughing'], 'the order changes');
select lives_ok($$ select public.admin_move_hero_slide((select id from public.hero_slides where alt_en like 'Farm hands%'), true) $$,
  'moving the first slide up does nothing');

select is((select public.admin_save_hero_slide(id, 'hero/44444444-4444-4444-4444-444444444444.jpg', 'New title', null,
             null, null, 'Farm hands weeding a cassava field', null, null, true) ->> 'old_image_path'
             from public.hero_slides where alt_en like 'Farm hands%'),
  'hero/11111111-1111-1111-1111-111111111111.jpg', 'replacing a picture returns the old file to delete');
select is((select public.admin_save_hero_slide(id, null, 'Newer title', null, null, null,
             'Farm hands weeding a cassava field', null, null, null) ->> 'old_image_path'
             from public.hero_slides where alt_en like 'Farm hands%'),
  null, 'keeping the picture returns nothing to delete');
select is((select image_path || '|' || published::text from public.hero_slides where alt_en like 'Farm hands%'),
  'hero/44444444-4444-4444-4444-444444444444.jpg|true', 'the picture is kept and publishing is unchanged when not given');

select lives_ok($$ select public.admin_set_hero_slide_published((select id from public.hero_slides where alt_en = 'Market day'), false) $$,
  'a slide is hidden');
select is((select count(*)::int from public.admin_actions where entity = 'hero_slide'), 7, 'every change is recorded');
select is((select public.admin_delete_hero_slide(id) from public.hero_slides where alt_en = 'A tractor ploughing'),
  'hero/22222222-2222-2222-2222-222222222222.webp', 'deleting returns the file to remove');

select lives_ok($$ select public.admin_save_hero_slide(null, 'hero/' || gen_random_uuid() || '.jpg',
  null, null, null, null, 'Filler picture', null, null, false) from generate_series(1, 10) $$, 'ten more slides fit');
select throws_ok($$ select public.admin_save_hero_slide(null, 'hero/55555555-5555-5555-5555-555555555555.jpg',
  null, null, null, null, 'One too many', null, null, false) $$,
  '22023', 'The carousel holds at most 12 pictures. Delete one first.', 'the carousel is limited to 12 pictures');

---------------------------------------------------------------- carousel: who sees what
select is((select count(*)::int from public.hero_slides), 12, 'content staff see every slide');
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000003"}', true);
select is((select count(*)::int from public.hero_slides), 1, 'signed-in users see published slides only');
reset role;
set local role anon;
select set_config('request.jwt.claims', '{}', true);
select is(array(select alt_en from public.hero_slides), array['Farm hands weeding a cassava field'],
  'visitors see published slides only');

---------------------------------------------------------------- page views
select lives_ok($$ select public.track_page_view('/en'); select public.track_page_view('/en/'); select public.track_page_view('/YO/Farmers') $$,
  'visitors can record page views');
select lives_ok($$ select public.track_page_view('/en/account'); select public.track_page_view('/admin');
  select public.track_page_view('/en/<script>'); select public.track_page_view(null) $$,
  'private and invalid paths are ignored without error');
select is((select count(*)::int from public.page_view_daily), 0, 'visitors cannot read the counts');
reset role;
select is(array(select path || '=' || views from public.page_view_daily order by path),
  array['/en=2', '/yo/farmers=1'], 'views are counted per page, normalised');
select ok(not has_function_privilege('anon', 'public.admin_analytics(integer)', 'execute')
          and not has_function_privilege('authenticated', 'private.clean_text(text, integer)', 'execute'),
  'analytics and helpers are not exposed to visitors');

---------------------------------------------------------------- analytics
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000003"}', true);
select throws_ok($$ select public.admin_analytics(30) $$, '42501', null, 'ordinary users cannot see analytics');
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000002"}', true);
select is((select (public.admin_analytics(30) -> 'totals' ->> 'people')::int), 4,
  'verification officers can read analytics; staff are not counted');
select is((select public.admin_analytics(30) -> 'by_channel'),
  '{"web": 2, "mobile": 1, "not_finished": 1}'::jsonb,
  'sign-ups are split by channel (web, mobile, not finished)');
select is((select public.admin_analytics(5) ->> 'days')::int, 7, 'the period is at least 7 days');
select is((select jsonb_array_length(public.admin_analytics(30) -> 'signups_by_day')), 30, 'one entry per day');
select is((select (public.admin_analytics(30) -> 'page_views' ->> 'total')::int), 3, 'page views are totalled');
select is((select r ->> 'pending' from jsonb_array_elements(public.admin_analytics(30) -> 'roles') r
            where r ->> 'role' = 'machinery_owner'), '1', 'pending role requests are counted per role');

select * from finish();
rollback;
