-- Batch 02.5 Final Reliability Corrections:
-- 1. Lease-based stale 'processing' claim recovery for account_deletion_storage_cleanup
-- 2. Service-side incomplete deletion listing RPC for background reconciliation
-- 3. Deadlock-safe FOR KEY SHARE profile locking in bookings/orders/fulfilments INSERT and party-change UPDATE triggers

alter table public.account_deletion_storage_cleanup
  add column if not exists lease_expires_at timestamptz;

create index if not exists account_deletion_storage_cleanup_lease_idx
  on public.account_deletion_storage_cleanup (status, lease_expires_at, profile_id);

-- Replace claim function to support lease_expires_at and reclaim stale 'processing' claims safely.
drop function if exists public.claim_account_deletion_storage_cleanup(uuid);

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
  lease_expires_at timestamptz
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
         updated_at = v_now
    from candidates
   where c.id = candidates.id
  returning c.id, c.profile_id, c.bucket_id, c.storage_path, c.attempts, c.lease_expires_at;
end;
$$;

-- Clear lease_expires_at when recording a terminal/retryable result.
create or replace function public.record_account_deletion_storage_result(
  p_cleanup_id uuid,
  p_status text,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.account_deletion_storage_cleanup%rowtype;
  v_remaining integer := 0;
begin
  if p_status not in ('completed', 'failed') then
    raise exception 'Invalid cleanup status.' using errcode = '22023';
  end if;

  update public.account_deletion_storage_cleanup
     set status = p_status,
         lease_expires_at = null,
         last_error = case when p_status = 'completed' then null else left(coalesce(p_error, 'Storage cleanup failed'), 500) end,
         completed_at = case when p_status = 'completed' then clock_timestamp() else null end,
         updated_at = clock_timestamp()
   where id = p_cleanup_id
  returning * into v_row;

  if not found then
    raise exception 'Cleanup record not found.' using errcode = 'P0002';
  end if;

  select count(*)::int into v_remaining
  from public.account_deletion_storage_cleanup
  where profile_id = v_row.profile_id and status <> 'completed';

  if v_remaining = 0 then
    update public.profiles
       set deletion_status = case when deletion_status = 'completed' then 'completed' else 'auth_pending' end
     where id = v_row.profile_id;
  else
    update public.profiles
       set deletion_status = 'storage_pending'
     where id = v_row.profile_id
       and deletion_status is not null;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'profile_id', v_row.profile_id,
    'status', v_row.status,
    'remaining_count', v_remaining
  );
end;
$$;

-- Service-side helper to list incomplete account deletions for background reconciliation.
create or replace function public.list_incomplete_account_deletions(
  p_limit integer default 50
)
returns table (
  profile_id uuid,
  deletion_status text,
  deleted_at timestamptz,
  pending_storage_count integer
)
language sql
security definer
set search_path = ''
as $$
  select
    p.id as profile_id,
    p.deletion_status,
    p.deleted_at,
    (
      select count(*)::int
      from public.account_deletion_storage_cleanup c
      where c.profile_id = p.id and c.status <> 'completed'
    ) as pending_storage_count
  from public.profiles p
  where p.deletion_status in ('processing', 'storage_pending', 'auth_pending')
  order by p.deleted_at asc nulls last, p.id asc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

-- Strengthen operational transaction guards with FOR KEY SHARE locking on profiles
-- and protect party-reassignment UPDATEs without blocking legitimate lifecycle updates.
create or replace function private.guard_not_deleting_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_check_farmer boolean := (tg_op = 'INSERT') or (new.farmer_id is distinct from old.farmer_id);
  v_check_provider boolean := (tg_op = 'INSERT') or (new.provider_id is distinct from old.provider_id);
  v_prof record;
begin
  if not v_check_farmer and not v_check_provider then
    return new;
  end if;

  for v_prof in
    select p.id, p.deleted_at, p.deletion_status
    from public.profiles p
    where (v_check_farmer and p.id = new.farmer_id)
       or (v_check_provider and p.id = new.provider_id)
    order by p.id asc
    for key share
  loop
    if v_prof.deleted_at is not null or v_prof.deletion_status is not null then
      raise exception 'Cannot create or update booking for a deleted or deleting account.'
        using errcode = 'P0001';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists bookings_block_deleted_accounts on public.bookings;
create trigger bookings_block_deleted_accounts
  before insert or update of farmer_id, provider_id on public.bookings
  for each row execute function private.guard_not_deleting_booking();

create or replace function private.guard_not_deleting_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prof record;
begin
  if tg_op = 'UPDATE' and new.buyer_id is not distinct from old.buyer_id then
    return new;
  end if;

  select p.id, p.deleted_at, p.deletion_status
  into v_prof
  from public.profiles p
  where p.id = new.buyer_id
  for key share;

  if found and (v_prof.deleted_at is not null or v_prof.deletion_status is not null) then
    raise exception 'Cannot place or reassign order for a deleted or deleting account.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists marketplace_orders_block_deleted_accounts on public.marketplace_orders;
create trigger marketplace_orders_block_deleted_accounts
  before insert or update of buyer_id on public.marketplace_orders
  for each row execute function private.guard_not_deleting_order();

create or replace function private.guard_not_deleting_fulfilment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prof record;
begin
  if tg_op = 'UPDATE' and new.seller_id is not distinct from old.seller_id then
    return new;
  end if;

  select p.id, p.deleted_at, p.deletion_status
  into v_prof
  from public.marketplace_sellers s
  join public.profiles p on p.id = s.profile_id
  where s.id = new.seller_id
  for key share of p;

  if found and (v_prof.deleted_at is not null or v_prof.deletion_status is not null) then
    raise exception 'Cannot create or reassign fulfilment for a deleted or deleting seller account.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists marketplace_fulfilments_block_deleted_accounts on public.marketplace_fulfilments;
create trigger marketplace_fulfilments_block_deleted_accounts
  before insert or update of seller_id on public.marketplace_fulfilments
  for each row execute function private.guard_not_deleting_fulfilment();

revoke all on function public.claim_account_deletion_storage_cleanup(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_account_deletion_storage_cleanup(uuid, integer) to service_role;

revoke all on function public.list_incomplete_account_deletions(integer) from public, anon, authenticated;
grant execute on function public.list_incomplete_account_deletions(integer) to service_role;
