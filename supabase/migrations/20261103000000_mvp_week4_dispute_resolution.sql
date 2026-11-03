-- CultivaNode MVP week 4: staff dispute resolution moves into the database.
--
--   1. A dispute outcome is recorded on the booking: decision (uphold_provider / uphold_farmer /
--      settlement), the staff note both parties read, a settlement amount when the parties agreed
--      to pay part, who decided and when. booking_detail() shows it to the parties.
--   2. resolve_booking_dispute(): a staff RPC with the 'disputes.decide' permission ends a dispute
--      the way every other state change happens - status check, booking_events row, notification
--      (and SMS) to both parties, audit log and admin action, all in one transaction.
--   3. reopen_booking_dispute(): staff can reopen a resolved dispute (a party called in with more
--      evidence). The booking goes back to 'disputed'; evidence uploads work again.
--   4. request_dispute_evidence(): staff ask a party (or both) for a specific extra photo or
--      detail. Purely a notification; add_dispute_evidence() already accepts uploads while disputed.
--   5. admin_cancel_booking(): staff take an active booking off the calendar with a reason,
--      through the same discipline (the old admin console did a raw UPDATE with no event).
--   6. booking_detail() learns the dispute outcome and the staff 'can' actions.
--      admin_booking_stats() learns the queue age.
--
-- No new booking_status values are needed ('completed', 'cancelled' and 'disputed' all exist),
-- so this is one file. Errors carry a stable code in HINT, as everywhere else.

------------------------------------------------------------------------------------------------
-- 1. Bookings: the dispute outcome lives on the row
------------------------------------------------------------------------------------------------

alter table public.bookings
  add column dispute_outcome    text check (dispute_outcome is null or dispute_outcome in
                                    ('uphold_provider', 'uphold_farmer', 'settlement')),
  add column dispute_decision  text check (dispute_decision is null or char_length(dispute_decision) <= 1000),
  add column settlement_kobo   bigint check (settlement_kobo is null or settlement_kobo > 0),
  add column dispute_decided_by uuid references public.profiles (id) on delete set null,
  add column dispute_decided_at timestamptz;

comment on column public.bookings.dispute_outcome is
  'How staff ended the dispute: the work stands (uphold_provider), the farmer was right (uphold_farmer), or the parties agreed a partial payment (settlement).';
comment on column public.bookings.dispute_decision is
  'What staff decided, in words both parties read in booking_detail(). Not a private note: the reason for the audit log goes to admin_actions.';
comment on column public.bookings.settlement_kobo is
  'A settlement outcome only: the amount the farmer and provider agreed the farmer pays directly (no money moves through CultivaNode in the pilot).';

create index bookings_disputed_queue_idx on public.bookings (disputed_at) where status = 'disputed';
create index bookings_dispute_resolved_idx on public.bookings (dispute_decided_at desc) where dispute_outcome is not null;

-- The history learns the staff steps.
alter table public.booking_events drop constraint booking_events_event_check;
alter table public.booking_events add constraint booking_events_event_check
  check (event in ('requested', 'accepted', 'declined', 'cancelled', 'expired', 'checked_in', 'proof_submitted',
                   'confirmed', 'auto_confirmed', 'disputed', 'evidence_added', 'evidence_requested',
                   'dispute_resolved', 'dispute_reopened', 'marked_paid', 'completed', 'rated'));

------------------------------------------------------------------------------------------------
-- 2. Staff loading and checks
------------------------------------------------------------------------------------------------

-- Like private.booking_for_change(), but for staff: locks the row and checks the permission, without
-- saying whether the booking exists when it does not.
create or replace function private.booking_for_staff(p_booking uuid)
returns public.bookings
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
begin
  if not public.has_permission('disputes.decide') then
    perform private.booking_error('You do not have permission to decide disputes.', 'not_allowed', '42501');
  end if;
  if auth.uid() is null or not private.account_active(auth.uid()) then
    perform private.booking_error('Sign in first.', 'not_signed_in', '42501');
  end if;
  select * into v_booking from public.bookings where id = p_booking for update;
  if not found then
    perform private.booking_error('Booking not found.', 'not_found', 'P0002');
  end if;
  return v_booking;
end;
$$;

------------------------------------------------------------------------------------------------
-- 3. Resolve a dispute
------------------------------------------------------------------------------------------------

-- p_decision:
--   uphold_provider  the work stands: status completed, both sides can mark paid and rate
--   uphold_farmer    the farmer was right: status cancelled, closed with the decision
--   settlement       the parties agreed a partial payment: status completed, settlement_kobo is
--                    what the farmer pays the provider directly
-- p_reason is the staff reasoning for the audit log (>= 10 characters); p_decision_text is what
-- the parties read. When only one text is given it is used for both.
create or replace function public.resolve_booking_dispute(
  p_booking        uuid,
  p_decision       text,
  p_reason         text,
  p_decision_text  text default null,
  p_settlement_kobo bigint default null
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking    public.bookings := private.booking_for_staff(p_booking);
  v_reason     text;
  v_text       text;
  v_new_status public.booking_status;
  v_data       jsonb;
begin
  if p_decision not in ('uphold_provider', 'uphold_farmer', 'settlement') then
    perform private.booking_error('Choose a decision.', 'decision_needed');
  end if;
  v_reason := nullif(left(trim(coalesce(p_reason, '')), 1000), '');
  if v_reason is null or char_length(v_reason) < 10 then
    perform private.booking_error('Write down your reasoning (at least 10 characters).', 'reason_needed');
  end if;
  v_text := coalesce(nullif(left(trim(coalesce(p_decision_text, '')), 1000), ''), v_reason);

  if v_booking.status <> 'disputed' then
    perform private.booking_error('This booking is not in a dispute.', 'wrong_status');
  end if;
  if p_decision = 'settlement' then
    if p_settlement_kobo is null or p_settlement_kobo <= 0 or p_settlement_kobo > v_booking.total_kobo then
      perform private.booking_error('The settlement must be more than zero and at most the agreed price.', 'bad_amount');
    end if;
  elsif p_settlement_kobo is not null then
    perform private.booking_error('Only a settlement has an amount.', 'bad_amount');
  end if;

  v_new_status := case when p_decision = 'uphold_farmer' then 'cancelled' else 'completed' end::public.booking_status;

  update public.bookings
     set status             = v_new_status,
         dispute_outcome    = p_decision,
         dispute_decision   = v_text,
         settlement_kobo    = p_settlement_kobo,
         dispute_decided_by = auth.uid(),
         dispute_decided_at = now(),
         closed_reason      = case when p_decision = 'uphold_farmer' then 'Dispute: ' || v_text end,
         cancelled_by       = case when p_decision = 'uphold_farmer' then auth.uid() end
   where id = p_booking;

  perform private.booking_event(p_booking, 'dispute_resolved', 'disputed', v_new_status,
                                p_decision || coalesce(': ' || v_text, ''));
  v_data := private.booking_message_data(v_booking, v_booking.provider_id)
            || jsonb_build_object('outcome', p_decision, 'decision', v_text, 'settlement_kobo', p_settlement_kobo);
  perform private.notify(v_booking.farmer_id, 'dispute_resolved', p_booking, v_data, true);
  perform private.notify(v_booking.provider_id, 'dispute_resolved', p_booking,
                         v_data || jsonb_build_object('name', coalesce((select nullif(split_part(trim(p.full_name), ' ', 1), '')
                                                   from public.profiles p where p.id = v_booking.farmer_id), '')), true);

  perform public.write_audit(
    'dispute_resolved', 'booking', p_booking,
    jsonb_build_object('decision', p_decision, 'settlement_kobo', p_settlement_kobo),
    jsonb_build_object('status', 'disputed'),
    jsonb_build_object('status', v_new_status, 'dispute_outcome', p_decision));
  perform private.record_admin_action('disputes.decide', 'dispute_resolved', 'booking', p_booking, v_reason);
end;
$$;

------------------------------------------------------------------------------------------------
-- 4. Reopen a resolved dispute
------------------------------------------------------------------------------------------------

create or replace function public.reopen_booking_dispute(p_booking uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_staff(p_booking);
  v_reason  text;
begin
  v_reason := nullif(left(trim(coalesce(p_reason, '')), 1000), '');
  if v_reason is null or char_length(v_reason) < 10 then
    perform private.booking_error('Write down why the dispute is reopened (at least 10 characters).', 'reason_needed');
  end if;
  if v_booking.status not in ('completed', 'cancelled') or v_booking.dispute_outcome is null then
    perform private.booking_error('Only a resolved dispute can be reopened.', 'wrong_status');
  end if;

  update public.bookings
     set status = 'disputed', dispute_outcome = null, dispute_decision = null, settlement_kobo = null,
         dispute_decided_by = null, dispute_decided_at = null,
         closed_reason = null, cancelled_by = case when cancelled_by = auth.uid() then null else cancelled_by end
   where id = p_booking;

  perform private.booking_event(p_booking, 'dispute_reopened', v_booking.status, 'disputed', v_reason);
  perform private.notify(v_booking.farmer_id, 'dispute_reopened', p_booking,
                         private.booking_message_data(v_booking, v_booking.provider_id)
                         || jsonb_build_object('reason', v_reason), true);
  perform private.notify(v_booking.provider_id, 'dispute_reopened', p_booking,
                         private.booking_message_data(v_booking, v_booking.farmer_id)
                         || jsonb_build_object('reason', v_reason), true);

  perform public.write_audit('dispute_reopened', 'booking', p_booking,
    jsonb_build_object('reason', v_reason),
    jsonb_build_object('status', v_booking.status, 'dispute_outcome', v_booking.dispute_outcome),
    jsonb_build_object('status', 'disputed'));
  perform private.record_admin_action('disputes.decide', 'dispute_reopened', 'booking', p_booking, v_reason);
end;
$$;

------------------------------------------------------------------------------------------------
-- 5. Ask a party for specific evidence
------------------------------------------------------------------------------------------------

-- A notification only: the parties already upload through add_dispute_evidence() while the booking
-- is disputed. p_hours is the deadline staff give; it is carried in the message, not enforced -
-- the decision deadline is the staff member's judgement call.
create or replace function public.request_dispute_evidence(
  p_booking uuid,
  p_note    text,
  p_hours   integer default 24,
  p_to      text default 'both'
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_staff(p_booking);
  v_note    text;
begin
  if v_booking.status <> 'disputed' then
    perform private.booking_error('This booking is not in a dispute.', 'wrong_status');
  end if;
  if p_to not in ('farmer', 'provider', 'both') then
    perform private.booking_error('Choose who should answer.', 'bad_recipient');
  end if;
  v_note := nullif(left(trim(coalesce(p_note, '')), 500), '');
  if v_note is null or char_length(v_note) < 10 then
    perform private.booking_error('Say what evidence you need (at least 10 characters).', 'reason_needed');
  end if;
  if p_hours is null or p_hours < 1 or p_hours > 168 then
    perform private.booking_error('Give 1 to 168 hours to answer.', 'bad_deadline');
  end if;

  perform private.booking_event(p_booking, 'evidence_requested', 'disputed', 'disputed',
                                'To ' || p_to || ': ' || v_note);
  if p_to in ('farmer', 'both') then
    perform private.notify(v_booking.farmer_id, 'dispute_evidence_requested', p_booking,
                           private.booking_message_data(v_booking, v_booking.provider_id)
                           || jsonb_build_object('note', v_note, 'hours', p_hours), true);
  end if;
  if p_to in ('provider', 'both') then
    perform private.notify(v_booking.provider_id, 'dispute_evidence_requested', p_booking,
                           private.booking_message_data(v_booking, v_booking.farmer_id)
                           || jsonb_build_object('note', v_note, 'hours', p_hours), true);
  end if;

  perform public.write_audit('dispute_evidence_requested', 'booking', p_booking,
    jsonb_build_object('to', p_to, 'hours', p_hours, 'note', v_note));
  perform private.record_admin_action('disputes.decide', 'dispute_evidence_requested', 'booking', p_booking, v_note);
end;
$$;

------------------------------------------------------------------------------------------------
-- 6. Staff cancel an active booking
------------------------------------------------------------------------------------------------

create or replace function public.admin_cancel_booking(p_booking uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := private.booking_for_staff(p_booking);
  v_reason  text;
begin
  v_reason := nullif(left(trim(coalesce(p_reason, '')), 500), '');
  if v_reason is null or char_length(v_reason) < 10 then
    perform private.booking_error('Write down why staff cancelled this booking (at least 10 characters).', 'reason_needed');
  end if;
  if v_booking.status not in ('requested', 'accepted', 'in_progress', 'awaiting_confirmation') then
    perform private.booking_error('This booking is already closed.', 'wrong_status');
  end if;

  update public.bookings
     set status = 'cancelled', closed_reason = 'Staff: ' || v_reason, cancelled_by = auth.uid()
   where id = p_booking;

  perform private.booking_event(p_booking, 'cancelled', v_booking.status, 'cancelled', 'Staff: ' || v_reason);
  perform private.notify(v_booking.farmer_id, 'booking_cancelled', p_booking,
                         private.booking_message_data(v_booking, v_booking.provider_id)
                         || jsonb_build_object('by_staff', true, 'reason', v_reason), true);
  perform private.notify(v_booking.provider_id, 'booking_cancelled', p_booking,
                         private.booking_message_data(v_booking, v_booking.farmer_id)
                         || jsonb_build_object('by_staff', true, 'reason', v_reason), true);

  perform public.write_audit('booking_cancelled_by_staff', 'booking', p_booking,
    jsonb_build_object('reason', v_reason),
    jsonb_build_object('status', v_booking.status),
    jsonb_build_object('status', 'cancelled'));
  perform private.record_admin_action('disputes.decide', 'booking_cancelled_by_staff', 'booking', p_booking, v_reason);
end;
$$;

------------------------------------------------------------------------------------------------
-- 7. booking_detail(): the parties see the outcome; staff see their actions
------------------------------------------------------------------------------------------------

create or replace function public.booking_detail(p_booking uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_b       public.bookings;
  v_uid     uuid := auth.uid();
  v_staff   boolean := public.has_permission('bookings.read');
  v_side    text;
  v_status  public.booking_status;
  v_agreed  boolean;
  v_other   uuid;
  v_contact jsonb;
begin
  select * into v_b from public.bookings where id = p_booking;
  if not found or not (v_uid in (v_b.farmer_id, v_b.provider_id) or v_staff) then
    perform private.booking_error('Booking not found.', 'not_found', 'P0002');
  end if;
  v_side := case when v_uid = v_b.farmer_id then 'farmer' when v_uid = v_b.provider_id then 'provider' else 'staff' end;
  v_status := private.effective_status(v_b.status, v_b.expires_at);
  -- Once agreed, both sides keep the pin and each other's phone through the job and its records.
  v_agreed := v_status in ('accepted', 'in_progress', 'awaiting_confirmation', 'confirmed', 'disputed', 'completed');
  v_other := case when v_side = 'farmer' then v_b.provider_id else v_b.farmer_id end;

  select jsonb_build_object(
           'name', case when v_agreed or v_side = 'staff' then p.full_name
                        else coalesce(nullif(split_part(trim(p.full_name), ' ', 1), ''), '') end,
           'phone', case when v_agreed or v_side = 'staff' then p.phone end,
           'tier', p.verification_tier)
    into v_contact
    from public.profiles p where p.id = v_other;

  return jsonb_build_object(
    'id', v_b.id, 'my_side', v_side, 'status', v_status,
    'title', v_b.listing_title, 'kind', v_b.listing_kind, 'equipment_type', v_b.equipment_type,
    'provider_type', v_b.provider_type, 'listing_id', v_b.listing_id,
    'job_date', v_b.job_date, 'unit', v_b.unit, 'quantity', v_b.quantity, 'rate_kobo', v_b.rate_kobo,
    'total_kobo', v_b.total_kobo, 'distance_km', v_b.distance_km, 'farmer_note', v_b.farmer_note,
    'farm_name', v_b.farm_name, 'job_state', v_b.job_state, 'job_lga', v_b.job_lga,
    'expires_at', v_b.expires_at, 'responded_at', v_b.responded_at, 'closed_reason', v_b.closed_reason,
    'cancelled_by_me', v_b.cancelled_by = v_uid, 'created_at', v_b.created_at,
    'checked_in_at', v_b.checked_in_at, 'check_in_distance_m', v_b.check_in_distance_m,
    'work_submitted_at', v_b.work_submitted_at, 'confirm_by', v_b.confirm_by,
    'hectares_done', v_b.hectares_done,
    'disputed_at', v_b.disputed_at, 'dispute_reason', v_b.dispute_reason, 'dispute_category', v_b.dispute_category,
    'disputed_by', case when v_b.disputed_by is null then null when v_b.disputed_by = v_b.farmer_id then 'farmer'
                        when v_b.disputed_by = v_b.provider_id then 'provider' else 'staff' end,
    'dispute', case when v_b.dispute_outcome is null then null else jsonb_build_object(
                 'outcome', v_b.dispute_outcome, 'decision', v_b.dispute_decision,
                 'settlement_kobo', v_b.settlement_kobo, 'decided_at', v_b.dispute_decided_at) end,
    'payment', jsonb_build_object(
      'mine', case when v_side = 'farmer' and v_b.farmer_paid_at is not null
                   then jsonb_build_object('at', v_b.farmer_paid_at, 'kobo', v_b.farmer_paid_kobo)
                   when v_side = 'provider' and v_b.provider_paid_at is not null
                   then jsonb_build_object('at', v_b.provider_paid_at, 'kobo', v_b.provider_paid_kobo)
                   when v_side = 'staff'
                   then jsonb_build_object('farmer', v_b.farmer_paid_kobo, 'provider', v_b.provider_paid_kobo) end,
      'theirs_marked', case when v_side = 'farmer' then v_b.provider_paid_at is not null
                            when v_side = 'provider' then v_b.farmer_paid_at is not null
                            else null end,
      'disputed', v_b.payment_disputed),
    'other', v_contact,
    'location', case when v_side <> 'provider' or v_agreed then jsonb_build_object(
        'lat', extensions.st_y(v_b.job_location::extensions.geometry),
        'lng', extensions.st_x(v_b.job_location::extensions.geometry),
        'hint', (select f.address_hint from public.farms f where f.id = v_b.farm_id)) end,
    'proofs', coalesce((select jsonb_agg(jsonb_build_object(
                 'id', pr.id, 'kind', pr.kind, 'path', pr.storage_path, 'taken_at', pr.taken_at,
                 'gps_distance_m', pr.gps_distance_m, 'hectares', pr.hectares,
                 'by', case when pr.uploader_id = v_b.farmer_id then 'farmer' else 'provider' end) order by pr.created_at)
                 from public.booking_proofs pr where pr.booking_id = v_b.id), '[]'::jsonb),
    'my_rating', (select jsonb_build_object('stars', r.stars, 'tags', r.tags, 'comment', r.comment)
                    from public.ratings r where r.booking_id = v_b.id and r.rater_id = v_uid),
    'their_rating', (select jsonb_build_object('stars', r.stars, 'tags', r.tags, 'comment', r.comment)
                       from public.ratings r where r.booking_id = v_b.id and r.ratee_id = v_uid),
    'can', jsonb_build_object(
        'accept', v_side = 'provider' and v_status = 'requested',
        'decline', v_side = 'provider' and v_status = 'requested',
        'cancel', (v_side = 'farmer' and v_status = 'requested')
                  or (v_side in ('farmer', 'provider') and v_status = 'accepted' and v_b.job_date >= private.lagos_today()),
        'check_in', v_side = 'provider' and v_status = 'accepted' and v_b.job_date = private.lagos_today(),
        'submit_proof', v_side = 'provider' and v_status = 'in_progress',
        'confirm', v_side = 'farmer' and v_status = 'awaiting_confirmation',
        'dispute', (v_side in ('farmer', 'provider')
                    and (v_status = 'in_progress' or (v_status = 'awaiting_confirmation' and v_b.confirm_by > now())))
                   or (v_side = 'farmer' and v_status = 'accepted' and v_b.job_date < private.lagos_today()),
        'add_evidence', v_side in ('farmer', 'provider') and v_status = 'disputed'
                        and (select count(*) from public.booking_proofs pr
                              where pr.booking_id = v_b.id and pr.kind = 'evidence' and pr.uploader_id = v_uid) < 10,
        'mark_paid', v_side in ('farmer', 'provider') and v_status in ('confirmed', 'completed')
                     and case when v_side = 'farmer' then v_b.farmer_paid_at is null
                              else v_b.provider_paid_at is null end,
        'rate', v_side in ('farmer', 'provider') and v_status = 'completed'
                and not exists (select 1 from public.ratings r where r.booking_id = v_b.id and r.rater_id = v_uid),
        'resolve_dispute', v_side = 'staff' and v_status = 'disputed',
        'request_evidence', v_side = 'staff' and v_status = 'disputed',
        'reopen_dispute', v_side = 'staff' and v_status in ('completed', 'cancelled')
                          and v_b.dispute_outcome is not null,
        'staff_cancel', v_side = 'staff'
                        and v_status in ('requested', 'accepted', 'in_progress', 'awaiting_confirmation')),
    'events', coalesce((select jsonb_agg(jsonb_build_object(
                 'event', e.event, 'at', e.created_at, 'note', e.note,
                 'by', case when e.actor_id is null then 'system' when e.actor_id = v_b.farmer_id then 'farmer'
                            when e.actor_id = v_b.provider_id then 'provider' else 'staff' end) order by e.id)
                 from public.booking_events e where e.booking_id = v_b.id), '[]'::jsonb));
end;
$$;

-- The staff overview learns the queue age and the resolved count.
create or replace function public.admin_booking_stats()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.has_permission('bookings.read') then
    raise exception 'You do not have permission to view bookings.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'requested', (select count(*) from public.bookings where status = 'requested' and expires_at > now()),
    'accepted', (select count(*) from public.bookings where status = 'accepted'),
    'in_progress', (select count(*) from public.bookings where status = 'in_progress'),
    'awaiting_confirmation', (select count(*) from public.bookings where status = 'awaiting_confirmation'),
    'disputed', (select count(*) from public.bookings where status = 'disputed'),
    'disputed_over_48h', (select count(*) from public.bookings
                           where status = 'disputed' and disputed_at < now() - interval '48 hours'),
    'disputes_resolved_30d', (select count(*) from public.bookings
                               where dispute_outcome is not null
                                 and dispute_decided_at > now() - interval '30 days'),
    'payment_disputed', (select count(*) from public.bookings where payment_disputed),
    'last_7_days', (select count(*) from public.bookings where created_at > now() - interval '7 days'),
    'accept_rate_30d', (select round(100.0 * count(*) filter (where status in ('accepted', 'cancelled') and responded_at is not null)
                                     / nullif(count(*) filter (where status <> 'requested'), 0))
                          from public.bookings where created_at > now() - interval '30 days'),
    'sms_failed_24h', (select count(*) from public.sms_outbox where status = 'failed' and created_at > now() - interval '24 hours'),
    'sms_waiting', (select count(*) from public.sms_outbox where status in ('queued', 'sending')));
end;
$$;

------------------------------------------------------------------------------------------------
-- 8. Grants
------------------------------------------------------------------------------------------------

grant select (dispute_outcome, dispute_decision, settlement_kobo, dispute_decided_by, dispute_decided_at)
  on public.bookings to authenticated;

revoke execute on function private.booking_for_staff(uuid) from public, anon, authenticated;

revoke execute on function
  public.resolve_booking_dispute(uuid, text, text, text, bigint),
  public.reopen_booking_dispute(uuid, text),
  public.request_dispute_evidence(uuid, text, integer, text),
  public.admin_cancel_booking(uuid, text)
  from public, anon;
grant execute on function
  public.resolve_booking_dispute(uuid, text, text, text, bigint),
  public.reopen_booking_dispute(uuid, text),
  public.request_dispute_evidence(uuid, text, integer, text),
  public.admin_cancel_booking(uuid, text)
  to authenticated;
