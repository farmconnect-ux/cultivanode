-- Batch 02.5: Self-service account deletion workflow with financial & shared-record safeguards.

alter table public.profiles
  add column if not exists deleted_at timestamptz;

-- Allow auth.admin.deleteUser() to remove Supabase Auth credentials/sessions
-- without cascade-deleting profiles or destroying financial/order/booking history.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- Ensure IoT user references do not block auth.users deletion.
alter table public.device_installations
  drop constraint if exists device_installations_installed_by_fkey,
  add constraint device_installations_installed_by_fkey
    foreign key (installed_by) references auth.users (id) on delete set null;

alter table public.device_alerts
  drop constraint if exists device_alerts_acknowledged_by_fkey,
  add constraint device_alerts_acknowledged_by_fkey
    foreign key (acknowledged_by) references auth.users (id) on delete set null;

alter table public.device_commands
  alter column created_by drop not null,
  drop constraint if exists device_commands_created_by_fkey,
  add constraint device_commands_created_by_fkey
    foreign key (created_by) references auth.users (id) on delete set null;

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
  v_storage_paths  text[];
  v_req_id         uuid;
  v_new_owner      uuid;
  v_org            record;
  v_trimmed_reason text := nullif(trim(p_reason), '');
begin
  if p_user_id is null then
    raise exception 'User ID is required.' using errcode = '22023';
  end if;

  if v_trimmed_reason is not null and char_length(v_trimmed_reason) > 1000 then
    raise exception 'Please keep the reason under 1000 characters.' using errcode = '22023';
  end if;

  select * into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Account profile not found.' using errcode = 'P0002';
  end if;

  if v_profile.deleted_at is not null then
    return jsonb_build_object(
      'status', 'already_deleted',
      'user_id', p_user_id,
      'storage_paths', '[]'::jsonb
    );
  end if;

  -- Safety checks: do not break active operational or financial commitments.
  if exists (
    select 1 from public.admin_roles where profile_id = p_user_id and admin_role = 'super_admin'
  ) and (select count(*) from public.admin_roles where admin_role = 'super_admin') <= 1 then
    raise exception 'Cannot delete the last super admin account.' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.bookings
    where (farmer_id = p_user_id or provider_id = p_user_id)
      and status in ('requested', 'accepted', 'in_progress', 'awaiting_confirmation', 'disputed')
  ) then
    raise exception 'Complete or resolve active service bookings before deleting your account.' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.marketplace_orders
    where buyer_id = p_user_id
      and status in ('paid', 'processing', 'shipped', 'disputed')
  ) then
    raise exception 'Complete or resolve active marketplace orders before deleting your account.' using errcode = 'P0001';
  end if;

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

  if exists (
    select 1 from public.marketplace_settlements
    where seller_id in (select id from public.marketplace_sellers where profile_id = p_user_id)
      and status in ('pending', 'processing')
  ) then
    raise exception 'Wait for pending seller settlements to complete before deleting your account.' using errcode = 'P0001';
  end if;

  -- Collect private verification document paths for server-side Storage cleanup.
  select coalesce(array_agg(storage_path), array[]::text[])
    into v_storage_paths
  from public.verification_documents
  where profile_id = p_user_id;

  -- Delete personal, non-financial, non-shared records.
  delete from public.notifications where profile_id = p_user_id;
  delete from public.calendar_feeds where profile_id = p_user_id;
  delete from public.role_requests where profile_id = p_user_id;
  delete from public.user_roles where profile_id = p_user_id;
  delete from public.verification_documents where profile_id = p_user_id;
  delete from public.bank_accounts where profile_id = p_user_id;
  delete from public.admin_roles where profile_id = p_user_id;
  delete from public.org_members where profile_id = p_user_id;

  -- Preserve shared organizations by transferring ownership if another member exists.
  for v_org in
    select id from public.organizations where owner_id = p_user_id
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
    end if;
  end loop;

  -- Anonymize PII while preserving financial, order, booking, and audit integrity.
  update public.profiles
     set full_name = 'Deleted user',
         phone = 'deleted-' || replace(p_user_id::text, '-', ''),
         state = null,
         lga = null,
         deleted_at = clock_timestamp(),
         suspended_at = coalesce(suspended_at, clock_timestamp()),
         suspended_reason = coalesce(suspended_reason, 'Account deleted by user')
   where id = p_user_id;

  update public.marketplace_orders
     set delivery_address = '{"redacted": true}'::jsonb
   where buyer_id = p_user_id;

  update public.marketplace_sellers
     set business_name = 'Deleted seller',
         verification_status = 'suspended'
   where profile_id = p_user_id;

  -- Close open deletion request or insert completed NDPA deletion record.
  update public.data_requests
     set status = 'completed',
         reason = coalesce(v_trimmed_reason, reason),
         handled_at = clock_timestamp(),
         resolution_note = 'Self-service account deletion completed'
   where profile_id = p_user_id
     and kind = 'deletion'
     and status = 'open'
  returning id into v_req_id;

  if v_req_id is null then
    insert into public.data_requests (profile_id, kind, status, reason, handled_at, resolution_note)
    values (p_user_id, 'deletion', 'completed', v_trimmed_reason, clock_timestamp(), 'Self-service account deletion completed')
    returning id into v_req_id;
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id, new_values)
  values (
    p_user_id,
    'account_deleted',
    'profile',
    p_user_id,
    jsonb_build_object('request_id', v_req_id, 'storage_paths_count', coalesce(array_length(v_storage_paths, 1), 0))
  );

  return jsonb_build_object(
    'status', 'deleted',
    'user_id', p_user_id,
    'request_id', v_req_id,
    'storage_paths', to_jsonb(coalesce(v_storage_paths, array[]::text[]))
  );
end;
$$;

revoke all on function public.execute_account_deletion(uuid, text) from public, anon, authenticated;
grant execute on function public.execute_account_deletion(uuid, text) to service_role;
