-- Batch 02.2: Governed marketplace settlement approval RPC for Admin Finance.
-- Requires 'payouts.approve' permission, enforces valid status transitions, posts a balanced
-- 'payout' double-entry journal entry on completion, and logs to admin_actions.

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
  v_settlement record;
  v_allowed text[];
  v_entry_id uuid;
begin
  if not public.has_permission('payouts.approve') then
    raise exception 'Permission payouts.approve required.' using errcode = '42501';
  end if;

  if p_status not in ('processing', 'completed', 'failed') then
    raise exception 'Invalid settlement status: %', p_status using errcode = '22023';
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
    auth.uid(),
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
