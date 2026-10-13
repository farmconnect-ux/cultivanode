// Enum values come straight from the generated database types (database.types.ts), so the apps can
// never drift from Postgres. Regenerate with `npm run db:types:remote` after a schema change.
//
// Which roles are auto-approved, need documents or a minimum tier is NOT defined here: that lives in
// the `roles` table and is enforced by the database. Labels below are display text only.

import { Constants } from './database.types';

const E = Constants.public.Enums;

export const APP_ROLES = E.app_role;
export type AppRole = (typeof APP_ROLES)[number];

export const PROVIDER_TYPES = E.provider_type;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const ADMIN_ROLES = E.admin_role;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ORG_MEMBER_ROLES = E.org_member_role;
export type OrgMemberRole = (typeof ORG_MEMBER_ROLES)[number];

export const FARM_ZONES = E.farm_zone;
export type FarmZone = (typeof FARM_ZONES)[number];

export const APP_LANGUAGES = E.app_language;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const EQUIPMENT_TYPES = E.equipment_type;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const PRICING_UNITS = E.pricing_unit;
export type PricingUnit = (typeof PRICING_UNITS)[number];

export const RECORD_SOURCES = E.record_source;
export type RecordSource = (typeof RECORD_SOURCES)[number];

export const CONSENT_TYPES = E.consent_type;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const VERIFICATION_DOCUMENT_TYPES = E.verification_document_type;
export type VerificationDocumentType = (typeof VERIFICATION_DOCUMENT_TYPES)[number];

export type RequestStatus = (typeof E.request_status)[number];

/** English labels for the UI. Other languages come from the app's translation files. */
export const ROLE_LABELS: Record<AppRole, string> = {
  crop_farmer: 'Crop farmer',
  animal_farmer: 'Animal farmer',
  machinery_owner: 'Machinery owner',
  service_provider: 'Service provider',
  input_supplier: 'Input supplier',
  buyer_offtaker: 'Buyer / off-taker',
  logistics_provider: 'Logistics provider',
  field_agent: 'Field agent',
  institutional_partner: 'Institutional partner',
  investor: 'Investor',
  customer: 'Customer',
};

export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  farm_hand: 'Farm hand',
  machine_operator: 'Machine operator',
  mechanic: 'Mechanic',
  spraying_service: 'Spraying service',
  agronomist: 'Agronomist',
  extension_agent: 'Extension agent',
  vet: 'Vet',
  agro_processor: 'Agro-processor',
};

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  tractor: 'Tractor',
  plough: 'Plough',
  harrow: 'Harrow',
  planter: 'Planter',
  harvester: 'Harvester',
  sprayer: 'Sprayer',
  ridger: 'Ridger',
  tiller: 'Tiller',
  irrigation_equipment: 'Irrigation equipment',
  transport_equipment: 'Transport equipment',
  other: 'Other equipment',
};
