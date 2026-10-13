-- CultivaNode: move row-level-security helper functions out of the API.
--
-- Everything in `public` is reachable at /rest/v1/rpc/<name>. These helpers exist only for
-- policies, and a few could answer questions about other people (is this profile a farmer?
-- which farm is this plot on?). Moving them to a `private` schema, which the Data API does not
-- expose, removes the endpoints. Policies store functions by OID, so every policy keeps working
-- without being rewritten.
--
-- Staying in `public` on purpose (callable by signed-in users):
--   has_role, is_admin, org_role, my_verification_tier  - only describe the caller
--   approve_role_request, reject_role_request, cancel_role_request - check permissions themselves

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

alter function public.is_farmer_profile(uuid)                                      set schema private;
alter function public.is_my_onboarded_profile(uuid)                                set schema private;
alter function public.can_view_farm(uuid)                                          set schema private;
alter function public.can_edit_farm(uuid)                                          set schema private;
alter function public.plot_farm_id(uuid)                                           set schema private;
alter function public.can_create_listing(public.listing_kind, public.provider_type) set schema private;
