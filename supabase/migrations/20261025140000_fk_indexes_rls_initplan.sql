-- Performance: cover every foreign key with an index (Supabase advisor 0001), so joins and
-- ON DELETE checks don't scan whole tables. Also evaluate auth.uid() once per query, not per row (0003).

do $$
declare
  x text[];
begin
  foreach x slice 1 in array array[
    array['buyer_requests', 'buyer_org_id', 'buyer_requests_buyer_org_id_fk_idx'],
    array['buyer_requests', 'category_id', 'buyer_requests_category_id_fk_idx'],
    array['crop_alerts', 'crop_cycle_id', 'crop_alerts_crop_cycle_id_fk_idx'],
    array['crop_cycle_operations', 'assigned_worker_id', 'crop_cycle_operations_assigned_worker_id_fk_idx'],
    array['crop_cycle_operations', 'booking_id', 'crop_cycle_operations_booking_id_fk_idx'],
    array['crop_cycle_operations_legacy', 'booking_id', 'crop_cycle_operations_legacy_booking_id_fk_idx'],
    array['crop_cycle_operations_legacy', 'completed_by', 'crop_cycle_operations_legacy_completed_by_fk_idx'],
    array['crop_cycles', 'created_by', 'crop_cycles_created_by_fk_idx'],
    array['crop_cycles', 'standard_id', 'crop_cycles_standard_id_fk_idx'],
    array['crop_cycles_legacy', 'created_by', 'crop_cycles_legacy_created_by_fk_idx'],
    array['crop_harvests', 'recorded_by', 'crop_harvests_recorded_by_fk_idx'],
    array['crop_harvests_legacy', 'recorded_by', 'crop_harvests_legacy_recorded_by_fk_idx'],
    array['crop_input_applications_legacy', 'applied_by', 'crop_input_applications_legacy_applied_by_fk_idx'],
    array['crop_input_applications_legacy', 'operation_id', 'crop_input_applications_legacy_operation_id_fk_idx'],
    array['crop_measurements_legacy', 'recorded_by', 'crop_measurements_legacy_recorded_by_fk_idx'],
    array['crop_observations', 'created_by', 'crop_observations_created_by_fk_idx'],
    array['crop_observations_legacy', 'observer_id', 'crop_observations_legacy_observer_id_fk_idx'],
    array['device_alerts', 'acknowledged_by', 'device_alerts_acknowledged_by_fk_idx'],
    array['device_alerts', 'device_id', 'device_alerts_device_id_fk_idx'],
    array['device_alerts', 'rule_id', 'device_alerts_rule_id_fk_idx'],
    array['device_commands', 'created_by', 'device_commands_created_by_fk_idx'],
    array['device_commands', 'device_id', 'device_commands_device_id_fk_idx'],
    array['device_events', 'installation_id', 'device_events_installation_id_fk_idx'],
    array['device_installations', 'installed_by', 'device_installations_installed_by_fk_idx'],
    array['devices', 'assigned_owner_id', 'devices_assigned_owner_id_fk_idx'],
    array['devices', 'model_id', 'devices_model_id_fk_idx'],
    array['farm_attendance_records', 'worker_id', 'farm_attendance_records_worker_id_fk_idx'],
    array['farm_budgets', 'crop_cycle_id', 'farm_budgets_crop_cycle_id_fk_idx'],
    array['farm_equipment_assets', 'assigned_worker_id', 'farm_equipment_assets_assigned_worker_id_fk_idx'],
    array['farm_financial_transactions', 'budget_id', 'farm_financial_transactions_budget_id_fk_idx'],
    array['farm_financial_transactions', 'crop_cycle_id', 'farm_financial_transactions_crop_cycle_id_fk_idx'],
    array['farm_financial_transactions', 'recorded_by', 'farm_financial_transactions_recorded_by_fk_idx'],
    array['farm_inventory', 'location_id', 'farm_inventory_location_id_fk_idx'],
    array['farm_inventory_transactions', 'crop_cycle_id', 'farm_inventory_transactions_crop_cycle_id_fk_idx'],
    array['farm_inventory_transactions', 'dest_location_id', 'farm_inventory_transactions_dest_location_id_fk_idx'],
    array['farm_inventory_transactions', 'group_id', 'farm_inventory_transactions_group_id_fk_idx'],
    array['farm_inventory_transactions', 'inventory_id', 'farm_inventory_transactions_inventory_id_fk_idx'],
    array['farm_inventory_transactions', 'recorded_by', 'farm_inventory_transactions_recorded_by_fk_idx'],
    array['farm_inventory_transactions', 'source_location_id', 'farm_inventory_transactions_source_location_id_fk_idx'],
    array['farm_livestock_animals', 'group_id', 'farm_livestock_animals_group_id_fk_idx'],
    array['farm_livestock_feedings', 'group_id', 'farm_livestock_feedings_group_id_fk_idx'],
    array['farm_livestock_health_events', 'animal_id', 'farm_livestock_health_events_animal_id_fk_idx'],
    array['farm_livestock_health_events', 'group_id', 'farm_livestock_health_events_group_id_fk_idx'],
    array['farm_livestock_production_logs', 'group_id', 'farm_livestock_production_logs_group_id_fk_idx'],
    array['farm_machinery_assets', 'listing_id', 'farm_machinery_assets_listing_id_fk_idx'],
    array['farm_machinery_maintenance', 'machinery_id', 'farm_machinery_maintenance_machinery_id_fk_idx'],
    array['farm_machinery_usage_logs', 'crop_cycle_id', 'farm_machinery_usage_logs_crop_cycle_id_fk_idx'],
    array['farm_machinery_usage_logs', 'machinery_id', 'farm_machinery_usage_logs_machinery_id_fk_idx'],
    array['farm_machinery_usage_logs', 'operator_id', 'farm_machinery_usage_logs_operator_id_fk_idx'],
    array['farm_machinery_usage_logs', 'plot_id', 'farm_machinery_usage_logs_plot_id_fk_idx'],
    array['farm_operational_tasks', 'assigned_worker_id', 'farm_operational_tasks_assigned_worker_id_fk_idx'],
    array['farm_operational_tasks', 'crop_cycle_id', 'farm_operational_tasks_crop_cycle_id_fk_idx'],
    array['farm_operational_tasks', 'plot_id', 'farm_operational_tasks_plot_id_fk_idx'],
    array['farm_operations', 'created_by', 'farm_operations_created_by_fk_idx'],
    array['farm_plan_actual_variances', 'crop_cycle_id', 'farm_plan_actual_variances_crop_cycle_id_fk_idx'],
    array['farm_plan_actual_variances', 'group_id', 'farm_plan_actual_variances_group_id_fk_idx'],
    array['farm_plan_actual_variances', 'standard_id', 'farm_plan_actual_variances_standard_id_fk_idx'],
    array['grant_applications', 'farm_id', 'grant_applications_farm_id_fk_idx'],
    array['grant_programmes', 'owner_id', 'grant_programmes_owner_id_fk_idx'],
    array['hero_slides', 'created_by', 'hero_slides_created_by_fk_idx'],
    array['hero_slides', 'updated_by', 'hero_slides_updated_by_fk_idx'],
    array['impact_programmes', 'owner_id', 'impact_programmes_owner_id_fk_idx'],
    array['insurance_claims', 'policy_id', 'insurance_claims_policy_id_fk_idx'],
    array['insurance_policies', 'farm_id', 'insurance_policies_farm_id_fk_idx'],
    array['investment_commitments', 'offering_id', 'investment_commitments_offering_id_fk_idx'],
    array['investment_offerings', 'sponsor_id', 'investment_offerings_sponsor_id_fk_idx'],
    array['irrigation_events', 'zone_id', 'irrigation_events_zone_id_fk_idx'],
    array['irrigation_zones', 'plot_id', 'irrigation_zones_plot_id_fk_idx'],
    array['loan_applications', 'farm_id', 'loan_applications_farm_id_fk_idx'],
    array['marketplace_delivery_proofs', 'recorded_by', 'marketplace_delivery_proofs_recorded_by_fk_idx'],
    array['marketplace_disputes', 'fulfilment_id', 'marketplace_disputes_fulfilment_id_fk_idx'],
    array['marketplace_disputes', 'initiator_id', 'marketplace_disputes_initiator_id_fk_idx'],
    array['marketplace_disputes', 'resolved_by', 'marketplace_disputes_resolved_by_fk_idx'],
    array['marketplace_disputes', 'seller_id', 'marketplace_disputes_seller_id_fk_idx'],
    array['marketplace_escrows', 'buyer_id', 'marketplace_escrows_buyer_id_fk_idx'],
    array['marketplace_escrows', 'seller_id', 'marketplace_escrows_seller_id_fk_idx'],
    array['marketplace_fee_rules', 'category_id', 'marketplace_fee_rules_category_id_fk_idx'],
    array['marketplace_listings', 'product_id', 'marketplace_listings_product_id_fk_idx'],
    array['marketplace_listings', 'variant_id', 'marketplace_listings_variant_id_fk_idx'],
    array['marketplace_orders', 'buyer_org_id', 'marketplace_orders_buyer_org_id_fk_idx'],
    array['marketplace_produce_provenance', 'crop_cycle_id', 'marketplace_produce_provenance_crop_cycle_id_fk_idx'],
    array['marketplace_produce_provenance', 'plot_id', 'marketplace_produce_provenance_plot_id_fk_idx'],
    array['marketplace_reviews', 'order_item_id', 'marketplace_reviews_order_item_id_fk_idx'],
    array['marketplace_reviews', 'reviewer_id', 'marketplace_reviews_reviewer_id_fk_idx'],
    array['marketplace_sellers', 'organization_id', 'marketplace_sellers_organization_id_fk_idx'],
    array['marketplace_sellers', 'payout_bank_account_id', 'marketplace_sellers_payout_bank_account_id_fk_idx'],
    array['marketplace_settlements', 'bank_account_id', 'marketplace_settlements_bank_account_id_fk_idx'],
    array['marketplace_settlements', 'escrow_id', 'marketplace_settlements_escrow_id_fk_idx'],
    array['message_threads', 'created_by', 'message_threads_created_by_fk_idx'],
    array['messages', 'sender_id', 'messages_sender_id_fk_idx'],
    array['offtake_contracts', 'crop_cycle_id', 'offtake_contracts_crop_cycle_id_fk_idx'],
    array['offtake_contracts', 'farm_id', 'offtake_contracts_farm_id_fk_idx'],
    array['processing_batches', 'source_farm_id', 'processing_batches_source_farm_id_fk_idx'],
    array['programme_beneficiaries', 'profile_id', 'programme_beneficiaries_profile_id_fk_idx'],
    array['ratings', 'rater_id', 'ratings_rater_id_fk_idx'],
    array['research_trials', 'farm_id', 'research_trials_farm_id_fk_idx'],
    array['research_trials', 'owner_id', 'research_trials_owner_id_fk_idx'],
    array['research_trials', 'plot_id', 'research_trials_plot_id_fk_idx'],
    array['support_ticket_messages', 'author_id', 'support_ticket_messages_author_id_fk_idx'],
    array['support_tickets', 'assigned_to', 'support_tickets_assigned_to_fk_idx'],
    array['telemetry_readings', 'installation_id', 'telemetry_readings_installation_id_fk_idx']
  ] loop
    -- Skip tables that exist only in production (the *_legacy copies) or not at all yet.
    if to_regclass('public.' || x[1]) is not null then
      execute format('create index if not exists %I on public.%I (%I)', x[3], x[1], x[2]);
    end if;
  end loop;
end $$;

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
