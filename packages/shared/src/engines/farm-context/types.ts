/**
 * CultivaNode 3.0 — Batch 03.1C / 03.1D Live Farm Context Domain Contract (ADR-001, ADR-007).
 *
 * Pure, reusable TypeScript types for representing farm facts across the eight
 * canonical agricultural data domains with explicit provenance, freshness,
 * missingness, and conflict states.
 *
 * Non-negotiable invariants:
 * - Eight canonical domains and seven canonical fact states.
 * - Missing, null, or invalid values are NEVER coerced to zero.
 * - AI-inferred values are NEVER silently promoted to `verified_current`.
 * - Query errors are NEVER converted into verified missing facts.
 * - Persistent memory (`farm_memory_items`) belongs to Batch 03.2 and is
 *   represented solely as an explicit typed extension point.
 */

export const CONTEXT_STATES = [
  'verified_current',
  'unverified_provisional',
  'stale',
  'missing',
  'conflicting',
  'awaiting_sync',
  'invalid_rejected',
] as const;

export type ContextState = (typeof CONTEXT_STATES)[number];

export const FARM_CONTEXT_DOMAINS = [
  'soil_chemistry_and_nutrients',
  'soil_moisture_and_irrigation',
  'crop_identity_variety_and_stage',
  'weather_and_environment',
  'farm_inventory_and_stock',
  'financial_and_marketplace_records',
  'equipment_and_iot_telemetry',
  'farmer_observations_and_scouting',
] as const;

export type FarmContextDomain = (typeof FARM_CONTEXT_DOMAINS)[number];

/**
 * Verified existing CultivaNode `public` schema tables currently whitelisted in
 * PostgreSQL M3 `private.write_ai_audit_event(...)` (`c_allowed_sources`).
 */
export const ALLOWED_AUDIT_CONTEXT_SOURCES = [
  'farms',
  'plots',
  'crop_cycles',
  'crop_cycle_operations',
  'crop_observations',
  'crop_alerts',
  'crop_harvests',
  'soil_records',
  'farm_agronomic_standards',
  'agronomic_standard_documents',
  'agronomic_standard_chunks',
  'farm_memory_items',
  'irrigation_zones',
  'irrigation_events',
  'farm_inventory',
  'farm_inventory_transactions',
  'farm_financial_transactions',
  'farm_machinery_assets',
  'farm_machinery_maintenance',
  'farm_machinery_usage_logs',
  'machinery_telemetry',
  'farm_operational_tasks',
  'farm_livestock',
  'farm_livestock_health_events',
  'farm_livestock_production_logs',
  'telemetry_readings',
  'telemetry_rollups',
  'weather_cache',
  'marketplace_orders',
  'marketplace_journal_entries',
] as const;

export type AllowedAuditContextSource = (typeof ALLOWED_AUDIT_CONTEXT_SOURCES)[number];

/**
 * All verified CultivaNode `public` schema evidence tables that may appear in
 * `ContextProvenance.source`. Includes `irrigation_zones` and `irrigation_events`
 * so irrigation facts are attributed to their actual source records rather than
 * fabricated under `farms`. Persisting those two tables in `ai_audit_events.context_refs`
 * requires a separate approved M3 whitelist migration.
 */
export const FARM_CONTEXT_EVIDENCE_SOURCES = [
  ...ALLOWED_AUDIT_CONTEXT_SOURCES,
  'marketplace_order_items',
  'marketplace_produce_provenance',
] as const;

export type FarmContextEvidenceSource = (typeof FARM_CONTEXT_EVIDENCE_SOURCES)[number];

export interface AuditContextReference {
  source: AllowedAuditContextSource;
  record_id: string;
  observed_at?: string;
}

export interface ContextProvenance {
  source: FarmContextEvidenceSource;
  recordId: string;
  sourceTrust:
    | 'lab_verified'
    | 'agent_verified'
    | 'platform_verified'
    | 'self_reported'
    | 'sensor_valid'
    | 'sensor_suspicious'
    | 'derived_ledger'
    | 'cache'
    | 'ai_inferred';
  observedAt: string | null;
  retrievedAt: string;
  /** Explicitly flags provisional thresholds pending qualified domain sign-off (e.g. 365-day soil validity). */
  provisionalPolicyNote?: string;
}

export interface ContextConflictDetail {
  field: string;
  summary: string;
  candidates: Array<{
    source: FarmContextEvidenceSource;
    recordId: string;
    value: unknown;
    observedAt: string | null;
  }>;
}

export interface ContextValidationIssue {
  domain: FarmContextDomain;
  field: string;
  code:
    | 'future_dated_soil_test'
    | 'missing_soil_test_date'
    | 'provisional_stale_soil_test'
    | 'faulty_or_quarantined_sensor'
    | 'non_monotonic_engine_hours'
    | 'implausible_engine_hours'
    | 'duplicate_telemetry_timestamp'
    | 'stale_telemetry'
    | 'invalid_usage_log'
    | 'machinery_usage_telemetry_mismatch'
    | 'inventory_ledger_cache_divergence'
    | 'inventory_ledger_truncated'
    | 'missing_or_invalid_farm_location'
    | 'weather_location_mismatch'
    | 'missing_required_value'
    | 'core_query_error'
    | 'domain_query_error';
  message: string;
  source?: FarmContextEvidenceSource;
  recordId?: string;
}

export interface ContextFact<T> {
  value: T | null;
  state: ContextState;
  provenance: ContextProvenance | null;
  note?: string;
}

export type DomainRetrievalStatus = 'ok' | 'partial' | 'empty' | 'error' | 'unavailable';

export type CoreQueryStatus = 'ok' | 'empty' | 'error';

export type QueryErrorKind = 'auth_error' | 'rls_denied' | 'timeout' | 'database_error';

export interface CoreQueryError {
  target: 'farms' | 'plots';
  kind: QueryErrorKind;
  message: string;
}

export interface SoilChemistryDomainData {
  ph: ContextFact<number>;
  nitrogenPct: ContextFact<number>;
  phosphorusPpm: ContextFact<number>;
  potassiumCmolKg: ContextFact<number>;
  organicMatterPct: ContextFact<number>;
  soilType: ContextFact<string>;
  testedOn: ContextFact<string>;
  soilTestAgeDays: number | null;
  provisionalValidityDays: number;
  provisionalThresholdPendingAgronomyValidation: true;
}

export interface SoilMoistureDomainData {
  moisturePct: ContextFact<number>;
  latestIrrigationAt: ContextFact<string>;
  latestIrrigationVolumeLitres: ContextFact<number>;
  activeZoneCount: number;
}

export interface CropIdentityDomainData {
  activeCycles: Array<{
    cycleId: string;
    plotId: string | null;
    cropId: string;
    currentStage: string;
    plantingDate: string;
    expectedHarvestDate: string;
    healthStatus: string;
    healthScore: number;
    state: ContextState;
  }>;
  fallbackPlotCrops: Array<{
    plotId: string;
    plotName: string;
    currentCrop: string | null;
    state: ContextState;
  }>;
}

export interface WeatherDomainData {
  locationLabel: ContextFact<string>;
  matchedBy: 'coordinates' | 'state' | null;
  provider: ContextFact<string>;
  fetchedAt: ContextFact<string>;
  observedAt: ContextFact<string>;
  forecastPeriod: ContextFact<string>;
  temperatureC: ContextFact<number>;
  rainfallMm: ContextFact<number>;
  humidityPct: ContextFact<number>;
  windSpeedKmh: ContextFact<number>;
  ageHours: number | null;
}

export interface FarmInventoryDomainData {
  items: Array<{
    inventoryId: string;
    itemName: string;
    category: string;
    unit: string;
    cachedQuantity: ContextFact<number>;
    ledgerQuantity: ContextFact<number>;
    ledgerComplete: boolean;
    transactionCount: number;
    state: ContextState;
  }>;
}

export interface FinancialMarketplaceDomainData {
  recentFarmTransactionsCount: number;
  recentMarketplaceOrdersCount: number;
  latestTransactionDate: ContextFact<string>;
}

export interface MachineryUsageSummary {
  totalHours: number | null;
  recordCount: number;
  isCompleteHistory: boolean;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface EquipmentTelemetryDomainData {
  machinery: Array<{
    machineryId: string;
    name: string;
    category: string;
    status: string;
    assetEngineHours: ContextFact<number>;
    latestObservedTelemetryEngineHours: ContextFact<number>;
    latestTelemetryEngineHours: ContextFact<number>;
    recentLoggedUsageHours: ContextFact<number>;
    loggedUsageSummary: MachineryUsageSummary;
    state: ContextState;
  }>;
  validSensorReadingsCount: number;
  excludedFaultyReadingsCount: number;
}

export interface FarmerObservationsDomainData {
  unresolvedObservationsCount: number;
  activeAlertsCount: number;
  recentObservations: Array<{
    observationId: string;
    cropCycleId: string;
    category: string;
    severity: string;
    title: string;
    observedAt: string;
    state: ContextState;
  }>;
}

export interface DomainContextSection<T> {
  domain: FarmContextDomain;
  status: DomainRetrievalStatus;
  data: T | null;
  errorKind?: QueryErrorKind;
  errorMessage?: string;
  sourceRefs: AuditContextReference[];
  conflicts: ContextConflictDetail[];
  missingFields: string[];
  validationIssues: ContextValidationIssue[];
}

/** Typed Batch 03.2 extension point — persistent memory is NOT retrieved in Batch 03.1C/D. */
export interface PersistentMemoryExtensionPoint {
  available: false;
  reason: 'batch_03_2_pending';
  farmScopeItems: readonly [];
  profileScopeItems: readonly [];
}

export interface LiveFarmContextSnapshot {
  farmId: string;
  farmName: string | null;
  farmZone: string | null;
  farmState: string | null;
  farmLga: string | null;
  farmQueryStatus: CoreQueryStatus;
  plotsQueryStatus: CoreQueryStatus;
  coreQueryErrors: CoreQueryError[];
  retrievedAt: string;
  scope: 'farm';
  domains: {
    soil_chemistry_and_nutrients: DomainContextSection<SoilChemistryDomainData>;
    soil_moisture_and_irrigation: DomainContextSection<SoilMoistureDomainData>;
    crop_identity_variety_and_stage: DomainContextSection<CropIdentityDomainData>;
    weather_and_environment: DomainContextSection<WeatherDomainData>;
    farm_inventory_and_stock: DomainContextSection<FarmInventoryDomainData>;
    financial_and_marketplace_records: DomainContextSection<FinancialMarketplaceDomainData>;
    equipment_and_iot_telemetry: DomainContextSection<EquipmentTelemetryDomainData>;
    farmer_observations_and_scouting: DomainContextSection<FarmerObservationsDomainData>;
  };
  auditContextRefs: AuditContextReference[];
  conflicts: ContextConflictDetail[];
  missingInformation: Array<{ domain: FarmContextDomain; field: string }>;
  validationIssues: ContextValidationIssue[];
  memoryExtension: PersistentMemoryExtensionPoint;
}
