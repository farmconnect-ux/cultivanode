begin;

select plan(9);

select ok(
  has_schema_privilege('postgres', 'private', 'USAGE'),
  'postgres can access private schema'
);

select ok(
  not has_table_privilege('anon', 'private.ai_actor_directory', 'SELECT')
  and not has_table_privilege('authenticated', 'private.ai_actor_directory', 'SELECT')
  and not has_table_privilege('service_role', 'private.ai_actor_directory', 'SELECT'),
  'application roles cannot read the private actor directory'
);

select ok(
  not has_function_privilege('anon', 'private.resolve_or_create_ai_actor(uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'private.resolve_or_create_ai_actor(uuid)', 'EXECUTE')
  and not has_function_privilege('service_role', 'private.resolve_or_create_ai_actor(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'private.anonymise_ai_actor(uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'private.anonymise_ai_actor(uuid)', 'EXECUTE')
  and not has_function_privilege('service_role', 'private.anonymise_ai_actor(uuid)', 'EXECUTE')
  and not has_function_privilege('anon', 'private.lookup_ai_actor_subject(uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'private.lookup_ai_actor_subject(uuid)', 'EXECUTE')
  and not has_function_privilege('service_role', 'private.lookup_ai_actor_subject(uuid)', 'EXECUTE'),
  'internal actor functions cannot be executed by application roles'
);

select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'private.ai_actor_directory'::regclass
      and conname = 'ai_actor_directory_identity_check'
  ),
  'actor kind and identity consistency constraint exists'
);

select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'private.ai_actor_directory'::regclass
      and conname = 'ai_actor_directory_deletion_check'
  ),
  'deleted actor cannot retain profile attribution'
);

select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'private'
      and indexname = 'ai_actor_directory_profile_uidx'
      and indexdef ilike '%unique%'
  ),
  'at most one active actor mapping can exist per profile'
);

select ok(
  exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'private'
      and c.relname = 'ai_actor_directory'
      and c.relrowsecurity
  ),
  'RLS is enabled on the private actor directory'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'anonymise_ai_actor'
      and p.prosecdef
      and 'search_path=""' = any(p.proconfig)
  ),
  'anonymisation function is SECURITY DEFINER with an empty search_path'
);

select ok(
  not exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where p.oid = 'private.anonymise_ai_actor(uuid)'::regprocedure
      and a.grantee = 0
      and a.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute the anonymisation function'
);

select * from finish();
rollback;
