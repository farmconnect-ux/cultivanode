-- CultivaNode: close function grants that Supabase's default privileges gave to `authenticated`.
--
-- Supabase grants EXECUTE on every new public function directly to anon, authenticated and
-- service_role. The earlier migrations revoked from `public` and `anon` only, so signed-in users
-- could still call these through /rest/v1/rpc. write_audit() is the real risk: a user could forge
-- audit entries. The trigger functions cannot run outside a trigger, but they should not be exposed.

revoke execute on function
  public.write_audit(text, text, uuid, jsonb),
  public.handle_new_user(),
  public.handle_new_organization(),
  public.before_role_request_insert(),
  public.after_role_request_insert(),
  public.refresh_verification_tier(),
  public.compute_area_from_boundary(),
  public.set_updated_at()
  from authenticated;

-- From now on, new functions in public are not executable by app roles unless a migration grants it.
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
