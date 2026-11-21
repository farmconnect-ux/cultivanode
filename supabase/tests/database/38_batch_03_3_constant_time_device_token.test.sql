-- Batch 03.3 pgTAP tests: constant-time device token comparison (PR #24 review, Low)
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

select ok(private.constant_time_text_equals('a1b2c3', 'a1b2c3'), 'equal strings compare equal');
select ok(not private.constant_time_text_equals('a1b2c3', 'a1b2c4'), 'last-byte difference is detected');
select ok(not private.constant_time_text_equals('a1b2c3', 'a1b2c3d4'), 'length difference is detected');

select ok(
  not has_function_privilege('authenticated', 'private.constant_time_text_equals(text,text)', 'execute')
  and not has_function_privilege('anon', 'private.constant_time_text_equals(text,text)', 'execute'),
  'comparison helper is not exposed to app roles'
);

select ok(
  position('constant_time_text_equals' in pg_get_functiondef('private.ingest_authenticated_device_telemetry(uuid,text,uuid,uuid,timestamptz,text,numeric,numeric,numeric,integer,numeric,numeric,text,uuid)'::regprocedure)) > 0
  and position('auth_token_hash)) <> v_token_sha256' in pg_get_functiondef('private.ingest_authenticated_device_telemetry(uuid,text,uuid,uuid,timestamptz,text,numeric,numeric,numeric,integer,numeric,numeric,text,uuid)'::regprocedure)) = 0,
  'device ingestion uses the constant-time comparison'
);

select * from finish();
rollback;
