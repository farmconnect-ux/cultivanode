-- =============================================================================
-- CultivaNode Farm Intelligence: Agronomy Rules & Device Hardware Seed
-- Migration: 003_iot_agronomy_rules_seed.sql
-- Description: Seed initial hardware models, sensor channels, and
--              agronomist-approved conservative alert rules.
-- =============================================================================

--------------------------------------------------------------------------------
-- 1. Hardware Models Seed
--------------------------------------------------------------------------------

-- Model 1: CultivaNode Soil Pro (LoRaWAN)
insert into public.device_models (id, model_code, name, vendor, connectivity, supported_power, hardware_revision, default_firmware, description)
values (
  '11111111-1111-1111-1111-111111111101',
  'CN-SOIL-PRO-V1',
  'CultivaNode Soil & Root Station',
  'CultivaNode Hardware Labs',
  'lorawan',
  '{solar_lifepo4}',
  'v1.2',
  '1.2.0',
  'Precision soil moisture at root depth (FDR probe), air temperature, humidity, and solar battery monitor.'
) on conflict (model_code) do nothing;

-- Model 2: CultivaNode Micro-Weather (Cellular)
insert into public.device_models (id, model_code, name, vendor, connectivity, supported_power, hardware_revision, default_firmware, description)
values (
  '11111111-1111-1111-1111-111111111102',
  'CN-WEATHER-CELL-V1',
  'CultivaNode Plot Micro-Weather Station',
  'CultivaNode Hardware Labs',
  'cellular_2g_4g',
  '{solar_lifepo4}',
  'v2.0',
  '2.0.1',
  'Cellular weather node: Tipping bucket rainfall, canopy temperature, relative humidity, solar irradiance.'
) on conflict (model_code) do nothing;

-- Model 3: CultivaNode Water Intel (Tank & Flow Meter)
insert into public.device_models (id, model_code, name, vendor, connectivity, supported_power, hardware_revision, default_firmware, description)
values (
  '11111111-1111-1111-1111-111111111103',
  'CN-TANK-FLOW-V1',
  'CultivaNode Water Infrastructure Node',
  'CultivaNode Hardware Labs',
  'cellular_2g_4g',
  '{solar_lifepo4, mains_grid}',
  'v1.1',
  '1.1.4',
  'Irrigation readiness monitor: Ultrasonic tank water level % and digital pulse flow meter for delivery detection.'
) on conflict (model_code) do nothing;

--------------------------------------------------------------------------------
-- 2. Sensor Channels Seed
--------------------------------------------------------------------------------

-- Channels for CN-SOIL-PRO-V1
insert into public.sensor_channels (device_model_id, channel_code, display_name, unit, min_valid_value, max_valid_value, precision_decimals, measurement_priority)
values
  ('11111111-1111-1111-1111-111111111101', 'soil_moisture_pct', 'Soil Moisture (Root Depth)', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'soil_temp_c', 'Soil Temperature', '°C', -5.0, 65.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'air_temperature_c', 'Air Temperature', '°C', -10.0, 60.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'air_humidity_pct', 'Relative Humidity', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'battery_pct', 'Node Battery Level', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111101', 'signal_rssi', 'LoRa Signal Strength', 'dBm', -140.0, -20.0, 0, 1)
on conflict (device_model_id, channel_code) do nothing;

-- Channels for CN-WEATHER-CELL-V1
insert into public.sensor_channels (device_model_id, channel_code, display_name, unit, min_valid_value, max_valid_value, precision_decimals, measurement_priority)
values
  ('11111111-1111-1111-1111-111111111102', 'rainfall_mm', 'Rainfall', 'mm', 0.0, 500.0, 1, 2),
  ('11111111-1111-1111-1111-111111111102', 'air_temperature_c', 'Air Temperature', '°C', -10.0, 60.0, 1, 1),
  ('11111111-1111-1111-1111-111111111102', 'air_humidity_pct', 'Relative Humidity', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111102', 'battery_pct', 'Node Battery Level', '%', 0.0, 100.0, 1, 1),
  ('11111111-1111-1111-1111-111111111102', 'signal_rssi', 'Cellular Signal Strength', 'dBm', -130.0, -40.0, 0, 1)
on conflict (device_model_id, channel_code) do nothing;

-- Channels for CN-TANK-FLOW-V1
insert into public.sensor_channels (device_model_id, channel_code, display_name, unit, min_valid_value, max_valid_value, precision_decimals, measurement_priority)
values
  ('11111111-1111-1111-1111-111111111103', 'water_level_pct', 'Water Tank Level', '%', 0.0, 100.0, 1, 2),
  ('11111111-1111-1111-1111-111111111103', 'water_flow_lpm', 'Irrigation Flow Rate', 'L/min', 0.0, 1000.0, 1, 2),
  ('11111111-1111-1111-1111-111111111103', 'battery_pct', 'Node Battery Level', '%', 0.0, 100.0, 1, 1)
on conflict (device_model_id, channel_code) do nothing;

--------------------------------------------------------------------------------
-- 3. Agronomist-Approved Alert Rules Seed
--------------------------------------------------------------------------------

-- Rule 1: Tomato Flowering/Fruiting Moisture Stress
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222201',
  'RULE_TOMATO_MOISTURE_DEFICIT',
  'tomato',
  'flowering',
  null,
  'soil_moisture_pct',
  'sustained_below',
  22.0,
  2.5,
  360, -- 6 hours sustained
  720, -- 12 hours cooldown
  'Tomato Moisture Deficit (Plot Root Zone)',
  'Moisture has stayed below the crop-stage threshold (22%) for six hours.',
  'Inspect irrigation on this plot today. Tomato flowering is sensitive to moisture stress which causes blossom drop.',
  'warning',
  'Dr. A. Adebayo (South-West Horticulture Agronomist)',
  '1.0'
) on conflict (rule_code) do nothing;

-- Rule 2: Maize Tasseling/Silking Moisture Stress
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222202',
  'RULE_MAIZE_MOISTURE_DEFICIT',
  'maize',
  'tasseling',
  null,
  'soil_moisture_pct',
  'sustained_below',
  20.0,
  2.0,
  360, -- 6 hours sustained
  720, -- 12 hours cooldown
  'Maize Tasseling Water Deficit',
  'Soil moisture has remained below 20% for six consecutive hours during critical tasseling stage.',
  'Check irrigation or furrow delivery on this plot. Water stress during pollination sharply reduces ear fill.',
  'warning',
  'Dr. F. Oladipo (IAR&T Maize Agronomist)',
  '1.0'
) on conflict (rule_code) do nothing;

-- Rule 3: Water Tank Low Level Alert
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222203',
  'RULE_TANK_WATER_LOW',
  null,
  null,
  null,
  'water_level_pct',
  'sustained_below',
  25.0,
  5.0,
  30,  -- 30 minutes sustained
  360, -- 6 hours cooldown
  'Low Irrigation Reservoir Level',
  'Tank level is low ({value}%); planned irrigation may not complete.',
  'Verify borehole pump operation and refill the main reservoir before starting drip cycles.',
  'warning',
  'CultivaNode Irrigation Systems Team',
  '1.0'
) on conflict (rule_code) do nothing;

-- Rule 4: Tomato Fungal / Blight Disease Risk (High Humidity + High Temp)
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222204',
  'RULE_TOMATO_FUNGAL_RISK',
  'tomato',
  null,
  null,
  'air_humidity_pct',
  'sustained_above',
  85.0,
  5.0,
  480, -- 8 hours sustained
  1440, -- 24 hours cooldown
  'Elevated Fungal & Blight Risk Condition',
  'High humidity (>85%) and warm temperature increase fungal-risk conditions.',
  'Inspect tomato leaves for early blight spots before scheduled spraying. Delay foliar spray if rain is forecast.',
  'warning',
  'Dr. A. Adebayo (Crop Protection)',
  '1.0'
) on conflict (rule_code) do nothing;

-- Rule 5: Node Battery Depleted
insert into public.alert_rules (
  id, rule_code, crop_type, crop_stage, soil_type, channel_code,
  operator, threshold_value, hysteresis_delta, sustained_duration_minutes, cooldown_minutes,
  title, observation_template, suggested_action, severity, approved_by, version
) values (
  '22222222-2222-2222-2222-222222222205',
  'RULE_DEVICE_BATTERY_CRITICAL',
  null,
  null,
  null,
  'battery_pct',
  '<',
  15.0,
  5.0,
  0,
  720,
  'Sensor Node Battery Low',
  'Sensor battery is below 15% ({value}%). Node may enter low-power sleep mode.',
  'Check solar panel orientation, clean surface dust or foliage shade, and inspect charging cable.',
  'critical',
  'Hardware Operations Lead',
  '1.0'
) on conflict (rule_code) do nothing;
