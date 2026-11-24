-- Email becomes an integration kind, in its own migration: Postgres can't use an enum value in the same
-- transaction that adds it (20261128000100 registers the email providers that use it).
alter type public.integration_kind add value if not exists 'email';
