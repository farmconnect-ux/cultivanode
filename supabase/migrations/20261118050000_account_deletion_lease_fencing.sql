-- Batch 02.5 Final Review Correction:
-- 1. Cryptographic lease_token fencing for account_deletion_storage_cleanup
-- 2. Terminal 'completed' state protection in record_account_deletion_storage_result and finalize_account_deletion

alter table public.account_deletion_storage_cleanup
  add column if not exists lease_token uuid;

drop function if exists public.claim_account_deletion_storage_cleanup(uuid, integer);

create or replace function public.claim_account_deletion_storage_cleanup(
  p_user_id uuid default null,
  p_lease_seconds integer default 300
)
returns table (
  id uuid,
  profile_id uuid,
  bucket_id text,
  storage_path text,
  attempts integer,
  lease_expires_at timestamptz,
  lease_token uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease_secs integer := greatest(1, least(coalesce(p_lease_seconds, 300), 3600));
  v_now timestamptz := clock_timestamp();
begin
  return query
  with candidates as (
    select c.id
    from public.account_deletion_storage_cleanup c
    where (p_user_id is null or c.profile_id = p_user_id)
      and (
        c.status in ('pending', 'failed')
        or (c.status = 'processing' and (c.lease_expires_at is null or c.lease_expires_at <= v_now))
      )
    order by c.created_at asc
    limit 100
    for update skip locked
  )
  update public.account_deletion_storage_cleanup c
     set status = 'processing',
         attempts = c.attempts + 1,
         lease_expires_at = v_now + make_interval(secs => v_lease_secs),
         lease_token = gen_random_uuid(),
         updated_at = v_now
    from candidates
   where c.id = candidates.id
  returning c.id, c.profile_id, c.bucket_id, c.storage_path, c.attempts, c.lease_expires_at, c.lease_token;
end;
$$;

drop function if exists public.record_account_deletion_storage_result(uuid, text, text);

create or replace function public.record_account_deletion_storage_result(
  p_cleanup_id uuid,
  p_status text,
  p_error text default null,
  p_lease_token uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.account_deletion_storage_cleanup%rowtype;
  v_profile_status text;
  v_remaining integer := 0;
  v_now timestamptz := clock_timestamp();
begin
  if p_status not in ('completed', 'failed') then
    raise exception 'Invalid cleanup status.' using errcode = '22023';
  end if;

  select * into v_row
  from public.account_deletion_storage_cleanup
  where id = p_cleanup_id
  for update;

  if not found then
    raise exception 'Cleanup record not found.' using errcode = 'P0002';
  end if;

  if v_row.status <> 'processing' then
    raise exception 'Storage cleanup lease is no longer active (current status: %).', v_row.status
      using errcode = 'P0001';
  end if;

  if v_row.lease_token is distinct from p_lease_token then
    raise exception 'Storage cleanup lease token mismatch or superseded by another worker.'
      using errcode = 'P0001';
  end if;

  if v_row.lease_expires_at is not null and v_row.lease_expires_at <= v_now then
    raise exception 'Storage cleanup lease has expired.'
      using errcode = 'P0001';
  end if;

  select deletion_status into v_profile_status
  from public.profiles
  where id = v_row.profile_id
  for update;

  update public.account_deletion_storage_cleanup
     set status = p_status,
         lease_expires_at = null,
         lease_token = null,
         last_error = case when p_status = 'completed' then null else left(coalesce(p_error, 'Storage cleanup failed'), 500) end,
         completed_at = case when p_status = 'completed' then v_now else null end,
         updated_at = v_now
   where id = p_cleanup_id
  returning * into v_row;

  select count(*)::int into v_remaining
  from public.account_deletion_storage_cleanup
  where profile_id = v_row.profile_id and status <> 'completed';

  if v_profile_status = 'completed' then
    -- Terminal state protection: never regress a completed deletion.
    null;
  elsif v_remaining = 0 then
    update public.profiles
       set deletion_status = 'auth_pending'
     where id = v_row.profile_id
       and deletion_status is distinct from 'completed';
  else
    update public.profiles
       set deletion_status = 'storage_pending'
     where id = v_row.profile_id
       and deletion_status is not null
       and deletion_status is distinct from 'completed';
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'profile_id', v_row.profile_id,
    'status', v_row.status,
    'remaining_count', v_remaining
  );
end;
$$;

create or replace function public.finalize_account_deletion(
  p_user_id uuid,
  p_auth_deleted boolean,
  p_auth_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining integer := 0;
  v_current_status text;
  v_final_status text;
begin
  if p_user_id is null then
    raise exception 'User ID is required.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('account_deletion:' || p_user_id::text));

  select deletion_status into v_current_status
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Account profile not found.' using errcode = 'P0002';
  end if;

  -- Terminal state protection: completed deletions are immutable and idempotent.
  if v_current_status = 'completed' then
    return jsonb_build_object(
      'user_id', p_user_id,
      'deletion_status', 'completed',
      'remaining_storage_count', 0
    );
  end if;

  select count(*)::int into v_remaining
  from public.account_deletion_storage_cleanup
  where profile_id = p_user_id and status <> 'completed';

  if v_remaining > 0 then
    v_final_status := 'storage_pending';
    update public.profiles
       set deletion_status = v_final_status
     where id = p_user_id;

    update public.data_requests
       set resolution_note = format('Storage cleanup incomplete (%s item(s) remaining)', v_remaining)
     where profile_id = p_user_id and kind = 'deletion' and status = 'open';
  elsif not coalesce(p_auth_deleted, false) then
    v_final_status := 'auth_pending';
    update public.profiles
       set deletion_status = v_final_status
     where id = p_user_id;

    update public.data_requests
       set resolution_note = left(coalesce(nullif(trim(p_auth_error), ''), 'Auth identity removal pending'), 1000)
     where profile_id = p_user_id and kind = 'deletion' and status = 'open';
  else
    v_final_status := 'completed';
    update public.profiles
       set deletion_status = 'completed'
     where id = p_user_id;

    update public.data_requests
       set status = 'completed',
           handled_at = coalesce(handled_at, clock_timestamp()),
           resolution_note = 'Self-service account deletion completed (DB anonymised, Storage cleaned, Auth removed)'
     where profile_id = p_user_id and kind = 'deletion' and status = 'open';

    insert into public.audit_log (actor_id, action, entity, entity_id, new_values)
    values (p_user_id, 'account_deleted', 'profile', p_user_id, jsonb_build_object('status', 'completed'));
  end if;

  return jsonb_build_object(
    'user_id', p_user_id,
    'deletion_status', v_final_status,
    'remaining_storage_count', v_remaining
  );
end;
$$;

revoke all on function public.claim_account_deletion_storage_cleanup(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_account_deletion_storage_cleanup(uuid, integer) to service_role;

revoke all on function public.record_account_deletion_storage_result(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_account_deletion_storage_result(uuid, text, text, uuid) to service_role;

revoke all on function public.finalize_account_deletion(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.finalize_account_deletion(uuid, boolean, text) to service_role;
