-- Removes every CultivaNode demo account (profiles.is_demo) and everything it owns, plus demo
-- market prices. Run it in the Supabase SQL editor when the sample data is no longer wanted:
--   select private.purge_demo_data();
-- (Create the function once by running this whole file.)
------------------------------------------------------------------------------------------------
create or replace function private.purge_demo_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_prices bigint;
begin
  select coalesce(array_agg(id), '{}') into v_ids from public.profiles where is_demo;
  -- Bookings restrict profile deletion, so they go first.
  delete from public.bookings where farmer_id = any (v_ids) or provider_id = any (v_ids);
  delete from public.marketplace_orders where buyer_id = any (v_ids);
  delete from public.organizations where owner_id = any (v_ids);
  delete from public.market_prices where is_demo;
  get diagnostics v_prices = row_count;
  -- Removing the auth users cascades to profiles and everything they own.
  delete from auth.users where id = any (v_ids);
  return jsonb_build_object('accounts_removed', coalesce(array_length(v_ids, 1), 0), 'prices_removed', v_prices);
end;
$$;
revoke all on function private.purge_demo_data() from public, anon, authenticated;
