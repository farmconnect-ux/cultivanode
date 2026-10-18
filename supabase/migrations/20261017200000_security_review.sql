-- Security and performance review, 17 Oct 2026. Applied on hosted the same day; every statement is idempotent.

-- 1. CRITICAL: get_checkout_payment_credentials() returned the decrypted payment-provider secrets
--    (Flutterwave secret/encryption/webhook keys, Paystack secret key) to ANY signed-in user who called it
--    without an order id. Only server code (service role) may read secrets. Checkout already falls back to
--    the service-role path (integration_runtime). The exposed keys must be rotated at the providers.
revoke execute on function public.get_checkout_payment_credentials(uuid) from public, anon, authenticated;
grant execute on function public.get_checkout_payment_credentials(uuid) to service_role;

-- 2. Trigger functions are not API endpoints.
revoke execute on function public.freeze_escrow_on_dispute() from public, anon, authenticated;
revoke execute on function public.sync_marketplace_listing_available_qty() from public, anon, authenticated;
revoke execute on function public.update_seller_rating_aggregate() from public, anon, authenticated;

-- 3. Guests could read the exact delivery coordinates on open buy requests. They keep everything else
--    (the public RFQ page selects named columns only).
revoke select on public.buyer_requests from anon;
grant select (id, request_number, buyer_id, buyer_org_id, title, category_id, target_crop_or_commodity,
              required_quantity, unit, target_grade, target_budget_kobo, deadline_date, delivery_location,
              notes, status, created_at, updated_at)
  on public.buyer_requests to anon;

-- 4. Performance (Supabase advisor auth_rls_initplan): evaluate auth.uid() / is_admin() once per query, not
--    once per row. Same rules, rewritten with (select ...).
alter policy marketplace_sellers_read on public.marketplace_sellers using (((NOT is_suspended) OR (profile_id = (select auth.uid())) OR (select public.is_admin())));
alter policy marketplace_sellers_insert on public.marketplace_sellers with check ((profile_id = (select auth.uid())));
alter policy marketplace_sellers_update on public.marketplace_sellers using (((profile_id = (select auth.uid())) OR (select public.is_admin()))) with check (((profile_id = (select auth.uid())) OR (select public.is_admin())));
alter policy marketplace_listings_read on public.marketplace_listings using (((status = 'active'::text) OR (EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_listings.seller_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin())))))));
alter policy marketplace_listings_insert on public.marketplace_listings with check ((EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_listings.seller_id) AND (s.profile_id = (select auth.uid())) AND (NOT s.is_suspended)))));
alter policy marketplace_listings_update on public.marketplace_listings using ((EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_listings.seller_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin())))))) with check ((EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_listings.seller_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin()))))));
alter policy marketplace_listings_delete on public.marketplace_listings using ((EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_listings.seller_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin()))))));
alter policy marketplace_provenance_owner_all on public.marketplace_produce_provenance using ((EXISTS ( SELECT 1
   FROM (marketplace_listings l
     JOIN marketplace_sellers s ON ((s.id = l.seller_id)))
  WHERE ((l.id = marketplace_produce_provenance.listing_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin())))))) with check ((EXISTS ( SELECT 1
   FROM (marketplace_listings l
     JOIN marketplace_sellers s ON ((s.id = l.seller_id)))
  WHERE ((l.id = marketplace_produce_provenance.listing_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin()))))));
alter policy marketplace_inv_lots_owner_all on public.marketplace_inventory_lots using ((EXISTS ( SELECT 1
   FROM (marketplace_listings l
     JOIN marketplace_sellers s ON ((s.id = l.seller_id)))
  WHERE ((l.id = marketplace_inventory_lots.listing_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin())))))) with check ((EXISTS ( SELECT 1
   FROM (marketplace_listings l
     JOIN marketplace_sellers s ON ((s.id = l.seller_id)))
  WHERE ((l.id = marketplace_inventory_lots.listing_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin()))))));
alter policy marketplace_orders_buyer_insert on public.marketplace_orders with check ((buyer_id = (select auth.uid())));
alter policy marketplace_orders_update_admin_or_buyer on public.marketplace_orders using (((buyer_id = (select auth.uid())) OR (select public.is_admin()))) with check (((buyer_id = (select auth.uid())) OR (select public.is_admin())));
alter policy marketplace_fulfilments_seller_update on public.marketplace_fulfilments using ((EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_fulfilments.seller_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin())))))) with check ((EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_fulfilments.seller_id) AND ((s.profile_id = (select auth.uid())) OR (select public.is_admin()))))));
alter policy marketplace_escrows_select on public.marketplace_escrows using (((buyer_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_escrows.seller_id) AND (s.profile_id = (select auth.uid()))))) OR (select public.is_admin())));
alter policy marketplace_settlements_select on public.marketplace_settlements using (((EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_settlements.seller_id) AND (s.profile_id = (select auth.uid()))))) OR (select public.is_admin())));
alter policy marketplace_proofs_select on public.marketplace_delivery_proofs using ((EXISTS ( SELECT 1
   FROM marketplace_shipments s
  WHERE ((s.id = marketplace_delivery_proofs.shipment_id) AND (EXISTS ( SELECT 1
           FROM ((marketplace_fulfilments f
             JOIN marketplace_orders o ON ((o.id = f.order_id)))
             JOIN marketplace_sellers sel ON ((sel.id = f.seller_id)))
          WHERE ((f.id = s.fulfilment_id) AND ((o.buyer_id = (select auth.uid())) OR (sel.profile_id = (select auth.uid())) OR (s.carrier_profile_id = (select auth.uid())) OR (select public.is_admin())))))))));
alter policy marketplace_proofs_insert on public.marketplace_delivery_proofs with check ((EXISTS ( SELECT 1
   FROM marketplace_shipments s
  WHERE ((s.id = marketplace_delivery_proofs.shipment_id) AND ((s.carrier_profile_id = (select auth.uid())) OR (select public.is_admin()))))));
alter policy buyer_requests_select on public.buyer_requests using (((status = 'open'::text) OR (buyer_id = (select auth.uid())) OR (select public.is_admin())));
alter policy buyer_requests_insert on public.buyer_requests with check ((buyer_id = (select auth.uid())));
alter policy buyer_requests_update on public.buyer_requests using (((buyer_id = (select auth.uid())) OR (select public.is_admin()))) with check (((buyer_id = (select auth.uid())) OR (select public.is_admin())));
alter policy buyer_responses_select on public.buyer_request_responses using (((EXISTS ( SELECT 1
   FROM buyer_requests r
  WHERE ((r.id = buyer_request_responses.request_id) AND (r.buyer_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = buyer_request_responses.seller_id) AND (s.profile_id = (select auth.uid()))))) OR (select public.is_admin())));
alter policy buyer_responses_insert on public.buyer_request_responses with check ((EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = buyer_request_responses.seller_id) AND (s.profile_id = (select auth.uid())) AND (NOT s.is_suspended)))));
alter policy marketplace_reviews_insert on public.marketplace_reviews with check (((reviewer_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM marketplace_orders o
  WHERE ((o.id = marketplace_reviews.order_id) AND (o.buyer_id = (select auth.uid())) AND (o.status = 'completed'::text))))));
alter policy marketplace_disputes_select on public.marketplace_disputes using (((initiator_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM marketplace_sellers s
  WHERE ((s.id = marketplace_disputes.seller_id) AND (s.profile_id = (select auth.uid()))))) OR (select public.is_admin())));
alter policy marketplace_disputes_insert on public.marketplace_disputes with check (((initiator_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM marketplace_orders o
  WHERE ((o.id = marketplace_disputes.order_id) AND (o.buyer_id = (select auth.uid())))))));
alter policy "devices: installers register or update assigned" on public.devices using (((select public.is_admin()) OR (has_role('field_agent'::app_role) AND ((assigned_owner_id = (select auth.uid())) OR (assigned_owner_id IS NULL))))) with check (((select public.is_admin()) OR (has_role('field_agent'::app_role) AND ((assigned_owner_id = (select auth.uid())) OR (assigned_owner_id IS NULL)))));

-- 5. "Add a plot" failed with 42501 for every farmer: the form writes plot_code, soil_texture, irrigation_type,
--    current_crop and created_by, but authenticated could insert only name/area/boundary/notes. Owners (the
--    plots RLS still requires can_edit_farm) may now set the site-profile fields; created_by is pinned to the
--    signed-in user. Checked against every insert/update in actions/farm-ops.ts and actions/ecosystem.ts: plots
--    was the only table with missing column grants.
grant insert (plot_code, soil_texture, drainage, slope_pct, irrigation_type, water_source, soil_ph, organic_matter_pct,
              accessibility, current_crop, previous_crop, created_by) on public.plots to authenticated;
grant update (plot_code, soil_texture, drainage, slope_pct, irrigation_type, water_source, soil_ph, organic_matter_pct,
              accessibility, current_crop, previous_crop) on public.plots to authenticated;
create or replace function private.stamp_plot_creator()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null then new.created_by := auth.uid(); end if;  -- server code (no user) may set it
  return new;
end $$;
revoke execute on function private.stamp_plot_creator() from public, anon, authenticated;
drop trigger if exists plots_stamp_creator on public.plots;
create trigger plots_stamp_creator before insert on public.plots for each row execute function private.stamp_plot_creator();
