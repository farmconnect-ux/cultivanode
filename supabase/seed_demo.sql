-- CultivaNode demo data.
--
-- Creates one sign-in demo account plus counterparties (buyers, lenders, farmers…) that cannot
-- sign in, and fills every module with realistic South-West Nigeria records owned by them.
-- Every demo profile has profiles.is_demo = true; demo sellers and market prices carry is_demo too.
-- Remove everything with:  select private.purge_demo_data();   (see supabase/scripts/purge_demo_data.sql)
--
-- Safe to re-run: it stops if the main demo account already exists.

do $seed$
declare
  -- Profiles (fixed ids so the seed is recognisable and idempotent).
  p_main   uuid := 'de000000-0000-4000-8000-000000000001'; -- signs in: Bisi Adeyemi (multi-role demo)
  p_buyer  uuid := 'de000000-0000-4000-8000-000000000002'; -- Ibadan Foods Processing Ltd
  p_dealer uuid := 'de000000-0000-4000-8000-000000000003'; -- Oke-Ogun Agro Inputs
  p_lender uuid := 'de000000-0000-4000-8000-000000000004'; -- AgriCredit MFB
  p_tract  uuid := 'de000000-0000-4000-8000-000000000005'; -- Iseyin Tractor Owners
  p_f1 uuid := 'de000000-0000-4000-8000-000000000011';
  p_f2 uuid := 'de000000-0000-4000-8000-000000000012';
  p_f3 uuid := 'de000000-0000-4000-8000-000000000013';
  p_f4 uuid := 'de000000-0000-4000-8000-000000000014';
  p_f5 uuid := 'de000000-0000-4000-8000-000000000015';
  p_f6 uuid := 'de000000-0000-4000-8000-000000000016';

  f_main uuid := 'de000000-0000-4000-8000-0000000000a1'; -- Adeyemi Family Farm, Iseyin
  f_poul uuid := 'de000000-0000-4000-8000-0000000000a2'; -- Ogbomoso Poultry Unit
  f_veg  uuid := 'de000000-0000-4000-8000-0000000000a3'; -- Akinyele Vegetable Plots
  f_o1 uuid := 'de000000-0000-4000-8000-0000000000b1';
  f_o2 uuid := 'de000000-0000-4000-8000-0000000000b2';
  f_o3 uuid := 'de000000-0000-4000-8000-0000000000b3';

  pl_m1 uuid; pl_m2 uuid; pl_m3 uuid; pl_m4 uuid; pl_v1 uuid; pl_v2 uuid; pl_p1 uuid;
  c_maize uuid; c_cass uuid; c_soy uuid; c_tom uuid; c_pep uuid; c_maize_old uuid;
  g_broil uuid; g_layer uuid; g_goat uuid; g_fish uuid;
  w1 uuid; w2 uuid; w3 uuid; w4 uuid; w5 uuid; w6 uuid; w7 uuid;
  m_tract uuid; m_plant uuid; m_spray uuid; m_pump uuid; m_truck uuid;
  loc_main uuid; loc_feed uuid; loc_cold uuid;
  inv_npk uuid; inv_urea uuid; inv_seed uuid; inv_feed uuid; inv_herb uuid;
  b_crop uuid; b_poul uuid; b_whole uuid;
  dev1 uuid; dev2 uuid; dev3 uuid; dev4 uuid;
  z1 uuid; z2 uuid; z3 uuid;
  s_main uuid; s_dealer uuid; s_buyer uuid; s_tract uuid;
  cat_cereal uuid; cat_roots uuid; cat_veg uuid; cat_fert uuid; cat_seed uuid; cat_prot uuid; cat_mach uuid; cat_legume uuid;
  l1 uuid; l2 uuid; l3 uuid; l4 uuid; l5 uuid; l6 uuid; l7 uuid; l8 uuid; l9 uuid; l10 uuid;
  o1 uuid; o2 uuid; o3 uuid; o4 uuid;
  fu1 uuid; fu2 uuid; fu3 uuid; fu4 uuid;
  k1 uuid; k2 uuid; k3 uuid;
  t1 uuid; t2 uuid; t3 uuid;
  gp1 uuid; gp2 uuid; gp3 uuid;
  io1 uuid; io2 uuid; io3 uuid;
  ip1 uuid; ip2 uuid;
  org uuid;
  pol1 uuid; pol2 uuid;
  lst_tractor uuid; lst_spray uuid;
  rq1 uuid;
  i int;
  d date := current_date;
begin
  if exists (select 1 from auth.users where id = p_main) then
    raise notice 'Demo data already present; nothing to do.';
    return;
  end if;

  ----------------------------------------------------------------------------------------------
  -- Accounts. The main account signs in with an emailed code; the others are counterparties.
  ----------------------------------------------------------------------------------------------
  insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                          created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
                          email_change, email_change_token_current, reauthentication_token, phone_change, phone_change_token)
  select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', v.email, now(),
         '{"provider":"email","providers":["email"]}'::jsonb,
         jsonb_build_object('full_name', v.name, 'account_type', v.acct),
         now() - interval '120 days', now(), '', '', '', '', '', '', '', ''
    from (values
      (p_main,   'quadriolapade+cultivademo@gmail.com', 'Bisi Adeyemi (Demo)', 'individual'),
      (p_buyer,  'buyer@demo.cultivanode.invalid',  'Ibadan Foods Processing Ltd (Demo)', 'business'),
      (p_dealer, 'dealer@demo.cultivanode.invalid', 'Oke-Ogun Agro Inputs (Demo)', 'business'),
      (p_lender, 'lender@demo.cultivanode.invalid', 'AgriCredit Microfinance Bank (Demo)', 'business'),
      (p_tract,  'fleet@demo.cultivanode.invalid',  'Iseyin Tractor Owners Association (Demo)', 'business'),
      (p_f1, 'f1@demo.cultivanode.invalid', 'Kunle Ojo (Demo)', 'individual'),
      (p_f2, 'f2@demo.cultivanode.invalid', 'Aisha Bello (Demo)', 'individual'),
      (p_f3, 'f3@demo.cultivanode.invalid', 'Tunde Afolabi (Demo)', 'individual'),
      (p_f4, 'f4@demo.cultivanode.invalid', 'Grace Okonkwo (Demo)', 'individual'),
      (p_f5, 'f5@demo.cultivanode.invalid', 'Musa Ibrahim (Demo)', 'individual'),
      (p_f6, 'f6@demo.cultivanode.invalid', 'Funmi Adebayo (Demo)', 'individual')
    ) as v(id, email, name, acct);

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text, 'email',
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), null, now(), now()
    from auth.users u where u.id in (p_main, p_buyer, p_dealer, p_lender, p_tract, p_f1, p_f2, p_f3, p_f4, p_f5, p_f6);

  update public.profiles p
     set is_demo = true,
         onboarded_at = now() - interval '118 days',
         verification_tier = v.tier,
         state = v.state,
         lga = v.lga
    from (values
      (p_main, 3, 'Oyo', 'Iseyin'), (p_buyer, 3, 'Oyo', 'Ibadan North'), (p_dealer, 3, 'Oyo', 'Saki West'),
      (p_lender, 3, 'Oyo', 'Ibadan South-West'), (p_tract, 3, 'Oyo', 'Iseyin'),
      (p_f1, 2, 'Oyo', 'Iseyin'), (p_f2, 1, 'Oyo', 'Itesiwaju'), (p_f3, 2, 'Oyo', 'Kajola'),
      (p_f4, 2, 'Ogun', 'Abeokuta North'), (p_f5, 1, 'Oyo', 'Saki East'), (p_f6, 3, 'Oyo', 'Ogbomosho North')
    ) as v(id, tier, state, lga)
   where p.id = v.id;

  insert into public.user_roles (profile_id, role, provider_type)
  values (p_main, 'crop_farmer', null), (p_main, 'animal_farmer', null), (p_main, 'machinery_owner', null),
         (p_main, 'field_agent', null), (p_main, 'buyer_offtaker', null), (p_main, 'input_supplier', null),
         (p_main, 'investor', null), (p_main, 'institutional_partner', null), (p_main, 'logistics_provider', null),
         (p_main, 'service_provider', 'agronomist'),
         (p_buyer, 'buyer_offtaker', null), (p_dealer, 'input_supplier', null), (p_lender, 'institutional_partner', null),
         (p_tract, 'machinery_owner', null),
         (p_f1, 'crop_farmer', null), (p_f2, 'crop_farmer', null), (p_f3, 'crop_farmer', null),
         (p_f4, 'crop_farmer', null), (p_f5, 'animal_farmer', null), (p_f6, 'crop_farmer', null);

  insert into public.consents (profile_id, consent_type, granted, document_version, channel)
  select x, c::public.consent_type, true, '2026-09', 'web'
    from unnest(array[p_main, p_f1, p_f2, p_f3, p_f4, p_f5, p_f6]) x,
         unnest(array['terms_of_use','privacy_policy','data_processing']) c;

  -- Field-agent roster: three farmers were registered by the demo account.
  update public.profiles set onboarded_by = p_main where id in (p_f1, p_f2, p_f3);

  ----------------------------------------------------------------------------------------------
  -- Farms and plots
  ----------------------------------------------------------------------------------------------
  insert into public.farms (id, owner_id, name, location, area_ha, state, lga, address_hint, farm_code, ownership_type,
                            water_sources, irrigation_systems, slope_type, accessibility_level, status, onboarded_by)
  values
    (f_main, p_main, 'Adeyemi Family Farm', extensions.st_setsrid(extensions.st_makepoint(3.6012, 7.9735), 4326)::extensions.geography,
     42.5, 'Oyo', 'Iseyin', 'Off Iseyin–Okeho road, after Ado-Awaye junction', 'CN-OY-ISY-0001', 'family',
     '{borehole,river}', '{drip,furrow}', 'gentle', 'all_season_road', 'active', null),
    (f_poul, p_main, 'Ogbomoso Poultry & Fish Unit', extensions.st_setsrid(extensions.st_makepoint(4.2436, 8.1335), 4326)::extensions.geography,
     3.2, 'Oyo', 'Ogbomosho North', 'Takie, behind LAUTECH staff quarters', 'CN-OY-OGB-0002', 'owned',
     '{borehole}', '{}', 'flat', 'all_season_road', 'active', null),
    (f_veg, p_main, 'Akinyele Vegetable Plots', extensions.st_setsrid(extensions.st_makepoint(3.9158, 7.5263), 4326)::extensions.geography,
     6.8, 'Oyo', 'Akinyele', 'Moniya–Iseyin road, km 9', 'CN-OY-AKN-0003', 'leased',
     '{borehole,rainwater_tank}', '{drip,sprinkler}', 'flat', 'all_season_road', 'active', null),
    (f_o1, p_f1, 'Ojo Maize Farm', extensions.st_setsrid(extensions.st_makepoint(3.5870, 7.9910), 4326)::extensions.geography,
     8.0, 'Oyo', 'Iseyin', 'Ekunle village', null, 'family', '{river}', '{}', 'gentle', 'dry_season_only', 'active', p_main),
    (f_o2, p_f2, 'Bello Cassava Holding', extensions.st_setsrid(extensions.st_makepoint(3.4910, 8.1410), 4326)::extensions.geography,
     5.5, 'Oyo', 'Itesiwaju', 'Otu, near the market', null, 'owned', '{}', '{}', 'flat', 'all_season_road', 'active', p_main),
    (f_o3, p_f3, 'Afolabi Soybean Fields', extensions.st_setsrid(extensions.st_makepoint(3.3920, 8.1820), 4326)::extensions.geography,
     11.0, 'Oyo', 'Kajola', 'Okeho outskirts', null, 'family', '{river}', '{}', 'gentle', 'dry_season_only', 'active', p_main);

  insert into public.plots (farm_id, name, plot_code, area_ha, soil_texture, drainage, slope_pct, irrigation_type, water_source, soil_ph, organic_matter_pct, current_crop, previous_crop)
  values (f_main, 'North Block A', 'NB-A', 12.0, 'sandy_loam', 'well_drained', 3, 'rainfed', 'river', 6.2, 1.8, 'maize', 'soybean')
  returning id into pl_m1;
  insert into public.plots (farm_id, name, plot_code, area_ha, soil_texture, drainage, slope_pct, irrigation_type, water_source, soil_ph, organic_matter_pct, current_crop, previous_crop)
  values (f_main, 'River Flats B', 'RF-B', 10.5, 'loam', 'moderate', 1, 'furrow', 'river', 6.6, 2.3, 'cassava', 'maize')
  returning id into pl_m2;
  insert into public.plots (farm_id, name, plot_code, area_ha, soil_texture, drainage, slope_pct, irrigation_type, water_source, soil_ph, organic_matter_pct, current_crop, previous_crop)
  values (f_main, 'Ridge Field C', 'RG-C', 9.0, 'sandy_loam', 'well_drained', 5, 'rainfed', null, 5.9, 1.4, 'soybean', 'cassava')
  returning id into pl_m3;
  insert into public.plots (farm_id, name, plot_code, area_ha, soil_texture, drainage, slope_pct, irrigation_type, water_source, soil_ph, organic_matter_pct, current_crop, previous_crop)
  values (f_main, 'Orchard & Fallow D', 'OF-D', 8.0, 'clay_loam', 'moderate', 2, 'rainfed', null, 6.4, 2.9, null, 'maize')
  returning id into pl_m4;
  insert into public.plots (farm_id, name, plot_code, area_ha, soil_texture, drainage, irrigation_type, water_source, soil_ph, organic_matter_pct, current_crop)
  values (f_veg, 'Tomato Tunnel Block', 'TT-1', 2.4, 'sandy_loam', 'well_drained', 'drip', 'borehole', 6.5, 2.6, 'tomato')
  returning id into pl_v1;
  insert into public.plots (farm_id, name, plot_code, area_ha, soil_texture, drainage, irrigation_type, water_source, soil_ph, organic_matter_pct, current_crop)
  values (f_veg, 'Pepper & Okra Beds', 'PO-2', 3.1, 'loam', 'well_drained', 'sprinkler', 'borehole', 6.3, 2.2, 'pepper')
  returning id into pl_v2;
  insert into public.plots (farm_id, name, plot_code, area_ha, soil_texture, drainage, irrigation_type, water_source)
  values (f_poul, 'Pen & Pond Area', 'PP-1', 3.2, 'loam', 'moderate', 'manual', 'borehole')
  returning id into pl_p1;

  insert into public.soil_records (plot_id, tested_on, soil_type, ph, organic_matter_pct, nitrogen_pct, phosphorus_ppm, potassium_cmol_kg, lab_name, recommendations, created_by)
  values
    (pl_m1, d - 160, 'Sandy loam', 6.2, 1.8, 0.110, 9.4, 0.32, 'IITA Analytical Services Lab', 'Apply 250 kg/ha NPK 15-15-15 at planting; top-dress 150 kg/ha urea at 4–5 weeks.', p_main),
    (pl_m2, d - 160, 'Loam', 6.6, 2.3, 0.140, 12.1, 0.41, 'IITA Analytical Services Lab', 'Cassava: 200 kg/ha NPK at 4 WAP. Maintain ridges for drainage.', p_main),
    (pl_m3, d - 158, 'Sandy loam', 5.9, 1.4, 0.090, 7.8, 0.28, 'IAR&T Soil Lab, Ibadan', 'Lime at 1 t/ha before next season; inoculate soybean seed with Rhizobium.', p_main),
    (pl_v1, d - 90, 'Sandy loam', 6.5, 2.6, 0.150, 18.2, 0.52, 'NIHORT Soil Clinic', 'Fertigate with calcium nitrate weekly during fruiting to prevent blossom-end rot.', p_main);

  ----------------------------------------------------------------------------------------------
  -- Crop cycles, operations, scouting, harvests, alerts
  ----------------------------------------------------------------------------------------------
  insert into public.crop_cycles (farm_id, plot_id, standard_id, crop_id, variety_id, season, status, current_stage, target_area_ha,
                                  planting_date, expected_harvest_date, target_yield_kg, seed_quantity_kg, plant_population_per_ha,
                                  health_score, health_status, estimated_budget_kobo, actual_cost_kobo, notes, created_by)
  values (f_main, pl_m1, (select id from public.farm_agronomic_standards where standard_code = 'GAP_MAIZE_V1'),
          'maize', 'SAMMAZ 15', '2026 late season', 'maintenance', 'Tasseling', 12.0, d - 68, d + 42, 48000, 240, 53333,
          0.82, 'watch', 486000000, 312500000, 'Late-season planting after soybean. Fall armyworm pressure moderate.', p_main)
  returning id into c_maize;
  insert into public.crop_cycles (farm_id, plot_id, standard_id, crop_id, variety_id, season, status, current_stage, target_area_ha,
                                  planting_date, expected_harvest_date, target_yield_kg, plant_population_per_ha,
                                  health_score, health_status, estimated_budget_kobo, actual_cost_kobo, notes, created_by)
  values (f_main, pl_m2, (select id from public.farm_agronomic_standards where standard_code = 'GAP_CASSAVA_V1'),
          'cassava', 'TME 419', '2026 main season', 'maintenance', 'Tuber bulking', 10.5, d - 190, d + 175, 262500, 10000,
          0.91, 'healthy', 525000000, 288000000, 'Contracted to Ibadan Foods at ₦190/kg.', p_main)
  returning id into c_cass;
  insert into public.crop_cycles (farm_id, plot_id, standard_id, crop_id, variety_id, season, status, current_stage, target_area_ha,
                                  planting_date, expected_harvest_date, target_yield_kg, seed_quantity_kg,
                                  health_score, health_status, estimated_budget_kobo, actual_cost_kobo, created_by)
  values (f_main, pl_m3, (select id from public.farm_agronomic_standards where standard_code = 'GAP_SOYBEAN_V1'),
          'soybean', 'TGX 1835-10E', '2026 late season', 'establishment', 'Flowering', 9.0, d - 41, d + 59, 18000, 540,
          0.88, 'healthy', 198000000, 96500000, p_main)
  returning id into c_soy;
  insert into public.crop_cycles (farm_id, plot_id, crop_id, variety_id, season, status, current_stage, target_area_ha,
                                  planting_date, expected_harvest_date, target_yield_kg, health_score, health_status,
                                  estimated_budget_kobo, actual_cost_kobo, notes, created_by)
  values (f_veg, pl_v1, 'tomato', 'Padma F1', '2026 dry season', 'harvesting', 'Fruiting & picking', 2.4, d - 96, d + 14, 72000,
          0.74, 'at_risk', 312000000, 268000000, 'Early blight spotted on lower leaves of rows 4–7.', p_main)
  returning id into c_tom;
  insert into public.crop_cycles (farm_id, plot_id, crop_id, variety_id, season, status, current_stage, target_area_ha,
                                  planting_date, expected_harvest_date, target_yield_kg, health_score, health_status,
                                  estimated_budget_kobo, actual_cost_kobo, created_by)
  values (f_veg, pl_v2, 'pepper', 'Scotch Bonnet (Rodo)', '2026 dry season', 'maintenance', 'Flowering', 3.1, d - 52, d + 48, 27900,
          0.93, 'healthy', 186000000, 74000000, p_main)
  returning id into c_pep;
  insert into public.crop_cycles (farm_id, plot_id, crop_id, variety_id, season, status, current_stage, target_area_ha,
                                  planting_date, expected_harvest_date, actual_harvest_date, target_yield_kg, health_score,
                                  health_status, estimated_budget_kobo, actual_cost_kobo, created_by)
  values (f_main, pl_m4, 'maize', 'Oba Super 2', '2026 early season', 'completed', 'Harvested', 8.0, d - 210, d - 95, d - 92, 30000,
          1.0, 'healthy', 312000000, 298000000, p_main)
  returning id into c_maize_old;

  insert into public.crop_cycle_operations (crop_cycle_id, operation_type, name, stage, status, scheduled_date, completed_date, required_machinery, actual_cost_kobo, notes)
  values
    (c_maize, 'land_prep', 'Ploughing and harrowing', 'Land preparation', 'completed', d - 75, d - 74, 'Tractor + disc plough', 42000000, 'Hired Iseyin Tractor Owners, 12 ha.'),
    (c_maize, 'planting', 'Mechanised planting', 'Planting', 'completed', d - 68, d - 68, '4-row planter', 18000000, null),
    (c_maize, 'fertiliser', 'Basal NPK 15-15-15 (250 kg/ha)', 'Establishment', 'completed', d - 66, d - 65, null, 135000000, '60 bags applied.'),
    (c_maize, 'weed_control', 'Post-emergence herbicide', 'Establishment', 'completed', d - 47, d - 46, 'Boom sprayer', 21000000, null),
    (c_maize, 'fertiliser', 'Urea top-dressing (150 kg/ha)', 'Vegetative', 'completed', d - 38, d - 37, null, 66500000, null),
    (c_maize, 'pest_control', 'Fall armyworm spot spray', 'Vegetative', 'completed', d - 19, d - 18, 'Knapsack sprayers', 30000000, 'Emamectin benzoate on hotspots.'),
    (c_maize, 'scouting', 'Tasseling-stage scouting walk', 'Tasseling', 'pending', d + 2, null, null, 0, null),
    (c_maize, 'harvest', 'Combine harvest and shelling', 'Harvest', 'pending', d + 42, null, 'Combine harvester', 0, null),
    (c_cass, 'weed_control', 'Third manual weeding', 'Bulking', 'in_progress', d - 1, null, null, 8500000, null),
    (c_cass, 'fertiliser', 'NPK top-up for bulking', 'Bulking', 'pending', d + 5, null, null, 0, null),
    (c_soy, 'scouting', 'Pod set and pest check', 'Flowering', 'pending', d + 3, null, null, 0, null),
    (c_soy, 'pest_control', 'Insecticide for pod borers', 'Pod formation', 'pending', d + 12, null, 'Boom sprayer', 0, null),
    (c_tom, 'harvest', 'Picking round 6', 'Fruiting', 'pending', d + 1, null, null, 0, null),
    (c_tom, 'disease_control', 'Fungicide for early blight', 'Fruiting', 'in_progress', d, null, 'Knapsack sprayers', 4800000, 'Mancozeb + copper.'),
    (c_pep, 'fertiliser', 'Fertigation: calcium nitrate', 'Flowering', 'pending', d + 2, null, null, 0, null);

  insert into public.crop_observations (crop_cycle_id, observed_at, category, severity, title, description, recommended_action, resolved, created_by)
  values
    (c_maize, now() - interval '19 days', 'pest', 'high', 'Fall armyworm damage in NB-A west rows', 'Window-pane feeding and frass in whorls on ~18% of plants sampled.', 'Spot-spray emamectin benzoate early morning; re-scout in 7 days.', true, p_main),
    (c_maize, now() - interval '3 days', 'nutrient_deficiency', 'medium', 'Yellowing lower leaves', 'V-shaped yellowing from leaf tip on older leaves in the low corner — likely nitrogen.', 'Confirm with leaf test; consider foliar N if tasseling is delayed.', false, p_main),
    (c_tom, now() - interval '2 days', 'disease', 'high', 'Early blight on lower canopy', 'Concentric brown lesions on lower leaves, rows 4–7. Humidity above 85% for three nights.', 'Remove infected leaves, spray mancozeb, improve airflow by pruning.', false, p_main),
    (c_cass, now() - interval '11 days', 'pest', 'low', 'Cassava mealybug colonies', 'Small colonies on 3 of 40 stems checked near the river edge.', 'Monitor; release of natural enemies is effective — no spray needed yet.', false, p_main),
    (c_soy, now() - interval '6 days', 'weed_infestation', 'medium', 'Late weed flush between rows', 'Broadleaf weeds re-emerging after rain, mostly Tridax and Commelina.', 'One inter-row slash before canopy closes.', true, p_main),
    (c_pep, now() - interval '1 day', 'water_stress', 'low', 'Midday wilting on bed 3', 'Temporary wilting 12:00–15:00; drip emitter blocked on two laterals.', 'Flush drip lines and replace blocked emitters.', false, p_main);

  insert into public.crop_harvests (crop_cycle_id, batch_code, harvest_date, quantity_kg, quality_grade, moisture_pct, loss_pct, storage_location, destination, notes, recorded_by)
  values
    (c_maize_old, 'MZ-OF-D-01', d - 94, 15800, 'A', 13.5, 2.5, 'Main warehouse, bay 2', 'offtaker', 'Delivered to Ibadan Foods.', p_main),
    (c_maize_old, 'MZ-OF-D-02', d - 92, 12450, 'B', 14.2, 3.1, 'Main warehouse, bay 3', 'marketplace', null, p_main),
    (c_tom, 'TM-TT1-R3', d - 14, 9800, 'A', null, 6.0, 'Cold room', 'marketplace', 'Bodija market and two restaurant buyers.', p_main),
    (c_tom, 'TM-TT1-R4', d - 9, 11200, 'A', null, 5.5, 'Cold room', 'marketplace', null, p_main),
    (c_tom, 'TM-TT1-R5', d - 4, 8600, 'B', null, 9.0, 'Cold room', 'processing', 'Blight-affected fruit sent for paste.', p_main);

  update public.crop_cycles set actual_harvest_date = d - 92 where id = c_maize_old;

  insert into public.crop_alerts (farm_id, crop_cycle_id, category, severity, title, message, action_url, is_dismissed, created_at)
  values
    (f_veg, c_tom, 'disease', 'high', 'Blight risk: tomato block', 'Three humid nights in a row. Early blight is spreading on lower leaves; spray before the next rain.', '/account/crops/scouting', false, now() - interval '2 days'),
    (f_main, c_maize, 'weather', 'medium', 'Dry spell during tasseling', 'Forecast shows 9 dry days. Maize at tasseling is sensitive to water stress — plan irrigation on River Flats if possible.', '/account/weather', false, now() - interval '1 day'),
    (f_main, c_soy, 'operation', 'low', 'Scouting due in 3 days', 'Pod-set scouting on Ridge Field C is scheduled for this week.', '/account/tasks', false, now() - interval '5 hours'),
    (f_main, null, 'market', 'medium', 'Maize prices up 8% in Ibadan', 'Bodija wholesale yellow maize rose to ₦610/kg this week. Consider holding stock for 2–3 weeks.', '/account/market-intel', false, now() - interval '3 days'),
    (f_poul, null, 'irrigation', 'low', 'Borehole pump service due', 'The poultry unit pump has run 1,180 hours since service.', '/account/machinery', true, now() - interval '9 days');

  ----------------------------------------------------------------------------------------------
  -- Livestock
  ----------------------------------------------------------------------------------------------
  insert into public.farm_livestock_groups (farm_id, group_name, animal_type, breed, purpose, population, housing_location, age_weeks, health_status, notes)
  values (f_poul, 'Broiler batch B-14', 'poultry', 'Arbor Acres', 'meat', 1960, 'Deep-litter house 2', 5, 'healthy', 'Started with 2,000 day-old chicks.')
  returning id into g_broil;
  insert into public.farm_livestock_groups (farm_id, group_name, animal_type, breed, purpose, population, housing_location, age_weeks, health_status)
  values (f_poul, 'Layer flock L-3', 'poultry', 'Isa Brown', 'eggs', 1450, 'Battery cage house 1', 38, 'healthy')
  returning id into g_layer;
  insert into public.farm_livestock_groups (farm_id, group_name, animal_type, breed, purpose, population, housing_location, age_weeks, health_status, notes)
  values (f_main, 'West African Dwarf goats', 'goats', 'WAD', 'meat', 34, 'Pen behind the store', null, 'monitoring', 'Two kids with diarrhoea under watch.')
  returning id into g_goat;
  insert into public.farm_livestock_groups (farm_id, group_name, animal_type, breed, purpose, population, housing_location, age_weeks, health_status)
  values (f_poul, 'Catfish pond 1', 'fish', 'Clarias gariepinus', 'meat', 4800, 'Concrete pond 1', 14, 'healthy')
  returning id into g_fish;

  insert into public.farm_livestock_animals (farm_id, group_id, tag_number, species, breed, sex, birth_date, acquisition_date, acquisition_source, current_weight_kg, housing_location, health_status, sire_tag, dam_tag)
  values
    (f_main, g_goat, 'WAD-001', 'goat', 'WAD', 'male', d - 900, d - 700, 'Saki market', 31.5, 'Goat pen', 'healthy', null, null),
    (f_main, g_goat, 'WAD-002', 'goat', 'WAD', 'female', d - 800, d - 700, 'Saki market', 24.0, 'Goat pen', 'healthy', null, null),
    (f_main, g_goat, 'WAD-003', 'goat', 'WAD', 'female', d - 760, d - 700, 'Saki market', 22.8, 'Goat pen', 'healthy', null, null),
    (f_main, g_goat, 'WAD-004', 'goat', 'WAD', 'female', d - 610, d - 610, 'Born on farm', 21.2, 'Goat pen', 'healthy', 'WAD-001', 'WAD-002'),
    (f_main, g_goat, 'WAD-005', 'goat', 'WAD', 'castrated', d - 420, d - 420, 'Born on farm', 18.4, 'Goat pen', 'healthy', 'WAD-001', 'WAD-003'),
    (f_main, g_goat, 'WAD-006', 'goat', 'WAD', 'female', d - 75, d - 75, 'Born on farm', 6.1, 'Kid pen', 'treatment', 'WAD-001', 'WAD-004'),
    (f_main, g_goat, 'WAD-007', 'goat', 'WAD', 'male', d - 75, d - 75, 'Born on farm', 6.4, 'Kid pen', 'treatment', 'WAD-001', 'WAD-004'),
    (f_main, g_goat, 'WAD-008', 'goat', 'WAD', 'female', d - 300, d - 300, 'Born on farm', 15.9, 'Goat pen', 'healthy', 'WAD-001', 'WAD-002');

  insert into public.farm_livestock_health_events (farm_id, group_id, event_type, disease_or_condition, medication_name, dosage, administered_on, vet_name, head_affected, cost_kobo, withdrawal_period_days, withdrawal_end_date, notes)
  values
    (f_poul, g_broil, 'vaccination', 'Newcastle disease', 'Lasota (NDV)', 'Drinking water, 1 dose/bird', d - 28, 'Dr. Yemi Alade', 2000, 1800000, 0, null, 'Day 7 vaccination.'),
    (f_poul, g_broil, 'vaccination', 'Gumboro (IBD)', 'Gumboro intermediate', 'Drinking water', d - 21, 'Dr. Yemi Alade', 2000, 1500000, 0, null, null),
    (f_poul, g_broil, 'mortality', 'Heat stress', null, null, d - 6, null, 12, 0, 0, null, '12 birds lost during 36°C afternoon.'),
    (f_poul, g_layer, 'routine_check', 'Laying performance review', null, null, d - 10, 'Dr. Yemi Alade', 1450, 1000000, 0, null, 'Hen-day production 86%.'),
    (f_poul, g_layer, 'treatment', 'Coccidiosis (mild)', 'Amprolium', '1 g/L for 5 days', d - 33, 'Dr. Yemi Alade', 120, 2400000, 7, d - 21, null),
    (f_main, g_goat, 'disease_diagnosis', 'Diarrhoea in kids', null, null, d - 4, 'Dr. Lara Ige', 2, 800000, 0, null, 'Faecal sample sent to lab.'),
    (f_main, g_goat, 'treatment', 'Diarrhoea in kids', 'Oxytetracycline LA', '1 ml/10 kg', d - 3, 'Dr. Lara Ige', 2, 650000, 28, d + 25, null),
    (f_main, g_goat, 'vaccination', 'PPR', 'PPR vaccine', '1 ml SC', d - 120, 'Dr. Lara Ige', 30, 1500000, 0, null, 'Annual PPR vaccination.');

  for i in 0..9 loop
    insert into public.farm_livestock_feedings (farm_id, group_id, feed_type, quantity_kg, cost_kobo, feeding_date)
    values (f_poul, g_broil, case when i < 4 then 'Broiler finisher (Top Feeds)' else 'Broiler grower (Top Feeds)' end,
            310 + i * 6, (310 + i * 6) * 74000, d - i),
           (f_poul, g_layer, 'Layer mash (Hybrid Feeds)', 168, 168 * 62000, d - i);
  end loop;
  insert into public.farm_livestock_feedings (farm_id, group_id, feed_type, quantity_kg, cost_kobo, feeding_date)
  select f_poul, g_fish, 'Floating catfish pellets 4 mm', 52, 52 * 98000, d - g from generate_series(0, 6) g;

  insert into public.farm_livestock_production_logs (farm_id, group_id, product_type, quantity, unit, quality_grade, log_date, destination, revenue_kobo)
  select f_poul, g_layer, 'eggs', 41 - (g % 3), 'crates', 'A', d - g, case when g % 4 = 0 then 'inventory' else 'marketplace' end,
         case when g % 4 = 0 then 0 else (41 - (g % 3)) * 520000 end
    from generate_series(0, 13) g;
  insert into public.farm_livestock_production_logs (farm_id, group_id, product_type, quantity, unit, quality_grade, log_date, destination, revenue_kobo)
  values (f_poul, g_fish, 'fish', 420, 'kg', 'A', d - 20, 'marketplace', 420 * 280000),
         (f_main, g_goat, 'meat', 2, 'heads', null, d - 45, 'marketplace', 2 * 9500000);

  ----------------------------------------------------------------------------------------------
  -- Workers, attendance, tasks
  ----------------------------------------------------------------------------------------------
  insert into public.farm_workers (farm_id, full_name, phone, role, employment_type, daily_wage_kobo, status, joined_date, emergency_contact)
  values (f_main, 'Segun Adewale', '08031110001', 'farm_manager', 'permanent', 1200000, 'active', d - 900, 'Mrs Adewale 08031110002') returning id into w1;
  insert into public.farm_workers (farm_id, full_name, phone, role, employment_type, daily_wage_kobo, status, joined_date)
  values (f_main, 'Ibrahim Sule', '08031110003', 'tractor_operator', 'permanent', 900000, 'active', d - 600) returning id into w2;
  insert into public.farm_workers (farm_id, full_name, phone, role, employment_type, daily_wage_kobo, status, joined_date)
  values (f_main, 'Kemi Olatunji', '08031110004', 'scout', 'permanent', 700000, 'active', d - 420) returning id into w3;
  insert into public.farm_workers (farm_id, full_name, phone, role, employment_type, daily_wage_kobo, status, joined_date)
  values (f_main, 'Femi Akande', '08031110005', 'field_worker', 'seasonal', 500000, 'active', d - 80) returning id into w4;
  insert into public.farm_workers (farm_id, full_name, phone, role, employment_type, daily_wage_kobo, status, joined_date)
  values (f_main, 'Blessing Udo', '08031110006', 'field_worker', 'daily_casual', 450000, 'active', d - 30) returning id into w5;
  insert into public.farm_workers (farm_id, full_name, phone, role, employment_type, daily_wage_kobo, status, joined_date)
  values (f_poul, 'Rasheed Lawal', '08031110007', 'livestock_keeper', 'permanent', 650000, 'active', d - 500) returning id into w6;
  insert into public.farm_workers (farm_id, full_name, phone, role, employment_type, daily_wage_kobo, status, joined_date)
  values (f_veg, 'Chiamaka Eze', '08031110008', 'field_worker', 'seasonal', 500000, 'on_leave', d - 150) returning id into w7;

  for i in 0..5 loop
    insert into public.farm_attendance_records (farm_id, worker_id, clock_in_at, clock_out_at, shift_name, hours_worked, status, overtime_hours, daily_pay_kobo)
    values
      (f_main, w1, (d - i)::timestamptz + time '06:55', (d - i)::timestamptz + time '17:10', 'Day shift', 10.25, 'present', 1.25, 1200000),
      (f_main, w2, (d - i)::timestamptz + time '07:20', (d - i)::timestamptz + time '16:00', 'Day shift', 8.67, case when i = 2 then 'late' else 'present' end, 0, 900000),
      (f_main, w3, (d - i)::timestamptz + time '06:30', (d - i)::timestamptz + time '14:30', 'Morning', 8, 'present', 0, 700000),
      (f_main, w4, (d - i)::timestamptz + time '07:00', (d - i)::timestamptz + time '15:00', 'Day shift', 8, case when i = 4 then 'half_day' else 'present' end, 0, case when i = 4 then 250000 else 500000 end);
  end loop;

  insert into public.farm_operational_tasks (farm_id, plot_id, crop_cycle_id, title, description, category, priority, status, assigned_worker_id, start_date, due_date, completed_date, estimated_duration_hours, direct_cost_kobo)
  values
    (f_main, pl_m1, c_maize, 'Scout NB-A for armyworm re-infestation', 'Walk the W pattern, 20 plants per stop, record % damaged whorls.', 'scouting', 'high', 'assigned', w3, d, d + 2, null, 4, 0),
    (f_main, pl_m2, c_cass, 'Third weeding — River Flats', 'Manual weeding between ridges; 6-person crew.', 'weed_control', 'medium', 'in_progress', w4, d - 1, d + 3, null, 48, 2700000),
    (f_main, pl_m3, c_soy, 'Book boom sprayer for pod borer spray', 'Confirm with Iseyin Tractor Owners for next Tuesday.', 'machinery', 'medium', 'planned', w1, d, d + 5, null, 1, 0),
    (f_main, null, null, 'Service tractor TR-01 (500 h)', 'Oil, filters, grease points; check hydraulics.', 'maintenance', 'high', 'planned', w2, d + 1, d + 4, null, 6, 0),
    (f_veg, pl_v1, c_tom, 'Prune and remove blighted leaves', 'Rows 4–7; burn debris away from the tunnel.', 'disease_control', 'urgent', 'in_progress', w7, d - 1, d, null, 6, 0),
    (f_veg, pl_v2, c_pep, 'Flush drip laterals on bed 3', 'Replace blocked emitters; check filter.', 'irrigation', 'high', 'planned', null, d, d + 1, null, 2, 350000),
    (f_poul, pl_p1, null, 'Weigh broiler sample (50 birds)', 'Week-5 weight check against Arbor Acres curve.', 'livestock', 'medium', 'planned', w6, d + 1, d + 1, null, 1, 0),
    (f_poul, pl_p1, null, 'Change pond water — catfish pond 1', '30% water exchange; check ammonia.', 'livestock', 'medium', 'completed', w6, d - 3, d - 3, d - 3, 3, 0),
    (f_main, pl_m4, null, 'Clear fallow for dry-season vegetables', 'Slash and pile; plan drip layout.', 'land_prep', 'low', 'planned', w5, d + 7, d + 14, null, 32, 0),
    (f_main, null, null, 'Pay casual labour — week 41', 'Reconcile attendance sheet with the cash book.', 'admin', 'medium', 'completed', w1, d - 2, d - 2, d - 2, 1, 0),
    (f_main, pl_m1, c_maize, 'Repair furrow channel on NB-A', 'Erosion after last storm cut the main channel.', 'irrigation', 'high', 'overdue', w4, d - 9, d - 4, null, 8, 0),
    (f_main, null, null, 'Fumigate warehouse bay 2', 'Before new maize arrives.', 'storage', 'medium', 'blocked', w1, d - 2, d + 1, null, 4, 0);

  ----------------------------------------------------------------------------------------------
  -- Machinery fleet, usage, maintenance, telemetry, small equipment
  ----------------------------------------------------------------------------------------------
  insert into public.farm_machinery_assets (farm_id, asset_code, name, category, manufacturer, model, year_of_manufacture, registration_number, fuel_type, current_status, engine_hours, next_service_hours, hourly_internal_rate_kobo, purchase_value_kobo)
  values (f_main, 'TR-01', 'Massey Ferguson 385 4WD', 'tractor', 'Massey Ferguson', 'MF 385', 2019, 'OY-ISY-541-KJ', 'diesel', 'in_use', 4986, 5000, 1500000, 2850000000) returning id into m_tract;
  insert into public.farm_machinery_assets (farm_id, asset_code, name, category, manufacturer, model, year_of_manufacture, fuel_type, current_status, engine_hours, hourly_internal_rate_kobo, purchase_value_kobo)
  values (f_main, 'PL-01', '4-row pneumatic planter', 'planter', 'Baldan', 'PSM 4', 2021, 'manual', 'available', 0, 600000, 640000000) returning id into m_plant;
  insert into public.farm_machinery_assets (farm_id, asset_code, name, category, manufacturer, model, year_of_manufacture, fuel_type, current_status, engine_hours, hourly_internal_rate_kobo, purchase_value_kobo)
  values (f_main, 'SP-01', '600 L boom sprayer', 'boom_sprayer', 'Jacto', 'Condor 600', 2022, 'manual', 'reserved', 0, 450000, 410000000) returning id into m_spray;
  insert into public.farm_machinery_assets (farm_id, asset_code, name, category, manufacturer, model, year_of_manufacture, fuel_type, current_status, engine_hours, next_service_hours, hourly_internal_rate_kobo, purchase_value_kobo)
  values (f_poul, 'WP-01', 'Borehole submersible pump 2 hp', 'water_pump', 'Pedrollo', '4SR 2HP', 2020, 'electric', 'under_maintenance', 1180, 1000, 0, 95000000) returning id into m_pump;
  insert into public.farm_machinery_assets (farm_id, asset_code, name, category, manufacturer, model, year_of_manufacture, registration_number, fuel_type, current_status, engine_hours, hourly_internal_rate_kobo, purchase_value_kobo)
  values (f_main, 'TK-01', 'Mitsubishi Canter 3.5 t', 'truck', 'Mitsubishi', 'Canter', 2016, 'OY-IBD-212-AE', 'diesel', 'available', 0, 2000000, 1800000000) returning id into m_truck;

  insert into public.farm_machinery_usage_logs (farm_id, machinery_id, operator_id, plot_id, crop_cycle_id, operation_name, start_time, end_time, hours_operated, area_covered_ha, fuel_litres_consumed, operational_cost_kobo)
  values
    (f_main, m_tract, w2, pl_m1, c_maize, 'Ploughing NB-A', (d - 75)::timestamptz + time '07:00', (d - 75)::timestamptz + time '16:30', 9.5, 6.0, 118, 14800000),
    (f_main, m_tract, w2, pl_m1, c_maize, 'Harrowing NB-A', (d - 74)::timestamptz + time '07:00', (d - 74)::timestamptz + time '15:00', 8.0, 12.0, 86, 10900000),
    (f_main, m_plant, w2, pl_m1, c_maize, 'Planting maize NB-A', (d - 68)::timestamptz + time '07:00', (d - 68)::timestamptz + time '17:00', 10.0, 12.0, 0, 6000000),
    (f_main, m_spray, w2, pl_m1, c_maize, 'Herbicide NB-A', (d - 47)::timestamptz + time '06:30', (d - 47)::timestamptz + time '11:30', 5.0, 12.0, 0, 2250000),
    (f_main, m_tract, w2, pl_m3, c_soy, 'Ridging Ridge Field C', (d - 45)::timestamptz + time '07:00', (d - 45)::timestamptz + time '15:30', 8.5, 9.0, 92, 11600000),
    (f_main, m_truck, w1, null, null, 'Haulage to Ibadan Foods', (d - 93)::timestamptz + time '05:30', (d - 93)::timestamptz + time '13:00', 7.5, 0, 64, 8200000),
    (f_main, m_tract, w2, pl_m2, c_cass, 'Inter-row slashing River Flats', (d - 6)::timestamptz + time '07:00', (d - 6)::timestamptz + time '13:00', 6.0, 10.5, 58, 7800000),
    (f_main, m_tract, w2, pl_m4, null, 'Clearing fallow OF-D', now() - interval '3 hours', now(), 3.0, 2.5, 31, 0);

  insert into public.farm_machinery_maintenance (farm_id, machinery_id, service_type, description, service_date, engine_hours_at, cost_kobo, vendor, status)
  values
    (f_main, m_tract, 'routine_service', '4,500 h service: oil, filters, injector check', d - 140, 4502, 18500000, 'AFCOT Tractors, Ibadan', 'completed'),
    (f_main, m_tract, 'tyre', 'Replaced rear right tyre', d - 60, 4890, 42000000, 'Iseyin Tyre Centre', 'completed'),
    (f_main, m_tract, 'routine_service', '5,000 h service', d + 3, 5000, 0, 'AFCOT Tractors, Ibadan', 'scheduled'),
    (f_poul, m_pump, 'repair', 'Rewinding motor after low-voltage burn', d - 1, 1180, 6500000, 'Ogbomoso Pumps & Motors', 'in_progress'),
    (f_main, m_truck, 'inspection', 'Road-worthiness and brake inspection', d - 25, null, 2500000, 'VIO Ibadan', 'completed');

  insert into public.machinery_telemetry (farm_id, machinery_id, recorded_at, location, speed_kmh, heading_deg, fuel_pct, engine_rpm, engine_temp_c, engine_hours, status)
  select f_main, m_tract, now() - (g * interval '15 minutes'),
         extensions.st_setsrid(extensions.st_makepoint(3.6040 + g * 0.0004, 7.9701 + (g % 4) * 0.0003), 4326)::extensions.geography,
         case when g < 12 then 6.5 + (g % 3) else 0 end, 90 + (g % 2) * 180, 62 - g * 0.9,
         case when g < 12 then 1850 + (g % 4) * 40 else 0 end, case when g < 12 then 86 + (g % 3) else 41 end,
         4986 - g * 0.25, case when g < 12 then 'working' else 'off' end
    from generate_series(0, 23) g;
  insert into public.machinery_telemetry (farm_id, machinery_id, recorded_at, location, speed_kmh, fuel_pct, engine_rpm, engine_temp_c, status)
  values (f_main, m_truck, now() - interval '20 minutes', extensions.st_setsrid(extensions.st_makepoint(3.6006, 7.9741), 4326)::extensions.geography, 0, 74, 0, 38, 'off');

  insert into public.farm_equipment_assets (farm_id, equipment_name, category, quantity, condition, storage_location, assigned_worker_id)
  values
    (f_main, '16 L knapsack sprayers', 'knapsack_sprayer', 6, 'good', 'Main store', w3),
    (f_main, 'Digital platform scale 300 kg', 'scale', 1, 'good', 'Warehouse', w1),
    (f_main, 'PPE kits (coverall, mask, gloves)', 'ppe', 10, 'fair', 'Main store', null),
    (f_main, 'Cutlasses and hoes', 'hand_tool', 24, 'good', 'Main store', null),
    (f_veg, 'Drip fittings and spare emitters', 'irrigation_fitting', 340, 'new', 'Tunnel shed', null),
    (f_main, 'Soil test kit (pH/NPK)', 'testing_kit', 1, 'needs_repair', 'Office', w3);

  ----------------------------------------------------------------------------------------------
  -- Inventory
  ----------------------------------------------------------------------------------------------
  insert into public.farm_inventory_locations (farm_id, location_name, location_type) values (f_main, 'Main warehouse', 'main_warehouse') returning id into loc_main;
  insert into public.farm_inventory_locations (farm_id, location_name, location_type) values (f_poul, 'Feed store', 'feed_store') returning id into loc_feed;
  insert into public.farm_inventory_locations (farm_id, location_name, location_type) values (f_veg, 'Cold room', 'cold_room') returning id into loc_cold;

  insert into public.farm_inventory (farm_id, location_id, item_name, sku, category, quantity, unit, reorder_threshold, storage_location, unit_cost_kobo, expiry_date)
  values (f_main, loc_main, 'NPK 15-15-15 (50 kg)', 'FERT-NPK-50', 'fertiliser', 18, 'bags', 20, 'Main warehouse', 2250000, null) returning id into inv_npk;
  insert into public.farm_inventory (farm_id, location_id, item_name, sku, category, quantity, unit, reorder_threshold, storage_location, unit_cost_kobo)
  values (f_main, loc_main, 'Urea 46% N (50 kg)', 'FERT-UREA-50', 'fertiliser', 42, 'bags', 15, 'Main warehouse', 2100000) returning id into inv_urea;
  insert into public.farm_inventory (farm_id, location_id, item_name, sku, category, quantity, unit, reorder_threshold, storage_location, unit_cost_kobo, expiry_date)
  values (f_main, loc_main, 'SAMMAZ 15 maize seed', 'SEED-MZ-S15', 'seed', 64, 'kg', 100, 'Main warehouse', 180000, d + 200) returning id into inv_seed;
  insert into public.farm_inventory (farm_id, location_id, item_name, sku, category, quantity, unit, reorder_threshold, storage_location, unit_cost_kobo, expiry_date)
  values (f_poul, loc_feed, 'Broiler finisher (25 kg)', 'FEED-BRF-25', 'feed', 46, 'bags', 30, 'Feed store', 1850000, d + 60) returning id into inv_feed;
  insert into public.farm_inventory (farm_id, location_id, item_name, sku, category, quantity, unit, reorder_threshold, storage_location, unit_cost_kobo, expiry_date)
  values (f_main, loc_main, 'Glyphosate 480 SL', 'CHEM-GLY-1L', 'chemical', 38, 'liters', 20, 'Chemical cage', 550000, d + 500) returning id into inv_herb;
  insert into public.farm_inventory (farm_id, location_id, item_name, sku, category, quantity, unit, reorder_threshold, storage_location, unit_cost_kobo, expiry_date)
  values
    (f_main, loc_main, 'Emamectin benzoate 5 WG', 'CHEM-EMA-100G', 'chemical', 6, 'units', 10, 'Chemical cage', 480000, d + 300),
    (f_poul, loc_feed, 'Layer mash (25 kg)', 'FEED-LM-25', 'feed', 61, 'bags', 40, 'Feed store', 1550000, d + 45),
    (f_poul, loc_feed, 'Catfish pellets 4 mm (15 kg)', 'FEED-CF-15', 'feed', 12, 'bags', 15, 'Feed store', 1470000, d + 120),
    (f_main, loc_main, 'Diesel', 'FUEL-DSL', 'fuel', 640, 'liters', 400, 'Fuel tank', 125000, null),
    (f_main, loc_main, 'Yellow maize grain (stored)', 'PROD-MZ', 'harvest_produce', 8.4, 'tons', 0, 'Bay 3', 52000000, null),
    (f_veg, loc_cold, 'Tomatoes, grade A', 'PROD-TOM-A', 'harvest_produce', 86, 'crates', 0, 'Cold room', 2600000, d + 6),
    (f_main, loc_main, 'Jute bags (100 kg)', 'PKG-JUTE', 'other', 220, 'units', 150, 'Main warehouse', 65000, null),
    (f_main, loc_main, 'Grease and engine oil', 'MNT-OIL', 'tool_equipment', 24, 'liters', 10, 'Workshop', 300000, null),
    (f_main, loc_main, 'Sulphur dust 80%', 'CHEM-SULF', 'chemical', 3, 'bags', 5, 'Chemical cage', 900000, d + 400);

  insert into public.farm_inventory_transactions (farm_id, inventory_id, transaction_type, quantity, unit_cost_kobo, crop_cycle_id, group_id, notes, created_at)
  values
    (f_main, inv_npk, 'purchase', 80, 2250000, null, null, 'Oke-Ogun Agro Inputs invoice 0412', now() - interval '70 days'),
    (f_main, inv_npk, 'issue_to_field', 60, null, c_maize, null, 'Basal application NB-A', now() - interval '66 days'),
    (f_main, inv_npk, 'issue_to_field', 2, null, c_soy, null, 'Spot patches', now() - interval '40 days'),
    (f_main, inv_urea, 'purchase', 80, 2100000, null, null, null, now() - interval '45 days'),
    (f_main, inv_urea, 'issue_to_field', 36, null, c_maize, null, 'Top-dressing NB-A', now() - interval '38 days'),
    (f_main, inv_urea, 'loss', 2, null, null, null, 'Two bags soaked by roof leak', now() - interval '20 days'),
    (f_main, inv_seed, 'purchase', 300, 180000, null, null, null, now() - interval '72 days'),
    (f_main, inv_seed, 'issue_to_field', 236, null, c_maize, null, null, now() - interval '68 days'),
    (f_poul, inv_feed, 'purchase', 120, 1850000, null, null, null, now() - interval '12 days'),
    (f_poul, inv_feed, 'consumption', 74, null, null, g_broil, 'Days 30–35', now() - interval '1 day'),
    (f_main, inv_herb, 'purchase', 60, 550000, null, null, null, now() - interval '50 days'),
    (f_main, inv_herb, 'issue_to_field', 22, null, c_maize, null, null, now() - interval '47 days');

  ----------------------------------------------------------------------------------------------
  -- Farm books and budgets
  ----------------------------------------------------------------------------------------------
  insert into public.farm_budgets (farm_id, title, fiscal_year, season, enterprise_type, crop_cycle_id, total_budget_kobo, planned_revenue_kobo, status, notes)
  values (f_main, 'Maize NB-A — late season 2026', 2026, '2026 late season', 'crop', c_maize, 486000000, 2880000000, 'active', 'Target 4 t/ha at ₦600/kg.')
  returning id into b_crop;
  insert into public.farm_budgets (farm_id, title, fiscal_year, enterprise_type, total_budget_kobo, planned_revenue_kobo, status)
  values (f_poul, 'Broiler batch B-14', 2026, 'livestock', 1150000000, 1680000000, 'active') returning id into b_poul;
  insert into public.farm_budgets (farm_id, title, fiscal_year, enterprise_type, total_budget_kobo, planned_revenue_kobo, status, notes)
  values (f_main, 'Whole farm — FY 2026', 2026, 'whole_farm', 3400000000, 5200000000, 'approved', 'Board-approved plan shared with AgriCredit MFB.') returning id into b_whole;

  insert into public.farm_budget_lines (budget_id, category, line_item, cost_type, budgeted_amount_kobo, actual_amount_kobo)
  values
    (b_crop, 'land_prep', 'Ploughing and harrowing (12 ha)', 'variable', 42000000, 42000000),
    (b_crop, 'seeds', 'SAMMAZ 15 seed (240 kg)', 'variable', 43200000, 42480000),
    (b_crop, 'fertilisers', 'NPK + urea', 'variable', 210000000, 201500000),
    (b_crop, 'chemicals', 'Herbicide and pesticide', 'variable', 54000000, 51000000),
    (b_crop, 'labour_wages', 'Casual labour', 'variable', 72000000, 39000000),
    (b_crop, 'machinery_hire', 'Combine harvest (planned)', 'variable', 64800000, 0),
    (b_poul, 'feed', 'Starter, grower, finisher feed', 'variable', 820000000, 612000000),
    (b_poul, 'veterinary', 'Vaccines and drugs', 'variable', 42000000, 33000000),
    (b_poul, 'livestock', 'Day-old chicks (2,000)', 'variable', 180000000, 180000000),
    (b_poul, 'utilities', 'Power and water', 'fixed', 38000000, 24000000),
    (b_whole, 'rent', 'Land lease — Akinyele plots', 'fixed', 120000000, 120000000),
    (b_whole, 'insurance', 'Weather-index premium', 'fixed', 38500000, 38500000);

  insert into public.farm_financial_transactions (farm_id, crop_cycle_id, budget_id, type, category, amount_kobo, transaction_date, receipt_number, payment_method, description, counterparty, recorded_by)
  values
    (f_main, c_maize_old, b_whole, 'income', 'harvest_sale', 948000000, d - 90, 'IFP-INV-2231', 'bank_transfer', 'Maize 15.8 t to Ibadan Foods at ₦600/kg', 'Ibadan Foods Processing Ltd', p_main),
    (f_main, c_maize_old, b_whole, 'income', 'harvest_sale', 697200000, d - 80, 'MKT-0094', 'escrow', 'Maize 12.45 t via CultivaNode marketplace', 'Marketplace buyers', p_main),
    (f_veg, c_tom, null, 'income', 'harvest_sale', 254800000, d - 13, 'BDJ-118', 'cash', 'Tomatoes 98 crates, Bodija', 'Bodija market traders', p_main),
    (f_veg, c_tom, null, 'income', 'harvest_sale', 291200000, d - 8, 'BDJ-121', 'mobile_money', 'Tomatoes 112 crates', 'Bodija market traders', p_main),
    (f_poul, null, b_poul, 'income', 'livestock_sale', 117600000, d - 20, 'FSH-007', 'bank_transfer', 'Catfish 420 kg', 'Ogbomoso fish sellers', p_main),
    (f_poul, null, null, 'income', 'livestock_sale', 59800000, d - 7, 'EGG-W40', 'cash', 'Eggs, week 40 (115 crates)', 'Takie retailers', p_main),
    (f_main, c_maize, b_crop, 'expense', 'machinery_service', 42000000, d - 74, 'ITO-0391', 'bank_transfer', 'Ploughing and harrowing 12 ha', 'Iseyin Tractor Owners', p_main),
    (f_main, c_maize, b_crop, 'expense', 'seeds', 42480000, d - 72, 'OAI-0405', 'bank_transfer', 'SAMMAZ 15 seed 236 kg', 'Oke-Ogun Agro Inputs', p_main),
    (f_main, c_maize, b_crop, 'expense', 'fertilisers', 180000000, d - 70, 'OAI-0412', 'bank_transfer', 'NPK 15-15-15 × 80 bags', 'Oke-Ogun Agro Inputs', p_main),
    (f_main, c_maize, b_crop, 'expense', 'fertilisers', 168000000, d - 45, 'OAI-0438', 'bank_transfer', 'Urea × 80 bags', 'Oke-Ogun Agro Inputs', p_main),
    (f_main, c_maize, b_crop, 'expense', 'chemicals', 33000000, d - 50, 'OAI-0420', 'cash', 'Glyphosate 60 L', 'Oke-Ogun Agro Inputs', p_main),
    (f_main, c_maize, b_crop, 'expense', 'chemicals', 18000000, d - 19, 'OAI-0461', 'cash', 'Emamectin benzoate', 'Oke-Ogun Agro Inputs', p_main),
    (f_main, null, b_crop, 'expense', 'labour_wages', 39000000, d - 2, 'PAY-W41', 'cash', 'Casual labour weeks 37–41', 'Field crew', p_main),
    (f_main, null, b_whole, 'expense', 'fuel', 48000000, d - 15, 'TOT-8812', 'mobile_money', 'Diesel 400 L', 'Total Energies Iseyin', p_main),
    (f_main, null, b_whole, 'expense', 'repairs', 42000000, d - 60, 'ITC-221', 'cash', 'Tractor rear tyre', 'Iseyin Tyre Centre', p_main),
    (f_poul, null, b_poul, 'expense', 'feed', 222000000, d - 12, 'TF-5520', 'bank_transfer', 'Broiler finisher × 120 bags', 'Top Feeds depot', p_main),
    (f_poul, null, b_poul, 'expense', 'other', 180000000, d - 36, 'CHK-B14', 'bank_transfer', 'Day-old chicks × 2,000', 'Amo Farm Sieberer', p_main),
    (f_poul, null, b_poul, 'expense', 'other', 3300000, d - 28, 'VET-0099', 'cash', 'Vaccines (Lasota, Gumboro)', 'Dr. Yemi Alade', p_main),
    (f_veg, c_tom, null, 'expense', 'chemicals', 4800000, d - 1, 'OAI-0470', 'cash', 'Mancozeb and copper fungicide', 'Oke-Ogun Agro Inputs', p_main),
    (f_main, null, b_whole, 'expense', 'other', 38500000, d - 100, 'LIC-WI-26', 'bank_transfer', 'Weather-index insurance premium', 'Leadway Agro Insurance', p_main);

  insert into public.farm_plan_actual_variances (farm_id, standard_id, crop_cycle_id, group_id, entity_type, metric_name, unit, standard_value, plan_value, actual_value, is_farmer_override, farmer_deviation_reason)
  values
    (f_main, (select id from public.farm_agronomic_standards where standard_code = 'GAP_MAIZE_V1'), c_maize, null, 'crop', 'Seed rate', 'kg/ha', 20, 20, 19.7, false, null),
    (f_main, (select id from public.farm_agronomic_standards where standard_code = 'GAP_MAIZE_V1'), c_maize, null, 'crop', 'Basal NPK', 'kg/ha', 250, 250, 250, false, null),
    (f_main, (select id from public.farm_agronomic_standards where standard_code = 'GAP_MAIZE_V1'), c_maize, null, 'crop', 'Urea top-dress', 'kg/ha', 150, 150, 150, false, null),
    (f_main, (select id from public.farm_agronomic_standards where standard_code = 'GAP_MAIZE_V1'), c_maize_old, null, 'crop', 'Yield', 'kg/ha', 4000, 3750, 3531, false, null),
    (f_poul, (select id from public.farm_agronomic_standards where standard_code = 'LIVESTOCK_BROILER_FEED_V1'), null, g_broil, 'livestock', 'Feed conversion ratio', 'ratio', 1.65, 1.70, 1.78, true, 'Heat stress in week 4 reduced intake efficiency.'),
    (f_poul, (select id from public.farm_agronomic_standards where standard_code = 'LIVESTOCK_BROILER_FEED_V1'), null, g_broil, 'livestock', 'Mortality', '%', 3.5, 3.0, 2.0, false, null);

  ----------------------------------------------------------------------------------------------
  -- IoT devices and telemetry
  ----------------------------------------------------------------------------------------------
  insert into public.devices (serial_number, model_id, status, firmware_version, battery_level_pct, signal_rssi, last_seen_at, assigned_owner_id)
  values ('CN-NG-2026-D0101', '11111111-1111-1111-1111-111111111101', 'active', '1.2.0', 84, -98, now() - interval '9 minutes', p_main) returning id into dev1;
  insert into public.devices (serial_number, model_id, status, firmware_version, battery_level_pct, signal_rssi, last_seen_at, assigned_owner_id)
  values ('CN-NG-2026-D0102', '11111111-1111-1111-1111-111111111101', 'active', '1.2.0', 71, -104, now() - interval '14 minutes', p_main) returning id into dev2;
  insert into public.devices (serial_number, model_id, status, firmware_version, battery_level_pct, signal_rssi, last_seen_at, assigned_owner_id)
  values ('CN-NG-2026-D0201', '11111111-1111-1111-1111-111111111102', 'active', '2.0.1', 92, -86, now() - interval '6 minutes', p_main) returning id into dev3;
  insert into public.devices (serial_number, model_id, status, firmware_version, battery_level_pct, signal_rssi, last_seen_at, assigned_owner_id)
  values ('CN-NG-2026-D0301', '11111111-1111-1111-1111-111111111103', 'degraded', '1.1.4', 13, -112, now() - interval '3 hours', p_main) returning id into dev4;

  insert into public.device_installations (device_id, farm_id, plot_id, crop_cycle_id, sensor_depth_cm, soil_texture, location, installed_by, is_active, calibrated_at, next_calibration_due)
  values
    (dev1, f_main, pl_m1, c_maize, 30, 'sandy_loam', extensions.st_setsrid(extensions.st_makepoint(3.6031, 7.9722), 4326)::extensions.geography, p_main, true, now() - interval '70 days', now() + interval '110 days'),
    (dev2, f_veg, pl_v1, c_tom, 20, 'sandy_loam', extensions.st_setsrid(extensions.st_makepoint(3.9161, 7.5267), 4326)::extensions.geography, p_main, true, now() - interval '90 days', now() + interval '90 days'),
    (dev3, f_main, pl_m2, c_cass, null, null, extensions.st_setsrid(extensions.st_makepoint(3.6050, 7.9760), 4326)::extensions.geography, p_main, true, now() - interval '120 days', now() + interval '60 days'),
    (dev4, f_poul, pl_p1, null, null, null, extensions.st_setsrid(extensions.st_makepoint(4.2440, 8.1338), 4326)::extensions.geography, p_main, true, now() - interval '200 days', now() - interval '20 days');

  -- 48 hours of hourly readings per channel.
  insert into public.telemetry_readings (device_id, plot_id, channel_code, raw_value, calibrated_value, unit, source_timestamp, sequence_number, quality_flag)
  select dev1, pl_m1, 'soil_moisture_pct', v, v, '%', ts, 100000 + g, 'valid'
    from (select g, now() - g * interval '1 hour' ts, round((24 - g * 0.12 + 2.5 * sin(g / 3.8))::numeric, 1) v from generate_series(0, 47) g) x;
  insert into public.telemetry_readings (device_id, plot_id, channel_code, raw_value, calibrated_value, unit, source_timestamp, sequence_number, quality_flag)
  select dev1, pl_m1, 'air_temperature_c', v, v, '°C', ts, 200000 + g, 'valid'
    from (select g, now() - g * interval '1 hour' ts, round((27 + 5 * sin((extract(hour from now() - g * interval '1 hour') - 9) / 24.0 * 2 * pi()))::numeric, 1) v from generate_series(0, 47) g) x;
  insert into public.telemetry_readings (device_id, plot_id, channel_code, raw_value, calibrated_value, unit, source_timestamp, sequence_number, quality_flag)
  select dev2, pl_v1, 'soil_moisture_pct', v, v, '%', ts, 300000 + g, 'valid'
    from (select g, now() - g * interval '1 hour' ts, round((31 + 4 * sin(g / 5.0))::numeric, 1) v from generate_series(0, 47) g) x;
  insert into public.telemetry_readings (device_id, plot_id, channel_code, raw_value, calibrated_value, unit, source_timestamp, sequence_number, quality_flag)
  select dev2, pl_v1, 'air_humidity_pct', v, v, '%', ts, 400000 + g, 'valid'
    from (select g, now() - g * interval '1 hour' ts, round((80 + 9 * cos((extract(hour from now() - g * interval '1 hour') - 3) / 24.0 * 2 * pi()))::numeric, 1) v from generate_series(0, 47) g) x;
  insert into public.telemetry_readings (device_id, plot_id, channel_code, raw_value, calibrated_value, unit, source_timestamp, sequence_number, quality_flag)
  select dev3, pl_m2, 'rainfall_mm', v, v, 'mm', ts, 500000 + g, 'valid'
    from (select g, now() - g * interval '1 hour' ts, case when g between 30 and 33 then 4.2 when g = 34 then 11.8 else 0 end v from generate_series(0, 47) g) x;
  insert into public.telemetry_readings (device_id, plot_id, channel_code, raw_value, calibrated_value, unit, source_timestamp, sequence_number, quality_flag)
  select dev4, pl_p1, 'water_level_pct', v, v, '%', ts, 600000 + g, case when g = 0 then 'suspicious'::public.telemetry_quality_flag else 'valid' end
    from (select g, now() - interval '3 hours' - g * interval '1 hour' ts, round((22 + g * 0.6)::numeric, 1) v from generate_series(0, 47) g) x;

  insert into public.device_alerts (farm_id, plot_id, device_id, rule_id, channel_code, observation, confidence, suggested_action, source, severity, status, triggered_at)
  values
    (f_veg, pl_v1, dev2, '22222222-2222-2222-2222-222222222204', 'air_humidity_pct', 'Humidity above 85% for 9 hours overnight with warm temperatures.', 0.92, 'Inspect tomato leaves for early blight before the next spray; delay foliar feed if rain is forecast.', 'sensor reading', 'warning', 'open', now() - interval '7 hours'),
    (f_poul, pl_p1, dev4, '22222222-2222-2222-2222-222222222203', 'water_level_pct', 'Tank level has been under 25% for 4 hours.', 0.97, 'Check the borehole pump (under repair) and arrange a water tanker for the layer house.', 'sensor reading', 'warning', 'acknowledged', now() - interval '4 hours'),
    (f_poul, pl_p1, dev4, '22222222-2222-2222-2222-222222222205', 'battery_pct', 'Node battery at 13%.', 0.99, 'Clean the solar panel and check the charging cable.', 'device watchdog', 'critical', 'open', now() - interval '3 hours');

  ----------------------------------------------------------------------------------------------
  -- Irrigation
  ----------------------------------------------------------------------------------------------
  insert into public.irrigation_zones (farm_id, plot_id, name, method, water_source, area_ha, flow_rate_lpm, target_moisture_pct, current_moisture_pct, status, schedule)
  values (f_veg, pl_v1, 'Tomato tunnel drip', 'drip', 'borehole', 2.4, 180, 32, 29.4, 'scheduled', '{"days":["mon","wed","fri","sun"],"start":"06:00","minutes":75}')
  returning id into z1;
  insert into public.irrigation_zones (farm_id, plot_id, name, method, water_source, area_ha, flow_rate_lpm, target_moisture_pct, current_moisture_pct, status, schedule)
  values (f_veg, pl_v2, 'Pepper & okra sprinklers', 'sprinkler', 'borehole', 3.1, 240, 30, 24.8, 'fault', '{"days":["tue","thu","sat"],"start":"05:30","minutes":60}')
  returning id into z2;
  insert into public.irrigation_zones (farm_id, plot_id, name, method, water_source, area_ha, flow_rate_lpm, target_moisture_pct, current_moisture_pct, status, schedule)
  values (f_main, pl_m2, 'River Flats furrow', 'furrow', 'river', 10.5, 900, 26, 21.7, 'idle', '{"mode":"sensor","threshold_pct":20}')
  returning id into z3;
  insert into public.irrigation_events (farm_id, zone_id, started_at, ended_at, volume_litres, energy_kwh, trigger, status, notes)
  select f_veg, z1, (d - g * 2)::timestamptz + time '06:00', (d - g * 2)::timestamptz + time '07:15', 13500, 4.8,
         case when g % 3 = 0 then 'sensor' else 'schedule' end, 'completed', null
    from generate_series(1, 6) g;
  insert into public.irrigation_events (farm_id, zone_id, started_at, ended_at, volume_litres, trigger, status, notes)
  values (f_veg, z2, (d - 2)::timestamptz + time '05:30', (d - 2)::timestamptz + time '05:41', 2600, 'schedule', 'failed', 'Pressure drop — blocked laterals on bed 3.'),
         (f_veg, z2, (d - 4)::timestamptz + time '05:30', (d - 4)::timestamptz + time '06:30', 14400, 'schedule', 'completed', null),
         (f_main, z3, (d - 12)::timestamptz + time '07:00', (d - 12)::timestamptz + time '12:00', 270000, 'manual', 'completed', 'Dry spell support for cassava.'),
         (f_veg, z1, (d + 1)::timestamptz + time '06:00', null, null, 'schedule', 'planned', null);

  ----------------------------------------------------------------------------------------------
  -- Service bookings (machinery hire)
  ----------------------------------------------------------------------------------------------
  insert into public.listings (owner_id, kind, equipment_type, title, description, operator_included, location, service_radius_km, status)
  values (p_tract, 'equipment', 'tractor', '75 hp tractor with disc plough and harrow', 'Massey Ferguson 375 with trained operator. Ploughing and harrowing across Oke-Ogun.', true,
          extensions.st_setsrid(extensions.st_makepoint(3.5980, 7.9700), 4326)::extensions.geography, 60, 'active')
  returning id into lst_tractor;
  insert into public.listing_rates (listing_id, unit, rate_kobo) values (lst_tractor, 'hectare', 3500000), (lst_tractor, 'day', 22000000);
  insert into public.listings (owner_id, kind, equipment_type, title, description, operator_included, location, service_radius_km, status)
  values (p_main, 'equipment', 'sprayer', '600 L boom sprayer with operator', 'Jacto Condor boom sprayer for herbicide and pesticide passes.', true,
          extensions.st_setsrid(extensions.st_makepoint(3.6012, 7.9735), 4326)::extensions.geography, 40, 'active')
  returning id into lst_spray;
  insert into public.listing_rates (listing_id, unit, rate_kobo) values (lst_spray, 'hectare', 1800000);

  insert into public.bookings (farmer_id, provider_id, listing_id, farm_id, listing_title, listing_kind, equipment_type, farm_name, job_location, job_state, job_lga, distance_km,
                               job_date, unit, quantity, rate_kobo, total_kobo, farmer_note, status, expires_at, responded_at, created_at)
  values
    (p_main, p_tract, lst_tractor, f_main, '75 hp tractor with disc plough and harrow', 'equipment', 'tractor', 'Adeyemi Family Farm',
     extensions.st_setsrid(extensions.st_makepoint(3.6012, 7.9735), 4326)::extensions.geography, 'Oyo', 'Iseyin', 0.8,
     d + 9, 'hectare', 8, 3500000, 28000000, 'Clear and plough OF-D for dry-season vegetables.', 'accepted', now() + interval '2 days', now() - interval '6 hours', now() - interval '1 day'),
    (p_main, p_tract, lst_tractor, f_main, '75 hp tractor with disc plough and harrow', 'equipment', 'tractor', 'Adeyemi Family Farm',
     extensions.st_setsrid(extensions.st_makepoint(3.6012, 7.9735), 4326)::extensions.geography, 'Oyo', 'Iseyin', 0.8,
     d - 74, 'hectare', 12, 3500000, 42000000, 'NB-A late-season maize.', 'completed', now() - interval '72 days', now() - interval '77 days', now() - interval '78 days'),
    (p_f1, p_main, lst_spray, f_o1, '600 L boom sprayer with operator', 'equipment', 'sprayer', 'Ojo Maize Farm',
     extensions.st_setsrid(extensions.st_makepoint(3.5870, 7.9910), 4326)::extensions.geography, 'Oyo', 'Iseyin', 2.4,
     d + 3, 'hectare', 6, 1800000, 10800000, 'Pre-emergence herbicide after planting.', 'requested', now() + interval '20 hours', null, now() - interval '4 hours'),
    (p_f3, p_main, lst_spray, f_o3, '600 L boom sprayer with operator', 'equipment', 'sprayer', 'Afolabi Soybean Fields',
     extensions.st_setsrid(extensions.st_makepoint(3.3920, 8.1820), 4326)::extensions.geography, 'Oyo', 'Kajola', 24.6,
     d, 'hectare', 11, 1800000, 19800000, null, 'in_progress', now() + interval '1 day', now() - interval '2 days', now() - interval '3 days'),
    (p_f2, p_main, lst_spray, f_o2, '600 L boom sprayer with operator', 'equipment', 'sprayer', 'Bello Cassava Holding',
     extensions.st_setsrid(extensions.st_makepoint(3.4910, 8.1410), 4326)::extensions.geography, 'Oyo', 'Itesiwaju', 19.8,
     d - 6, 'hectare', 5.5, 1800000, 9900000, null, 'awaiting_confirmation', now() + interval '1 day', now() - interval '8 days', now() - interval '9 days');

  insert into public.notifications (profile_id, kind, data, read_at, created_at)
  values
    (p_main, 'booking_accepted', '{"title":"Tractor booking accepted","body":"Iseyin Tractor Owners accepted ploughing on 8 ha for next week."}', null, now() - interval '6 hours'),
    (p_main, 'booking_requested', '{"title":"New sprayer request","body":"Kunle Ojo asked for 6 ha of herbicide spraying."}', null, now() - interval '4 hours'),
    (p_main, 'crop_alert', '{"title":"Blight risk on tomatoes","body":"Humidity stayed above 85% overnight in the tomato tunnel."}', null, now() - interval '7 hours'),
    (p_main, 'payment_received', '{"title":"Escrow released","body":"₦697,200 for maize order MKT-0094 is on its way to your account."}', now() - interval '2 days', now() - interval '3 days'),
    (p_main, 'contract_update', '{"title":"Delivery accepted","body":"Ibadan Foods accepted 6.2 t of cassava under contract IFP-OT-2026-014."}', now() - interval '1 day', now() - interval '5 days'),
    (p_main, 'system', '{"title":"Weather advisory","body":"Nine dry days forecast for Iseyin. Plan irrigation for tasseling maize."}', null, now() - interval '1 day');

  ----------------------------------------------------------------------------------------------
  -- Marketplace: sellers, listings, lots, orders, shipments, reviews, RFQs, disputes
  ----------------------------------------------------------------------------------------------
  select id into cat_cereal from public.marketplace_categories where slug = 'cereals-grains';
  select id into cat_roots from public.marketplace_categories where slug = 'roots-tubers';
  select id into cat_veg from public.marketplace_categories where slug = 'vegetables';
  select id into cat_legume from public.marketplace_categories where slug = 'legumes-pulses';
  select id into cat_fert from public.marketplace_categories where slug = 'fertilisers';
  select id into cat_seed from public.marketplace_categories where slug = 'seeds-seedlings';
  select id into cat_prot from public.marketplace_categories where slug = 'crop-protection';
  select id into cat_mach from public.marketplace_categories where slug = 'machinery';

  insert into public.marketplace_sellers (profile_id, seller_type, business_name, description, rating_avg, rating_count, verification_status, is_demo)
  values (p_main, 'farmer', 'Adeyemi Family Farm', 'Family farm in Iseyin growing maize, cassava, soybean and vegetables since 1998.', 4.8, 23, 'verified', true) returning id into s_main;
  insert into public.marketplace_sellers (profile_id, seller_type, business_name, description, rating_avg, rating_count, verification_status, is_demo)
  values (p_dealer, 'agro_dealer', 'Oke-Ogun Agro Inputs', 'Licensed agro-dealer in Saki supplying certified seed, fertiliser and crop protection.', 4.6, 58, 'trusted', true) returning id into s_dealer;
  insert into public.marketplace_sellers (profile_id, seller_type, business_name, description, rating_avg, rating_count, verification_status, is_demo)
  values (p_tract, 'machinery_owner', 'Iseyin Tractor Owners Association', 'Twelve tractors with trained operators serving Oke-Ogun.', 4.7, 41, 'verified', true) returning id into s_tract;
  insert into public.marketplace_sellers (profile_id, seller_type, business_name, description, rating_avg, rating_count, verification_status, is_demo)
  values (p_f6, 'farmer', 'Adebayo Vegetables, Ogbomoso', 'Peppers, okra and leafy vegetables, harvested to order.', 4.4, 9, 'verified', true) returning id into s_buyer;

  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status, is_verified)
  values (s_main, cat_cereal, (select id from public.marketplace_products where slug = 'yellow-maize-grain'), 'produce', 'Yellow maize, grade A — 8 tonnes', 'Clean, dried to 13.5% moisture, bagged in 100 kg jute bags. Lab aflatoxin test available.', 'kg', 'per_unit', 61000, 500, 0,
          extensions.st_setsrid(extensions.st_makepoint(3.6012, 7.9735), 4326)::extensions.geography, 'Iseyin warehouse', 'Oyo', 'Iseyin', '{pickup,seller_delivery}', 'active', true) returning id into l1;
  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status, is_verified)
  values (s_main, cat_veg, (select id from public.marketplace_products where slug = 'roma-tomatoes'), 'produce', 'Roma tomatoes — fresh crates', 'Firm, red Padma F1 tomatoes from drip-irrigated tunnels. Picked the morning of dispatch.', 'crate', 'per_unit', 2800000, 5, 0,
          extensions.st_setsrid(extensions.st_makepoint(3.9158, 7.5263), 4326)::extensions.geography, 'Akinyele, Moniya road', 'Oyo', 'Akinyele', '{pickup,seller_delivery}', 'active', true) returning id into l2;
  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status)
  values (s_main, cat_roots, (select id from public.marketplace_products where slug = 'cassava-tubers'), 'produce', 'Cassava roots TME 419 — forward sale', 'Harvest from March 2027, 10.5 ha under contract farming. Book volume now.', 'tonne', 'negotiable', 19000000, 5, 0,
          extensions.st_setsrid(extensions.st_makepoint(3.6050, 7.9760), 4326)::extensions.geography, 'River Flats, Iseyin', 'Oyo', 'Iseyin', '{pickup}', 'active') returning id into l3;
  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status, is_verified)
  values (s_dealer, cat_fert, (select id from public.marketplace_products where slug = 'npk-15-15-15'), 'input', 'NPK 15-15-15 (50 kg) — Notore', 'Genuine Notore NPK. Delivery across Oke-Ogun for orders of 20 bags or more.', 'bag', 'per_unit', 2250000, 1, 0,
          extensions.st_setsrid(extensions.st_makepoint(3.3920, 8.6670), 4326)::extensions.geography, 'Saki main market', 'Oyo', 'Saki West', '{pickup,seller_delivery}', 'active', true) returning id into l4;
  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status, is_verified)
  values (s_dealer, cat_fert, (select id from public.marketplace_products where slug = 'granular-urea-46'), 'input', 'Granular urea 46% N (50 kg)', 'Dangote granular urea for top-dressing.', 'bag', 'per_unit', 2100000, 1, 0,
          extensions.st_setsrid(extensions.st_makepoint(3.3920, 8.6670), 4326)::extensions.geography, 'Saki main market', 'Oyo', 'Saki West', '{pickup,seller_delivery}', 'active', true) returning id into l5;
  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status, is_verified)
  values (s_dealer, cat_seed, (select id from public.marketplace_products where slug = 'seed-sammaz-15'), 'input', 'SAMMAZ 15 hybrid maize seed (2 kg)', 'Drought-tolerant, Striga-tolerant hybrid. NASC-certified lot.', 'piece', 'per_unit', 450000, 1, 0,
          extensions.st_setsrid(extensions.st_makepoint(3.3920, 8.6670), 4326)::extensions.geography, 'Saki main market', 'Oyo', 'Saki West', '{pickup,seller_delivery}', 'active', true) returning id into l6;
  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status)
  values (s_dealer, cat_prot, (select id from public.marketplace_products where slug = 'herbicide-glyphosate-480'), 'input', 'Glyphosate 480 SL (1 L)', 'Non-selective systemic herbicide.', 'litre', 'per_unit', 550000, 1, 0,
          extensions.st_setsrid(extensions.st_makepoint(3.3920, 8.6670), 4326)::extensions.geography, 'Saki main market', 'Oyo', 'Saki West', '{pickup}', 'active') returning id into l7;
  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status, is_verified)
  values (s_tract, cat_mach, (select id from public.marketplace_products where slug = 'tractor-4wd-75hp-plough'), 'machinery', 'Ploughing + harrowing per hectare', 'Tractor with operator and fuel included. Minimum 3 ha per job.', 'hectare', 'per_unit', 3500000, 3, 0,
          extensions.st_setsrid(extensions.st_makepoint(3.5980, 7.9700), 4326)::extensions.geography, 'Iseyin mechanisation yard', 'Oyo', 'Iseyin', '{seller_delivery}', 'active', true) returning id into l8;
  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status)
  values (s_buyer, cat_veg, (select id from public.marketplace_products where slug = 'scotch-bonnet-pepper-rodo'), 'produce', 'Scotch bonnet (rodo) — crates', 'Hot red and yellow rodo, sorted and crated.', 'crate', 'per_unit', 3400000, 2, 0,
          extensions.st_setsrid(extensions.st_makepoint(4.2436, 8.1335), 4326)::extensions.geography, 'Ogbomoso, Takie', 'Oyo', 'Ogbomosho North', '{pickup,seller_delivery}', 'active') returning id into l9;
  insert into public.marketplace_listings (seller_id, category_id, product_id, listing_type, title, description, unit, price_model, base_price_kobo, min_order_quantity, available_quantity, location, location_address, location_state, location_lga, delivery_options, status)
  values (s_main, cat_legume, null, 'produce', 'Soybean TGX 1835 — pre-harvest booking', 'Expected 18 t from Ridge Field C in December. Clean, bagged.', 'tonne', 'negotiable', 76000000, 2, 0,
          extensions.st_setsrid(extensions.st_makepoint(3.6012, 7.9735), 4326)::extensions.geography, 'Iseyin warehouse', 'Oyo', 'Iseyin', '{pickup}', 'active') returning id into l10;

  insert into public.marketplace_inventory_lots (listing_id, lot_number, physical_quantity, storage_location, expiry_date)
  values (l1, 'MZ-2026-B3', 8400, 'Bay 3', null), (l2, 'TOM-R5', 86, 'Cold room', d + 6), (l3, 'CAS-FWD-27', 180, 'In field', null),
         (l4, 'NPK-NT-0926', 640, 'Saki store', null), (l5, 'UREA-DG-0926', 410, 'Saki store', null), (l6, 'S15-NASC-24-118', 1200, 'Saki store', d + 220),
         (l7, 'GLY-0726', 380, 'Saki store', d + 600), (l8, 'TRACT-SEASON', 400, 'Fleet', null), (l9, 'ROD-W41', 64, 'Ogbomoso shed', d + 5),
         (l10, 'SOY-FWD-26', 18, 'In field', null);

  insert into public.marketplace_produce_provenance (listing_id, farm_id, plot_id, crop_cycle_id, batch_code, harvest_date, grade, moisture_pct, quality_notes, certifications)
  values (l1, f_main, pl_m4, c_maize_old, 'MZ-OF-D-02', d - 92, 'grade_a', 13.5, 'Aflatoxin below 4 ppb (lab ref IITA-AF-0931).', '{"GAP self-assessed"}'),
         (l2, f_veg, pl_v1, c_tom, 'TM-TT1-R5', d - 4, 'grade_a', null, 'Drip-irrigated, picked at breaker-to-red stage.', '{}'),
         (l3, f_main, pl_m2, c_cass, null, null, 'processing_grade', null, 'High-starch TME 419.', '{}'),
         (l10, f_main, pl_m3, c_soy, null, null, 'grade_a', null, null, '{}');

  -- Orders: the demo account buys inputs and sells produce.
  insert into public.marketplace_orders (order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo, platform_fee_kobo, total_amount_kobo, status, payment_status, delivery_address, placed_at, paid_at, created_at)
  values ('ORD-2026-10-0041', p_main, 'business', 67500000, 1500000, 0, 69000000, 'processing', 'escrowed', '{"line":"Adeyemi Family Farm, Iseyin","state":"Oyo"}', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days')
  returning id into o1;
  insert into public.marketplace_order_items (order_id, listing_id, seller_id, title, unit, quantity, unit_price_kobo, subtotal_kobo, commission_bps, commission_kobo, seller_earnings_kobo)
  values (o1, l4, s_dealer, 'NPK 15-15-15 (50 kg) — Notore', 'bag', 30, 2250000, 67500000, 300, 2025000, 65475000);
  insert into public.marketplace_fulfilments (fulfilment_number, order_id, seller_id, status, subtotal_kobo, delivery_fee_kobo, delivery_method, dispatched_at)
  values ('FUL-0041-A', o1, s_dealer, 'in_transit', 67500000, 1500000, 'seller_delivery', now() - interval '1 day') returning id into fu1;

  insert into public.marketplace_orders (order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo, total_amount_kobo, status, payment_status, delivery_address, placed_at, paid_at, completed_at, created_at)
  values ('ORD-2026-08-0094', p_buyer, 'bulk', 697200000, 0, 697200000, 'completed', 'released', '{"line":"Ibadan Foods, Oluyole Estate","state":"Oyo"}', now() - interval '84 days', now() - interval '84 days', now() - interval '80 days', now() - interval '84 days')
  returning id into o2;
  insert into public.marketplace_order_items (order_id, listing_id, seller_id, title, unit, quantity, unit_price_kobo, subtotal_kobo, commission_bps, commission_kobo, seller_earnings_kobo)
  values (o2, l1, s_main, 'Yellow maize, grade A', 'kg', 12450, 56000, 697200000, 0, 0, 697200000);
  insert into public.marketplace_fulfilments (fulfilment_number, order_id, seller_id, status, subtotal_kobo, delivery_method, dispatched_at, delivered_at, confirmed_at)
  values ('FUL-0094-A', o2, s_main, 'delivered', 697200000, 'pickup', now() - interval '83 days', now() - interval '82 days', now() - interval '80 days') returning id into fu2;

  insert into public.marketplace_orders (order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo, total_amount_kobo, status, payment_status, delivery_address, placed_at, paid_at, created_at)
  values ('ORD-2026-10-0057', p_f6, 'retail', 56000000, 3000000, 59000000, 'paid', 'escrowed', '{"line":"Takie, Ogbomoso","state":"Oyo"}', now() - interval '20 hours', now() - interval '19 hours', now() - interval '20 hours')
  returning id into o3;
  insert into public.marketplace_order_items (order_id, listing_id, seller_id, title, unit, quantity, unit_price_kobo, subtotal_kobo, commission_bps, commission_kobo, seller_earnings_kobo)
  values (o3, l2, s_main, 'Roma tomatoes — fresh crates', 'crate', 20, 2800000, 56000000, 300, 1680000, 54320000);
  insert into public.marketplace_fulfilments (fulfilment_number, order_id, seller_id, status, subtotal_kobo, delivery_fee_kobo, delivery_method)
  values ('FUL-0057-A', o3, s_main, 'preparing', 56000000, 3000000, 'seller_delivery') returning id into fu3;

  insert into public.marketplace_orders (order_number, buyer_id, order_type, items_subtotal_kobo, delivery_fee_kobo, total_amount_kobo, status, payment_status, delivery_address, placed_at, paid_at, created_at)
  values ('ORD-2026-10-0049', p_main, 'retail', 13600000, 0, 13600000, 'disputed', 'escrowed', '{"line":"Akinyele plots","state":"Oyo"}', now() - interval '6 days', now() - interval '6 days', now() - interval '6 days')
  returning id into o4;
  insert into public.marketplace_order_items (order_id, listing_id, seller_id, title, unit, quantity, unit_price_kobo, subtotal_kobo, commission_bps, commission_kobo, seller_earnings_kobo)
  values (o4, l9, s_buyer, 'Scotch bonnet (rodo) — crates', 'crate', 4, 3400000, 13600000, 300, 408000, 13192000);
  insert into public.marketplace_fulfilments (fulfilment_number, order_id, seller_id, status, subtotal_kobo, delivery_method, delivered_at)
  values ('FUL-0049-A', o4, s_buyer, 'disputed', 13600000, 'seller_delivery', now() - interval '4 days') returning id into fu4;

  insert into public.marketplace_payments (order_id, payment_reference, provider, amount_kobo, status, verified_at, created_at)
  values (o1, 'PSK-DEMO-0041', 'paystack', 69000000, 'successful', now() - interval '3 days', now() - interval '3 days'),
         (o2, 'PSK-DEMO-0094', 'paystack', 697200000, 'successful', now() - interval '84 days', now() - interval '84 days'),
         (o3, 'FLW-DEMO-0057', 'flutterwave', 59000000, 'successful', now() - interval '19 hours', now() - interval '19 hours'),
         (o4, 'PSK-DEMO-0049', 'paystack', 13600000, 'successful', now() - interval '6 days', now() - interval '6 days');
  insert into public.marketplace_escrows (order_id, fulfilment_id, buyer_id, seller_id, amount_kobo, commission_kobo, seller_net_kobo, status, held_at, released_at, auto_release_deadline)
  values (o1, fu1, p_main, s_dealer, 69000000, 2025000, 66975000, 'held', now() - interval '3 days', null, now() + interval '4 days'),
         (o2, fu2, p_buyer, s_main, 697200000, 0, 697200000, 'released', now() - interval '84 days', now() - interval '80 days', null),
         (o3, fu3, p_f6, s_main, 59000000, 1680000, 57320000, 'held', now() - interval '19 hours', null, now() + interval '6 days'),
         (o4, fu4, p_main, s_buyer, 13600000, 408000, 13192000, 'disputed', now() - interval '6 days', null, null);
  insert into public.marketplace_settlements (escrow_id, seller_id, gross_amount_kobo, commission_kobo, net_payout_kobo, payout_reference, status, processed_at)
  select e.id, e.seller_id, e.amount_kobo, e.commission_kobo, e.seller_net_kobo, 'PAYOUT-DEMO-0094', 'completed', now() - interval '79 days'
    from public.marketplace_escrows e where e.order_id = o2;

  insert into public.marketplace_shipments (fulfilment_id, carrier_type, carrier_profile_id, vehicle_type, tracking_code, pickup_location, dropoff_location, status, pickup_time, created_at)
  values (fu1, 'seller', p_dealer, 'Pickup truck', 'TRK-DEMO-0041',
          extensions.st_setsrid(extensions.st_makepoint(3.3920, 8.6670), 4326)::extensions.geography,
          extensions.st_setsrid(extensions.st_makepoint(3.6012, 7.9735), 4326)::extensions.geography, 'in_transit', now() - interval '1 day', now() - interval '1 day'),
         (fu3, 'cultivanode_fleet', p_main, 'Mitsubishi Canter 3.5 t', 'TRK-DEMO-0057',
          extensions.st_setsrid(extensions.st_makepoint(3.9158, 7.5263), 4326)::extensions.geography,
          extensions.st_setsrid(extensions.st_makepoint(4.2436, 8.1335), 4326)::extensions.geography, 'pickup_pending', null, now() - interval '18 hours'),
         (fu2, 'buyer', p_buyer, '20 t trailer', 'TRK-DEMO-0094',
          extensions.st_setsrid(extensions.st_makepoint(3.6012, 7.9735), 4326)::extensions.geography,
          extensions.st_setsrid(extensions.st_makepoint(3.8530, 7.3530), 4326)::extensions.geography, 'delivered', now() - interval '83 days', now() - interval '83 days');

  insert into public.marketplace_reviews (order_id, seller_id, reviewer_id, rating, comment, created_at)
  values (o2, s_main, p_buyer, 5, 'Clean, dry maize and the weights matched our weighbridge. Will buy again.', now() - interval '79 days');

  insert into public.marketplace_disputes (order_id, fulfilment_id, initiator_id, seller_id, reason, description, status, created_at)
  values (o4, fu4, p_main, s_buyer, 'quality_not_as_described', 'One of four crates was soft and partly rotten on arrival; photos attached in chat.', 'under_review', now() - interval '3 days');

  insert into public.buyer_requests (buyer_id, request_number, title, category_id, target_crop_or_commodity, required_quantity, unit, target_grade, delivery_location, deadline_date, target_budget_kobo, status, notes)
  values (p_buyer, 'RFQ-DEMO-0102', 'Yellow maize for feed mill — 60 t', cat_cereal, 'Yellow maize', 60, 'tonne', 'grade_a', 'Oluyole Industrial Estate, Ibadan', d + 21, 3600000000, 'open', 'Moisture max 14%, aflatoxin certificate required.')
  returning id into rq1;
  insert into public.buyer_requests (buyer_id, request_number, title, category_id, target_crop_or_commodity, required_quantity, unit, delivery_location, deadline_date, target_budget_kobo, status)
  values (p_main, 'RFQ-DEMO-0108', 'NPK 20-10-10 for dry-season vegetables — 40 bags', cat_fert, 'NPK 20-10-10', 40, 'bag', 'Akinyele plots', d + 10, 96000000, 'evaluating'),
         (p_buyer, 'RFQ-DEMO-0111', 'Soybean for oil extraction — 30 t', cat_legume, 'Soybean', 30, 'tonne', 'Oluyole Industrial Estate, Ibadan', d + 70, 2250000000, 'open');
  insert into public.buyer_request_responses (request_id, seller_id, offered_quantity, unit_price_kobo, delivery_fee_kobo, total_quote_kobo, offered_grade, estimated_delivery_date, valid_until, status, seller_notes)
  values (rq1, s_main, 8.4, 60000000, 18000000, 522000000, 'grade_a', d + 7, now() + interval '7 days', 'shortlisted', 'Stored maize from OF-D with lab certificate. Can deliver in two trips.');
  insert into public.buyer_request_responses (request_id, seller_id, offered_quantity, unit_price_kobo, delivery_fee_kobo, total_quote_kobo, estimated_delivery_date, valid_until, status, seller_notes)
  select r.id, s_dealer, 40, 2380000, 2000000, 40 * 2380000 + 2000000, d + 4, now() + interval '6 days', 'submitted', 'Notore NPK 20-10-10, delivered to Akinyele in one trip.'
    from public.buyer_requests r where r.request_number = 'RFQ-DEMO-0108';

  ----------------------------------------------------------------------------------------------
  -- Off-take contracts
  ----------------------------------------------------------------------------------------------
  insert into public.offtake_contracts (contract_number, buyer_id, buyer_name, grower_id, farm_id, crop_cycle_id, commodity, grade, contracted_kg, price_per_kg_kobo, advance_paid_kobo, delivery_start, delivery_end, delivery_point, status, terms, signed_at)
  values ('IFP-OT-2026-014', p_buyer, 'Ibadan Foods Processing Ltd', p_main, f_main, c_cass, 'Cassava roots (TME 419)', 'Processing grade', 200000, 19000, 380000000, d - 30, d + 180, 'Ibadan Foods, Oluyole', 'delivering', 'Starch content ≥ 25%. Price fixed for the season. 10% advance against delivery schedule.', now() - interval '200 days')
  returning id into k1;
  insert into public.offtake_contracts (contract_number, buyer_id, buyer_name, grower_id, farm_id, crop_cycle_id, commodity, grade, contracted_kg, price_per_kg_kobo, delivery_start, delivery_end, delivery_point, status, terms, signed_at)
  values ('IFP-OT-2026-021', p_buyer, 'Ibadan Foods Processing Ltd', p_main, f_main, c_maize, 'Yellow maize', 'Grade A', 30000, 59000, d + 40, d + 75, 'Ibadan Foods, Oluyole', 'signed', 'Moisture ≤ 14%, aflatoxin ≤ 10 ppb.', now() - interval '40 days')
  returning id into k2;
  -- The demo account also buys under contract from outgrowers it supports.
  insert into public.offtake_contracts (contract_number, buyer_id, buyer_name, grower_id, farm_id, commodity, grade, contracted_kg, price_per_kg_kobo, advance_paid_kobo, delivery_start, delivery_end, delivery_point, status, terms, signed_at)
  values ('AFF-OG-2026-003', p_main, 'Adeyemi Family Farm (aggregator)', p_f1, f_o1, 'Yellow maize', 'Grade A/B', 24000, 56000, 0, d + 30, d + 60, 'Iseyin warehouse', 'active', 'Outgrower scheme: seed and fertiliser credit recovered at delivery.', now() - interval '70 days')
  returning id into k3;
  insert into public.offtake_contracts (contract_number, buyer_id, buyer_name, grower_id, farm_id, commodity, contracted_kg, price_per_kg_kobo, delivery_start, delivery_end, delivery_point, status, terms)
  values ('AFF-OG-2026-004', p_main, 'Adeyemi Family Farm (aggregator)', p_f3, f_o3, 'Soybean', 30000, 74000, d + 60, d + 90, 'Iseyin warehouse', 'offered', 'Price review at harvest if Ibadan price moves more than 10%.');

  insert into public.contract_deliveries (contract_id, delivered_on, quantity_kg, grade, moisture_pct, weighbridge_ref, accepted, notes)
  values (k1, d - 25, 21400, 'Processing', null, 'WB-IFP-77120', true, null),
         (k1, d - 12, 18900, 'Processing', null, 'WB-IFP-77455', true, null),
         (k1, d - 5, 6200, 'Processing', null, 'WB-IFP-77702', true, 'Early harvest from the river edge.');

  ----------------------------------------------------------------------------------------------
  -- Processing batches
  ----------------------------------------------------------------------------------------------
  insert into public.processing_batches (owner_id, batch_code, facility_name, input_commodity, input_kg, output_product, output_kg, source_farm_id, stage, quality_grade, moisture_pct, started_at, completed_at, notes)
  values
    (p_main, 'GAR-2026-031', 'Iseyin cassava cluster mill', 'Cassava roots', 6200, 'White garri', 1240, f_main, 'dispatched', 'A', 9.5, now() - interval '5 days', now() - interval '3 days', '20% conversion.'),
    (p_main, 'GAR-2026-032', 'Iseyin cassava cluster mill', 'Cassava roots', 5800, 'White garri', null, f_main, 'drying', null, 18.0, now() - interval '1 day', null, null),
    (p_main, 'PST-2026-007', 'Akinyele pack house', 'Tomatoes grade B', 8600, 'Tomato paste (400 g)', 2150, f_veg, 'packaging', 'A', null, now() - interval '3 days', null, 'Blight-affected fruit diverted from fresh market.'),
    (p_main, 'MZ-2026-019', 'Iseyin warehouse', 'Yellow maize', 8400, 'Cleaned, graded maize', 8180, f_main, 'quality_check', 'A', 13.5, now() - interval '9 days', null, 'Aflatoxin test pending.');

  ----------------------------------------------------------------------------------------------
  -- Market prices: eight weeks for six commodities in four markets
  ----------------------------------------------------------------------------------------------
  insert into public.market_prices (commodity, market, state, unit, price_kobo, observed_on, source, is_demo)
  select c.commodity, m.market, m.state, c.unit,
         round(c.base * m.factor * (1 + 0.012 * (7 - w)) * (1 + 0.03 * sin(w + m.n)))::bigint * 100,
         d - w * 7, 'CultivaNode field agents', true
    from (values ('Yellow maize', 'kg', 590), ('Cassava roots', 'tonne', 185000), ('Soybean', 'tonne', 745000),
                 ('Tomatoes', 'crate', 27000), ('Scotch bonnet', 'crate', 33000), ('Garri (white)', 'kg', 1150)) as c(commodity, unit, base),
         (values ('Bodija, Ibadan', 'Oyo', 1.04, 1), ('Iseyin', 'Oyo', 0.95, 2), ('Ogbomoso', 'Oyo', 0.98, 3), ('Mile 12, Lagos', 'Lagos', 1.12, 4)) as m(market, state, factor, n),
         generate_series(0, 7) w;

  ----------------------------------------------------------------------------------------------
  -- Messages
  ----------------------------------------------------------------------------------------------
  insert into public.message_threads (subject, context_type, context_id, created_by, created_at) values ('Cassava delivery schedule — November', 'contract', k1, p_buyer, now() - interval '6 days') returning id into t1;
  insert into public.message_threads (subject, context_type, context_id, created_by, created_at) values ('Ploughing OF-D next week', 'booking', null, p_main, now() - interval '1 day') returning id into t2;
  insert into public.message_threads (subject, context_type, context_id, created_by, created_at) values ('Soft pepper crates — order 0049', 'order', o4, p_main, now() - interval '3 days') returning id into t3;
  insert into public.message_participants (thread_id, profile_id, last_read_at) values
    (t1, p_buyer, now()), (t1, p_main, now() - interval '2 days'),
    (t2, p_main, now()), (t2, p_tract, now() - interval '5 hours'),
    (t3, p_main, now()), (t3, p_f6, now() - interval '1 day');
  insert into public.messages (thread_id, sender_id, body, created_at) values
    (t1, p_buyer, 'Good morning. Can we bring the next 20 t forward to the first week of November? Our starch line is running ahead of plan.', now() - interval '6 days'),
    (t1, p_main, 'Yes, possible. River Flats can supply about 18 t that week; the rest the week after.', now() - interval '5 days 20 hours'),
    (t1, p_buyer, 'Perfect. I will send the truck schedule. Please keep the roots under 48 hours from harvest.', now() - interval '5 days 18 hours'),
    (t1, p_buyer, 'Truck schedule attached: Tue 4 Nov and Fri 7 Nov, 06:00 pickup at your gate.', now() - interval '1 day'),
    (t2, p_main, 'Hello, please confirm the operator for Thursday. OF-D has some stumps on the north edge.', now() - interval '1 day'),
    (t2, p_tract, 'Confirmed — Ibrahim will come with the MF 375. We will clear the stumps first; no extra charge for 8 ha.', now() - interval '5 hours'),
    (t3, p_main, 'One of the four crates arrived soft and partly rotten. Photos are in the dispute.', now() - interval '3 days'),
    (t3, p_f6, 'Sorry about that. The truck was delayed in the heat. I can replace the crate or refund ₦34,000 — your choice.', now() - interval '2 days'),
    (t3, p_main, 'A replacement crate on Monday is fine. I will close the dispute once it arrives.', now() - interval '1 day');

  ----------------------------------------------------------------------------------------------
  -- Support desk
  ----------------------------------------------------------------------------------------------
  insert into public.support_tickets (ticket_number, requester_id, subject, category, priority, status, channel, sla_due_at, resolved_at, created_at)
  values
    ('TCK-DEMO-1001', p_main, 'Escrow release for order 0094 not showing in bank', 'payment', 'high', 'resolved', 'web', now() - interval '78 days', now() - interval '79 days', now() - interval '80 days'),
    ('TCK-DEMO-1014', p_f2, 'Cannot add second farm on my phone', 'technical', 'normal', 'in_progress', 'agent', now() + interval '10 hours', null, now() - interval '14 hours'),
    ('TCK-DEMO-1015', p_f5, 'Which vaccine for goats before rainy season?', 'agronomy', 'low', 'open', 'sms', now() + interval '2 days', null, now() - interval '6 hours'),
    ('TCK-DEMO-1016', p_f3, 'Tractor did not arrive on booked date', 'booking', 'urgent', 'pending', 'phone', now() + interval '2 hours', null, now() - interval '3 hours'),
    ('TCK-DEMO-1017', p_main, 'Verify BVN — stuck at tier 3', 'verification', 'normal', 'open', 'web', now() + interval '1 day', null, now() - interval '1 day'),
    ('TCK-DEMO-1018', p_f6, 'Buyer opened a dispute on pepper crates', 'marketplace', 'high', 'in_progress', 'whatsapp', now() + interval '6 hours', null, now() - interval '2 days');
  insert into public.support_ticket_messages (ticket_id, author_id, body, is_internal, created_at)
  select t.id, t.requester_id, 'Opening message: ' || t.subject, false, t.created_at from public.support_tickets t where t.ticket_number like 'TCK-DEMO-%';

  ----------------------------------------------------------------------------------------------
  -- Finance hubs: loans, insurance, grants, investment
  ----------------------------------------------------------------------------------------------
  insert into public.loan_applications (reference, applicant_id, lender_id, farm_id, lender_name, product, purpose, amount_kobo, tenor_months, interest_rate_pct, readiness_score, status, disbursed_kobo, repaid_kobo, submitted_at, decided_at, created_at)
  values
    ('LN-DEMO-0007', p_main, p_lender, f_main, 'AgriCredit Microfinance Bank', 'Input finance (season)', 'Fertiliser and seed for 12 ha late-season maize', 450000000, 8, 21.0, 82, 'repaying', 450000000, 180000000, now() - interval '85 days', now() - interval '80 days', now() - interval '86 days'),
    ('LN-DEMO-0012', p_main, p_lender, f_veg, 'AgriCredit Microfinance Bank', 'Equipment lease', 'Drip kit and borehole pump for Akinyele plots', 820000000, 24, 18.5, 79, 'under_review', 0, 0, now() - interval '4 days', null, now() - interval '5 days'),
    ('LN-DEMO-0013', p_f1, p_main, f_o1, 'Adeyemi outgrower credit', 'In-kind input credit', 'NPK, urea and seed for 8 ha maize', 98000000, 5, 0, 64, 'disbursed', 98000000, 0, now() - interval '72 days', now() - interval '70 days', now() - interval '73 days'),
    ('LN-DEMO-0014', p_f3, p_main, f_o3, 'Adeyemi outgrower credit', 'In-kind input credit', 'Inoculant and SSP for 11 ha soybean', 61000000, 5, 0, 71, 'submitted', 0, 0, now() - interval '2 days', null, now() - interval '2 days'),
    ('LN-DEMO-0015', p_f2, p_main, f_o2, 'Adeyemi outgrower credit', 'Cash advance', 'Labour for cassava weeding', 25000000, 3, 5.0, 48, 'declined', 0, 0, now() - interval '20 days', now() - interval '18 days', now() - interval '21 days');

  insert into public.insurance_policies (policy_number, holder_id, insurer_id, farm_id, insurer_name, product, cover_type, crop_or_asset, sum_insured_kobo, premium_kobo, start_date, end_date, status, trigger_terms)
  values ('LWA-WI-26-0331', p_main, null, f_main, 'Leadway Agro Insurance', 'Weather-index maize cover', 'weather_index', 'Maize, 12 ha', 1440000000, 38500000, d - 100, d + 80, 'active', '{"index":"cumulative rainfall","trigger_mm":120,"window_days":30,"station":"CN-NG-2026-D0201"}')
  returning id into pol1;
  insert into public.insurance_policies (policy_number, holder_id, insurer_id, farm_id, insurer_name, product, cover_type, crop_or_asset, sum_insured_kobo, premium_kobo, start_date, end_date, status)
  values ('NAIC-LV-26-1188', p_main, null, f_poul, 'NAIC', 'Poultry flock cover', 'livestock', 'Layers and broilers, 3,400 birds', 950000000, 28500000, d - 200, d + 165, 'active')
  returning id into pol2;
  insert into public.insurance_policies (policy_number, holder_id, insurer_id, farm_id, insurer_name, product, cover_type, crop_or_asset, sum_insured_kobo, premium_kobo, start_date, end_date, status)
  values ('LWA-EQ-25-0090', p_main, null, f_main, 'Leadway Agro Insurance', 'Tractor and implements', 'equipment', 'MF 385 + planter', 3200000000, 64000000, d - 400, d - 35, 'expired');
  insert into public.insurance_claims (claim_number, policy_id, holder_id, incident_date, cause, description, amount_claimed_kobo, amount_paid_kobo, status, created_at)
  values ('CLM-DEMO-0041', pol2, p_main, d - 6, 'Heat stress mortality', '12 broilers lost in a 36°C afternoon; vet report attached.', 3600000, 0, 'assessing', now() - interval '5 days'),
         ('CLM-DEMO-0029', pol2, p_main, d - 150, 'Newcastle outbreak (partial)', '180 layers lost before vaccination booster.', 81000000, 64800000, 'paid', now() - interval '148 days');

  insert into public.grant_programmes (owner_id, title, funder, description, focus_area, max_award_kobo, total_pool_kobo, eligibility, states, opens_on, closes_on, status)
  values (p_main, 'Oke-Ogun Youth Mechanisation Grant', 'Adeyemi Foundation × Oyo ADP', 'Matching grants for youth groups buying shared planters and sprayers.', 'Mechanisation', 500000000, 4000000000, 'Registered youth groups of 5+ members aged 18–35 in Oke-Ogun.', '{Oyo}', d - 20, d + 25, 'open')
  returning id into gp1;
  insert into public.grant_programmes (owner_id, title, funder, description, focus_area, max_award_kobo, total_pool_kobo, eligibility, states, opens_on, closes_on, status)
  values (p_lender, 'Women in Agro-Processing Fund', 'AgriCredit MFB Foundation', 'Equipment grants for women-led cassava and tomato processing.', 'Processing', 300000000, 2500000000, 'Women-led enterprises with at least one year of trading.', '{Oyo,Ogun,Osun}', d - 40, d + 10, 'open')
  returning id into gp2;
  insert into public.grant_programmes (owner_id, title, funder, description, focus_area, max_award_kobo, total_pool_kobo, eligibility, states, opens_on, closes_on, status)
  values (p_lender, 'Climate-Smart Irrigation Pilot', 'AgriCredit MFB Foundation', 'Solar irrigation kits for smallholder vegetable growers.', 'Irrigation', 250000000, 1500000000, 'Vegetable farmers with access to a water source.', '{Oyo,Ogun}', d - 120, d - 30, 'awarded')
  returning id into gp3;
  insert into public.grant_applications (programme_id, applicant_id, farm_id, amount_requested_kobo, amount_awarded_kobo, proposal, score, status, submitted_at)
  values (gp1, p_f1, f_o1, 420000000, null, 'Ekunle Youth Farmers (7 members) — shared 4-row planter.', 74, 'shortlisted', now() - interval '10 days'),
         (gp1, p_f3, f_o3, 480000000, null, 'Okeho soybean youth group — boom sprayer and inoculant.', 81, 'submitted', now() - interval '6 days'),
         (gp1, p_f2, f_o2, 300000000, null, 'Otu women and youth cassava group — cassava planter.', null, 'submitted', now() - interval '2 days'),
         (gp2, p_main, f_veg, 280000000, null, 'Tomato paste line at the Akinyele pack house.', null, 'submitted', now() - interval '12 days'),
         (gp3, p_main, f_veg, 240000000, 240000000, 'Solar drip for the pepper and okra beds.', 88, 'awarded', now() - interval '100 days');

  insert into public.investment_offerings (sponsor_id, title, commodity, structure, target_raise_kobo, raised_kobo, min_ticket_kobo, expected_return_pct, tenor_months, risk_rating, closes_on, status)
  values (p_buyer, 'Ibadan Foods cassava outgrower finance — 2027', 'Cassava', 'offtake_backed', 12000000000, 7400000000, 50000000, 18.0, 12, 'low', d + 30, 'open') returning id into io1;
  insert into public.investment_offerings (sponsor_id, title, commodity, structure, target_raise_kobo, raised_kobo, min_ticket_kobo, expected_return_pct, tenor_months, risk_rating, closes_on, status)
  values (p_tract, 'Iseyin tractor fleet expansion (6 units)', 'Mechanisation services', 'equipment_lease', 18000000000, 4100000000, 100000000, 22.5, 36, 'medium', d + 60, 'open') returning id into io2;
  insert into public.investment_offerings (sponsor_id, title, commodity, structure, target_raise_kobo, raised_kobo, min_ticket_kobo, expected_return_pct, tenor_months, risk_rating, closes_on, status)
  values (p_main, 'Adeyemi dry-season vegetable cycle', 'Tomato and pepper', 'crop_finance', 2500000000, 2500000000, 25000000, 24.0, 6, 'high', d - 10, 'funded') returning id into io3;
  insert into public.investment_commitments (offering_id, investor_id, amount_kobo, status, returned_kobo, created_at)
  values (io1, p_main, 300000000, 'funded', 0, now() - interval '40 days'),
         (io2, p_main, 200000000, 'committed', 0, now() - interval '5 days'),
         (io3, p_lender, 1500000000, 'funded', 0, now() - interval '35 days');

  ----------------------------------------------------------------------------------------------
  -- Impact: NGO programme, research trials, cooperative
  ----------------------------------------------------------------------------------------------
  insert into public.impact_programmes (owner_id, name, organisation, focus, states, budget_kobo, spent_kobo, target_farmers, start_date, end_date, status)
  values (p_main, 'Oke-Ogun Climate-Smart Maize', 'Adeyemi Foundation', 'Drought-tolerant seed, conservation tillage and weather advisories', '{Oyo}', 9500000000, 6120000000, 400, d - 300, d + 400, 'active')
  returning id into ip1;
  insert into public.impact_programmes (owner_id, name, organisation, focus, states, budget_kobo, spent_kobo, target_farmers, start_date, end_date, status)
  values (p_main, 'Women Cassava Processors Network', 'Adeyemi Foundation × WOFAN', 'Garri processing equipment and market linkage', '{Oyo,Ogun}', 4200000000, 1730000000, 120, d - 150, d + 210, 'active')
  returning id into ip2;
  insert into public.programme_beneficiaries (programme_id, farmer_name, profile_id, state, lga, gender, support_type, value_kobo, yield_before_kg_ha, yield_after_kg_ha, enrolled_on, status)
  values
    (ip1, 'Kunle Ojo', p_f1, 'Oyo', 'Iseyin', 'male', 'Seed + extension visits', 12500000, 1800, 3100, d - 280, 'supported'),
    (ip1, 'Aisha Bello', p_f2, 'Oyo', 'Itesiwaju', 'female', 'Seed + extension visits', 12500000, 1500, 2600, d - 280, 'supported'),
    (ip1, 'Tunde Afolabi', p_f3, 'Oyo', 'Kajola', 'male', 'Seed, inoculant + training', 15000000, 1200, 1900, d - 270, 'graduated'),
    (ip1, 'Musa Ibrahim', p_f5, 'Oyo', 'Saki East', 'male', 'Weather SMS + seed', 9000000, 1600, 2300, d - 250, 'supported'),
    (ip1, 'Grace Okonkwo', p_f4, 'Ogun', 'Abeokuta North', 'female', 'Seed + extension visits', 12500000, 1700, null, d - 60, 'enrolled'),
    (ip1, 'Ronke Salami', null, 'Oyo', 'Iseyin', 'female', 'Seed + extension visits', 12500000, 1400, 2500, d - 280, 'supported'),
    (ip1, 'Yakubu Garba', null, 'Oyo', 'Saki West', 'male', 'Conservation tillage training', 6000000, 1900, 2900, d - 240, 'supported'),
    (ip2, 'Aisha Bello', p_f2, 'Oyo', 'Itesiwaju', 'female', 'Garri fryer + grater (shared)', 85000000, null, null, d - 140, 'supported'),
    (ip2, 'Funmi Adebayo', p_f6, 'Oyo', 'Ogbomosho North', 'female', 'Market linkage', 15000000, null, null, d - 120, 'enrolled'),
    (ip2, 'Mama Ibeji Group (12 women)', null, 'Ogun', 'Ifo', 'female', 'Pressing machine', 120000000, null, null, d - 100, 'supported');

  insert into public.research_trials (owner_id, title, institution, crop, design, treatments, farm_id, plot_id, replicates, start_date, end_date, status, findings)
  values
    (p_main, 'Nitrogen rate response of SAMMAZ 15', 'IAR&T Ibadan (on-farm)', 'Maize', 'RCBD', '[{"code":"N0","n_kg_ha":0},{"code":"N60","n_kg_ha":60},{"code":"N120","n_kg_ha":120},{"code":"N180","n_kg_ha":180}]', f_main, pl_m1, 4, d - 68, d + 45, 'running', null),
    (p_main, 'Rhizobium inoculant on TGX soybean', 'IITA Ibadan', 'Soybean', 'Paired plots', '[{"code":"INOC","note":"NoduMax"},{"code":"CTRL","note":"No inoculant"}]', f_main, pl_m3, 3, d - 41, d + 60, 'running', null),
    (p_main, 'Drip vs furrow water use in dry-season tomato', 'NIHORT', 'Tomato', 'Split plot', '[{"code":"DRIP"},{"code":"FURROW"}]', f_veg, pl_v1, 3, d - 260, d - 150, 'published', 'Drip used 41% less water with a 12% higher marketable yield.');

  insert into public.organizations (name, cac_number, owner_id, created_by) values ('Iseyin Progressive Farmers Cooperative (Demo)', 'CS-DEMO-11872', p_main, p_main) returning id into org;
  -- org trigger adds the owner membership and flips account_type; keep the demo user as an individual
  update public.profiles set account_type = 'individual' where id = p_main;
  insert into public.org_members (organization_id, profile_id, member_role, added_by)
  values (org, p_f1, 'worker', p_main), (org, p_f2, 'worker', p_main), (org, p_f3, 'worker', p_main),
         (org, p_f5, 'worker', p_main), (org, p_f6, 'storekeeper', p_main);
  insert into public.cooperative_aggregations (organization_id, commodity, target_kg, pledged_kg, delivered_kg, member_count, price_per_kg_kobo, buyer_name, collection_point, closes_on, status)
  values (org, 'Yellow maize', 120000, 96500, 41200, 38, 58500, 'Ibadan Foods Processing Ltd', 'Iseyin warehouse', d + 45, 'collecting'),
         (org, 'Soybean', 60000, 22000, 0, 17, 74000, null, 'Okeho collection shed', d + 80, 'open'),
         (org, 'Cassava roots', 400000, 400000, 400000, 52, 18500, 'Ibadan Foods Processing Ltd', 'Farm gates', d - 20, 'sold');

  raise notice 'CultivaNode demo data created.';
end
$seed$;
