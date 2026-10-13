-- Website content, page-view counts and the admin analytics dashboard.
--
--   1. Home-page picture carousel (hero_slides) managed by staff with `site_content.manage`.
--      Pictures live in the public `site-media` bucket under hero/<uuid>.<ext>.
--   2. First-party page-view counts per day and page (page_view_daily). No cookies, IPs, user IDs or
--      referrers are stored: only the path and a counter.
--   3. admin_analytics(): sign-ups and growth, users by role and state, verification and approvals,
--      website traffic. Needs `analytics.read`.

------------------------------------------------------------------------------------------------
-- Permissions
------------------------------------------------------------------------------------------------
insert into public.permissions (permission, description) values
  ('site_content.manage', 'Edit website content such as the home-page picture carousel'),
  ('analytics.read',      'View sign-up, user, verification and website analytics');

insert into public.admin_role_permissions (admin_role, permission) values
  ('verification_officer', 'analytics.read'),
  ('support_disputes',     'analytics.read'),
  ('finance_officer',      'analytics.read');

------------------------------------------------------------------------------------------------
-- 1. Home-page carousel
------------------------------------------------------------------------------------------------
create table public.hero_slides (
  id          uuid primary key default gen_random_uuid(),
  image_path  text not null check (image_path ~ '^hero/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  title_en    text check (char_length(title_en) <= 80),
  title_yo    text check (char_length(title_yo) <= 80),
  caption_en  text check (char_length(caption_en) <= 200),
  caption_yo  text check (char_length(caption_yo) <= 200),
  -- Describes the picture for screen readers; required so no slide is published without it.
  alt_en      text not null check (char_length(trim(alt_en)) between 3 and 200),
  alt_yo      text check (char_length(alt_yo) <= 200),
  -- A page on this site (/en/farmers) or an https link.
  link_url    text check (link_url is null or (char_length(link_url) <= 300
                          and link_url ~ '^(/[A-Za-z0-9/_-]*|https://[^[:space:]<>"]+)$')),
  position    integer not null default 0,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  updated_by  uuid references public.profiles (id) on delete set null
);
comment on table public.hero_slides is 'Pictures in the home-page carousel. Staff edit them through admin_*_hero_slide().';
create index hero_slides_order_idx on public.hero_slides (published, position);
create trigger hero_slides_updated_at before update on public.hero_slides
  for each row execute function public.set_updated_at();

alter table public.hero_slides enable row level security;
create policy "hero_slides: anyone reads published" on public.hero_slides
  for select to anon using (published);
create policy "hero_slides: published, or all for content staff" on public.hero_slides
  for select to authenticated
  using (published or (select public.has_permission('site_content.manage')));
-- No insert/update/delete policies: changes go through the functions below (permission check + audit).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "site media: content staff upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-media' and (storage.foldername(name))[1] = 'hero'
              and (select public.has_permission('site_content.manage')));
create policy "site media: content staff list" on storage.objects
  for select to authenticated
  using (bucket_id = 'site-media' and (select public.has_permission('site_content.manage')));
create policy "site media: content staff delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-media' and (select public.has_permission('site_content.manage')));

create or replace function private.clean_text(p_value text, p_max integer)
returns text
language sql immutable
set search_path = ''
as $$
  select nullif(left(trim(coalesce(p_value, '')), p_max), '');
$$;

-- Creates (p_id null) or updates a slide. p_image_path null keeps the current picture.
-- Returns the slide id and, when the picture was replaced, the old path so the caller can delete the file.
create or replace function public.admin_save_hero_slide(
  p_id uuid, p_image_path text, p_title_en text, p_title_yo text, p_caption_en text, p_caption_yo text,
  p_alt_en text, p_alt_yo text, p_link_url text, p_published boolean
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_old public.hero_slides;
  v_id uuid;
begin
  perform private.require_permission('site_content.manage');
  if p_id is null then
    if p_image_path is null then
      raise exception 'Choose a picture.' using errcode = '22023';
    end if;
    if (select count(*) from public.hero_slides) >= 12 then
      raise exception 'The carousel holds at most 12 pictures. Delete one first.' using errcode = '22023';
    end if;
    insert into public.hero_slides (image_path, title_en, title_yo, caption_en, caption_yo, alt_en, alt_yo,
                                    link_url, published, position, updated_by)
    values (p_image_path, private.clean_text(p_title_en, 80), private.clean_text(p_title_yo, 80),
            private.clean_text(p_caption_en, 200), private.clean_text(p_caption_yo, 200),
            coalesce(private.clean_text(p_alt_en, 200), ''), private.clean_text(p_alt_yo, 200),
            private.clean_text(p_link_url, 300), coalesce(p_published, false),
            coalesce((select max(position) + 1 from public.hero_slides), 0), auth.uid())
    returning id into v_id;
    perform private.record_admin_action('site_content.manage', 'hero_slide_created', 'hero_slide', v_id, null);
    return jsonb_build_object('id', v_id, 'old_image_path', null);
  end if;

  select * into v_old from public.hero_slides where id = p_id for update;
  if not found then
    raise exception 'Slide not found.' using errcode = 'P0002';
  end if;
  update public.hero_slides
     set image_path = coalesce(p_image_path, image_path),
         title_en = private.clean_text(p_title_en, 80),
         title_yo = private.clean_text(p_title_yo, 80),
         caption_en = private.clean_text(p_caption_en, 200),
         caption_yo = private.clean_text(p_caption_yo, 200),
         alt_en = coalesce(private.clean_text(p_alt_en, 200), ''),
         alt_yo = private.clean_text(p_alt_yo, 200),
         link_url = private.clean_text(p_link_url, 300),
         published = coalesce(p_published, published),
         updated_by = auth.uid()
   where id = p_id;
  perform private.record_admin_action('site_content.manage', 'hero_slide_updated', 'hero_slide', p_id, null);
  return jsonb_build_object('id', p_id,
    'old_image_path', case when p_image_path is not null and p_image_path <> v_old.image_path then v_old.image_path end);
end;
$$;

create or replace function public.admin_set_hero_slide_published(p_id uuid, p_published boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  perform private.require_permission('site_content.manage');
  update public.hero_slides set published = p_published, updated_by = auth.uid() where id = p_id;
  if not found then
    raise exception 'Slide not found.' using errcode = 'P0002';
  end if;
  perform private.record_admin_action('site_content.manage',
    case when p_published then 'hero_slide_published' else 'hero_slide_hidden' end, 'hero_slide', p_id, null);
end;
$$;

-- Swaps the slide with its neighbour (p_up = earlier in the carousel).
create or replace function public.admin_move_hero_slide(p_id uuid, p_up boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_slide public.hero_slides;
  v_other public.hero_slides;
begin
  perform private.require_permission('site_content.manage');
  select * into v_slide from public.hero_slides where id = p_id for update;
  if not found then
    raise exception 'Slide not found.' using errcode = 'P0002';
  end if;
  if p_up then
    select * into v_other from public.hero_slides
     where (position, id) < (v_slide.position, v_slide.id) order by position desc, id desc limit 1 for update;
  else
    select * into v_other from public.hero_slides
     where (position, id) > (v_slide.position, v_slide.id) order by position, id limit 1 for update;
  end if;
  if v_other.id is null then
    return; -- already first / last
  end if;
  -- Positions may be equal after deletions; give distinct values while swapping.
  update public.hero_slides set position = v_other.position, updated_by = auth.uid() where id = v_slide.id;
  update public.hero_slides
     set position = case when v_other.position = v_slide.position
                         then v_slide.position + case when p_up then 1 else -1 end
                         else v_slide.position end,
         updated_by = auth.uid()
   where id = v_other.id;
  perform private.record_admin_action('site_content.manage', 'hero_slide_moved', 'hero_slide', p_id, null);
end;
$$;

-- Deletes the slide and returns its picture path so the caller can remove the file from storage.
create or replace function public.admin_delete_hero_slide(p_id uuid)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_path text;
begin
  perform private.require_permission('site_content.manage');
  delete from public.hero_slides where id = p_id returning image_path into v_path;
  if v_path is null then
    raise exception 'Slide not found.' using errcode = 'P0002';
  end if;
  perform private.record_admin_action('site_content.manage', 'hero_slide_deleted', 'hero_slide', p_id, null);
  return v_path;
end;
$$;

------------------------------------------------------------------------------------------------
-- 2. Page views (no personal data)
------------------------------------------------------------------------------------------------
create table public.page_view_daily (
  day    date not null,
  path   text not null check (char_length(path) <= 80),
  views  integer not null default 0 check (views >= 0),
  primary key (day, path)
);
comment on table public.page_view_daily is 'Public page views per Lagos calendar day. Only the path is kept: no cookies, IPs or user IDs.';
alter table public.page_view_daily enable row level security;
create policy "page_view_daily: analytics staff read" on public.page_view_daily
  for select to authenticated using ((select public.has_permission('analytics.read')));

-- Called by the website on each public page view. Silently ignores anything that is not a public page.
create or replace function public.track_page_view(p_path text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_path text := lower(rtrim(coalesce(p_path, ''), '/'));
begin
  if v_path = '' or char_length(v_path) > 80 or v_path !~ '^/(en|yo)(/[a-z0-9-]+){0,3}$' then
    return;
  end if;
  if v_path ~ '^/(en|yo)/(account|onboarding|sign-in|sign-up)(/|$)' then
    return; -- private or sign-in pages are not counted
  end if;
  insert into public.page_view_daily (day, path, views)
  values ((now() at time zone 'Africa/Lagos')::date, v_path, 1)
  on conflict (day, path) do update set views = least(public.page_view_daily.views + 1, 100000000);
end;
$$;

------------------------------------------------------------------------------------------------
-- 3. Analytics for the admin dashboard
------------------------------------------------------------------------------------------------
-- Days are Lagos calendar days. p_days is clamped to 7..365.
create or replace function public.admin_analytics(p_days integer default 30)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_days  integer := least(greatest(coalesce(p_days, 30), 7), 365);
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  v_from  date;
  v_prev  date;
  v_out   jsonb;
begin
  perform private.require_permission('analytics.read');
  v_from := v_today - (v_days - 1);
  v_prev := v_from - v_days;

  with people as (
    select p.id,
           (p.created_at at time zone 'Africa/Lagos')::date as day,
           p.onboarded_at is not null as onboarded,
           case
             when p.onboarded_by is not null then 'field_agent'
             when p.onboarded_at is null then 'not_finished'
             else coalesce((select c.channel from public.consents c
                             where c.profile_id = p.id order by c.created_at limit 1), 'web')
           end as channel
      from public.profiles p
     where not exists (select 1 from public.admin_roles a where a.profile_id = p.id)
  ),
  days as (select generate_series(v_from, v_today, interval '1 day')::date as day)
  select jsonb_build_object(
    'days', v_days,
    'from', v_from,
    'to', v_today,
    'totals', (select jsonb_build_object(
        'people', count(*),
        'onboarded', count(*) filter (where onboarded),
        'new_in_period', count(*) filter (where day >= v_from),
        'new_previous_period', count(*) filter (where day >= v_prev and day < v_from),
        'onboarded_in_period', count(*) filter (where day >= v_from and onboarded))
      from people),
    'signups_by_day', (select jsonb_agg(jsonb_build_object(
        'day', x.day, 'web', x.web, 'mobile', x.mobile, 'field_agent', x.field_agent,
        'not_finished', x.not_finished) order by x.day)
      from (select d.day,
                   count(p.id) filter (where p.channel = 'web') as web,
                   count(p.id) filter (where p.channel = 'mobile') as mobile,
                   count(p.id) filter (where p.channel = 'field_agent') as field_agent,
                   count(p.id) filter (where p.channel = 'not_finished') as not_finished
              from days d left join people p on p.day = d.day
             group by d.day) x),
    'by_channel', (select coalesce(jsonb_object_agg(channel, n), '{}'::jsonb)
      from (select channel, count(*) as n from people where day >= v_from group by channel) x),
    'roles', (select coalesce(jsonb_agg(jsonb_build_object('role', r.role, 'active', r.active, 'pending', r.pending)
                                        order by r.active desc, r.role), '[]'::jsonb)
      from (select ro.role,
                   (select count(*) from public.user_roles ur where ur.role = ro.role) as active,
                   (select count(*) from public.role_requests rr where rr.role = ro.role and rr.status = 'pending') as pending
              from public.roles ro) r),
    'states', (select coalesce(jsonb_agg(jsonb_build_object('state', s.state, 'people', s.n) order by s.n desc, s.state), '[]'::jsonb)
      from (select coalesce(p.state, 'Not given') as state, count(*) as n
              from public.profiles p
             where p.onboarded_at is not null
               and not exists (select 1 from public.admin_roles a where a.profile_id = p.id)
             group by 1) s),
    'tiers', (select coalesce(jsonb_object_agg(t.tier::text, t.n), '{}'::jsonb)
      from (select p.verification_tier as tier, count(*) as n
              from public.profiles p
             where p.onboarded_at is not null
               and not exists (select 1 from public.admin_roles a where a.profile_id = p.id)
             group by 1) t),
    'approvals', (select jsonb_build_object(
        'pending', count(*) filter (where status = 'pending'),
        'approved_in_period', count(*) filter (where status = 'approved' and reviewed_at >= v_from),
        'rejected_in_period', count(*) filter (where status = 'rejected' and reviewed_at >= v_from),
        'auto_approved_in_period', count(*) filter (where status = 'approved' and reviewed_by is null and reviewed_at >= v_from),
        'avg_hours_to_decision', round((extract(epoch from avg(reviewed_at - created_at)
                                   filter (where reviewed_by is not null and reviewed_at >= v_from)) / 3600)::numeric, 1),
        'oldest_pending_hours', round((extract(epoch from now() - min(created_at) filter (where status = 'pending')) / 3600)::numeric, 1))
      from public.role_requests),
    'documents_pending', (select count(*) from public.verification_documents where status = 'pending'),
    'page_views', jsonb_build_object(
      'total', (select coalesce(sum(views), 0) from public.page_view_daily where day >= v_from),
      'previous_total', (select coalesce(sum(views), 0) from public.page_view_daily where day >= v_prev and day < v_from),
      'by_day', (select jsonb_agg(jsonb_build_object('day', d.day, 'views', coalesce(v.views, 0)) order by d.day)
                   from days d
                   left join (select day, sum(views) as views from public.page_view_daily group by day) v on v.day = d.day),
      'top_pages', (select coalesce(jsonb_agg(jsonb_build_object('path', x.path, 'views', x.views) order by x.views desc, x.path), '[]'::jsonb)
                      from (select path, sum(views) as views from public.page_view_daily
                             where day >= v_from group by path order by 2 desc, 1 limit 10) x))
  ) into v_out;
  return v_out;
end;
$$;

------------------------------------------------------------------------------------------------
-- Grants
------------------------------------------------------------------------------------------------
revoke execute on function private.clean_text(text, integer) from public, anon, authenticated;

revoke execute on function
  public.admin_save_hero_slide(uuid, text, text, text, text, text, text, text, text, boolean),
  public.admin_set_hero_slide_published(uuid, boolean),
  public.admin_move_hero_slide(uuid, boolean),
  public.admin_delete_hero_slide(uuid),
  public.admin_analytics(integer),
  public.track_page_view(text)
  from public, anon;

grant execute on function
  public.admin_save_hero_slide(uuid, text, text, text, text, text, text, text, text, boolean),
  public.admin_set_hero_slide_published(uuid, boolean),
  public.admin_move_hero_slide(uuid, boolean),
  public.admin_delete_hero_slide(uuid),
  public.admin_analytics(integer)
  to authenticated;

grant execute on function public.track_page_view(text) to anon, authenticated;
