-- Performance: cover every foreign key with an index (Supabase advisor 0001), so joins and
-- ON DELETE checks don't scan whole tables. Also evaluate auth.uid() once per query, not per row (0003).

create index if not exists buyer_requests_buyer_org_id_fk_idx on public.buyer_requests (buyer_org_id);
create index if not exists buyer_requests_category_id_fk_idx on public.buyer_requests (category_id);
create index if not exists crop_alerts_crop_cycle_id_fk_idx on public.crop_alerts (crop_cycle_id);
create index if not exists crop_cycle_operations_assigned_worker_id_fk_idx on public.crop_cycle_operations (assigned_worker_id);
create index if not exists crop_cycle_operations_booking_id_fk_idx on public.crop_cycle_operations (booking_id);
create index if not exists crop_cycle_operations_legacy_booking_id_fk_idx on public.crop_cycle_operations_legacy (booking_id);
create index if not exists crop_cycle_operations_legacy_completed_by_fk_idx on public.crop_cycle_operations_legacy (completed_by);
create index if not exists crop_cycles_created_by_fk_idx on public.crop_cycles (created_by);
create index if not exists crop_cycles_standard_id_fk_idx on public.crop_cycles (standard_id);
create index if not exists crop_cycles_legacy_created_by_fk_idx on public.crop_cycles_legacy (created_by);
create index if not exists crop_harvests_recorded_by_fk_idx on public.crop_harvests (recorded_by);
create index if not exists crop_harvests_legacy_recorded_by_fk_idx on public.crop_harvests_legacy (recorded_by);
create index if not exists crop_input_applications_legacy_applied_by_fk_idx on public.crop_input_applications_legacy (applied_by);
create index if not exists crop_input_applications_legacy_operation_id_fk_idx on public.crop_input_applications_legacy (operation_id);
create index if not exists crop_measurements_legacy_recorded_by_fk_idx on public.crop_measurements_legacy (recorded_by);
create index if not exists crop_observations_created_by_fk_idx on public.crop_observations (created_by);
create index if not exists crop_observations_legacy_observer_id_fk_idx on public.crop_observations_legacy (observer_id);
create index if not exists device_alerts_acknowledged_by_fk_idx on public.device_alerts (acknowledged_by);
create index if not exists device_alerts_device_id_fk_idx on public.device_alerts (device_id);
create index if not exists device_alerts_rule_id_fk_idx on public.device_alerts (rule_id);
create index if not exists device_commands_created_by_fk_idx on public.device_commands (created_by);
create index if not exists device_commands_device_id_fk_idx on public.device_commands (device_id);
create index if not exists device_events_installation_id_fk_idx on public.device_events (installation_id);
create index if not exists device_installations_installed_by_fk_idx on public.device_installations (installed_by);
create index if not exists devices_assigned_owner_id_fk_idx on public.devices (assigned_owner_id);
create index if not exists devices_model_id_fk_idx on public.devices (model_id);
create index if not exists farm_attendance_records_worker_id_fk_idx on public.farm_attendance_records (worker_id);
create index if not exists farm_budgets_crop_cycle_id_fk_idx on public.farm_budgets (crop_cycle_id);
create index if not exists farm_equipment_assets_assigned_worker_id_fk_idx on public.farm_equipment_assets (assigned_worker_id);
create index if not exists farm_financial_transactions_budget_id_fk_idx on public.farm_financial_transactions (budget_id);
create index if not exists farm_financial_transactions_crop_cycle_id_fk_idx on public.farm_financial_transactions (crop_cycle_id);
create index if not exists farm_financial_transactions_recorded_by_fk_idx on public.farm_financial_transactions (recorded_by);
create index if not exists farm_inventory_location_id_fk_idx on public.farm_inventory (location_id);
create index if not exists farm_inventory_transactions_crop_cycle_id_fk_idx on public.farm_inventory_transactions (crop_cycle_id);
create index if not exists farm_inventory_transactions_dest_location_id_fk_idx on public.farm_inventory_transactions (dest_location_id);
create index if not exists farm_inventory_transactions_group_id_fk_idx on public.farm_inventory_transactions (group_id);
create index if not exists farm_inventory_transactions_inventory_id_fk_idx on public.farm_inventory_transactions (inventory_id);
create index if not exists farm_inventory_transactions_recorded_by_fk_idx on public.farm_inventory_transactions (recorded_by);
create index if not exists farm_inventory_transactions_source_location_id_fk_idx on public.farm_inventory_transactions (source_location_id);
create index if not exists farm_livestock_animals_group_id_fk_idx on public.farm_livestock_animals (group_id);
create index if not exists farm_livestock_feedings_group_id_fk_idx on public.farm_livestock_feedings (group_id);
create index if not exists farm_livestock_health_events_animal_id_fk_idx on public.farm_livestock_health_events (animal_id);
create index if not exists farm_livestock_health_events_group_id_fk_idx on public.farm_livestock_health_events (group_id);
create index if not exists farm_livestock_production_logs_group_id_fk_idx on public.farm_livestock_production_logs (group_id);
create index if not exists farm_machinery_assets_listing_id_fk_idx on public.farm_machinery_assets (listing_id);
create index if not exists farm_machinery_maintenance_machinery_id_fk_idx on public.farm_machinery_maintenance (machinery_id);
create index if not exists farm_machinery_usage_logs_crop_cycle_id_fk_idx on public.farm_machinery_usage_logs (crop_cycle_id);
create index if not exists farm_machinery_usage_logs_machinery_id_fk_idx on public.farm_machinery_usage_logs (machinery_id);
create index if not exists farm_machinery_usage_logs_operator_id_fk_idx on public.farm_machinery_usage_logs (operator_id);
create index if not exists farm_machinery_usage_logs_plot_id_fk_idx on public.farm_machinery_usage_logs (plot_id);
create index if not exists farm_operational_tasks_assigned_worker_id_fk_idx on public.farm_operational_tasks (assigned_worker_id);
create index if not exists farm_operational_tasks_crop_cycle_id_fk_idx on public.farm_operational_tasks (crop_cycle_id);
create index if not exists farm_operational_tasks_plot_id_fk_idx on public.farm_operational_tasks (plot_id);
create index if not exists farm_operations_created_by_fk_idx on public.farm_operations (created_by);
create index if not exists farm_plan_actual_variances_crop_cycle_id_fk_idx on public.farm_plan_actual_variances (crop_cycle_id);
create index if not exists farm_plan_actual_variances_group_id_fk_idx on public.farm_plan_actual_variances (group_id);
create index if not exists farm_plan_actual_variances_standard_id_fk_idx on public.farm_plan_actual_variances (standard_id);
create index if not exists grant_applications_farm_id_fk_idx on public.grant_applications (farm_id);
create index if not exists grant_programmes_owner_id_fk_idx on public.grant_programmes (owner_id);
create index if not exists hero_slides_created_by_fk_idx on public.hero_slides (created_by);
create index if not exists hero_slides_updated_by_fk_idx on public.hero_slides (updated_by);
create index if not exists impact_programmes_owner_id_fk_idx on public.impact_programmes (owner_id);
create index if not exists insurance_claims_policy_id_fk_idx on public.insurance_claims (policy_id);
create index if not exists insurance_policies_farm_id_fk_idx on public.insurance_policies (farm_id);
create index if not exists investment_commitments_offering_id_fk_idx on public.investment_commitments (offering_id);
create index if not exists investment_offerings_sponsor_id_fk_idx on public.investment_offerings (sponsor_id);
create index if not exists irrigation_events_zone_id_fk_idx on public.irrigation_events (zone_id);
create index if not exists irrigation_zones_plot_id_fk_idx on public.irrigation_zones (plot_id);
create index if not exists loan_applications_farm_id_fk_idx on public.loan_applications (farm_id);
create index if not exists marketplace_delivery_proofs_recorded_by_fk_idx on public.marketplace_delivery_proofs (recorded_by);
create index if not exists marketplace_disputes_fulfilment_id_fk_idx on public.marketplace_disputes (fulfilment_id);
create index if not exists marketplace_disputes_initiator_id_fk_idx on public.marketplace_disputes (initiator_id);
create index if not exists marketplace_disputes_resolved_by_fk_idx on public.marketplace_disputes (resolved_by);
create index if not exists marketplace_disputes_seller_id_fk_idx on public.marketplace_disputes (seller_id);
create index if not exists marketplace_escrows_buyer_id_fk_idx on public.marketplace_escrows (buyer_id);
create index if not exists marketplace_escrows_seller_id_fk_idx on public.marketplace_escrows (seller_id);
create index if not exists marketplace_fee_rules_category_id_fk_idx on public.marketplace_fee_rules (category_id);
create index if not exists marketplace_listings_product_id_fk_idx on public.marketplace_listings (product_id);
create index if not exists marketplace_listings_variant_id_fk_idx on public.marketplace_listings (variant_id);
create index if not exists marketplace_orders_buyer_org_id_fk_idx on public.marketplace_orders (buyer_org_id);
create index if not exists marketplace_produce_provenance_crop_cycle_id_fk_idx on public.marketplace_produce_provenance (crop_cycle_id);
create index if not exists marketplace_produce_provenance_plot_id_fk_idx on public.marketplace_produce_provenance (plot_id);
create index if not exists marketplace_reviews_order_item_id_fk_idx on public.marketplace_reviews (order_item_id);
create index if not exists marketplace_reviews_reviewer_id_fk_idx on public.marketplace_reviews (reviewer_id);
create index if not exists marketplace_sellers_organization_id_fk_idx on public.marketplace_sellers (organization_id);
create index if not exists marketplace_sellers_payout_bank_account_id_fk_idx on public.marketplace_sellers (payout_bank_account_id);
create index if not exists marketplace_settlements_bank_account_id_fk_idx on public.marketplace_settlements (bank_account_id);
create index if not exists marketplace_settlements_escrow_id_fk_idx on public.marketplace_settlements (escrow_id);
create index if not exists message_threads_created_by_fk_idx on public.message_threads (created_by);
create index if not exists messages_sender_id_fk_idx on public.messages (sender_id);
create index if not exists offtake_contracts_crop_cycle_id_fk_idx on public.offtake_contracts (crop_cycle_id);
create index if not exists offtake_contracts_farm_id_fk_idx on public.offtake_contracts (farm_id);
create index if not exists processing_batches_source_farm_id_fk_idx on public.processing_batches (source_farm_id);
create index if not exists programme_beneficiaries_profile_id_fk_idx on public.programme_beneficiaries (profile_id);
create index if not exists ratings_rater_id_fk_idx on public.ratings (rater_id);
create index if not exists research_trials_farm_id_fk_idx on public.research_trials (farm_id);
create index if not exists research_trials_owner_id_fk_idx on public.research_trials (owner_id);
create index if not exists research_trials_plot_id_fk_idx on public.research_trials (plot_id);
create index if not exists support_ticket_messages_author_id_fk_idx on public.support_ticket_messages (author_id);
create index if not exists support_tickets_assigned_to_fk_idx on public.support_tickets (assigned_to);
create index if not exists telemetry_readings_installation_id_fk_idx on public.telemetry_readings (installation_id);

alter policy "payout_accounts: seller manages own" on public.marketplace_seller_payout_accounts
  using (exists (select 1 from public.marketplace_sellers s where s.id = seller_id and s.profile_id = (select auth.uid())))
  with check (exists (select 1 from public.marketplace_sellers s where s.id = seller_id and s.profile_id = (select auth.uid())));

alter policy "payout_accounts: buyers of direct orders read" on public.marketplace_seller_payout_accounts
  using (exists (
    select 1
    from public.marketplace_fulfilments f
    join public.marketplace_orders o on o.id = f.order_id
    where f.seller_id = marketplace_seller_payout_accounts.seller_id
      and o.buyer_id = (select auth.uid())
      and o.payment_mode = 'direct'
  ) or public.is_admin());
