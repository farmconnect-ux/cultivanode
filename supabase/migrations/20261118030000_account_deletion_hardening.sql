-- Batch 02.5 Independent Verification Corrections:
-- 1. Durable, recoverable Storage cleanup tracking (`account_deletion_storage_cleanup`)
-- 2. Separate DB anonymisation, Storage removal, and Auth removal states (`profiles.deletion_status`)
-- 3. Active seller fulfilment blockers (`marketplace_fulfilments`)
-- 4. Serialised super-admin deletion & concurrent booking/order/fulfilment guards
-- 5. Explicit archival/anonymisation for organizations without remaining members

alter table public.profiles
  add column if not exists deletion_status text
    check (deletion_status is null or deletion_status in ('processing', 'storage_pending', 'auth_pending', 'completed'));

alter table public.organizations
  add column if not exists archived_at timestamptz;

create table if not exists public.account_deletion_storage_cleanup (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  bucket_id    text not null default 'verification-documents',
  storage_path text not null,
  status       text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts     integer not null default 0 check (attempts >= 0),
  last_error   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (profile_id, bucket_id, storage_path)
);

create index if not exists account_deletion_storage_cleanup_status_idx
  on public.account_deletion_storage_cleanup (status, profile_id);

drop trigger if exists account_deletion_storage_cleanup_updated_at on public.account_deletion_storage_cleanup;
create trigger account_deletion_storage_cleanup_updated_at
  before update on public.account_deletion_storage_cleanup
  for each row execute function public.set_updated_at();

alter table public.account_deletion_storage_cleanup enable row level security;
revoke all on public.account_deletion_storage_cleanup from public, anon, authenticated;
grant select, insert, update, delete on public.account_deletion_storage_cleanup to service_role;

-- Prevent new bookings, orders, or fulfilments against an account undergoing or having completed deletion.
create or replace function private.guard_not_deleting_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles p
    where p.id in (new.farmer_id, new.provider_id)
      and (p.deleted_at is not null or p.deletion_status is not null)
  ) then
    raise exception 'Cannot create or update booking for a deleted or deleting account.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_block_deleted_accounts on public.bookings;
create trigger bookings_block_deleted_accounts
  before insert on public.bookings
  for each row execute function private.guard_not_deleting_booking();

create or replace function private.guard_not_deleting_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles p
    where p.id = new.buyer_id
      and (p.deleted_at is not null or p.deletion_status is not null)
  ) then
    raise exception 'Cannot place order for a deleted or deleting account.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_orders_block_deleted_accounts on public.marketplace_orders;
create trigger marketplace_orders_block_deleted_accounts
  before insert on public.marketplace_orders
  for each row execute function private.guard_not_deleting_order();

create or replace function private.guard_not_deleting_fulfilment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.marketplace_sellers s
    join public.profiles p on p.id = s.profile_id
    where s.id = new.seller_id
      and (p.deleted_at is not null or p.deletion_status is not null)
  ) then
    raise exception 'Cannot create fulfilment for a deleted or deleting seller account.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_fulfilments_block_deleted_accounts on public.marketplace_fulfilments;
create trigger marketplace_fulfilments_block_deleted_accounts
  before insert on public.marketplace_fulfilments
  for each row execute function private.guard_not_deleting_fulfilment();

create or replace function public.execute_account_deletion(
  p_user_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile        public.profiles%rowtype;
  v_storage_count  integer := 0;
  v_pending_count  integer := 0;
  v_req_id         uuid;
  v_new_owner      uuid;
  v_org            record;
  v_is_super_admin boolean := false;
  v_trimmed_reason text := nullif(trim(p_reason), '');
begin
  if p_user_id is null then
    raise exception 'User ID is required.' using errcode = '22023';
  end if;

  if v_trimmed_reason is not null and char_length(v_trimmed_reason) > 1000 then
    raise exception 'Please keep the reason under 1000 characters.' using errcode = '22023';
  end if;

  -- Serialise concurrent deletion attempts for the same user.
  perform pg_advisory_xact_lock(hashtext('account_deletion:' || p_user_id::text));

  -- Check if user is a super_admin and serialise global super-admin deletion to prevent leaving zero super-admins.
  select exists (
    select 1 from public.admin_roles where profile_id = p_user_id and admin_role = 'super_admin'
  ) into v_is_super_admin;

  if v_is_super_admin then
    perform pg_advisory_xact_lock(hashtext('account_deletion:super_admin_guard'));
  end if;

  select * into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Account profile not found.' using errcode = 'P0002';
  end if;

  -- Idempotent retry: DB anonymisation already ran; return current state & pending storage count without repeating destructive steps.
  if v_profile.deleted_at is not null or v_profile.deletion_status is not null then
    select count(*)::int into v_pending_count
    from public.account_deletion_storage_cleanup
    where profile_id = p_user_id and status <> 'completed';

    select id into v_req_id
    from public.data_requests
    where profile_id = p_user_id and kind = 'deletion'
    order by created_at desc
    limit 1;

    return jsonb_build_object(
      'status', case when v_profile.deletion_status = 'completed' then 'already_deleted' else 'already_anonymized' end,
      'deletion_status', coalesce(v_profile.deletion_status, 'completed'),
      'user_id', p_user_id,
      'request_id', v_req_id,
      'pending_storage_count', v_pending_count
    );
  end if;

  -- Re-check super_admin count under the serialised lock.
  if v_is_super_admin and (select count(*) from public.admin_roles where admin_role = 'super_admin') <= 1 then
    raise exception 'Cannot delete the last super admin account.' using errcode = 'P0001';
  end if;

  -- Active service bookings blocker (buyer or provider).
  if exists (
    select 1 from public.bookings
    where (farmer_id = p_user_id or provider_id = p_user_id)
      and status in ('requested', 'accepted', 'in_progress', 'awaiting_confirmation', 'disputed')
  ) then
    raise exception 'Complete or resolve active service bookings before deleting your account.' using errcode = 'P0001';
  end if;

  -- Active buyer marketplace orders blocker.
  if exists (
    select 1 from public.marketplace_orders
    where buyer_id = p_user_id
      and status in ('placed', 'payment_pending', 'paid', 'processing', 'partially_fulfilled', 'disputed')
  ) then
    raise exception 'Complete or resolve active marketplace orders before deleting your account.' using errcode = 'P0001';
  end if;

  -- Active seller fulfilments blocker (all non-terminal fulfilment states; terminal = accepted, rejected, cancelled).
  if exists (
    select 1
    from public.marketplace_fulfilments f
    join public.marketplace_sellers s on s.id = f.seller_id
    where s.profile_id = p_user_id
      and f.status in ('placed', 'confirmed', 'preparing', 'ready_for_pickup', 'dispatched', 'in_transit', 'delivered', 'disputed')
  ) then
    raise exception 'Complete or resolve active seller fulfilments before deleting your account.' using errcode = 'P0001';
  end if;

  -- Held marketplace escrows blocker (buyer or seller).
  if exists (
    select 1 from public.marketplace_escrows
    where (
      buyer_id = p_user_id
      or seller_id in (select id from public.marketplace_sellers where profile_id = p_user_id)
    )
      and status = 'held'
  ) then
    raise exception 'Resolve held marketplace escrows before deleting your account.' using errcode = 'P0001';
  end if;

  -- Pending or processing seller settlements blocker.
  if exists (
    select 1 from public.marketplace_settlements
    where seller_id in (select id from public.marketplace_sellers where profile_id = p_user_id)
      and status in ('pending', 'processing')
  ) then
    raise exception 'Wait for pending seller settlements to complete before deleting your account.' using errcode = 'P0001';
  end if;

  -- Preserve private Storage paths in durable cleanup queue BEFORE deleting verification_documents metadata.
  insert into public.account_deletion_storage_cleanup (profile_id, bucket_id, storage_path, status)
  select p_user_id, 'verification-documents', vd.storage_path, 'pending'
  from public.verification_documents vd
  where vd.profile_id = p_user_id
  on conflict (profile_id, bucket_id, storage_path) do nothing;

  select count(*)::int into v_storage_count
  from public.account_deletion_storage_cleanup
  where profile_id = p_user_id and status <> 'completed';

  -- Delete personal, non-financial, non-shared records.
  delete from public.notifications where profile_id = p_user_id;
  delete from public.calendar_feeds where profile_id = p_user_id;
  delete from public.role_requests where profile_id = p_user_id;
  delete from public.user_roles where profile_id = p_user_id;
  delete from public.verification_documents where profile_id = p_user_id;
  delete from public.bank_accounts where profile_id = p_user_id;
  delete from public.admin_roles where profile_id = p_user_id;
  delete from public.org_members where profile_id = p_user_id;

  -- Handle organizations owned by user: transfer ownership to remaining member, or explicitly archive & anonymize if none remain.
  for v_org in
    select id from public.organizations where owner_id = p_user_id for update
  loop
    select profile_id into v_new_owner
    from public.org_members
    where organization_id = v_org.id
    order by created_at asc
    limit 1;

    if v_new_owner is not null then
      update public.organizations
         set owner_id = v_new_owner
       where id = v_org.id;
    else
      update public.organizations
         set name = 'Deleted organization',
             cac_number = null,
             archived_at = clock_timestamp()
       where id = v_org.id;
    end if;
  end loop;

  -- Pause seller listings and suspend seller profile.
  update public.marketplace_listings
     set status = 'paused'
   where seller_id in (select id from public.marketplace_sellers where profile_id = p_user_id)
     and status = 'active';

  update public.marketplace_sellers
     set business_name = 'Deleted seller',
         is_suspended = true,
         suspension_reason = 'Account deleted by user'
   where profile_id = p_user_id;

  -- Anonymize profile PII and mark protected processing state.
  update public.profiles
     set full_name = 'Deleted user',
         phone = 'deleted-' || replace(p_user_id::text, '-', ''),
         state = null,
         lga = null,
         deleted_at = clock_timestamp(),
         deletion_status = case when v_storage_count > 0 then 'storage_pending' else 'auth_pending' end,
         suspended_at = coalesce(suspended_at, clock_timestamp()),
         suspended_reason = coalesce(suspended_reason, 'Account deleted by user')
   where id = p_user_id;

  update public.marketplace_orders
     set delivery_address = '{"redacted": true}'::jsonb
   where buyer_id = p_user_id;

  -- Keep data_requests status 'open' until Storage cleanup AND Auth deletion complete in finalize_account_deletion().
  update public.data_requests
     set reason = coalesce(v_trimmed_reason, reason),
         resolution_note = case
           when v_storage_count > 0 then 'Database anonymised; private Storage cleanup pending'
           else 'Database anonymised; Auth identity removal pending'
         end
   where profile_id = p_user_id
     and kind = 'deletion'
     and status = 'open'
  returning id into v_req_id;

  if v_req_id is null then
    insert into public.data_requests (profile_id, kind, status, reason, resolution_note)
    values (
      p_user_id,
      'deletion',
      'open',
      v_trimmed_reason,
      case
        when v_storage_count > 0 then 'Database anonymised; private Storage cleanup pending'
        else 'Database anonymised; Auth identity removal pending'
      end
    )
    returning id into v_req_id;
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id, new_values)
  values (
    p_user_id,
    'account_anonymized',
    'profile',
    p_user_id,
    jsonb_build_object(
      'request_id', v_req_id,
      'pending_storage_count', v_storage_count,
      'deletion_status', case when v_storage_count > 0 then 'storage_pending' else 'auth_pending' end
    )
  );

  return jsonb_build_object(
    'status', 'anonymized',
    'deletion_status', case when v_storage_count > 0 then 'storage_pending' else 'auth_pending' end,
    'user_id', p_user_id,
    'request_id', v_req_id,
    'pending_storage_count', v_storage_count
  );
end;
$$;

create or replace function public.claim_account_deletion_storage_cleanup(
  p_user_id uuid default null
)
returns table (
  id uuid,
  profile_id uuid,
  bucket_id text,
  storage_path text,
  attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select c.id
    from public.account_deletion_storage_cleanup c
    where (p_user_id is null or c.profile_id = p_user_id)
      and c.status in ('pending', 'failed')
    order by c.created_at asc
    limit 100
    for update skip locked
  )
  update public.account_deletion_storage_cleanup c
     set status = 'processing',
         attempts = c.attempts + 1,
         updated_at = clock_timestamp()
    from candidates
   where c.id = candidates.id
  returning c.id, c.profile_id, c.bucket_id, c.storage_path, c.attempts;
end;
$$;

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
  v_final_status text;
begin
  if p_user_id is null then
    raise exception 'User ID is required.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('account_deletion:' || p_user_id::text));

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
           handled_at = clock_timestamp(),
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

revoke all on function public.execute_account_deletion(uuid, text) from public, anon, authenticated;
grant execute on function public.execute_account_deletion(uuid, text) to service_role;

revoke all on function public.claim_account_deletion_storage_cleanup(uuid) from public, anon, authenticated;
grant execute on function public.claim_account_deletion_storage_cleanup(uuid) to service_role;

revoke all on function public.record_account_deletion_storage_result(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_account_deletion_storage_result(uuid, text, text) to service_role;

revoke all on function public.finalize_account_deletion(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.finalize_account_deletion(uuid, boolean, text) to service_role;
