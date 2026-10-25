-- New integration kinds, in their own migration: Postgres can't use an enum value in the same
-- transaction that adds it (20261012073500 registers the providers that use them).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'integration_kind' and typnamespace = 'public'::regnamespace) then
    create type public.integration_kind as enum ('sms', 'identity', 'weather', 'payment', 'maps');
  else
    alter type public.integration_kind add value if not exists 'payment';
    alter type public.integration_kind add value if not exists 'maps';
  end if;
end $$;
