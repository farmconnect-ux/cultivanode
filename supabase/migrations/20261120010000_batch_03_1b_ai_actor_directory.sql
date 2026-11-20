-- Batch 03.1B M2: private AI actor directory and account-deletion anonymisation.
-- Actor subject IDs are pseudonymous stable identifiers; profile attribution is severed
-- during the existing account-deletion transaction. AI audit events are never modified.

create table private.ai_actor_directory (
  actor_subject_id uuid primary key default gen_random_uuid(),
  actor_kind text not null check (actor_kind in ('user', 'system')),
  profile_id uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  deleted_at timestamptz,
  constraint ai_actor_directory_identity_check check (
    (actor_kind = 'user' and (profile_id is not null or deleted_at is not null))
    or (actor_kind = 'system' and profile_id is null)
  ),
  constraint ai_actor_directory_deletion_check check (
    deleted_at is null or profile_id is null
  )
);

create unique index ai_actor_directory_profile_uidx
  on private.ai_actor_directory (profile_id)
  where profile_id is not null;

alter table private.ai_actor_directory enable row level security;
revoke all on table private.ai_actor_directory from public, anon, authenticated, service_role;
alter table private.ai_actor_directory owner to postgres;

create or replace function private.resolve_or_create_ai_actor(p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted_at timestamptz;
  v_actor_subject_id uuid;
begin
  if p_profile_id is null then
    raise exception 'Profile ID is required.' using errcode = '22023';
  end if;

  select p.deleted_at
    into v_deleted_at
  from public.profiles p
  where p.id = p_profile_id
  for key share;

  if not found then
    raise exception 'Profile not found.' using errcode = 'P0002';
  end if;

  if v_deleted_at is not null then
    raise exception 'Deleted profiles cannot be mapped to an AI actor.' using errcode = 'P0001';
  end if;

  insert into private.ai_actor_directory (actor_kind, profile_id)
  values ('user', p_profile_id)
  on conflict (profile_id) where profile_id is not null do nothing;

  select d.actor_subject_id
    into v_actor_subject_id
  from private.ai_actor_directory d
  where d.profile_id = p_profile_id
    and d.actor_kind = 'user'
    and d.deleted_at is null;

  if v_actor_subject_id is null then
    raise exception 'AI actor mapping could not be resolved.' using errcode = 'P0001';
  end if;

  return v_actor_subject_id;
end;
$$;

alter function private.resolve_or_create_ai_actor(uuid) owner to postgres;
revoke all on function private.resolve_or_create_ai_actor(uuid)
  from public, anon, authenticated, service_role;

create or replace function private.anonymise_ai_actor(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_profile_id is null then
    return;
  end if;

  update private.ai_actor_directory
     set profile_id = null,
         deleted_at = coalesce(deleted_at, clock_timestamp()),
         updated_at = clock_timestamp()
   where profile_id = p_profile_id
     and actor_kind = 'user';
end;
$$;

alter function private.anonymise_ai_actor(uuid) owner to postgres;
revoke all on function private.anonymise_ai_actor(uuid)
  from public, anon, authenticated, service_role;

create or replace function private.lookup_ai_actor_subject(p_actor_subject_id uuid)
returns table (
  actor_subject_id uuid,
  actor_kind text,
  profile_id uuid,
  deleted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.actor_subject_id, d.actor_kind, d.profile_id, d.deleted_at
  from private.ai_actor_directory d
  where d.actor_subject_id = p_actor_subject_id;
$$;

alter function private.lookup_ai_actor_subject(uuid) owner to postgres;
revoke all on function private.lookup_ai_actor_subject(uuid)
  from public, anon, authenticated, service_role;

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

  -- Anonymise AI actor attribution in the same transaction; immutable AI events remain untouched.
  perform private.anonymise_ai_actor(p_user_id);

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

alter function public.execute_account_deletion(uuid, text) owner to postgres;

revoke all on function public.execute_account_deletion(uuid, text)
  from public, anon, authenticated;
grant execute on function public.execute_account_deletion(uuid, text)
  to service_role;
