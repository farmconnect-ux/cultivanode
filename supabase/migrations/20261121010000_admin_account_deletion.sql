-- Staff-run account deletion for queued deletion requests.
--
-- Website deletion requests (request_account_deletion) were closed by hand with
-- admin_resolve_data_request(..., 'completed', ...), which only changed the request status.
-- Staff now start the real three-phase deletion from the privacy desk: this function checks
-- privacy.manage and records the decision; the server then runs execute_account_deletion,
-- Storage cleanup and Auth removal with the service role, and finalize_account_deletion
-- closes the request once the account is actually gone.

create or replace function public.admin_authorize_account_deletion(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.data_requests;
begin
  perform private.require_permission('privacy.manage');

  select * into v_req
  from public.data_requests
  where id = p_request_id
  for update;

  if not found or v_req.kind <> 'deletion' or v_req.status <> 'open' then
    raise exception 'No open deletion request with that id.' using errcode = 'P0002';
  end if;
  if v_req.profile_id is null then
    raise exception 'This request has no account attached.' using errcode = '22023';
  end if;
  if v_req.profile_id = auth.uid() then
    raise exception 'Delete your own account from your account settings.' using errcode = '22023';
  end if;

  perform public.write_audit('account_deletion_started', 'data_request', v_req.id,
    jsonb_build_object('profile_id', v_req.profile_id));
  perform private.record_admin_action('privacy.manage', 'account_deletion_started', 'data_request', v_req.id,
    'Staff started account deletion');

  return jsonb_build_object('profile_id', v_req.profile_id, 'reason', v_req.reason);
end;
$$;

alter function public.admin_authorize_account_deletion(uuid) owner to postgres;
revoke all on function public.admin_authorize_account_deletion(uuid) from public, anon;
grant execute on function public.admin_authorize_account_deletion(uuid) to authenticated;

-- A deletion request may only be marked completed by finalize_account_deletion.
create or replace function public.admin_resolve_data_request(
  p_request_id uuid, p_status public.data_request_status, p_note text
)
returns public.data_requests
language plpgsql security definer
set search_path = ''
as $$
declare
  v_req public.data_requests;
begin
  perform private.require_permission('privacy.manage');
  if p_status not in ('completed', 'rejected') then
    raise exception 'Choose completed or rejected.' using errcode = '22023';
  end if;
  if p_note is null or char_length(trim(p_note)) not between 5 and 1000 then
    raise exception 'Write what was done (5 to 1000 characters).' using errcode = '22023';
  end if;
  if p_status = 'completed'
     and exists (select 1 from public.data_requests where id = p_request_id and kind = 'deletion') then
    raise exception 'Use Delete account to complete a deletion request.' using errcode = '22023';
  end if;
  update public.data_requests
     set status = p_status, resolution_note = trim(p_note), handled_by = auth.uid(), handled_at = now()
   where id = p_request_id and status = 'open'
  returning * into v_req;
  if not found then
    raise exception 'No open request with that id.' using errcode = 'P0002';
  end if;
  perform public.write_audit('data_request_' || p_status::text, 'data_request', v_req.id,
    jsonb_build_object('kind', v_req.kind, 'profile_id', v_req.profile_id),
    jsonb_build_object('status', 'open'), jsonb_build_object('status', p_status));
  perform private.record_admin_action('privacy.manage', 'data_request_' || p_status::text, 'data_request', v_req.id, v_req.resolution_note);
  return v_req;
end;
$$;
