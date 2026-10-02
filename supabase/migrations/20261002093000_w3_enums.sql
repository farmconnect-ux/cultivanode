-- CultivaNode MVP week 3, part 1: new booking states and the payment integration kind.
--
-- Kept separate from 20261002120000_mvp_week3.sql because a newly added enum value cannot be used
-- inside the transaction that added it: this file is applied (and committed) first.

alter type public.booking_status add value if not exists 'in_progress';
alter type public.booking_status add value if not exists 'awaiting_confirmation';
alter type public.booking_status add value if not exists 'confirmed';
alter type public.booking_status add value if not exists 'disputed';
alter type public.booking_status add value if not exists 'completed';

alter type public.integration_kind add value if not exists 'payment';
