-- Migration: Marketplace Disputes W4 Architecture & Direct Payment Handling
-- 1. Feature Switch registration: marketplace_disputes
-- 2. Schema extensions on marketplace_disputes (decision, instructions, evidence loops)
-- 3. Fix RLS: allow BOTH Buyer and Seller to open disputes
-- 4. Direct-payment safe escrow freeze trigger
-- 5. Atomic SECURITY DEFINER RPCs:
--    - open_marketplace_dispute
--    - resolve_marketplace_dispute
--    - reopen_marketplace_dispute
--    - request_marketplace_dispute_evidence
--    - marketplace_dispute_detail

------------------------------------------------------------------------------------------------
-- 1. Feature Switch
------------------------------------------------------------------------------------------------
insert into public.feature_flags (key, description, enabled)
values (
  'marketplace_disputes',
  'Marketplace order dispute workflow and arbitration workstation. Off: disputes are routed to customer support.',
  false
)
on conflict (key) do nothing;

------------------------------------------------------------------------------------------------
-- 2. Schema Extensions on marketplace_disputes
------------------------------------------------------------------------------------------------
alter table public.marketplace_disputes
  add column if not exists decision text check (decision is null or decision in ('uphold_buyer', 'uphold_seller', 'settlement')),
  add column if not exists decision_text text,
  add column if not exists settlement_instructions text,
  add column if not exists evidence_requested_from text check (evidence_requested_from is null or evidence_requested_from in ('buyer', 'seller', 'both')),
  add column if not exists evidence_deadline timestamptz,
  add column if not exists evidence_request_note text,
  add column if not exists reopened_at timestamptz,
  add column if not exists reopened_by uuid references public.profiles(id) on delete set null,
  add column if not exists reopened_reason text;

------------------------------------------------------------------------------------------------
-- 3. RLS Policy Updates
------------------------------------------------------------------------------------------------
drop policy if exists "marketplace_disputes_select" on public.marketplace_disputes;
drop policy if exists "marketplace_disputes_insert" on public.marketplace_disputes;
drop policy if exists "marketplace_disputes_update_admin" on public.marketplace_disputes;

-- Buyer, Seller, or Staff with disputes.decide / admin can select
create policy marketplace_disputes_select on public.marketplace_disputes
  for select to authenticated
  using (
    initiator_id = auth.uid()
    or exists (
      select 1 from public.marketplace_orders o
      where o.id = marketplace_disputes.order_id and o.buyer_id = auth.uid()
    )
    or exists (
      select 1 from public.marketplace_sellers s
      where s.id = marketplace_disputes.seller_id and s.profile_id = auth.uid()
    )
    or public.has_permission('disputes.decide')
    or public.is_admin()
  );

-- Both Buyer and Seller can open a dispute
create policy marketplace_disputes_insert on public.marketplace_disputes
  for insert to authenticated
  with check (
    initiator_id = auth.uid()
    and (
      exists (
        select 1 from public.marketplace_orders o
        where o.id = marketplace_disputes.order_id and o.buyer_id = auth.uid()
      )
      or exists (
        select 1 from public.marketplace_sellers s
        where s.id = marketplace_disputes.seller_id and s.profile_id = auth.uid()
      )
    )
  );

-- Staff with disputes.decide can update
create policy marketplace_disputes_update_admin on public.marketplace_disputes
  for update to authenticated
  using (public.has_permission('disputes.decide'))
  with check (public.has_permission('disputes.decide'));

------------------------------------------------------------------------------------------------
-- 4. Direct-Payment Safe Trigger
------------------------------------------------------------------------------------------------
create or replace function public.freeze_escrow_on_dispute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 1. If escrow exists, freeze it
  update public.marketplace_escrows
     set status = 'disputed',
         disputed_at = now()
   where order_id = new.order_id
     and (new.fulfilment_id is null or fulfilment_id = new.fulfilment_id)
     and status in ('held', 'awaiting_confirmation');

  -- 2. Mark order as disputed
  update public.marketplace_orders
     set status = 'disputed',
         updated_at = now()
   where id = new.order_id;

  -- 3. Mark fulfilment as disputed if provided
  if new.fulfilment_id is not null then
    update public.marketplace_fulfilments
       set status = 'disputed',
           updated_at = now()
     where id = new.fulfilment_id;
  end if;

  return null;
end;
$$;

------------------------------------------------------------------------------------------------
-- 5. SECURITY DEFINER RPCs
------------------------------------------------------------------------------------------------

-- Open a marketplace dispute
create or replace function public.open_marketplace_dispute(
  p_order_id uuid,
  p_fulfilment_id uuid default null,
  p_reason text default 'other',
  p_description text default '',
  p_evidence_urls text[] default array[]::text[]
)
returns public.marketplace_disputes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.marketplace_orders;
  v_seller_id uuid;
  v_seller_profile_id uuid;
  v_is_buyer boolean;
  v_is_seller boolean;
  v_row public.marketplace_disputes;
  v_reason text;
  v_desc text;
begin
  if not public.feature_on('marketplace_disputes') then
    raise exception 'Marketplace disputes are currently handled via customer support.' using errcode = '42501';
  end if;

  select * into v_order from public.marketplace_orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P0002';
  end if;

  if v_order.status in ('cancelled', 'refunded', 'disputed') then
    raise exception 'Order cannot be disputed in current status: %.', v_order.status using errcode = '22023';
  end if;

  v_reason := lower(trim(coalesce(p_reason, 'other')));
  if v_reason not in ('damaged_goods', 'quality_not_as_described', 'quantity_shortage', 'not_delivered', 'late_delivery', 'wrong_item', 'other') then
    raise exception 'Invalid dispute reason category.' using errcode = '22023';
  end if;

  v_desc := trim(coalesce(p_description, ''));
  if char_length(v_desc) < 5 or char_length(v_desc) > 2000 then
    raise exception 'Description must be between 5 and 2000 characters.' using errcode = '22023';
  end if;

  v_is_buyer := (v_order.buyer_id = v_uid);

  -- Determine seller_id
  if p_fulfilment_id is not null then
    select seller_id into v_seller_id from public.marketplace_fulfilments where id = p_fulfilment_id and order_id = p_order_id;
  else
    select seller_id into v_seller_id from public.marketplace_fulfilments where order_id = p_order_id limit 1;
  end if;

  if v_seller_id is null then
    raise exception 'Order does not have a valid seller fulfilment.' using errcode = '22023';
  end if;

  select profile_id into v_seller_profile_id from public.marketplace_sellers where id = v_seller_id;
  v_is_seller := (v_seller_profile_id = v_uid);

  if not (v_is_buyer or v_is_seller) then
    raise exception 'Permission denied: only order parties may open a dispute.' using errcode = '42501';
  end if;

  insert into public.marketplace_disputes (
    order_id, fulfilment_id, initiator_id, seller_id,
    reason, description, evidence_urls, status
  )
  values (
    p_order_id, p_fulfilment_id, v_uid, v_seller_id,
    v_reason, v_desc, coalesce(p_evidence_urls, array[]::text[]), 'opened'
  )
  returning * into v_row;

  -- Notify counterparty
  if v_is_buyer then
    perform private.notify(
      v_seller_profile_id, 'mkt_dispute_opened', null,
      jsonb_build_object('order_number', v_order.order_number, 'reason', v_reason, 'dispute_id', v_row.id),
      true
    );
  else
    perform private.notify(
      v_order.buyer_id, 'mkt_dispute_opened', null,
      jsonb_build_object('order_number', v_order.order_number, 'reason', v_reason, 'dispute_id', v_row.id),
      true
    );
  end if;

  perform public.write_audit(
    'mkt_dispute_opened', 'marketplace_disputes', v_row.id,
    jsonb_build_object('order_id', p_order_id, 'reason', v_reason, 'by_buyer', v_is_buyer)
  );

  return v_row;
end;
$$;

-- Resolve a marketplace dispute (requires disputes.decide)
create or replace function public.resolve_marketplace_dispute(
  p_dispute_id uuid,
  p_decision text,
  p_reason text,
  p_decision_text text default null,
  p_settlement_kobo bigint default null,
  p_settlement_instructions text default null
)
returns public.marketplace_disputes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_dispute public.marketplace_disputes;
  v_order public.marketplace_orders;
  v_seller_profile_id uuid;
  v_reason text;
  v_text text;
  v_instructions text;
  v_res_type text;
begin
  if not public.has_permission('disputes.decide') then
    raise exception 'Permission denied: disputes.decide required.' using errcode = '42501';
  end if;

  select * into v_dispute from public.marketplace_disputes where id = p_dispute_id for update;
  if not found then
    raise exception 'Dispute not found.' using errcode = 'P0002';
  end if;

  if v_dispute.status = 'resolved' or v_dispute.status = 'closed' then
    raise exception 'Dispute is already resolved.' using errcode = '22023';
  end if;

  select * into v_order from public.marketplace_orders where id = v_dispute.order_id for update;

  if p_decision not in ('uphold_buyer', 'uphold_seller', 'settlement') then
    raise exception 'Choose a decision: uphold_buyer, uphold_seller, or settlement.' using errcode = '22023';
  end if;

  v_reason := nullif(left(trim(coalesce(p_reason, '')), 1000), '');
  if v_reason is null or char_length(v_reason) < 10 then
    raise exception 'Write down your reasoning (at least 10 characters).' using errcode = '22023';
  end if;

  v_text := coalesce(nullif(left(trim(coalesce(p_decision_text, '')), 1000), ''), v_reason);

  if p_decision = 'settlement' then
    if p_settlement_kobo is null or p_settlement_kobo <= 0 or p_settlement_kobo > v_order.total_amount_kobo then
      raise exception 'The settlement amount must be greater than zero and at most the total order price.' using errcode = '22023';
    end if;
    v_res_type := 'partial_refund';
    v_instructions := trim(coalesce(p_settlement_instructions, ''));
    if char_length(v_instructions) < 10 then
      raise exception 'Direct settlement requires explicit payment/restitution instructions (at least 10 characters).' using errcode = '22023';
    end if;
  elsif p_decision = 'uphold_buyer' then
    if p_settlement_kobo is not null then
      raise exception 'Only a mutual settlement has an amount.' using errcode = '22023';
    end if;
    v_res_type := 'refund_buyer';
    v_instructions := coalesce(p_settlement_instructions, 'Seller must refund direct bank transfer or order is cancelled.');
  else
    if p_settlement_kobo is not null then
      raise exception 'Only a mutual settlement has an amount.' using errcode = '22023';
    end if;
    v_res_type := 'release_seller';
    v_instructions := coalesce(p_settlement_instructions, 'Dispute dismissed in favor of seller. Order stands fulfilled.');
  end if;

  select profile_id into v_seller_profile_id from public.marketplace_sellers where id = v_dispute.seller_id;

  -- 1. Update dispute
  update public.marketplace_disputes
     set status = 'resolved',
         decision = p_decision,
         decision_text = v_text,
         resolution = v_reason,
         resolution_type = v_res_type,
         refund_amount_kobo = p_settlement_kobo,
         settlement_instructions = v_instructions,
         resolved_by = v_uid,
         resolved_at = now(),
         updated_at = now()
   where id = p_dispute_id
   returning * into v_dispute;

  -- 2. Update order status
  if p_decision = 'uphold_buyer' then
    update public.marketplace_orders set status = 'cancelled', updated_at = now() where id = v_dispute.order_id;
  else
    update public.marketplace_orders set status = 'completed', updated_at = now() where id = v_dispute.order_id;
  end if;

  -- 3. If escrow rows exist, resolve them
  if v_order.payment_mode = 'escrow' then
    if p_decision = 'uphold_seller' then
      update public.marketplace_escrows set status = 'released', released_at = now() where order_id = v_dispute.order_id and status = 'disputed';
    elsif p_decision = 'uphold_buyer' then
      update public.marketplace_escrows set status = 'refunded' where order_id = v_dispute.order_id and status = 'disputed';
    else
      update public.marketplace_escrows set status = 'settled' where order_id = v_dispute.order_id and status = 'disputed';
    end if;
  end if;

  -- 4. Notify both parties
  perform private.notify(
    v_order.buyer_id, 'mkt_dispute_resolved', null,
    jsonb_build_object(
      'order_number', v_order.order_number, 'decision', p_decision,
      'decision_text', v_text, 'instructions', v_instructions, 'settlement_kobo', p_settlement_kobo
    ),
    true
  );
  if v_seller_profile_id is not null then
    perform private.notify(
      v_seller_profile_id, 'mkt_dispute_resolved', null,
      jsonb_build_object(
        'order_number', v_order.order_number, 'decision', p_decision,
        'decision_text', v_text, 'instructions', v_instructions, 'settlement_kobo', p_settlement_kobo
      ),
      true
    );
  end if;

  -- 5. Audit & Admin Action
  perform public.write_audit(
    'mkt_dispute_resolved', 'marketplace_disputes', p_dispute_id,
    jsonb_build_object('decision', p_decision, 'settlement_kobo', p_settlement_kobo, 'reason', v_reason)
  );
  perform private.record_admin_action('disputes.decide', 'mkt_dispute_resolved', 'marketplace_disputes', p_dispute_id, v_reason);

  return v_dispute;
end;
$$;

-- Reopen a resolved dispute
create or replace function public.reopen_marketplace_dispute(
  p_dispute_id uuid,
  p_reason text
)
returns public.marketplace_disputes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_dispute public.marketplace_disputes;
  v_order public.marketplace_orders;
  v_seller_profile_id uuid;
  v_reason text;
begin
  if not public.has_permission('disputes.decide') then
    raise exception 'Permission denied: disputes.decide required.' using errcode = '42501';
  end if;

  select * into v_dispute from public.marketplace_disputes where id = p_dispute_id for update;
  if not found then
    raise exception 'Dispute not found.' using errcode = 'P0002';
  end if;

  if v_dispute.status <> 'resolved' then
    raise exception 'Only a resolved dispute can be reopened.' using errcode = '22023';
  end if;

  v_reason := nullif(left(trim(coalesce(p_reason, '')), 1000), '');
  if v_reason is null or char_length(v_reason) < 10 then
    raise exception 'Write down why the dispute is reopened (at least 10 characters).' using errcode = '22023';
  end if;

  select * into v_order from public.marketplace_orders where id = v_dispute.order_id;
  select profile_id into v_seller_profile_id from public.marketplace_sellers where id = v_dispute.seller_id;

  update public.marketplace_disputes
     set status = 'under_review',
         decision = null,
         decision_text = null,
         settlement_instructions = null,
         refund_amount_kobo = null,
         reopened_at = now(),
         reopened_by = v_uid,
         reopened_reason = v_reason,
         updated_at = now()
   where id = p_dispute_id
   returning * into v_dispute;

  update public.marketplace_orders set status = 'disputed', updated_at = now() where id = v_dispute.order_id;

  -- Notify parties
  perform private.notify(
    v_order.buyer_id, 'mkt_dispute_reopened', null,
    jsonb_build_object('order_number', v_order.order_number, 'reason', v_reason),
    true
  );
  if v_seller_profile_id is not null then
    perform private.notify(
      v_seller_profile_id, 'mkt_dispute_reopened', null,
      jsonb_build_object('order_number', v_order.order_number, 'reason', v_reason),
      true
    );
  end if;

  perform public.write_audit(
    'mkt_dispute_reopened', 'marketplace_disputes', p_dispute_id,
    jsonb_build_object('reason', v_reason)
  );
  perform private.record_admin_action('disputes.decide', 'mkt_dispute_reopened', 'marketplace_disputes', p_dispute_id, v_reason);

  return v_dispute;
end;
$$;

-- Request specific evidence from buyer or seller
create or replace function public.request_marketplace_dispute_evidence(
  p_dispute_id uuid,
  p_note text,
  p_hours int default 24,
  p_to text default 'both'
)
returns public.marketplace_disputes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dispute public.marketplace_disputes;
  v_order public.marketplace_orders;
  v_seller_profile_id uuid;
  v_note text;
begin
  if not public.has_permission('disputes.decide') then
    raise exception 'Permission denied: disputes.decide required.' using errcode = '42501';
  end if;

  select * into v_dispute from public.marketplace_disputes where id = p_dispute_id for update;
  if not found then
    raise exception 'Dispute not found.' using errcode = 'P0002';
  end if;

  if v_dispute.status in ('resolved', 'closed') then
    raise exception 'Cannot request evidence on a closed or resolved dispute.' using errcode = '22023';
  end if;

  if p_to not in ('buyer', 'seller', 'both') then
    raise exception 'Choose who should provide evidence: buyer, seller, or both.' using errcode = '22023';
  end if;

  v_note := nullif(left(trim(coalesce(p_note, '')), 500), '');
  if v_note is null or char_length(v_note) < 10 then
    raise exception 'Say what evidence you need (at least 10 characters).' using errcode = '22023';
  end if;

  if p_hours is null or p_hours < 1 or p_hours > 168 then
    raise exception 'Give 1 to 168 hours to answer.' using errcode = '22023';
  end if;

  select * into v_order from public.marketplace_orders where id = v_dispute.order_id;
  select profile_id into v_seller_profile_id from public.marketplace_sellers where id = v_dispute.seller_id;

  update public.marketplace_disputes
     set status = 'evidence_required',
         evidence_requested_from = p_to,
         evidence_deadline = now() + (p_hours || ' hours')::interval,
         evidence_request_note = v_note,
         updated_at = now()
   where id = p_dispute_id
   returning * into v_dispute;

  if p_to in ('buyer', 'both') then
    perform private.notify(
      v_order.buyer_id, 'mkt_evidence_requested', null,
      jsonb_build_object('order_number', v_order.order_number, 'note', v_note, 'hours', p_hours),
      true
    );
  end if;
  if p_to in ('seller', 'both') and v_seller_profile_id is not null then
    perform private.notify(
      v_seller_profile_id, 'mkt_evidence_requested', null,
      jsonb_build_object('order_number', v_order.order_number, 'note', v_note, 'hours', p_hours),
      true
    );
  end if;

  perform public.write_audit(
    'mkt_evidence_requested', 'marketplace_disputes', p_dispute_id,
    jsonb_build_object('to', p_to, 'hours', p_hours, 'note', v_note)
  );
  perform private.record_admin_action('disputes.decide', 'mkt_evidence_requested', 'marketplace_disputes', p_dispute_id, v_note);

  return v_dispute;
end;
$$;

-- Workstation detail RPC
create or replace function public.marketplace_dispute_detail(p_dispute uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dispute public.marketplace_disputes;
  v_order public.marketplace_orders;
  v_buyer public.profiles;
  v_seller public.marketplace_sellers;
  v_seller_profile public.profiles;
  v_fulfilment public.marketplace_fulfilments;
  v_payout public.marketplace_seller_payout_accounts;
  v_items jsonb;
  v_is_staff boolean := public.has_permission('disputes.decide') or public.is_admin();
begin
  select * into v_dispute from public.marketplace_disputes where id = p_dispute;
  if not found then return null; end if;

  select * into v_order from public.marketplace_orders where id = v_dispute.order_id;
  select * into v_buyer from public.profiles where id = v_order.buyer_id;
  select * into v_seller from public.marketplace_sellers where id = v_dispute.seller_id;
  select * into v_seller_profile from public.profiles where id = v_seller.profile_id;
  
  if v_dispute.fulfilment_id is not null then
    select * into v_fulfilment from public.marketplace_fulfilments where id = v_dispute.fulfilment_id;
  else
    select * into v_fulfilment from public.marketplace_fulfilments where order_id = v_dispute.order_id limit 1;
  end if;

  select * into v_payout from public.marketplace_seller_payout_accounts where seller_id = v_seller.id limit 1;

  -- Access control check
  if not (v_is_staff or auth.uid() in (v_order.buyer_id, v_seller.profile_id, v_dispute.initiator_id)) then
    raise exception 'Permission denied.' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'title', oi.title,
    'quantity', oi.quantity,
    'unit_price_kobo', oi.unit_price_kobo,
    'subtotal_kobo', oi.subtotal_kobo
  )), '[]'::jsonb)
  into v_items
  from public.marketplace_order_items oi
  where oi.order_id = v_order.id;

  return jsonb_build_object(
    'id', v_dispute.id,
    'reason', v_dispute.reason,
    'description', v_dispute.description,
    'evidence_urls', v_dispute.evidence_urls,
    'status', v_dispute.status,
    'decision', v_dispute.decision,
    'decision_text', v_dispute.decision_text,
    'settlement_instructions', v_dispute.settlement_instructions,
    'refund_amount_kobo', v_dispute.refund_amount_kobo,
    'resolution', v_dispute.resolution,
    'resolution_type', v_dispute.resolution_type,
    'evidence_requested_from', v_dispute.evidence_requested_from,
    'evidence_deadline', v_dispute.evidence_deadline,
    'evidence_request_note', v_dispute.evidence_request_note,
    'created_at', v_dispute.created_at,
    'resolved_at', v_dispute.resolved_at,
    'reopened_at', v_dispute.reopened_at,
    'reopened_reason', v_dispute.reopened_reason,
    'order', jsonb_build_object(
      'id', v_order.id,
      'order_number', v_order.order_number,
      'total_amount_kobo', v_order.total_amount_kobo,
      'payment_mode', v_order.payment_mode,
      'payment_status', v_order.payment_status,
      'status', v_order.status,
      'created_at', v_order.created_at
    ),
    'buyer', jsonb_build_object(
      'id', v_buyer.id,
      'full_name', v_buyer.full_name,
      'phone', v_buyer.phone
    ),
    'seller', jsonb_build_object(
      'id', v_seller.id,
      'business_name', v_seller.business_name,
      'seller_type', v_seller.seller_type,
      'profile_name', v_seller_profile.full_name,
      'phone', v_seller_profile.phone,
      'payout_bank', v_payout.bank_name,
      'payout_account_number', v_payout.account_number,
      'payout_account_name', v_payout.account_name
    ),
    'fulfilment', case when v_fulfilment.id is not null then jsonb_build_object(
      'id', v_fulfilment.id,
      'fulfilment_number', v_fulfilment.fulfilment_number,
      'status', v_fulfilment.status,
      'subtotal_kobo', v_fulfilment.subtotal_kobo,
      'delivery_method', v_fulfilment.delivery_method,
      'tracking_number', v_fulfilment.tracking_number
    ) else null end,
    'items', v_items,
    'is_staff', v_is_staff
  );
end;
$$;

------------------------------------------------------------------------------------------------
-- 6. Function Grants
------------------------------------------------------------------------------------------------
revoke execute on function
  public.open_marketplace_dispute(uuid, uuid, text, text, text[]),
  public.resolve_marketplace_dispute(uuid, text, text, text, bigint, text),
  public.reopen_marketplace_dispute(uuid, text),
  public.request_marketplace_dispute_evidence(uuid, text, int, text),
  public.marketplace_dispute_detail(uuid)
  from public, anon;

grant execute on function
  public.open_marketplace_dispute(uuid, uuid, text, text, text[]),
  public.resolve_marketplace_dispute(uuid, text, text, text, bigint, text),
  public.reopen_marketplace_dispute(uuid, text),
  public.request_marketplace_dispute_evidence(uuid, text, int, text),
  public.marketplace_dispute_detail(uuid)
  to authenticated;
