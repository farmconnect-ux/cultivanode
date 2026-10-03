-- CultivaNode MVP week 3 fixes (review of 20261002095258_mvp_week3.sql, 2026-10-03).
--
--   1. bookings uses column-level read grants (the farm pin stays hidden). The week 3 columns were never added
--      to the grant, so the two parties could not read their own check-in time or confirm-by deadline. Grant
--      the safe ones; check_in_location and the two payment amounts stay hidden (booking_detail() shows each
--      side only its own amount, so neither can copy the other's figure).
--   2. provider_card(): rating is null until someone rates (it returned {"avg": null, "count": 0}).
--   3. (Proof upload policy left as in week 3: the hosted project does not accept storage policy changes
--      through migrations here; the app only offers uploads after check-in.)
--   4. admin_booking_stats(): the acceptance rate counted later stages (in progress, confirmed, completed) as
--      not accepted.

set local lock_timeout = '15s';

grant select (checked_in_at, check_in_distance_m, work_submitted_at, confirm_by, hectares_done,
              disputed_at, dispute_reason, farmer_paid_at, provider_paid_at, payment_disputed)
  on public.bookings to authenticated;

create or replace function private.provider_card(p_profile uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'name', coalesce(split_part(trim(p.full_name), ' ', 1), ''),
           'state', p.state,
           'tier', p.verification_tier,
           'rating', (select jsonb_build_object('avg', round(avg(r.stars)::numeric, 1), 'count', count(*))
                        from public.ratings r where r.ratee_id = p.id
                      having count(*) > 0))
    from public.profiles p
   where p.id = p_profile and p.suspended_at is null;
$$;

create or replace function public.admin_booking_stats()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform private.require_permission('bookings.read');
  return jsonb_build_object(
    'requested', (select count(*) from public.bookings where status = 'requested' and expires_at > now()),
    'accepted', (select count(*) from public.bookings where status = 'accepted'),
    'in_progress', (select count(*) from public.bookings where status = 'in_progress'),
    'awaiting_confirmation', (select count(*) from public.bookings where status = 'awaiting_confirmation'),
    'disputed', (select count(*) from public.bookings where status = 'disputed'),
    'payment_disputed', (select count(*) from public.bookings where payment_disputed),
    'last_7_days', (select count(*) from public.bookings where created_at > now() - interval '7 days'),
    'accept_rate_30d', (select round(100.0 * count(*) filter (where responded_at is not null and status <> 'declined')
                                     / nullif(count(*) filter (where status <> 'requested'), 0))
                          from public.bookings where created_at > now() - interval '30 days'),
    'sms_failed_24h', (select count(*) from public.sms_outbox where status = 'failed' and created_at > now() - interval '24 hours'),
    'sms_waiting', (select count(*) from public.sms_outbox where status in ('queued', 'sending')));
end;
$$;
