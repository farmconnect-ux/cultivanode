-- CultivaNode MVP W1–W3: identity, farms, listings, bookings (no money).
create table if not exists profiles (
  user_id text primary key,
  full_name text not null,
  phone text,
  state text not null,
  lga text,
  verification_tier integer not null default 2,
  is_staff boolean not null default false,
  suspended_at timestamptz,
  id_hash text unique,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_roles (
  user_id text not null references profiles (user_id) on delete cascade,
  role text not null,
  provider_type text not null default '',
  primary key (user_id, role, provider_type)
);

create table if not exists farms (
  id text primary key,
  user_id text not null references profiles (user_id) on delete cascade,
  name text not null,
  community_id text not null,
  state text not null,
  lat double precision not null,
  lng double precision not null,
  hectares numeric,
  created_at timestamptz not null default now()
);
create index if not exists farms_user_idx on farms (user_id);

create table if not exists listings (
  id text primary key,
  owner_id text not null,
  kind text not null,
  equipment_type text,
  provider_type text,
  title text not null,
  description text,
  operator_included boolean not null default true,
  lat double precision not null,
  lng double precision not null,
  community_id text not null,
  service_radius_km numeric not null default 30,
  status text not null default 'active',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists listings_status_idx on listings (status);

create table if not exists listing_rates (
  listing_id text not null references listings (id) on delete cascade,
  unit text not null,
  rate_kobo bigint not null,
  primary key (listing_id, unit)
);

create table if not exists bookings (
  id text primary key,
  farmer_id text not null,
  provider_id text not null,
  listing_id text not null,
  farm_id text not null,
  job_date text not null,
  unit text not null,
  quantity numeric not null default 1,
  agreed_kobo bigint not null,
  status text not null,
  farmer_paid boolean not null default false,
  provider_paid boolean not null default false,
  checkin_lat double precision,
  checkin_lng double precision,
  checkin_at timestamptz,
  proof_note text,
  dispute_reason text,
  farmer_rating integer,
  provider_rating integer,
  created_at timestamptz not null default now()
);
create index if not exists bookings_farmer_idx on bookings (farmer_id);
create index if not exists bookings_provider_idx on bookings (provider_id);

create table if not exists booking_events (
  id text primary key,
  booking_id text not null references bookings (id) on delete cascade,
  actor_id text not null,
  event text not null,
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  title text not null,
  body text not null,
  booking_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at);

create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default true
);

create table if not exists waitlist (
  id text primary key,
  name text not null,
  contact text not null,
  side text not null,
  interest text,
  created_at timestamptz not null default now()
);

insert into feature_flags (key, enabled)
  values ('marketplace_live', true)
  on conflict (key) do nothing;

-- Pilot demo supply (Ibadan tractor reaches Moniya ~10 km, not Ikorodu ~120 km)
insert into listings (id, owner_id, kind, equipment_type, title, description, operator_included, lat, lng, community_id, service_radius_km, status, is_demo)
values
  ('seed-tractor-ibadan', 'seed-adewale', 'equipment', 'tractor', 'Adewale 75HP tractor with operator', 'Massey-style 75HP. Land prep and ridging. Operator included. Direct payment in the pilot — no platform escrow.', true, 7.528, 3.911, 'moniya', 25, 'active', true),
  ('seed-sprayer-abeokuta', 'seed-funmi', 'equipment', 'sprayer', 'Funmi boom sprayer', 'Boom sprayer with 400 L tank. Best for maize and vegetables. Travels within Ogun and western Oyo.', true, 7.185, 3.397, 'obantoko', 35, 'active', true),
  ('seed-hands-osogbo', 'seed-tunde', 'service', null, 'Osogbo farm hands crew (6)', 'Weeding, planting and harvest labour. Six experienced hands. Set your own transport.', true, 7.771, 4.557, 'osogbo', 40, 'active', true),
  ('seed-tiller-ikorodu', 'seed-chika', 'equipment', 'tiller', 'Ikorodu power tiller', 'Walk-behind tiller for vegetable beds. Lagos peri-urban only.', true, 6.619, 3.51, 'ikorodu', 20, 'active', true)
on conflict (id) do nothing;

update listings set provider_type = 'farm_hand' where id = 'seed-hands-osogbo' and provider_type is null;

insert into listing_rates (listing_id, unit, rate_kobo) values
  ('seed-tractor-ibadan', 'hectare', 4500000),
  ('seed-tractor-ibadan', 'hour', 2500000),
  ('seed-sprayer-abeokuta', 'hectare', 1800000),
  ('seed-sprayer-abeokuta', 'day', 3500000),
  ('seed-hands-osogbo', 'day', 4500000),
  ('seed-hands-osogbo', 'job', 12000000),
  ('seed-tiller-ikorodu', 'day', 2200000),
  ('seed-tiller-ikorodu', 'hectare', 2800000)
on conflict (listing_id, unit) do nothing;
