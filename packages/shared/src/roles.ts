// Mirrors the Postgres enums in supabase/migrations/20260926020957_extensions_and_types.sql.
// Keep the two in step: src/__tests__/enums-match-db.test.ts fails if they drift apart.

export const APP_ROLES = [
  'crop_farmer',
  'animal_farmer',
  'machinery_owner',
  'service_provider',
  'input_supplier',
  'buyer',
  'logistics_provider',
  'field_agent',
  'institutional_partner',
  'investor',
] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const PROVIDER_TYPES = [
  'farm_hand',
  'machine_operator',
  'mechanic',
  'spraying_service',
  'agronomist',
  'vet_doctor',
  'agro_processor',
] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export const ORG_MEMBER_ROLES = ['owner', 'farm_manager', 'storekeeper', 'accountant', 'worker'] as const;
export type OrgMemberRole = (typeof ORG_MEMBER_ROLES)[number];

export const FARM_ZONES = ['rainforest', 'derived_savanna', 'other'] as const;
export type FarmZone = (typeof FARM_ZONES)[number];

export const APP_LANGUAGES = ['en', 'yo', 'pcm'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/** Farmer roles are approved instantly; every other role waits for a verification officer. */
export const AUTO_APPROVED_ROLES: readonly AppRole[] = ['crop_farmer', 'animal_farmer'];

export function isAutoApproved(role: AppRole): boolean {
  return AUTO_APPROVED_ROLES.includes(role);
}

/** English labels for the UI. Yoruba and Pidgin labels arrive with the i18n work in M1. */
export const ROLE_LABELS: Record<AppRole, string> = {
  crop_farmer: 'Crop farmer',
  animal_farmer: 'Animal farmer',
  machinery_owner: 'Machinery owner',
  service_provider: 'Service provider',
  input_supplier: 'Input supplier',
  buyer: 'Buyer',
  logistics_provider: 'Logistics provider',
  field_agent: 'Field agent',
  institutional_partner: 'Institutional partner',
  investor: 'Investor',
};

export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  farm_hand: 'Farm hand',
  machine_operator: 'Machine operator',
  mechanic: 'Mechanic',
  spraying_service: 'Spraying service',
  agronomist: 'Agronomist / extension',
  vet_doctor: 'Vet doctor',
  agro_processor: 'Agro-processor',
};
