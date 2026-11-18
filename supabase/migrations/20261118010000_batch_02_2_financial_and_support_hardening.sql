-- Batch 02.2 Independent Review Corrections:
-- A. Ledger concurrency serialisation (pg_advisory_xact_lock) & strict validation
-- B. Settlement mathematical/escrow reconciliation & permission boundary
-- C. Authoritative database-side Finance aggregations, filtering & pagination RPCs
-- D. Atomic Support ticket updates/messages with transactional audit logging & pagination RPCs
-- E. Storage DELETE policy for verification-documents owner cleanup

-- ------------------------------------------------------------------------------------------------
-- A. Ledger Concurrency Protection, Validation & Payout Idempotency
-- ------------------------------------------------------------------------------------------------

create unique index if not exists mkt_journal_one_payout_idx
  on public.marketplace_journal_entries (reference_id)
  where (reference_type = 'payout');

create or replace function public.record_marketplace_journal_entry(
  p_reference_id text,
  p_reference_type text,
  p_description text,
  p_postings jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_last_hash text;
  v_entry_id uuid;
  v_postings_digest text := '';
  v_current_hash text;
  v_elem jsonb;
  v_account_id text;
  v_direction text;
  v_amount_raw text;
  v_amount_kobo bigint;
  v_memo text;
  v_account_active boolean;
  v_total_debits bigint := 0;
  v_total_credits bigint := 0;
  v_line_count integer := 0;
begin
  if p_reference_id is null or char_length(trim(p_reference_id)) not between 1 and 100 then
    raise exception 'Invalid journal reference_id' using errcode = '22023';
  end if;

  if p_reference_type not in ('order_payment', 'escrow_release', 'refund', 'payout', 'adjustment') then
    raise exception 'Invalid journal reference_type: %', coalesce(p_reference_type, '<null>') using errcode = '22023';
  end if;

  if p_description is null or char_length(trim(p_description)) not between 3 and 500 then
    raise exception 'Invalid journal description' using errcode = '22023';
  end if;

  if p_postings is null or jsonb_typeof(p_postings) <> 'array' or jsonb_array_length(p_postings) < 2 then
    raise exception 'Postings must be a JSON array with at least two lines' using errcode = '22023';
  end if;

  -- Validate every posting line before acquiring the global chain lock
  for v_elem in select value from jsonb_array_elements(p_postings)
  loop
    v_line_count := v_line_count + 1;
    v_account_id := nullif(trim(coalesce(v_elem->>'account_id', '')), '');
    v_direction := trim(coalesce(v_elem->>'direction', ''));
    v_amount_raw := trim(coalesce(v_elem->>'amount_kobo', ''));
    v_memo := nullif(trim(coalesce(v_elem->>'memo', '')), '');

    if v_account_id is null then
      raise exception 'Missing account_id in posting line %', v_line_count using errcode = '22023';
    end if;

    select is_active into v_account_active
      from public.marketplace_ledger_accounts
     where id = v_account_id;

    if not found then
      raise exception 'Unknown ledger account: %', v_account_id using errcode = '23503';
    end if;

    if not v_account_active then
      raise exception 'Inactive ledger account: %', v_account_id using errcode = '22023';
    end if;

    if v_direction not in ('DEBIT', 'CREDIT') then
      raise exception 'Invalid posting direction: %', v_direction using errcode = '22023';
    end if;

    if jsonb_typeof(v_elem->'amount_kobo') <> 'number' or v_amount_raw !~ '^[0-9]+$' then
      raise exception 'Malformed posting amount_kobo: %', v_amount_raw using errcode = '22023';
    end if;

    v_amount_kobo := v_amount_raw::bigint;
    if v_amount_kobo <= 0 then
      raise exception 'Posting amount_kobo must be positive, got %', v_amount_kobo using errcode = '22023';
    end if;

    if v_memo is not null and char_length(v_memo) > 300 then
      raise exception 'Posting memo exceeds 300 characters' using errcode = '22023';
    end if;

    if v_direction = 'DEBIT' then
      v_total_debits := v_total_debits + v_amount_kobo;
    else
      v_total_credits := v_total_credits + v_amount_kobo;
    end if;

    v_postings_digest := v_postings_digest || '|' || v_account_id || ':' || v_direction || ':' || v_amount_kobo::text;
  end loop;

  if v_total_debits <= 0 or v_total_debits <> v_total_credits then
    raise exception 'UNBALANCED JOURNAL ENTRY: Sum of Debits (%) does not equal sum of Credits (%)',
      v_total_debits, v_total_credits using errcode = '22023';
  end if;

  -- Global transaction-scoped advisory lock serialises hash-chain reads & writes
  perform pg_advisory_xact_lock(hashtext('marketplace_journal_chain'));

  select current_hash into v_last_hash
    from public.marketplace_journal_entries
   order by created_at desc, id desc
   limit 1;

  if v_last_hash is null then
    v_last_hash := repeat('0', 64);
  end if;

  v_entry_id := gen_random_uuid();
  v_current_hash := encode(
    extensions.digest(
      v_last_hash || ':' || v_entry_id::text || ':' || p_reference_id || ':' || v_postings_digest || ':' || clock_timestamp()::text,
      'sha256'
    ),
    'hex'
  );

  insert into public.marketplace_journal_entries (id, reference_id, reference_type, description, previous_hash, current_hash)
  values (v_entry_id, trim(p_reference_id), p_reference_type, trim(p_description), v_last_hash, v_current_hash);

  for v_elem in select value from jsonb_array_elements(p_postings)
  loop
    insert into public.marketplace_journal_postings (entry_id, account_id, direction, amount_kobo, memo)
    values (
      v_entry_id,
      trim(v_elem->>'account_id'),
      trim(v_elem->>'direction'),
      (v_elem->>'amount_kobo')::bigint,
      nullif(trim(coalesce(v_elem->>'memo', '')), '')
    );
  end loop;

  return v_entry_id;
end;
$$;

revoke all on function public.record_marketplace_journal_entry(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_marketplace_journal_entry(text, text, text, jsonb) to service_role;

-- ------------------------------------------------------------------------------------------------
-- B. Hardened Settlement Processing RPC (Reconciliation, Locking, Audit Atomicity)
-- ------------------------------------------------------------------------------------------------

create or replace function public.admin_process_marketplace_settlement(
  p_settlement_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_settlement record;
  v_escrow record;
  v_allowed text[];
  v_entry_id uuid;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null or not public.has_permission('payouts.approve') then
    raise exception 'Permission payouts.approve required.' using errcode = '42501';
  end if;

  if p_status not in ('processing', 'completed', 'failed') then
    raise exception 'Invalid settlement status: %', coalesce(p_status, '<null>') using errcode = '22023';
  end if;

  select * into v_settlement
    from public.marketplace_settlements
   where id = p_settlement_id
     for update;

  if not found then
    raise exception 'Settlement % not found.', p_settlement_id using errcode = 'P0002';
  end if;

  v_allowed := case v_settlement.status
    when 'pending' then array['processing', 'completed', 'failed']
    when 'processing' then array['completed', 'failed']
    else array[]::text[]
  end;

  if not (p_status = any (v_allowed)) then
    raise exception 'Settlement cannot transition from % to %.', v_settlement.status, p_status using errcode = '22023';
  end if;

  if v_settlement.gross_amount_kobo <> (v_settlement.commission_kobo + v_settlement.net_payout_kobo) then
    raise exception 'Settlement % amount mismatch: gross (%) <> commission (%) + net (%).',
      p_settlement_id, v_settlement.gross_amount_kobo, v_settlement.commission_kobo, v_settlement.net_payout_kobo
      using errcode = '22023';
  end if;

  select * into v_escrow
    from public.marketplace_escrows
   where id = v_settlement.escrow_id
     for update;

  if not found then
    raise exception 'Linked escrow % not found for settlement %.', v_settlement.escrow_id, p_settlement_id using errcode = 'P0002';
  end if;

  if v_escrow.seller_id <> v_settlement.seller_id
     or v_escrow.status <> 'released'
     or v_escrow.amount_kobo <> v_settlement.gross_amount_kobo
     or v_escrow.commission_kobo <> v_settlement.commission_kobo
     or v_escrow.seller_net_kobo <> v_settlement.net_payout_kobo then
    raise exception 'Settlement % does not reconcile with escrow %.', p_settlement_id, v_escrow.id using errcode = '22023';
  end if;

  update public.marketplace_settlements
     set status = p_status,
         processed_at = case when p_status in ('completed', 'failed') then now() else processed_at end
   where id = p_settlement_id;

  if p_status = 'completed' then
    v_entry_id := public.record_marketplace_journal_entry(
      p_settlement_id::text,
      'payout',
      'Seller payout completed for settlement ' || coalesce(v_settlement.payout_reference, p_settlement_id::text),
      jsonb_build_array(
        jsonb_build_object(
          'account_id', 'LIABILITY_SELLER_PAYABLE',
          'direction', 'DEBIT',
          'amount_kobo', v_settlement.net_payout_kobo,
          'memo', 'Clear seller payable on payout ' || coalesce(v_settlement.payout_reference, p_settlement_id::text)
        ),
        jsonb_build_object(
          'account_id', 'ASSET_PAYMENT_CLEARING',
          'direction', 'CREDIT',
          'amount_kobo', v_settlement.net_payout_kobo,
          'memo', 'Disburse seller net payout'
        )
      )
    );
  end if;

  insert into public.admin_actions (actor_id, permission, action, entity, entity_id, reason)
  values (
    v_actor_id,
    'payouts.approve',
    'settlement_' || p_status,
    'marketplace_settlements',
    p_settlement_id,
    nullif(left(trim(coalesce(p_note, '')), 2000), '')
  );

  return jsonb_build_object(
    'ok', true,
    'settlement_id', p_settlement_id,
    'status', p_status,
    'journal_entry_id', v_entry_id
  );
end;
$$;

revoke all on function public.admin_process_marketplace_settlement(uuid, text, text) from public, anon;
grant execute on function public.admin_process_marketplace_settlement(uuid, text, text) to authenticated;

-- ------------------------------------------------------------------------------------------------
-- C. Authoritative Admin Finance Aggregations, Filtering & Pagination RPCs
-- ------------------------------------------------------------------------------------------------

create or replace function public.admin_finance_summary()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_can_ledger boolean;
  v_can_payments boolean;
  v_accounts jsonb := '[]'::jsonb;
  v_commission_ledger_kobo bigint := 0;
  v_payments_summary jsonb := '{}'::jsonb;
  v_escrows_summary jsonb := '{}'::jsonb;
  v_settlements_summary jsonb := '{}'::jsonb;
begin
  v_can_ledger := public.has_permission('ledger.read');
  v_can_payments := public.has_permission('payments.read');

  if not v_can_ledger and not v_can_payments then
    raise exception 'Permission ledger.read or payments.read required.' using errcode = '42501';
  end if;

  if v_can_ledger then
    select coalesce(jsonb_agg(row_data order by acct_id), '[]'::jsonb)
      into v_accounts
      from (
        select
          a.id as acct_id,
          jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'type', a.type,
            'debits_kobo', coalesce(sum(case when p.direction = 'DEBIT' then p.amount_kobo else 0 end), 0),
            'credits_kobo', coalesce(sum(case when p.direction = 'CREDIT' then p.amount_kobo else 0 end), 0),
            'balance_kobo', case
              when a.type in ('asset', 'expense') then
                coalesce(sum(case when p.direction = 'DEBIT' then p.amount_kobo else 0 end), 0)
                - coalesce(sum(case when p.direction = 'CREDIT' then p.amount_kobo else 0 end), 0)
              else
                coalesce(sum(case when p.direction = 'CREDIT' then p.amount_kobo else 0 end), 0)
                - coalesce(sum(case when p.direction = 'DEBIT' then p.amount_kobo else 0 end), 0)
            end
          ) as row_data
        from public.marketplace_ledger_accounts a
        left join public.marketplace_journal_postings p on p.account_id = a.id
        group by a.id, a.name, a.type
      ) sub;

    select coalesce(
      sum(case when p.direction = 'CREDIT' then p.amount_kobo else -p.amount_kobo end),
      0
    )
      into v_commission_ledger_kobo
      from public.marketplace_journal_postings p
     where p.account_id = 'REVENUE_MARKETPLACE_COMMISSION';
  end if;

  if v_can_payments then
    select jsonb_build_object(
      'total_count', count(*),
      'successful_kobo', coalesce(sum(amount_kobo) filter (where status = 'successful'), 0),
      'pending_kobo', coalesce(sum(amount_kobo) filter (where status = 'pending'), 0),
      'failed_kobo', coalesce(sum(amount_kobo) filter (where status = 'failed'), 0),
      'refunded_kobo', coalesce(sum(amount_kobo) filter (where status = 'refunded'), 0),
      'by_provider', coalesce((
        select jsonb_object_agg(provider, prov_stats)
          from (
            select
              provider,
              jsonb_build_object(
                'count', count(*),
                'successful_kobo', coalesce(sum(amount_kobo) filter (where status = 'successful'), 0)
              ) as prov_stats
            from public.marketplace_payments
            group by provider
          ) ps
      ), '{}'::jsonb)
    )
      into v_payments_summary
      from public.marketplace_payments;

    select jsonb_build_object(
      'held_kobo', coalesce(sum(amount_kobo) filter (where status in ('held', 'awaiting_confirmation', 'disputed')), 0),
      'released_kobo', coalesce(sum(amount_kobo) filter (where status = 'released'), 0),
      'refunded_kobo', coalesce(sum(amount_kobo) filter (where status = 'refunded'), 0),
      'disputed_kobo', coalesce(sum(amount_kobo) filter (where status = 'disputed'), 0)
    )
      into v_escrows_summary
      from public.marketplace_escrows;

    select jsonb_build_object(
      'pending_kobo', coalesce(sum(net_payout_kobo) filter (where status in ('pending', 'processing')), 0),
      'completed_kobo', coalesce(sum(net_payout_kobo) filter (where status = 'completed'), 0),
      'failed_kobo', coalesce(sum(net_payout_kobo) filter (where status = 'failed'), 0),
      'commission_kobo', coalesce(sum(commission_kobo), 0),
      'total_count', count(*)
    )
      into v_settlements_summary
      from public.marketplace_settlements;
  end if;

  return jsonb_build_object(
    'can_read_ledger', v_can_ledger,
    'can_read_payments', v_can_payments,
    'accounts', v_accounts,
    'commission_ledger_kobo', v_commission_ledger_kobo,
    'payments', v_payments_summary,
    'escrows', v_escrows_summary,
    'settlements', v_settlements_summary
  );
end;
$$;

revoke all on function public.admin_finance_summary() from public, anon;
grant execute on function public.admin_finance_summary() to authenticated;

create or replace function public.admin_finance_journal_entries(
  p_q text default null,
  p_type text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_q text := nullif(trim(coalesce(p_q, '')), '');
  v_type text := nullif(trim(coalesce(p_type, '')), '');
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_total bigint;
  v_items jsonb;
begin
  if not public.has_permission('ledger.read') then
    raise exception 'Permission ledger.read required.' using errcode = '42501';
  end if;

  select count(*)
    into v_total
    from public.marketplace_journal_entries je
   where (v_type is null or je.reference_type = v_type)
     and (p_from is null or je.created_at >= p_from)
     and (p_to is null or je.created_at <= p_to)
     and (
       v_q is null
       or je.reference_id ilike '%' || v_q || '%'
       or je.reference_type ilike '%' || v_q || '%'
       or je.description ilike '%' || v_q || '%'
       or je.current_hash ilike '%' || v_q || '%'
     );

  select coalesce(jsonb_agg(item_obj order by created_at desc, id desc), '[]'::jsonb)
    into v_items
    from (
      select
        je.created_at,
        je.id,
        jsonb_build_object(
          'id', je.id,
          'reference_id', je.reference_id,
          'reference_type', je.reference_type,
          'description', je.description,
          'previous_hash', je.previous_hash,
          'current_hash', je.current_hash,
          'created_at', je.created_at,
          'postings', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', p.id,
                'account_id', p.account_id,
                'direction', p.direction,
                'amount_kobo', p.amount_kobo,
                'memo', p.memo
              )
              order by p.direction desc, p.account_id asc
            )
              from public.marketplace_journal_postings p
             where p.entry_id = je.id
          ), '[]'::jsonb)
        ) as item_obj
      from public.marketplace_journal_entries je
      where (v_type is null or je.reference_type = v_type)
        and (p_from is null or je.created_at >= p_from)
        and (p_to is null or je.created_at <= p_to)
        and (
          v_q is null
          or je.reference_id ilike '%' || v_q || '%'
          or je.reference_type ilike '%' || v_q || '%'
          or je.description ilike '%' || v_q || '%'
          or je.current_hash ilike '%' || v_q || '%'
        )
      order by je.created_at desc, je.id desc
      limit v_limit offset v_offset
    ) sub;

  return jsonb_build_object('total_count', v_total, 'limit', v_limit, 'offset', v_offset, 'items', v_items);
end;
$$;

revoke all on function public.admin_finance_journal_entries(text, text, timestamptz, timestamptz, integer, integer) from public, anon;
grant execute on function public.admin_finance_journal_entries(text, text, timestamptz, timestamptz, integer, integer) to authenticated;

create or replace function public.admin_finance_payments(
  p_q text default null,
  p_status text default null,
  p_provider text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_q text := nullif(trim(coalesce(p_q, '')), '');
  v_status text := nullif(trim(coalesce(p_status, '')), '');
  v_provider text := nullif(trim(coalesce(p_provider, '')), '');
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_total bigint;
  v_items jsonb;
begin
  if not public.has_permission('payments.read') then
    raise exception 'Permission payments.read required.' using errcode = '42501';
  end if;

  select count(*)
    into v_total
    from public.marketplace_payments mp
    left join public.marketplace_orders mo on mo.id = mp.order_id
   where (v_status is null or mp.status = v_status)
     and (v_provider is null or mp.provider = v_provider)
     and (p_from is null or mp.created_at >= p_from)
     and (p_to is null or mp.created_at <= p_to)
     and (
       v_q is null
       or mp.payment_reference ilike '%' || v_q || '%'
       or coalesce(mo.order_number, '') ilike '%' || v_q || '%'
       or mp.order_id::text ilike '%' || v_q || '%'
     );

  select coalesce(jsonb_agg(item_obj order by created_at desc, id desc), '[]'::jsonb)
    into v_items
    from (
      select
        mp.created_at,
        mp.id,
        jsonb_build_object(
          'id', mp.id,
          'order_id', mp.order_id,
          'order_number', mo.order_number,
          'payment_reference', mp.payment_reference,
          'provider', mp.provider,
          'amount_kobo', mp.amount_kobo,
          'status', mp.status,
          'verified_at', mp.verified_at,
          'created_at', mp.created_at
        ) as item_obj
      from public.marketplace_payments mp
      left join public.marketplace_orders mo on mo.id = mp.order_id
      where (v_status is null or mp.status = v_status)
        and (v_provider is null or mp.provider = v_provider)
        and (p_from is null or mp.created_at >= p_from)
        and (p_to is null or mp.created_at <= p_to)
        and (
          v_q is null
          or mp.payment_reference ilike '%' || v_q || '%'
          or coalesce(mo.order_number, '') ilike '%' || v_q || '%'
          or mp.order_id::text ilike '%' || v_q || '%'
        )
      order by mp.created_at desc, mp.id desc
      limit v_limit offset v_offset
    ) sub;

  return jsonb_build_object('total_count', v_total, 'limit', v_limit, 'offset', v_offset, 'items', v_items);
end;
$$;

revoke all on function public.admin_finance_payments(text, text, text, timestamptz, timestamptz, integer, integer) from public, anon;
grant execute on function public.admin_finance_payments(text, text, text, timestamptz, timestamptz, integer, integer) to authenticated;

create or replace function public.admin_finance_settlements(
  p_q text default null,
  p_status text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_q text := nullif(trim(coalesce(p_q, '')), '');
  v_status text := nullif(trim(coalesce(p_status, '')), '');
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_total bigint;
  v_items jsonb;
begin
  if not public.has_permission('payments.read') then
    raise exception 'Permission payments.read required.' using errcode = '42501';
  end if;

  select count(*)
    into v_total
    from public.marketplace_settlements ms
    left join public.marketplace_sellers sel on sel.id = ms.seller_id
   where (v_status is null or ms.status = v_status)
     and (p_from is null or ms.created_at >= p_from)
     and (p_to is null or ms.created_at <= p_to)
     and (
       v_q is null
       or coalesce(ms.payout_reference, '') ilike '%' || v_q || '%'
       or coalesce(sel.business_name, '') ilike '%' || v_q || '%'
       or ms.id::text ilike '%' || v_q || '%'
     );

  select coalesce(jsonb_agg(item_obj order by created_at desc, id desc), '[]'::jsonb)
    into v_items
    from (
      select
        ms.created_at,
        ms.id,
        jsonb_build_object(
          'id', ms.id,
          'escrow_id', ms.escrow_id,
          'seller_id', ms.seller_id,
          'seller_name', sel.business_name,
          'gross_amount_kobo', ms.gross_amount_kobo,
          'commission_kobo', ms.commission_kobo,
          'net_payout_kobo', ms.net_payout_kobo,
          'payout_reference', ms.payout_reference,
          'status', ms.status,
          'processed_at', ms.processed_at,
          'created_at', ms.created_at
        ) as item_obj
      from public.marketplace_settlements ms
      left join public.marketplace_sellers sel on sel.id = ms.seller_id
      where (v_status is null or ms.status = v_status)
        and (p_from is null or ms.created_at >= p_from)
        and (p_to is null or ms.created_at <= p_to)
        and (
          v_q is null
          or coalesce(ms.payout_reference, '') ilike '%' || v_q || '%'
          or coalesce(sel.business_name, '') ilike '%' || v_q || '%'
          or ms.id::text ilike '%' || v_q || '%'
        )
      order by ms.created_at desc, ms.id desc
      limit v_limit offset v_offset
    ) sub;

  return jsonb_build_object('total_count', v_total, 'limit', v_limit, 'offset', v_offset, 'items', v_items);
end;
$$;

revoke all on function public.admin_finance_settlements(text, text, timestamptz, timestamptz, integer, integer) from public, anon;
grant execute on function public.admin_finance_settlements(text, text, timestamptz, timestamptz, integer, integer) to authenticated;

-- ------------------------------------------------------------------------------------------------
-- D. Support Ticket Atomicity, Transactional Audit & Server-Side Pagination RPCs
-- ------------------------------------------------------------------------------------------------

create or replace function public.admin_update_support_ticket(
  p_ticket_id uuid,
  p_status text,
  p_priority text,
  p_assigned_to uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_ticket record;
  v_allowed text[];
  v_resolved_at timestamptz;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null or not public.has_permission('website_inbox.manage') then
    raise exception 'Permission website_inbox.manage required.' using errcode = '42501';
  end if;

  if p_status not in ('open', 'pending', 'in_progress', 'resolved', 'closed') then
    raise exception 'Invalid ticket status: %', coalesce(p_status, '<null>') using errcode = '22023';
  end if;

  if p_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'Invalid ticket priority: %', coalesce(p_priority, '<null>') using errcode = '22023';
  end if;

  select * into v_ticket
    from public.support_tickets
   where id = p_ticket_id
     for update;

  if not found then
    raise exception 'Support ticket % not found.', p_ticket_id using errcode = 'P0002';
  end if;

  v_allowed := case v_ticket.status
    when 'open' then array['open', 'pending', 'in_progress', 'resolved', 'closed']
    when 'pending' then array['open', 'pending', 'in_progress', 'resolved', 'closed']
    when 'in_progress' then array['open', 'pending', 'in_progress', 'resolved', 'closed']
    when 'resolved' then array['open', 'in_progress', 'resolved', 'closed']
    when 'closed' then array['open', 'in_progress', 'closed']
    else array[]::text[]
  end;

  if not (p_status = any (v_allowed)) then
    raise exception 'Cannot move ticket from % to %.', v_ticket.status, p_status using errcode = '22023';
  end if;

  v_resolved_at := case when p_status in ('resolved', 'closed') then coalesce(v_ticket.resolved_at, now()) else null end;

  update public.support_tickets
     set status = p_status,
         priority = p_priority,
         assigned_to = p_assigned_to,
         resolved_at = v_resolved_at
   where id = p_ticket_id;

  insert into public.admin_actions (actor_id, permission, action, entity, entity_id, reason)
  values (
    v_actor_id,
    'website_inbox.manage',
    'support_ticket_' || p_status,
    'support_tickets',
    p_ticket_id,
    'from=' || v_ticket.status || ', status=' || p_status || ', priority=' || p_priority
  );

  return jsonb_build_object(
    'ok', true,
    'ticket_id', p_ticket_id,
    'status', p_status,
    'priority', p_priority
  );
end;
$$;

revoke all on function public.admin_update_support_ticket(uuid, text, text, uuid) from public, anon;
grant execute on function public.admin_update_support_ticket(uuid, text, text, uuid) to authenticated;

create or replace function public.admin_post_support_message(
  p_ticket_id uuid,
  p_body text,
  p_is_internal boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid;
  v_clean_body text;
  v_msg_id uuid;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null or not public.has_permission('website_inbox.manage') then
    raise exception 'Permission website_inbox.manage required.' using errcode = '42501';
  end if;

  v_clean_body := trim(coalesce(p_body, ''));
  if char_length(v_clean_body) < 1 or char_length(v_clean_body) > 4000 then
    raise exception 'Message body must be between 1 and 4000 characters.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.support_tickets where id = p_ticket_id) then
    raise exception 'Support ticket % not found.', p_ticket_id using errcode = 'P0002';
  end if;

  insert into public.support_ticket_messages (ticket_id, author_id, body, is_internal)
  values (p_ticket_id, v_actor_id, v_clean_body, coalesce(p_is_internal, false))
  returning id into v_msg_id;

  insert into public.admin_actions (actor_id, permission, action, entity, entity_id, reason)
  values (
    v_actor_id,
    'website_inbox.manage',
    case when coalesce(p_is_internal, false) then 'support_internal_note' else 'support_public_reply' end,
    'support_tickets',
    p_ticket_id,
    left(v_clean_body, 200)
  );

  return jsonb_build_object('ok', true, 'message_id', v_msg_id);
end;
$$;

revoke all on function public.admin_post_support_message(uuid, text, boolean) from public, anon;
grant execute on function public.admin_post_support_message(uuid, text, boolean) to authenticated;

create or replace function public.admin_support_summary()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_summary jsonb;
begin
  if not public.has_permission('website_inbox.manage') then
    raise exception 'Permission website_inbox.manage required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total_count', count(*),
    'active_count', count(*) filter (where status in ('open', 'pending', 'in_progress')),
    'urgent_open_count', count(*) filter (where priority in ('high', 'urgent') and status not in ('resolved', 'closed')),
    'resolved_count', count(*) filter (where status in ('resolved', 'closed')),
    'sla_overdue_count', count(*) filter (where sla_due_at is not null and sla_due_at < now() and status not in ('resolved', 'closed'))
  )
    into v_summary
    from public.support_tickets;

  return v_summary;
end;
$$;

revoke all on function public.admin_support_summary() from public, anon;
grant execute on function public.admin_support_summary() to authenticated;

create or replace function public.admin_support_tickets_page(
  p_q text default null,
  p_status text default null,
  p_priority text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_q text := nullif(trim(coalesce(p_q, '')), '');
  v_status text := nullif(trim(coalesce(p_status, '')), '');
  v_priority text := nullif(trim(coalesce(p_priority, '')), '');
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_total bigint;
  v_items jsonb;
begin
  if not public.has_permission('website_inbox.manage') then
    raise exception 'Permission website_inbox.manage required.' using errcode = '42501';
  end if;

  select count(*)
    into v_total
    from public.support_tickets st
    left join public.profiles req on req.id = st.requester_id
   where (v_status is null or st.status = v_status)
     and (v_priority is null or st.priority = v_priority)
     and (
       v_q is null
       or st.ticket_number ilike '%' || v_q || '%'
       or st.subject ilike '%' || v_q || '%'
       or st.category ilike '%' || v_q || '%'
       or coalesce(req.full_name, '') ilike '%' || v_q || '%'
     );

  select coalesce(jsonb_agg(item_obj order by created_at desc, id desc), '[]'::jsonb)
    into v_items
    from (
      select
        st.created_at,
        st.id,
        jsonb_build_object(
          'id', st.id,
          'ticket_number', st.ticket_number,
          'requester_id', st.requester_id,
          'requester_name', coalesce(req.full_name, 'CultivaNode User'),
          'requester_phone', req.phone,
          'subject', st.subject,
          'category', st.category,
          'priority', st.priority,
          'status', st.status,
          'channel', st.channel,
          'assigned_to', st.assigned_to,
          'sla_due_at', st.sla_due_at,
          'resolved_at', st.resolved_at,
          'created_at', st.created_at,
          'messages', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', m.id,
                'ticket_id', m.ticket_id,
                'author_id', m.author_id,
                'author_name', coalesce(auth_prof.full_name, 'User'),
                'body', m.body,
                'is_internal', m.is_internal,
                'created_at', m.created_at
              )
              order by m.created_at asc
            )
              from public.support_ticket_messages m
              left join public.profiles auth_prof on auth_prof.id = m.author_id
             where m.ticket_id = st.id
          ), '[]'::jsonb)
        ) as item_obj
      from public.support_tickets st
      left join public.profiles req on req.id = st.requester_id
      where (v_status is null or st.status = v_status)
        and (v_priority is null or st.priority = v_priority)
        and (
          v_q is null
          or st.ticket_number ilike '%' || v_q || '%'
          or st.subject ilike '%' || v_q || '%'
          or st.category ilike '%' || v_q || '%'
          or coalesce(req.full_name, '') ilike '%' || v_q || '%'
        )
      order by st.created_at desc, st.id desc
      limit v_limit offset v_offset
    ) sub;

  return jsonb_build_object('total_count', v_total, 'limit', v_limit, 'offset', v_offset, 'items', v_items);
end;
$$;

revoke all on function public.admin_support_tickets_page(text, text, text, integer, integer) from public, anon;
grant execute on function public.admin_support_tickets_page(text, text, text, integer, integer) to authenticated;

-- ------------------------------------------------------------------------------------------------
-- E. Storage Policy: Allow authenticated owners to delete their own verification-documents objects
--    (required for orphan storage cleanup when metadata insert fails; prevents cross-user deletion)
-- ------------------------------------------------------------------------------------------------

drop policy if exists "verification documents: owner deletes own" on storage.objects;
create policy "verification documents: owner deletes own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'verification-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
