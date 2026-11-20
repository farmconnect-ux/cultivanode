-- Batch 03.1B M4 / M4.1: audited, concurrency-safe AI actor compliance lookup
-- with bounded-write admission control and cooldown-based throttle-state write suppression.
--
-- Lookup is disabled by default. The provisional limits and cooldown interval are
-- configuration defaults only; enforcement is enabled only after explicit approval.
--
-- Bounded-write guarantees:
-- 1. Unauthenticated, suspended, deleting, and deleted accounts are rejected before
--    any lock or persistent write.
-- 2. private.ai_compliance_lookup_limits records only admitted attempts ('permitted' | 'denied'),
--    so active-window rows are strictly bounded by system_attempt_limit.
-- 3. Repeated throttled or disabled-feature calls inside throttle_write_cooldown_seconds
--    perform ZERO persistent DML (no INSERT, UPDATE, or DELETE).
-- 4. Once per rolling window, at most one summary audit_log row is emitted per scope;
--    once per cooldown interval after that, at most one throttle-state UPDATE records
--    an approximate sampled suppression event without resetting window_started_at.

create table private.ai_compliance_lookup_limits (
  id bigint generated always as identity primary key,
  principal_id uuid not null,
  requested_subject_id uuid,
  purpose_code text not null,
  outcome text not null check (outcome in ('permitted', 'denied')),
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

-- Stores at most one row per active rejection scope ('unavailable:<uid>', 'principal:<uid>',
-- 'system:global'). sampled_suppression_events is an approximate, cooldown-sampled write
-- count (not an exact count of all rejected requests).
create table private.ai_compliance_lookup_throttle_state (
  scope_key text primary key,
  window_started_at timestamptz not null,
  sampled_suppression_events integer not null default 1 check (sampled_suppression_events >= 1),
  last_recorded_at timestamptz not null default clock_timestamp()
);

alter table private.ai_compliance_lookup_throttle_state enable row level security;
alter table private.ai_compliance_lookup_throttle_state owner to postgres;
revoke all on table private.ai_compliance_lookup_throttle_state
  from public, anon, authenticated, service_role;

create table private.ai_compliance_lookup_config (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  window_seconds integer not null default 900 check (window_seconds between 60 and 3600),
  throttle_write_cooldown_seconds integer not null default 60 check (throttle_write_cooldown_seconds between 5 and 3600),
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
  singleton, enabled, window_seconds, throttle_write_cooldown_seconds,
  principal_attempt_limit, principal_denied_limit, system_attempt_limit
) values (true, false, 900, 60, 10, 5, 30)
on conflict (singleton) do nothing;

-- Shared deterministic predicate for rolling-window expiry. Keeping this predicate
-- in one private function lets pgTAP exercise the exact production comparison with
-- fixed timestamps, without introducing a clock override into the compliance RPC.
create or replace function private.ai_compliance_window_expired(
  p_window_started_at timestamptz,
  p_window_cutoff timestamptz
)
returns boolean
language sql
immutable
set search_path = ''
as $ai_compliance_window_expired$
  select p_window_started_at <= p_window_cutoff;
$ai_compliance_window_expired$;

alter function private.ai_compliance_window_expired(timestamptz, timestamptz) owner to postgres;
revoke all on function private.ai_compliance_window_expired(timestamptz, timestamptz)
  from public, anon, authenticated, service_role;

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
  v_window_cutoff timestamptz;
  v_cooldown_cutoff timestamptz;
  v_principal_attempts integer := 0;
  v_principal_denied integer := 0;
  v_system_attempts integer := 0;
  v_throttle_scope text;
  v_existing_throttle private.ai_compliance_lookup_throttle_state%rowtype;
  v_outcome text;
  v_actor record;
  v_result jsonb;
begin
  -- 1. Reject unauthenticated callers before any lock or persistent write.
  if v_principal_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  -- 2. Verify account eligibility before any compliance audit or counter write.
  --    Suspended, deleting, or deleted accounts must not generate compliance lookup writes.
  if not private.account_active(v_principal_id)
     or not exists (
       select 1 from public.profiles p
        where p.id = v_principal_id
          and p.deleted_at is null
          and p.deletion_status is null
     ) then
    return jsonb_build_object('status', 'denied');
  end if;

  if v_purpose is not null and v_purpose not in ('data_subject_request', 'regulatory_inquiry', 'security_incident', 'legal_obligation') then
    v_purpose := null;
  end if;

  -- 3. Acquire global first, then principal lock in a stable order. This makes the
  --    system-wide ceiling and write-suppression cooldown exact under concurrent callers
  --    and prevents lock-order deadlocks.
  perform pg_advisory_xact_lock(hashtextextended('ai_compliance_lookup:system', 0));
  perform pg_advisory_xact_lock(hashtextextended('ai_compliance_lookup:principal:' || v_principal_id::text, 0));

  select * into v_config
    from private.ai_compliance_lookup_config
   where singleton = true;

  if not found then
    raise exception 'Compliance lookup configuration is unavailable.' using errcode = 'P0001';
  end if;

  v_window_cutoff := v_now - make_interval(secs => v_config.window_seconds);
  v_cooldown_cutoff := v_now - make_interval(secs => v_config.throttle_write_cooldown_seconds);

  -- 4. Disabled feature check: never execute lookup.
  --    Inside cooldown, execute ZERO persistent writes; on new window emit one audit_log
  --    summary; after cooldown expiry update sampled_suppression_events at most once.
  if not v_config.enabled then
    v_throttle_scope := 'unavailable:' || v_principal_id::text;

    select * into v_existing_throttle
      from private.ai_compliance_lookup_throttle_state
     where scope_key = v_throttle_scope;

    if not found or private.ai_compliance_window_expired(v_existing_throttle.window_started_at, v_window_cutoff) then
      delete from private.ai_compliance_lookup_throttle_state
       where last_recorded_at < v_now - interval '1 hour';

      insert into private.ai_compliance_lookup_throttle_state (
        scope_key, window_started_at, sampled_suppression_events, last_recorded_at
      ) values (v_throttle_scope, v_now, 1, v_now)
      on conflict (scope_key) do update set
        window_started_at = excluded.window_started_at,
        sampled_suppression_events = 1,
        last_recorded_at = excluded.last_recorded_at;

      insert into public.audit_log (
        actor_id, action, entity, entity_id, new_values
      ) values (
        v_principal_id,
        'ai_actor_compliance_lookup',
        'ai_actor_directory',
        p_actor_subject_id,
        jsonb_build_object(
          'purpose', left(coalesce(v_purpose, '[invalid_or_missing]'), 200),
          'outcome', 'unavailable',
          'attempted_at', v_now
        )
      );
    elsif v_existing_throttle.last_recorded_at <= v_cooldown_cutoff then
      update private.ai_compliance_lookup_throttle_state
         set sampled_suppression_events = sampled_suppression_events + 1,
             last_recorded_at = v_now
       where scope_key = v_throttle_scope
         and last_recorded_at <= v_cooldown_cutoff;
    end if;

    return jsonb_build_object('status', 'unavailable');
  end if;

  -- 5. Evaluate principal-level and system-wide admitted counts in the active window.
  select count(*)::integer,
         count(*) filter (where outcome = 'denied')::integer
    into v_principal_attempts, v_principal_denied
    from private.ai_compliance_lookup_limits
   where principal_id = v_principal_id
     and attempted_at >= v_window_cutoff;

  select count(*)::integer
    into v_system_attempts
    from private.ai_compliance_lookup_limits
   where attempted_at >= v_window_cutoff;

  -- 6. Throttle path: do NOT insert into ai_compliance_lookup_limits.
  --    Inside cooldown, execute ZERO persistent writes. On a new rolling window,
  --    record the throttle state and emit at most one summary audit_log row.
  --    After cooldown expiry within the same window, update sampled_suppression_events
  --    atomically without resetting window_started_at and without extra audit_log rows.
  if v_principal_attempts >= v_config.principal_attempt_limit
     or v_principal_denied >= v_config.principal_denied_limit
     or v_system_attempts >= v_config.system_attempt_limit then
    if v_principal_attempts >= v_config.principal_attempt_limit
       or v_principal_denied >= v_config.principal_denied_limit then
      v_throttle_scope := 'principal:' || v_principal_id::text;
    else
      v_throttle_scope := 'system:global';
    end if;

    select * into v_existing_throttle
      from private.ai_compliance_lookup_throttle_state
     where scope_key = v_throttle_scope;

    if not found or private.ai_compliance_window_expired(v_existing_throttle.window_started_at, v_window_cutoff) then
      delete from private.ai_compliance_lookup_throttle_state
       where last_recorded_at < v_now - interval '1 hour';

      insert into private.ai_compliance_lookup_throttle_state (
        scope_key, window_started_at, sampled_suppression_events, last_recorded_at
      ) values (v_throttle_scope, v_now, 1, v_now)
      on conflict (scope_key) do update set
        window_started_at = excluded.window_started_at,
        sampled_suppression_events = 1,
        last_recorded_at = excluded.last_recorded_at;

      insert into public.audit_log (
        actor_id, action, entity, entity_id, new_values
      ) values (
        v_principal_id,
        'ai_actor_compliance_lookup',
        'ai_actor_directory',
        p_actor_subject_id,
        jsonb_build_object(
          'purpose', left(coalesce(v_purpose, '[invalid_or_missing]'), 200),
          'outcome', 'throttled',
          'attempted_at', v_now
        )
      );
    elsif v_existing_throttle.last_recorded_at <= v_cooldown_cutoff then
      update private.ai_compliance_lookup_throttle_state
         set sampled_suppression_events = sampled_suppression_events + 1,
             last_recorded_at = v_now
       where scope_key = v_throttle_scope
         and last_recorded_at <= v_cooldown_cutoff;
    end if;

    return jsonb_build_object('status', 'throttled');
  end if;

  -- 7. Admitted path: prune expired rows only on permitted write paths, then validate
  --    permissions, parameters, and resolve actor subject.
  delete from private.ai_compliance_lookup_limits
   where attempted_at < v_now - interval '1 hour';

  delete from private.ai_compliance_lookup_throttle_state
   where last_recorded_at < v_now - interval '1 hour';

  if not public.has_permission('audit.read')
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

  -- Every admitted outcome is recorded in the existing append-only audit log. If this
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
