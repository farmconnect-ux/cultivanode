-- CultivaNode: extensions and shared types
-- PostGIS lives in the `extensions` schema, as Supabase recommends.

create extension if not exists postgis with schema extensions;

-- Individual person or registered business.
create type public.account_type as enum ('individual', 'business');

-- Platform roles a person can hold. One account can hold many.
-- Admin powers are NOT here; they live in public.admin_roles so they can never be self-requested.
create type public.app_role as enum (
  'crop_farmer',
  'animal_farmer',
  'machinery_owner',
  'service_provider',
  'input_supplier',
  'buyer',
  'logistics_provider',
  'field_agent',
  'institutional_partner',
  'investor'
);

-- Only used together with app_role = 'service_provider'.
create type public.provider_type as enum (
  'farm_hand',
  'machine_operator',
  'mechanic',
  'spraying_service',
  'agronomist',
  'vet_doctor',
  'agro_processor'
);

create type public.admin_role as enum (
  'super_admin',
  'verification_officer',
  'support_officer',
  'content_editor',
  'finance_officer'
);

create type public.request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create type public.verification_kind as enum ('phone', 'nin', 'bvn', 'cac', 'document');
create type public.verification_status as enum ('pending', 'verified', 'failed');

-- Staff roles inside a business account.
create type public.org_member_role as enum ('owner', 'farm_manager', 'storekeeper', 'accountant', 'worker');

-- South-West agro-ecological zones used by crop templates.
create type public.farm_zone as enum ('rainforest', 'derived_savanna', 'other');

create type public.app_language as enum ('en', 'yo', 'pcm');

-- Shared trigger: keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
