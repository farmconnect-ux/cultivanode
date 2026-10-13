-- Public marketplace policies call is_admin(); guests (anon) must be able to evaluate it (it is false for them).
grant execute on function public.is_admin() to anon;
grant execute on function public.has_permission(text) to anon;
