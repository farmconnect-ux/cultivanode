-- Secure RPC function enabling authenticated buyers to retrieve the active payment gateway
-- configuration and Vault secret for their order checkout, without requiring a service-role key.

create or replace function public.get_checkout_payment_credentials(p_order_id uuid default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_order   public.marketplace_orders;
  v_active  text;
  v_mode    public.integration_mode;
  v_config  jsonb;
  v_secrets jsonb;
begin
  if auth.uid() is null then
    raise exception 'must be signed in' using errcode = '42501';
  end if;

  if p_order_id is not null then
    select * into v_order from public.marketplace_orders where id = p_order_id;
    if not found then
      raise exception 'order not found' using errcode = 'P0002';
    end if;
    if v_order.buyer_id <> auth.uid() and not exists (
      select 1 from public.profile_roles pr where pr.profile_id = auth.uid() and pr.role in ('super_admin', 'admin')
    ) then
      raise exception 'permission denied' using errcode = '42501';
    end if;
  end if;

  select active_provider into v_active from public.integration_settings where kind = 'payment';
  v_active := coalesce(v_active, 'flutterwave');
  select coalesce((select mode from public.integration_configs where provider = v_active), 'live') into v_mode;

  select coalesce(jsonb_object_agg(s.field, d.decrypted_secret), '{}'::jsonb)
    into v_secrets
    from public.integration_secrets s
    join vault.decrypted_secrets d on d.id = s.vault_secret_id
   where s.provider = v_active and s.mode = v_mode;

  select coalesce(jsonb_object_agg(f ->> 'key', coalesce(
           nullif(btrim((select c.config -> v_mode::text ->> (f ->> 'key')
                           from public.integration_configs c where c.provider = v_active)), ''),
           f ->> 'default')), '{}'::jsonb)
    into v_config
    from public.integration_providers p, jsonb_array_elements(p.config_fields) f
   where p.code = v_active;

  return jsonb_build_object(
    'provider', v_active,
    'mode', v_mode,
    'config', v_config,
    'secrets', v_secrets
  );
end;
$$;

grant execute on function public.get_checkout_payment_credentials(uuid) to authenticated;
