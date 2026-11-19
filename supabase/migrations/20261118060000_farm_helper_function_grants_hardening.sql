-- Batch 02.6E security hardening:
-- 1. Revoke unintended PUBLIC and anon EXECUTE grants on farm RLS helper wrappers
--    recreated in 20261008130000_farm_management_reconcile.sql.
-- 2. Enforce private.can_view_farm(p.farm_id) inside public.plot_farm_id(uuid) so
--    authenticated callers cannot resolve farm_id for arbitrary plot UUIDs.
-- 3. Revoke PUBLIC EXECUTE on public.feature_on(text) while preserving intentional
--    anon and authenticated access.

create or replace function public.plot_farm_id(p_plot uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.farm_id
  from public.plots p
  where p.id = p_plot
    and private.can_view_farm(p.farm_id);
$$;

revoke all on function public.can_edit_farm(uuid) from public, anon;
grant execute on function public.can_edit_farm(uuid) to authenticated;

revoke all on function public.can_view_farm(uuid) from public, anon;
grant execute on function public.can_view_farm(uuid) to authenticated;

revoke all on function public.plot_farm_id(uuid) from public, anon;
grant execute on function public.plot_farm_id(uuid) to authenticated;

revoke all on function public.feature_on(text) from public;
grant execute on function public.feature_on(text) to anon, authenticated;
