-- Migration: 20261008180000_marketplace_seed_expansion.sql
-- Description: Comprehensive agricultural seed data covering all Nigerian benchmark crops,
--              inputs, machinery, labour, farm services, and sample listings.

-- 1. Ensure Categories & Subcategories exist
insert into public.marketplace_categories (slug, name, description, icon, sort_order)
values
  ('produce', 'Farm Produce', 'Fresh crops, grains, roots, tubers and vegetables direct from farms', 'sprout', 1),
  ('inputs', 'Farm Inputs', 'Certified seeds, fertilisers, agrochemicals, tools and irrigation equipment', 'package', 2),
  ('machinery', 'Machinery Hire', 'Tractors, planters, harvesters, boom sprayers and tillage equipment', 'tractor', 3),
  ('labour', 'Farm Labour', 'Skilled and casual farm hands, harvesting crews, sprayers and scouting teams', 'users', 4),
  ('services', 'Agricultural Services', 'Agronomy consultations, soil testing, drone spraying and mechanics', 'wrench', 5)
on conflict (slug) do update set name = excluded.name;

-- Subcategories for Produce
insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'cereals-grains', 'Cereals & Grains', 'Maize, rice, sorghum, millet and wheat', 1
from public.marketplace_categories where slug = 'produce'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'roots-tubers', 'Roots & Tubers', 'Cassava, white yam, sweet potato and cocoyam', 2
from public.marketplace_categories where slug = 'produce'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'legumes-pulses', 'Legumes & Pulses', 'Cowpea (beans), soybeans, groundnuts and pigeon pea', 3
from public.marketplace_categories where slug = 'produce'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'vegetables', 'Vegetables', 'Tomatoes, peppers, onions, okra and leafy greens', 4
from public.marketplace_categories where slug = 'produce'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'fruits', 'Fruits & Melons', 'Watermelon, cucumber, pineapple, citrus and mango', 5
from public.marketplace_categories where slug = 'produce'
on conflict (slug) do nothing;

-- Subcategories for Inputs
insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'seeds-seedlings', 'Seeds & Seedlings', 'Certified hybrid and open-pollinated seed varieties', 1
from public.marketplace_categories where slug = 'inputs'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'fertilisers', 'Fertilisers', 'NPK blends, Urea, organic compost and micronutrients', 2
from public.marketplace_categories where slug = 'inputs'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'crop-protection', 'Crop Protection', 'Selective herbicides, insecticides, and fungicides', 3
from public.marketplace_categories where slug = 'inputs'
on conflict (slug) do nothing;

insert into public.marketplace_categories (parent_id, slug, name, description, sort_order)
select id, 'tools-irrigation', 'Tools & Irrigation', 'Drip kits, knapsack sprayers, water pumps and tarpaulins', 4
from public.marketplace_categories where slug = 'inputs'
on conflict (slug) do nothing;

-- 2. Products
-- Grains
insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Paddy Rice (Faro 44)', 'paddy-rice-faro-44', 'Clean un-milled paddy rice, optimal moisture content under 13%', 'tonne'
from public.marketplace_categories where slug = 'cereals-grains'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Milled Parboiled Rice (50kg)', 'milled-parboiled-rice-50kg', 'Long grain stone-free Nigerian parboiled rice in branded bags', 'bag'
from public.marketplace_categories where slug = 'cereals-grains'
on conflict (slug) do nothing;

-- Legumes
insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'White Cowpea / Honey Beans (Oloyin)', 'cowpea-beans-oloyin', 'Dry high-protein sweet cowpea beans, weevil-free, food-grade', 'bag'
from public.marketplace_categories where slug = 'legumes-pulses'
on conflict (slug) do nothing;

-- Vegetables
insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Habanero / Scotch Bonnet Pepper (Rodo)', 'scotch-bonnet-pepper-rodo', 'Pungent fresh red and orange scotch bonnet pepper crates', 'crate'
from public.marketplace_categories where slug = 'vegetables'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Fresh Okra (Lady Finger)', 'fresh-okra', 'Tender dark green okra pods freshly harvested daily', 'basket'
from public.marketplace_categories where slug = 'vegetables'
on conflict (slug) do nothing;

-- Fruits
insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Green Field Cucumbers', 'green-field-cucumbers', 'Crisp fresh field cucumbers harvested at commercial maturity', 'bag'
from public.marketplace_categories where slug = 'fruits'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Sugar Baby Watermelon', 'sugar-baby-watermelon', 'Sweet dense red-flesh watermelons sorted by size classes', 'tonne'
from public.marketplace_categories where slug = 'fruits'
on conflict (slug) do nothing;

-- Inputs
insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Certified Hybrid Maize Seed (SAMMAZ 15)', 'seed-sammaz-15', 'High-yielding drought-tolerant hybrid yellow maize seed, 2kg pack', 'packet'
from public.marketplace_categories where slug = 'seeds-seedlings'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Non-Selective Herbicide (Glyphosate 480 SL)', 'herbicide-glyphosate-480', 'Systemic non-selective post-emergence weed control (1L bottle)', 'litre'
from public.marketplace_categories where slug = 'crop-protection'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Heavy Duty 16L Knapsack Sprayer', 'knapsack-sprayer-16l', 'Manual pressure backpack sprayer with brass lance and pressure regulator', 'piece'
from public.marketplace_categories where slug = 'tools-irrigation'
on conflict (slug) do nothing;

-- Machinery Products
insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, '75HP 4WD Tractor with 3-Disc Plough', 'tractor-4wd-75hp-plough', 'Primary tillage land preparation tractor service per hectare', 'hectare'
from public.marketplace_categories where slug = 'machinery'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Boom Sprayer Tractor Mount (600L)', 'boom-sprayer-600l', 'High-clearance broadacre agrochemical spraying per hectare', 'hectare'
from public.marketplace_categories where slug = 'machinery'
on conflict (slug) do nothing;

-- Labour Products
insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Manual Harvesting & Bagging Crew (5 Persons)', 'labour-harvesting-crew-5p', 'Experienced harvesting team for grain, root and vegetable crops per day', 'day'
from public.marketplace_categories where slug = 'labour'
on conflict (slug) do nothing;

-- Services Products
insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'Comprehensive Farm Soil Chemistry Testing & NPK Audit', 'service-soil-testing-audit', 'Complete NPK, pH, organic carbon, and micronutrient lab analysis per sample', 'sample'
from public.marketplace_categories where slug = 'services'
on conflict (slug) do nothing;

insert into public.marketplace_products (category_id, name, slug, description, default_unit)
select id, 'On-Farm Agronomist Crop Health Scouting Visit', 'service-agronomist-scouting', 'Field diagnostic inspection, pest identification, and treatment prescription', 'visit'
from public.marketplace_categories where slug = 'services'
on conflict (slug) do nothing;

------------------------------------------------------------------------------------------------
-- 3. Demo Marketplace Seller Profiles (Safe Idempotent Setup)
------------------------------------------------------------------------------------------------

-- Demo Seller 1: Premier Grain Hub (Agro Dealer)
insert into public.marketplace_sellers (
  profile_id,
  seller_type,
  business_name,
  business_reg_number,
  description,
  verification_status,
  is_verified,
  rating_avg,
  review_count,
  contact_phone,
  contact_email,
  state,
  lga,
  address
)
select
  p.id,
  'agro_dealer',
  'Premier Oyo Grain Hub & Storage',
  'RC-1049281',
  'Aggregator and licensed agro-dealer supplying cleaned quality grains, seeds, and inputs.',
  'verified',
  true,
  4.9,
  28,
  '+2348030001001',
  'sales@premiergrainhub.ng',
  'Oyo',
  'Ibadan North',
  'Bodija Market Agricultural Depot, Ibadan'
from public.profiles p
where p.role in ('admin', 'farmer')
order by p.created_at asc
limit 1
on conflict do nothing;

-- Demo Seller 2: AgroTech Tractors & Logistics
insert into public.marketplace_sellers (
  profile_id,
  seller_type,
  business_name,
  business_reg_number,
  description,
  verification_status,
  is_verified,
  rating_avg,
  review_count,
  contact_phone,
  contact_email,
  state,
  lga,
  address
)
select
  p.id,
  'machinery_owner',
  'AgroTech Farm Mechanization Fleet',
  'BN-2940192',
  'Tractor tillage, boom spraying, and combine harvesting services across Oyo and Ogun.',
  'verified',
  true,
  4.8,
  19,
  '+2348030001002',
  'bookings@agrotechfleet.ng',
  'Oyo',
  'Iseyin',
  'Farm Mechanization Centre, Iseyin Road'
from public.profiles p
where p.role in ('admin', 'farmer')
order by p.created_at desc
limit 1
on conflict do nothing;
