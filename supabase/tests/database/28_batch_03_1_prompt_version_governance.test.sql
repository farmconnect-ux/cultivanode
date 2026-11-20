begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select ok(
  (select relrowsecurity from pg_class where oid = 'private.ai_prompt_versions'::regclass)
  and (select relrowsecurity from pg_class where oid = 'private.ai_prompt_active_pointers'::regclass)
  and (select relrowsecurity from pg_class where oid = 'private.ai_prompt_activation_history'::regclass),
  'RLS is enabled on all prompt governance tables'
);

select ok(
  not has_table_privilege('anon', 'private.ai_prompt_versions', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_prompt_versions', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_prompt_versions', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_prompt_active_pointers', 'SELECT'),
  'prompt tables are inaccessible directly to application roles'
);

select ok(
  has_function_privilege('authenticated', 'public.create_ai_prompt_version(text,text,text,jsonb)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.set_active_ai_prompt_version(text,text,text)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.rollback_active_ai_prompt_version(text,text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.create_ai_prompt_version(text,text,text,jsonb)', 'EXECUTE'),
  'prompt management RPCs are authenticated-only'
);

select ok(
  has_function_privilege('service_role', 'public.get_active_ai_prompt(text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.get_active_ai_prompt(text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.get_active_ai_prompt(text)', 'EXECUTE'),
  'runtime prompt reader is service_role-only'
);

select ok(
  exists (
    select 1 from pg_proc p
    where p.oid = 'public.set_active_ai_prompt_version(text,text,text)'::regprocedure
      and p.prosecdef and pg_get_userbyid(p.proowner) = 'postgres'
      and 'search_path=""' = any(p.proconfig)
  ),
  'activation RPC is postgres-owned SECURITY DEFINER with empty search_path'
);

insert into auth.users (id, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
values ('e8000000-0000-0000-0000-000000000001', '2348088880001', now(), '{}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, phone, full_name, state, lga)
values ('e8000000-0000-0000-0000-000000000001', '2348088880001', 'Prompt Governance Admin', 'Oyo', 'Ibadan')
on conflict (id) do nothing;

insert into public.admin_roles (profile_id, admin_role)
values ('e8000000-0000-0000-0000-000000000001', 'super_admin')
on conflict do nothing;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e8000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select ok(
  (public.create_ai_prompt_version('agronomy.advisor', '1.0.0', 'Initial safe agronomy prompt', '{}'::jsonb)->>'content_sha256')
    = encode(extensions.digest('Initial safe agronomy prompt', 'sha256'), 'hex'),
  'prompt creation records a server-computed SHA-256 content hash'
);

select is(
  public.set_active_ai_prompt_version('agronomy.advisor', '1.0.0', 'Initial approved production prompt')->>'active_version',
  '1.0.0',
  'first prompt version can be activated'
);

reset role;
set local role service_role;
select is(
  public.get_active_ai_prompt('agronomy.advisor')->>'content',
  'Initial safe agronomy prompt',
  'service runtime can resolve active prompt content'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e8000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is(
  public.create_ai_prompt_version('agronomy.advisor', '1.0.1', 'Updated safe agronomy prompt', '{}'::jsonb)->>'version',
  '1.0.1',
  'new prompt version can be registered'
);

select is(
  public.set_active_ai_prompt_version('agronomy.advisor', '1.0.1', 'Approved update after agronomy review')->>'active_version',
  '1.0.1',
  'new version activation updates the active pointer'
);

select is(
  public.rollback_active_ai_prompt_version('agronomy.advisor', 'Rollback after observed quality regression')->>'active_version',
  '1.0.0',
  'rollback restores the previous immutable version'
);

select throws_ok(
  $select public.rollback_active_ai_prompt_version('agronomy.advisor', 'Attempt a second rollback without a prior activation')$,
  'P0002',
  null,
  'rollback does not toggle forward to a version created by an earlier rollback'
);

reset role;
set local role service_role;
select is(
  public.get_active_ai_prompt('agronomy.advisor')->>'content',
  'Initial safe agronomy prompt',
  'runtime resolves restored prompt content after rollback'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"e8000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select throws_ok(
  $$update private.ai_prompt_versions set content = 'tampered' where prompt_key = 'agronomy.advisor'$$,
  '42501',
  null,
  'authenticated role cannot update immutable prompt versions'
);

select throws_ok(
  $$delete from private.ai_prompt_versions where prompt_key = 'agronomy.advisor'$$,
  '42501',
  null,
  'authenticated role cannot delete immutable prompt versions'
);

reset role;

select ok(
  (select count(*) = 2 from private.ai_prompt_versions where prompt_key = 'agronomy.advisor')
  and (select count(*) = 3 from private.ai_prompt_activation_history where prompt_key = 'agronomy.advisor'),
  'two immutable versions and complete activation/rollback history are retained'
);

select is(
  (select count(*)::int from public.audit_log
   where actor_id = 'e8000000-0000-0000-0000-000000000001'
     and action in ('ai_prompt_version_created', 'ai_prompt_version_activated', 'ai_prompt_version_rolled_back')),
  5,
  'creation, activation and rollback operations are written to audit_log'
);

select ok(
  not exists (
    select 1 from pg_constraint
    where conrelid in ('private.ai_prompt_versions'::regclass, 'private.ai_prompt_activation_history'::regclass)
      and contype = 'f'
      and confrelid = 'public.profiles'::regclass
  ),
  'prompt governance attribution does not retain profile foreign keys'
);

select * from finish();
rollback;
