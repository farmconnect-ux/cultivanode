-- Weather becomes a switchable integration like SMS and identity checks (separate migration: a new enum
-- value cannot be used in the transaction that adds it).
alter type public.integration_kind add value if not exists 'weather';
