-- Member names, roles and locations for an organisation, visible only to its own members.
create or replace function public.org_member_directory(p_org uuid)
returns table (profile_id uuid, full_name text, member_role public.org_member_role, state text, lga text, joined_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select m.profile_id, coalesce(p.full_name, 'Member'), m.member_role, p.state, p.lga, m.created_at
  from public.org_members m join public.profiles p on p.id = m.profile_id
  where m.organization_id = p_org and public.org_role(p_org) is not null
  order by m.created_at;
$$;
revoke all on function public.org_member_directory(uuid) from public, anon;
grant execute on function public.org_member_directory(uuid) to authenticated;
