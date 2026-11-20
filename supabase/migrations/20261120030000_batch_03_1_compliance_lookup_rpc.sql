-- Batch 03.1B M4: audited, concurrency-safe AI actor compliance lookup.
-- Lookup is disabled by default. The provisional limits are configuration defaults only;
-- enforcement is enabled only after an explicit operational/security approval.

create table private.ai_compliance_lookup_limits (
  id bigint generated always as identity primary key,
  principal_id uuid not null,
  requested_subject_id uuid,
  purpose_code text not null,
  outcome text not null check (outcome in ('permitted', 'denied', 'throttled', 'unavailable')),
  attempted_at timestamptz not null default clock_timestamp()
);

create index ai_compliance_lookup_limits_principal_time_idx
  on private.ai_compliance_lookup_limits (principal_id, attempted_at desc);

create index ai_compliance_lookup_limits_time_idx
  on private.ai_compliance_lookup_limits (attempted_at desc);

alter table private.ai_compliance_lookup_limits enable row level security;
alter table private.ai_compliance_lookup_limits owner to postgres;
revoke all on table private.ai_compliance_lookup_limits
  from public, anon, authenticated, service_role;

create table private.ai_compliance_lookup_config (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  window_seconds integer not null default 900 check (window_seconds between 60 and 3600),
  principal_attempt_limit integer not null default 10 check (principal_attempt_limit between 1 and 1000),
  principal_denied_limit integer not null default 5 check (principal_denied_limit between 1 and 1000),
  system_attempt_limit integer not null default 30 check (system_attempt_limit between 1 and 10000),
  updated_at timestamptz not null default clock_timestamp()
);

alter table private.ai_compliance_lookup_config enable row level security;
alter table private.ai_compliance_lookup_config owner to postgres;
revoke all on table private.ai_compliance_lookup_config
  from public, anon, authenticated, service_role;

insert into private.ai_compliance_lookup_config (
  singleton, enabled, window_seconds,
  principal_attempt_limit, principal_denied_limit, system_attempt_limit
) values (true, false, 900, 10, 5, 30)
on conflict (singleton) do nothing;

create or replace function public.compliance_lookup_ai_actor(
  p_actor_subject_id uuid,
  p_purpose text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_principal_id uuid := auth.uid();
  v_purpose text := nullif(lower(trim(p_purpose)), '');
  v_now timestamptz := clock_timestamp();
  v_config private.ai_compliance_lookup_config%rowtype;
  v_principal_attempts integer := 0;
  v_principal_denied integer := 0;
  v_system_attempts integer := 0;
  v_outcome text;
  v_actor record;
  v_result jsonb;
begin
  if v_principal_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  if v_purpose is not null and v_purpose not in ('data_subject_request', 'regulatory_inquiry', 'security_incident', 'legal_obligation') then
    v_purpose := null;
  end if;

  -- Acquire global first, then principal lock in a stable order. This makes the
  -- system-wide ceiling exact under concurrent callers and avoids lock-order cycles.
  perform pg_advisory_xact_lock(hashtextextended('ai_compliance_lookup:system', 0));
  perform pg_advisory_xact_lock(hashtextextended('ai_compliance_lookup:principal:' || v_principal_id::text, 0));

  delete from private.ai_compliance_lookup_limits
   where attempted_at < v_now - interval '1 hour';

  select * into v_config
    from private.ai_compliance_lookup_config
   where singleton = true;

  if not found then
    raise exception 'Compliance lookup configuration is unavailable.' using errcode = 'P0001';
  end if;

  select count(*)::integer,
         count(*) filter (where outcome = 'denied')::integer
    into v_principal_attempts, v_principal_denied
    from private.ai_compliance_lookup_limits
   where principal_id = v_principal_id
     and attempted_at >= v_now - make_interval(secs => v_config.window_seconds);

  select count(*)::integer
    into v_system_attempts
    from private.ai_compliance_lookup_limits
   where attempted_at >= v_now - make_interval(secs => v_config.window_seconds);

  if v_principal_attempts >= v_config.principal_attempt_limit
     or v_principal_denied >= v_config.principal_denied_limit
     or v_system_attempts >= v_config.system_attempt_limit then
    v_outcome := 'throttled';
  elsif not v_config.enabled then
    v_outcome := 'unavailable';
  elsif not private.account_active(v_principal_id)
     or not public.has_permission('audit.read')
     or p_actor_subject_id is null
     or v_purpose is null
     or char_length(v_purpose) not between 3 and 200
     or v_purpose not in ('data_subject_request', 'regulatory_inquiry', 'security_incident', 'legal_obligation') then
    v_outcome := 'denied';
  else
    select * into v_actor
      from private.lookup_ai_actor_subject(p_actor_subject_id);

    if not found then
      v_outcome := 'denied';
    else
      v_outcome := 'permitted';
    end if;
  end if;

  insert into private.ai_compliance_lookup_limits (
    principal_id, requested_subject_id, purpose_code, outcome, attempted_at
  ) values (
    v_principal_id, p_actor_subject_id,
    left(coalesce(v_purpose, '[invalid_or_missing]'), 200), v_outcome, v_now
  );

  -- Every outcome is recorded in the existing append-only audit log. If this
  -- insert fails, the function raises and returns no actor data (fail closed).
  insert into public.audit_log (
    actor_id, action, entity, entity_id, new_values
  ) values (
    v_principal_id,
    'ai_actor_compliance_lookup',
    'ai_actor_directory',
    p_actor_subject_id,
    jsonb_build_object(
      'purpose', left(coalesce(v_purpose, '[invalid_or_missing]'), 200),
      'outcome', v_outcome,
      'attempted_at', v_now
    )
  );

  if v_outcome = 'permitted' then
    v_result := jsonb_build_object(
      'status', 'permitted',
      'actor_subject_id', v_actor.actor_subject_id,
      'actor_kind', v_actor.actor_kind,
      'profile_id', v_actor.profile_id,
      'deleted_at', v_actor.deleted_at
    );
  else
    v_result := jsonb_build_object('status', v_outcome);
  end if;

  return v_result;
end;
$$;

alter function public.compliance_lookup_ai_actor(uuid, text) owner to postgres;
revoke all on function public.compliance_lookup_ai_actor(uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.compliance_lookup_ai_actor(uuid, text)
  to authenticated;
