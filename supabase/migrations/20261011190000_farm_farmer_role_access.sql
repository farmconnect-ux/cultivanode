-- Keep farm creation aligned with the two instantly active farmer roles.
alter policy "farms: farmers or their field agents create" on public.farms
  with check (
    (
      owner_id = (select auth.uid())
      and onboarded_by is null
      and (
        (select public.has_role('crop_farmer'))
        or (select public.has_role('animal_farmer'))
      )
      and (organization_id is null or public.org_role(organization_id) in ('owner', 'farm_manager'))
    )
    or (
      onboarded_by = (select auth.uid())
      and private.is_my_onboarded_profile(owner_id)
      and private.is_farmer_profile(owner_id)
      and organization_id is null
    )
  );
