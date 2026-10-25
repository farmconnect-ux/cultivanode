-- Hides demo and test records from the live site WITHOUT deleting them, and can be undone.
--
-- Run this whole file once in the Supabase SQL editor (project vqbtnftnxyfaembwgfrk), then:
--   select private.hide_demo_data();      -- hide demo/test listings, clean crop notes
--   select private.restore_demo_data();   -- put every hidden listing back as it was
--
-- What it hides:
--   * marketplace lots of demo sellers (marketplace_sellers.is_demo, or a profile with is_demo,
--     or one of the seed accounts de000000-0000-4000-8000-…)
--   * machinery/service listings (public.listings) owned by demo profiles or by an account
--     whose name is "TEST" (the test tractor shown as "By TEST, Oyo")
-- What it cleans:
--   * the internal "[front_end_meta: …]" text that leaked into crop-cycle notes
-- Nothing is deleted. To remove demo accounts for good later, use scripts/purge_demo_data.sql.
------------------------------------------------------------------------------------------------

create table if not exists private.hidden_demo_records (
  table_name      text not null,
  record_id       uuid not null,
  previous_status text not null,
  hidden_at       timestamptz not null default now(),
  primary key (table_name, record_id)
);

create or replace function private.hide_demo_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_demo uuid[];
  v_lots bigint := 0;
  v_listings bigint := 0;
  v_notes bigint := 0;
begin
  select coalesce(array_agg(id), '{}') into v_demo
  from public.profiles
  where is_demo
     or id::text like 'de000000-0000-4000-8000-%'
     or upper(trim(coalesce(full_name, ''))) = 'TEST';

  -- Marketplace lots of demo sellers.
  with hit as (
    select l.id, l.status
    from public.marketplace_listings l
    join public.marketplace_sellers s on s.id = l.seller_id
    where l.status in ('active', 'draft', 'paused')
      and (s.is_demo or s.profile_id = any (v_demo))
  ), saved as (
    insert into private.hidden_demo_records (table_name, record_id, previous_status)
    select 'marketplace_listings', id, status from hit
    on conflict do nothing
    returning record_id
  )
  update public.marketplace_listings l set status = 'paused'
  where l.id in (select record_id from saved) and l.status <> 'paused';
  get diagnostics v_lots = row_count;

  -- Machinery and service listings of demo or TEST accounts.
  with hit as (
    select id, status::text as status
    from public.listings
    where owner_id = any (v_demo) and status in ('active', 'draft')
  ), saved as (
    insert into private.hidden_demo_records (table_name, record_id, previous_status)
    select 'listings', id, status from hit
    on conflict do nothing
    returning record_id
  )
  update public.listings set status = 'paused'
  where id in (select record_id from saved);
  get diagnostics v_listings = row_count;

  -- Internal metadata that leaked into crop notes, e.g. "[front_end_meta: crop_name:Maize, …]".
  update public.crop_cycles
  set notes = nullif(trim(regexp_replace(notes, '\s*\|?\s*\[front_end_meta:[^\]]*\]', '', 'g')), '')
  where notes like '%[front_end_meta:%';
  get diagnostics v_notes = row_count;

  return jsonb_build_object(
    'demo_or_test_accounts', coalesce(array_length(v_demo, 1), 0),
    'marketplace_lots_hidden', v_lots,
    'machinery_listings_hidden', v_listings,
    'crop_notes_cleaned', v_notes
  );
end;
$$;

create or replace function private.restore_demo_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lots bigint := 0;
  v_listings bigint := 0;
begin
  update public.marketplace_listings l set status = h.previous_status
  from private.hidden_demo_records h
  where h.table_name = 'marketplace_listings' and h.record_id = l.id;
  get diagnostics v_lots = row_count;

  update public.listings l set status = h.previous_status::public.listing_status
  from private.hidden_demo_records h
  where h.table_name = 'listings' and h.record_id = l.id;
  get diagnostics v_listings = row_count;

  delete from private.hidden_demo_records where table_name in ('marketplace_listings', 'listings');
  return jsonb_build_object('marketplace_lots_restored', v_lots, 'machinery_listings_restored', v_listings);
end;
$$;

revoke all on function private.hide_demo_data() from public, anon, authenticated;
revoke all on function private.restore_demo_data() from public, anon, authenticated;
