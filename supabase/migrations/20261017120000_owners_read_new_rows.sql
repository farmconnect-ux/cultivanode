-- Owners can always read their own farm and device rows.
--
-- Saving a farm inserts the row and reads it back in the same statement (insert ... returning). The read
-- policy only called private.can_view_farm(id), which looks the farm up again in its own snapshot and
-- cannot see a row that statement is still inserting, so every new farm failed with 42501 and the site
-- showed "Add the crop farmer or livestock farmer role" to farmers who already had the role.
-- Checking the row's own columns first fixes it. Applied on hosted on 2026-10-17; idempotent.

alter policy "farms: read if you can view" on public.farms
  using (
    owner_id = (select auth.uid())
    or (onboarded_by = (select auth.uid()) and (select public.has_role('field_agent'::public.app_role)))
    or private.can_view_farm(id)
  );

-- Same pattern on devices (can_view_device looks the device up by id).
alter policy "devices: select if authorized" on public.devices
  using (assigned_owner_id = (select auth.uid()) or public.can_view_device(id));
