begin;

select plan(3);

select ok(
  exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'vector'
      and n.nspname = 'extensions'
  ),
  'vector extension is installed in extensions schema'
);

select ok(
  exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'consent_type'
      and e.enumlabel = 'ai_intelligence'
  ),
  'ai_intelligence consent enum value exists'
);

select ok(
  not has_table_privilege('anon', 'public.consents', 'INSERT'),
  'anonymous role cannot write consent records'
);

select * from finish();
rollback;
