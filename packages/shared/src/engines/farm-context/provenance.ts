/**
 * CultivaNode 3.0 — Batch 03.1C / 03.1D Live Farm Context Provenance & Conflict Rules (ADR-007).
 *
 * Pure, deterministic helpers that classify facts into the 7 explicit context states,
 * enforce domain-specific precedence rules, and emit schema-valid audit context references.
 */

import {
  ALLOWED_AUDIT_CONTEXT_SOURCES,
  type AllowedAuditContextSource,
  type AuditContextReference,
  type ContextConflictDetail,
  type ContextFact,
  type ContextState,
  type ContextValidationIssue,
  type LiveFarmContextSnapshot,
} from './types';

export const PROVISIONAL_SOIL_TEST_VALIDITY_DAYS = 365;
export const PROVISIONAL_SOIL_VALIDITY_NOTE =
  'Provisional 365-day soil-test validity threshold pending qualified agronomist/soil-scientist validation (ADR-007).';
export const DEFAULT_TELEMETRY_STALE_HOURS = 168; // 7 days
/**
 * Batch 03.3 (PR #24 review, Low): a verified device/provider reading only counts as `verified_current`
 * while it is recent. Older (but not yet stale) verified readings are reported as `unverified_provisional`.
 */
export const DEFAULT_VERIFIED_TELEMETRY_MAX_AGE_HOURS = 24;
/** Tolerated clock skew for observation timestamps ahead of the retrieval time. */
export const TELEMETRY_FUTURE_SKEW_MINUTES = 5;
export const MAX_WEATHER_MATCH_DISTANCE_KM = 100;

const ALLOWED_AUDIT_SOURCE_SET = new Set<string>(ALLOWED_AUDIT_CONTEXT_SOURCES);

export interface SoilRecordCandidate {
  id: string;
  plotId: string;
  ph: number | null;
  nitrogenPct: number | null;
  phosphorusPpm: number | null;
  potassiumCmolKg: number | null;
  organicMatterPct: number | null;
  soilType: string | null;
  source: string | null;
  testedOn: string | null;
  createdAt: string;
}

export interface SoilFreshnessResult {
  state: ContextState;
  ageDays: number | null;
  issue: ContextValidationIssue | null;
}

/**
 * Evaluates soil-test freshness using `soil_test_age_days = current_date - tested_on`.
 * - Missing `tested_on` -> `missing`
 * - Future `tested_on > retrievalDate` -> `invalid_rejected`
 * - `ageDays > provisionalValidityDays` -> `stale` (explicitly marked provisional)
 * - Otherwise -> `verified_current` for agent/platform verified records, or `unverified_provisional` for self-reported.
 */
export function evaluateSoilTestFreshness(
  testedOn: string | null | undefined,
  retrievedAtIso: string,
  recordSource: string | null | undefined,
  recordId: string,
  provisionalValidityDays: number = PROVISIONAL_SOIL_TEST_VALIDITY_DAYS,
): SoilFreshnessResult {
  if (!testedOn || !/^\d{4}-\d{2}-\d{2}/.test(testedOn)) {
    return {
      state: 'missing',
      ageDays: null,
      issue: {
        domain: 'soil_chemistry_and_nutrients',
        field: 'tested_on',
        code: 'missing_soil_test_date',
        message: 'Soil record is missing a valid tested_on measurement date.',
        source: 'soil_records',
        recordId,
      },
    };
  }

  const testedDate = new Date(`${testedOn.slice(0, 10)}T00:00:00.000Z`);
  const retrievalDay = new Date(`${retrievedAtIso.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(testedDate.getTime()) || Number.isNaN(retrievalDay.getTime())) {
    return {
      state: 'invalid_rejected',
      ageDays: null,
      issue: {
        domain: 'soil_chemistry_and_nutrients',
        field: 'tested_on',
        code: 'future_dated_soil_test',
        message: 'Soil record contains an unparseable tested_on date.',
        source: 'soil_records',
        recordId,
      },
    };
  }

  const ageDays = Math.floor((retrievalDay.getTime() - testedDate.getTime()) / 86_400_000);
  if (ageDays < 0) {
    return {
      state: 'invalid_rejected',
      ageDays,
      issue: {
        domain: 'soil_chemistry_and_nutrients',
        field: 'tested_on',
        code: 'future_dated_soil_test',
        message: `Soil test date (${testedOn.slice(0, 10)}) is in the future relative to retrieval date.`,
        source: 'soil_records',
        recordId,
      },
    };
  }

  if (ageDays > provisionalValidityDays) {
    return {
      state: 'stale',
      ageDays,
      issue: {
        domain: 'soil_chemistry_and_nutrients',
        field: 'tested_on',
        code: 'provisional_stale_soil_test',
        message: `Soil test is ${ageDays} days old (exceeds provisional ${provisionalValidityDays}-day threshold pending agronomy validation).`,
        source: 'soil_records',
        recordId,
      },
    };
  }

  const isVerified = recordSource === 'agent_verified' || recordSource === 'platform_verified';
  return {
    state: isVerified ? 'verified_current' : 'unverified_provisional',
    ageDays,
    issue: null,
  };
}

/**
 * Ranks soil chemistry candidates per ADR-007 Domain 1 precedence:
 * 1. `soil_records` (`agent_verified` / `platform_verified`)
 * 2. `soil_records` (`self_reported` / other)
 * Never lets IoT sensor readings override verified laboratory soil chemistry.
 */
export function selectAuthoritativeSoilRecord(
  records: readonly SoilRecordCandidate[],
  retrievedAtIso: string,
): {
  selected: SoilRecordCandidate | null;
  freshness: SoilFreshnessResult;
  rejectedIssues: ContextValidationIssue[];
} {
  const rejectedIssues: ContextValidationIssue[] = [];
  const validCandidates: Array<{ record: SoilRecordCandidate; freshness: SoilFreshnessResult; rank: number }> = [];

  for (const record of records) {
    const freshness = evaluateSoilTestFreshness(record.testedOn, retrievedAtIso, record.source, record.id);
    if (freshness.state === 'invalid_rejected') {
      if (freshness.issue) rejectedIssues.push(freshness.issue);
      continue;
    }
    const isVerified = record.source === 'agent_verified' || record.source === 'platform_verified';
    const freshnessBonus =
      freshness.state === 'verified_current'
        ? 4
        : freshness.state === 'unverified_provisional'
          ? 3
          : freshness.state === 'stale'
            ? 2
            : 1;
    const rank = (isVerified ? 10 : 0) + freshnessBonus;
    validCandidates.push({ record, freshness, rank });
  }

  if (validCandidates.length === 0) {
    return {
      selected: null,
      freshness: { state: 'missing', ageDays: null, issue: null },
      rejectedIssues,
    };
  }

  validCandidates.sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    return (
      (b.record.testedOn ?? '').localeCompare(a.record.testedOn ?? '') ||
      b.record.createdAt.localeCompare(a.record.createdAt)
    );
  });

  const best = validCandidates[0]!;
  return {
    selected: best.record,
    freshness: best.freshness,
    rejectedIssues,
  };
}

/**
 * Builds a numeric context fact without EVER coercing null, undefined, or non-finite values to zero.
 */
export function makeNumericFact(
  rawValue: number | null | undefined,
  stateWhenPresent: ContextState,
  provenance: ContextFact<number>['provenance'],
  note?: string,
): ContextFact<number> {
  if (rawValue === null || rawValue === undefined || typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
    return { value: null, state: 'missing', provenance: null, note };
  }
  return {
    value: rawValue,
    state: stateWhenPresent,
    provenance,
    note,
  };
}

export interface InventoryTransactionInput {
  id: string;
  inventoryId: string;
  transactionType: string;
  quantity: number;
  createdAt: string;
}

export interface InventoryLedgerBalanceSummary {
  inventoryId: string;
  balance: number;
  transactionCount: number;
  latestTransactionId: string;
  latestTransactionAt: string;
}

const INVENTORY_OUTFLOW_TYPES = new Set([
  'issue_to_field',
  'consumption',
  'loss',
  'damage',
  'sale',
  'reversal',
  'write_off',
]);

const INVENTORY_INFLOW_TYPES = new Set(['purchase', 'receipt', 'return', 'adjustment']);

const INVENTORY_PHYSICAL_NEUTRAL_TYPES = new Set(['transfer', 'reservation', 'release']);

/**
 * Computes exact inventory ledger balances across all transactions using the
 * authoritative semantics of `public.record_farm_inventory_movement`
 * (`20261008130000_farm_management_reconcile.sql`):
 * - Inflows (`purchase`, `receipt`, `return`, `adjustment`): `+quantity` (signed negative adjustments subtract).
 * - Outflows (`issue_to_field`, `consumption`, `loss`, `damage`, `sale`, `reversal`, `write_off`): `-abs(quantity)`.
 * - Physical-neutral (`transfer`, `reservation`, `release`): `0` physical balance change.
 * Deduplicates by transaction `id` so overlapping paginated reads never double-count.
 */
export function calculateInventoryLedgerBalances(
  transactions: readonly InventoryTransactionInput[],
): Map<string, InventoryLedgerBalanceSummary> {
  const seenIds = new Set<string>();
  const summaries = new Map<string, InventoryLedgerBalanceSummary>();

  for (const tx of transactions) {
    if (!tx.id || !tx.inventoryId || seenIds.has(tx.id)) continue;
    if (typeof tx.quantity !== 'number' || !Number.isFinite(tx.quantity)) continue;
    seenIds.add(tx.id);

    const type = tx.transactionType.trim().toLowerCase();
    let delta = 0;
    if (INVENTORY_PHYSICAL_NEUTRAL_TYPES.has(type)) {
      delta = 0;
    } else if (INVENTORY_OUTFLOW_TYPES.has(type)) {
      delta = -Math.abs(tx.quantity);
    } else if (INVENTORY_INFLOW_TYPES.has(type)) {
      // `adjustment` may carry a signed quantity in ledger corrections; standard schema enforces quantity > 0.
      delta = type === 'adjustment' ? tx.quantity : Math.abs(tx.quantity);
    } else {
      // Unknown movement type: do not guess sign; treat as neutral to avoid fabricated drift.
      delta = 0;
    }

    const existing = summaries.get(tx.inventoryId);
    if (!existing) {
      summaries.set(tx.inventoryId, {
        inventoryId: tx.inventoryId,
        balance: Math.round(delta * 1000) / 1000,
        transactionCount: 1,
        latestTransactionId: tx.id,
        latestTransactionAt: tx.createdAt,
      });
    } else {
      const nextBalance = Math.round((existing.balance + delta) * 1000) / 1000;
      const isNewer =
        tx.createdAt > existing.latestTransactionAt ||
        (tx.createdAt === existing.latestTransactionAt && tx.id > existing.latestTransactionId);
      summaries.set(tx.inventoryId, {
        inventoryId: tx.inventoryId,
        balance: Object.is(nextBalance, -0) ? 0 : nextBalance,
        transactionCount: existing.transactionCount + 1,
        latestTransactionId: isNewer ? tx.id : existing.latestTransactionId,
        latestTransactionAt: isNewer ? tx.createdAt : existing.latestTransactionAt,
      });
    }
  }

  return summaries;
}

/**
 * Evaluates Domain 5 (Farm Inventory) divergence between `farm_inventory.quantity` cache
 * and the ledger sum computed from `farm_inventory_transactions`.
 */
export function evaluateInventoryLedgerConsistency(params: {
  inventoryId: string;
  itemName: string;
  cachedQuantity: number | null;
  ledgerQuantity: number | null;
  latestTransactionId?: string | null;
  latestTransactionAt?: string | null;
  isLedgerComplete?: boolean;
  hasPendingOutboxSync?: boolean;
  retrievedAt: string;
  updatedAt: string | null;
}): {
  state: ContextState;
  conflict: ContextConflictDetail | null;
  issue: ContextValidationIssue | null;
} {
  if (params.hasPendingOutboxSync) {
    return { state: 'awaiting_sync', conflict: null, issue: null };
  }
  if (params.isLedgerComplete === false) {
    return {
      state: 'unverified_provisional',
      conflict: null,
      issue: {
        domain: 'farm_inventory_and_stock',
        field: 'quantity',
        code: 'inventory_ledger_truncated',
        message: `Inventory ledger for "${params.itemName}" exceeded the safe retrieval bound; partial sum cannot be treated as authoritative.`,
        source: 'farm_inventory',
        recordId: params.inventoryId,
      },
    };
  }
  if (params.cachedQuantity === null && params.ledgerQuantity === null) {
    return { state: 'missing', conflict: null, issue: null };
  }
  if (params.ledgerQuantity === null) {
    return { state: 'unverified_provisional', conflict: null, issue: null };
  }
  if (params.cachedQuantity !== null && Math.abs(params.cachedQuantity - params.ledgerQuantity) > 0.001) {
    const ledgerRefId = params.latestTransactionId ?? params.inventoryId;
    const ledgerObservedAt = params.latestTransactionAt ?? params.retrievedAt;
    return {
      state: 'conflicting',
      conflict: {
        field: `inventory:${params.inventoryId}:quantity`,
        summary: `Inventory item "${params.itemName}" cached quantity (${params.cachedQuantity}) diverges from ledger sum (${params.ledgerQuantity}).`,
        candidates: [
          {
            source: 'farm_inventory',
            recordId: params.inventoryId,
            value: params.cachedQuantity,
            observedAt: params.updatedAt,
          },
          {
            source: params.latestTransactionId ? 'farm_inventory_transactions' : 'farm_inventory',
            recordId: ledgerRefId,
            value: params.ledgerQuantity,
            observedAt: ledgerObservedAt,
          },
        ],
      },
      issue: {
        domain: 'farm_inventory_and_stock',
        field: 'quantity',
        code: 'inventory_ledger_cache_divergence',
        message: `Cached quantity (${params.cachedQuantity}) disagrees with transaction ledger sum (${params.ledgerQuantity}).`,
        source: 'farm_inventory',
        recordId: params.inventoryId,
      },
    };
  }
  return { state: 'verified_current', conflict: null, issue: null };
}

export interface MachineryTelemetrySample {
  id: string;
  engineHours: number | null;
  recordedAt: string;
  qualityFlag?: string | null;
  sourceCategory?: 'device_authenticated' | 'trusted_provider_integration' | 'farmer_observation' | 'staff_observation' | 'unverified_provisional' | string | null;
  validationStatus?: 'verified' | 'provisional' | 'rejected' | string | null;
  trustClassification?: 'verified_current' | 'unverified_provisional' | 'invalid_rejected' | string | null;
}

/**
 * Evaluates Domain 7 (Machinery & Telemetry) consistency:
 * - Sorts samples chronologically ascending before evaluation (defensive against unsorted inputs).
 * - Preserves distinction between latest observed telemetry and latest valid telemetry.
 * - Rejects null, non-finite, negative, > 100,000h, or invalid `qualityFlag` readings.
 * - Flags duplicate timestamps with conflicting readings and non-monotonic engine-hour decreases.
 * - Flags stale telemetry (> `staleThresholdHours`, default 168h).
 * - Compares latest valid telemetry against cumulative `assetEngineHours` (never against partial session logs).
 * - Never promotes suspicious, stale, or unverified telemetry to `verified_current`.
 */
export function evaluateMachineryTelemetryConsistency(params: {
  machineryId: string;
  machineryName: string;
  assetEngineHours: number | null;
  loggedUsageHoursTotal?: number | null;
  telemetrySamples: readonly MachineryTelemetrySample[];
  retrievedAt?: string;
  staleThresholdHours?: number;
  verifiedMaxAgeHours?: number;
}): {
  state: ContextState;
  latestObservedHours: number | null;
  latestObservedId: string | null;
  latestObservedAt: string | null;
  latestValidHours: number | null;
  latestValidSampleId: string | null;
  latestValidObservedAt: string | null;
  conflicts: ContextConflictDetail[];
  issues: ContextValidationIssue[];
} {
  const conflicts: ContextConflictDetail[] = [];
  const issues: ContextValidationIssue[] = [];

  // Deduplicate by sample ID and sort chronologically ascending (recordedAt asc, id asc).
  const uniqueById = new Map<string, MachineryTelemetrySample>();
  for (const s of params.telemetrySamples) {
    if (s.id && !uniqueById.has(s.id)) uniqueById.set(s.id, s);
  }
  const ordered = Array.from(uniqueById.values()).sort((a, b) => {
    const tA = new Date(a.recordedAt).getTime();
    const tB = new Date(b.recordedAt).getTime();
    if (!Number.isNaN(tA) && !Number.isNaN(tB) && tA !== tB) return tA - tB;
    return a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id);
  });

  const latestObserved = ordered.length > 0 ? ordered[ordered.length - 1]! : null;
  const latestObservedHours =
    latestObserved && typeof latestObserved.engineHours === 'number' && Number.isFinite(latestObserved.engineHours)
      ? latestObserved.engineHours
      : null;
  const latestObservedId = latestObserved?.id ?? null;
  const latestObservedAt = latestObserved?.recordedAt ?? null;

  let previousValidHours: number | null = null;
  let previousSample: MachineryTelemetrySample | null = null;
  let latestValidHours: number | null = null;
  let latestValidSampleId: string | null = null;
  let latestValidObservedAt: string | null = null;
  let sawInvalid = false;
  let sawNonMonotonic = false;
  let sawDuplicateConflict = false;

  for (const sample of ordered) {
    if (
      (sample.qualityFlag && sample.qualityFlag !== 'valid') ||
      sample.validationStatus === 'rejected' ||
      sample.trustClassification === 'invalid_rejected'
    ) {
      sawInvalid = true;
      issues.push({
        domain: 'equipment_and_iot_telemetry',
        field: 'engine_hours',
        code: 'faulty_or_quarantined_sensor',
        message: `Machinery "${params.machineryName}" telemetry sample ${sample.id} excluded due to rejected/quarantined provenance or quality_flag.`,
        source: 'machinery_telemetry',
        recordId: sample.id,
      });
      continue;
    }

    if (sample.engineHours === null || typeof sample.engineHours !== 'number' || !Number.isFinite(sample.engineHours)) {
      continue;
    }

    if (sample.engineHours < 0 || sample.engineHours > 100_000) {
      sawInvalid = true;
      issues.push({
        domain: 'equipment_and_iot_telemetry',
        field: 'engine_hours',
        code: 'implausible_engine_hours',
        message: `Machinery "${params.machineryName}" reported implausible engine_hours (${sample.engineHours}).`,
        source: 'machinery_telemetry',
        recordId: sample.id,
      });
      continue;
    }

    if (previousSample && sample.recordedAt === previousSample.recordedAt) {
      if (previousValidHours !== null && Math.abs(sample.engineHours - previousValidHours) > 0.1) {
        sawDuplicateConflict = true;
        issues.push({
          domain: 'equipment_and_iot_telemetry',
          field: 'engine_hours',
          code: 'duplicate_telemetry_timestamp',
          message: `Machinery "${params.machineryName}" reported conflicting engine_hours (${previousValidHours} vs ${sample.engineHours}) at identical timestamp ${sample.recordedAt}.`,
          source: 'machinery_telemetry',
          recordId: sample.id,
        });
        conflicts.push({
          field: `machinery:${params.machineryId}:duplicate_timestamp`,
          summary: `Conflicting duplicate-timestamp telemetry on "${params.machineryName}" at ${sample.recordedAt}.`,
          candidates: [
            {
              source: 'machinery_telemetry',
              recordId: previousSample.id,
              value: previousValidHours,
              observedAt: previousSample.recordedAt,
            },
            {
              source: 'machinery_telemetry',
              recordId: sample.id,
              value: sample.engineHours,
              observedAt: sample.recordedAt,
            },
          ],
        });
      }
    } else if (previousValidHours !== null && sample.engineHours < previousValidHours - 0.1) {
      sawNonMonotonic = true;
      issues.push({
        domain: 'equipment_and_iot_telemetry',
        field: 'engine_hours',
        code: 'non_monotonic_engine_hours',
        message: `Machinery "${params.machineryName}" engine_hours decreased from ${previousValidHours} to ${sample.engineHours}.`,
        source: 'machinery_telemetry',
        recordId: sample.id,
      });
      conflicts.push({
        field: `machinery:${params.machineryId}:engine_hours`,
        summary: `Non-monotonic telemetry engine_hours on "${params.machineryName}" (${previousValidHours} -> ${sample.engineHours}).`,
        candidates: [
          {
            source: 'machinery_telemetry',
            recordId: previousSample!.id,
            value: previousValidHours,
            observedAt: previousSample!.recordedAt,
          },
          {
            source: 'machinery_telemetry',
            recordId: sample.id,
            value: sample.engineHours,
            observedAt: sample.recordedAt,
          },
        ],
      });
    }

    previousValidHours = sample.engineHours;
    previousSample = sample;
    latestValidHours = sample.engineHours;
    latestValidSampleId = sample.id;
    latestValidObservedAt = sample.recordedAt;
  }

  // Compare cumulative telemetry hours ONLY against cumulative assetEngineHours (never partial session logs).
  if (
    latestValidHours !== null &&
    params.assetEngineHours !== null &&
    Math.abs(latestValidHours - params.assetEngineHours) > 25
  ) {
    issues.push({
      domain: 'equipment_and_iot_telemetry',
      field: 'engine_hours',
      code: 'machinery_usage_telemetry_mismatch',
      message: `Telemetry engine_hours (${latestValidHours}) disagrees with machinery asset engine_hours (${params.assetEngineHours}).`,
      source: 'machinery_telemetry',
      recordId: latestValidSampleId ?? params.machineryId,
    });
    conflicts.push({
      field: `machinery:${params.machineryId}:usage_vs_telemetry`,
      summary: `Machinery "${params.machineryName}" telemetry hours (${latestValidHours}) disagree with asset engine_hours (${params.assetEngineHours}).`,
      candidates: [
        { source: 'farm_machinery_assets', recordId: params.machineryId, value: params.assetEngineHours, observedAt: null },
        {
          source: 'machinery_telemetry',
          recordId: latestValidSampleId ?? params.machineryId,
          value: latestValidHours,
          observedAt: latestValidObservedAt,
        },
      ],
    });
  }

  let isStale = false;
  if (latestValidObservedAt && params.retrievedAt) {
    const threshold = params.staleThresholdHours ?? DEFAULT_TELEMETRY_STALE_HOURS;
    const ageHours = (new Date(params.retrievedAt).getTime() - new Date(latestValidObservedAt).getTime()) / 3_600_000;
    if (Number.isFinite(ageHours) && ageHours > threshold) {
      isStale = true;
      issues.push({
        domain: 'equipment_and_iot_telemetry',
        field: 'engine_hours',
        code: 'stale_telemetry',
        message: `Latest valid telemetry for "${params.machineryName}" is ${Math.round(ageHours)}h old (threshold ${threshold}h).`,
        source: 'machinery_telemetry',
        recordId: latestValidSampleId ?? undefined,
      });
    }
  }

  if (conflicts.length > 0 || sawNonMonotonic || sawDuplicateConflict) {
    return {
      state: 'conflicting',
      latestObservedHours,
      latestObservedId,
      latestObservedAt,
      latestValidHours,
      latestValidSampleId,
      latestValidObservedAt,
      conflicts,
      issues,
    };
  }
  if (sawInvalid && latestValidHours === null) {
    return {
      state: 'invalid_rejected',
      latestObservedHours,
      latestObservedId,
      latestObservedAt,
      latestValidHours: null,
      latestValidSampleId: null,
      latestValidObservedAt: null,
      conflicts,
      issues,
    };
  }
  if (latestValidHours === null) {
    return {
      state: 'missing',
      latestObservedHours,
      latestObservedId,
      latestObservedAt,
      latestValidHours: null,
      latestValidSampleId: null,
      latestValidObservedAt: null,
      conflicts,
      issues,
    };
  }
  if (isStale) {
    return {
      state: 'stale',
      latestObservedHours,
      latestObservedId,
      latestObservedAt,
      latestValidHours,
      latestValidSampleId,
      latestValidObservedAt,
      conflicts,
      issues,
    };
  }

  // Batch 03.3 Workstream B4: Promote to `verified_current` ONLY when the latest valid sample
  // carries database-verified `device_authenticated` or `trusted_provider_integration` provenance.
  // Unattributed, provisional, farmer_observation, and staff_observation readings remain `unverified_provisional`.
  const latestValidSample = previousSample;
  const hasVerifiedProvenance =
    latestValidSample !== null &&
    latestValidSample.validationStatus === 'verified' &&
    latestValidSample.trustClassification === 'verified_current' &&
    (latestValidSample.sourceCategory === 'device_authenticated' ||
      latestValidSample.sourceCategory === 'trusted_provider_integration');

  // Batch 03.3 (PR #24 review, Low): verified provenance alone is not enough to be "current".
  // The reading must have a known age (retrievedAt supplied), not be in the future beyond clock skew,
  // and be no older than the verified max age. Otherwise it stays `unverified_provisional`.
  let isRecentEnough = false;
  if (hasVerifiedProvenance && latestValidObservedAt && params.retrievedAt) {
    const maxAgeHours = params.verifiedMaxAgeHours ?? DEFAULT_VERIFIED_TELEMETRY_MAX_AGE_HOURS;
    const ageHours =
      (new Date(params.retrievedAt).getTime() - new Date(latestValidObservedAt).getTime()) / 3_600_000;
    if (!Number.isFinite(ageHours)) {
      isRecentEnough = false;
    } else if (ageHours < -TELEMETRY_FUTURE_SKEW_MINUTES / 60) {
      issues.push({
        domain: 'equipment_and_iot_telemetry',
        field: 'recorded_at',
        code: 'future_telemetry_timestamp',
        message: `Verified telemetry for "${params.machineryName}" is timestamped in the future; not treated as current.`,
        source: 'machinery_telemetry',
        recordId: latestValidSampleId ?? undefined,
      });
    } else if (ageHours > maxAgeHours) {
      issues.push({
        domain: 'equipment_and_iot_telemetry',
        field: 'recorded_at',
        code: 'verified_telemetry_not_recent',
        message: `Verified telemetry for "${params.machineryName}" is ${Math.round(ageHours)}h old (current limit ${maxAgeHours}h); treated as provisional.`,
        source: 'machinery_telemetry',
        recordId: latestValidSampleId ?? undefined,
      });
    } else {
      isRecentEnough = true;
    }
  }
  const isVerifiedTrustedTelemetry = hasVerifiedProvenance && isRecentEnough;

  return {
    state: isVerifiedTrustedTelemetry ? 'verified_current' : 'unverified_provisional',
    latestObservedHours,
    latestObservedId,
    latestObservedAt,
    latestValidHours,
    latestValidSampleId,
    latestValidObservedAt,
    conflicts,
    issues,
  };
}

export interface MachineryUsageLogInput {
  id: string;
  machineryId: string;
  hoursOperated: number | null;
  startTime?: string | null;
  endTime: string;
}

export interface AggregatedMachineryUsage {
  totalHours: number | null;
  recordCount: number;
  isCompleteHistory: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  latestRecordId: string | null;
  latestObservedAt: string | null;
  issues: ContextValidationIssue[];
}

/**
 * Aggregates per-session `farm_machinery_usage_logs.hours_operated` for a single asset.
 * - Deduplicates by log `id`.
 * - Rejects null, negative, or implausible session durations (> 24h or exceeding endTime - startTime + 1h).
 * - Optionally filters to a comparison period `[periodStart, periodEnd]`.
 * - Preserves `isCompleteHistory` so bounded subsets are NEVER misrepresented as lifetime totals.
 */
export function aggregateMachineryUsageLogs(
  logs: readonly MachineryUsageLogInput[],
  options: {
    machineryName: string;
    isCompleteHistory: boolean;
    comparisonPeriodStart?: string;
    comparisonPeriodEnd?: string;
  },
): AggregatedMachineryUsage {
  const seenIds = new Set<string>();
  const issues: ContextValidationIssue[] = [];
  let sum = 0;
  let validCount = 0;
  let periodStart: string | null = null;
  let periodEnd: string | null = null;
  let latestRecordId: string | null = null;
  let latestObservedAt: string | null = null;

  const filterStartMs = options.comparisonPeriodStart ? new Date(options.comparisonPeriodStart).getTime() : null;
  const filterEndMs = options.comparisonPeriodEnd ? new Date(options.comparisonPeriodEnd).getTime() : null;

  for (const log of logs) {
    if (!log.id || seenIds.has(log.id)) continue;
    seenIds.add(log.id);

    const endMs = new Date(log.endTime).getTime();
    if (filterStartMs !== null && Number.isFinite(endMs) && endMs < filterStartMs) continue;
    if (filterEndMs !== null && Number.isFinite(endMs) && endMs > filterEndMs) continue;

    if (log.hoursOperated === null || typeof log.hoursOperated !== 'number' || !Number.isFinite(log.hoursOperated)) {
      issues.push({
        domain: 'equipment_and_iot_telemetry',
        field: 'hours_operated',
        code: 'invalid_usage_log',
        message: `Usage log ${log.id} for "${options.machineryName}" has null or non-finite hours_operated.`,
        source: 'farm_machinery_usage_logs',
        recordId: log.id,
      });
      continue;
    }

    if (log.hoursOperated < 0 || log.hoursOperated > 24) {
      issues.push({
        domain: 'equipment_and_iot_telemetry',
        field: 'hours_operated',
        code: 'invalid_usage_log',
        message: `Usage log ${log.id} for "${options.machineryName}" has implausible session duration (${log.hoursOperated}h).`,
        source: 'farm_machinery_usage_logs',
        recordId: log.id,
      });
      continue;
    }

    if (log.startTime) {
      const startMs = new Date(log.startTime).getTime();
      if (Number.isFinite(startMs) && Number.isFinite(endMs)) {
        const spanHours = (endMs - startMs) / 3_600_000;
        if (spanHours < 0 || log.hoursOperated > spanHours + 1) {
          issues.push({
            domain: 'equipment_and_iot_telemetry',
            field: 'hours_operated',
            code: 'invalid_usage_log',
            message: `Usage log ${log.id} for "${options.machineryName}" hours_operated (${log.hoursOperated}h) exceeds session window.`,
            source: 'farm_machinery_usage_logs',
            recordId: log.id,
          });
          continue;
        }
      }
    }

    sum += log.hoursOperated;
    validCount += 1;

    const sessionStart = log.startTime ?? log.endTime;
    if (!periodStart || sessionStart < periodStart) periodStart = sessionStart;
    if (!periodEnd || log.endTime > periodEnd) periodEnd = log.endTime;
    if (!latestObservedAt || log.endTime > latestObservedAt) {
      latestObservedAt = log.endTime;
      latestRecordId = log.id;
    }
  }

  return {
    totalHours: validCount > 0 ? Math.round(sum * 100) / 100 : null,
    recordCount: validCount,
    isCompleteHistory: options.isCompleteHistory,
    periodStart,
    periodEnd,
    latestRecordId,
    latestObservedAt,
    issues,
  };
}

export interface ParsedCoordinates {
  lat: number;
  lon: number;
}

/**
 * Extracts and validates WGS84 coordinates from a farm's `location` value
 * (GeoJSON Point `{ type: "Point", coordinates: [lon, lat] }` or `{ lat, lon }`).
 * Rejects non-finite, out-of-range, or `[0, 0]` null-island coordinates.
 */
export function parseFarmLocationCoordinates(
  location: unknown,
): { status: 'valid'; coords: ParsedCoordinates } | { status: 'missing' } | { status: 'invalid' } {
  if (location === null || location === undefined) return { status: 'missing' };

  let lat: number | undefined;
  let lon: number | undefined;

  if (typeof location === 'object' && location !== null) {
    const obj = location as Record<string, unknown>;
    if (obj.type === 'Point' && Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
      lon = Number(obj.coordinates[0]);
      lat = Number(obj.coordinates[1]);
    } else if ('lat' in obj && 'lon' in obj) {
      lat = Number(obj.lat);
      lon = Number(obj.lon);
    } else if ('latitude' in obj && 'longitude' in obj) {
      lat = Number(obj.latitude);
      lon = Number(obj.longitude);
    } else {
      return { status: 'invalid' };
    }
  } else {
    return { status: 'invalid' };
  }

  if (
    typeof lat !== 'number' ||
    typeof lon !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180 ||
    (lat === 0 && lon === 0)
  ) {
    return { status: 'invalid' };
  }

  return { status: 'valid', coords: { lat, lon } };
}

function haversineKm(a: ParsedCoordinates, b: ParsedCoordinates): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface WeatherForecastEntry {
  place?: {
    state?: string;
    town?: string;
    lat?: number;
    lon?: number;
  };
  now?: {
    tempC?: number | null;
    humidity?: number | null;
    windKmh?: number | null;
    observedAt?: string | null;
  } | null;
  days?: Array<{
    date?: string;
    rainMm?: number | null;
    maxC?: number | null;
    minC?: number | null;
    windKmh?: number | null;
  }>;
}

/**
 * Matches a farm's verified location (`coords` and/or `state`) against cached
 * `PlaceForecast[]` payloads. Never falls back to an unrelated location.
 */
export function matchFarmWeatherForecast(
  payload: unknown,
  farmLocation: { state: string | null; coords: ParsedCoordinates | null },
  maxDistanceKm: number = MAX_WEATHER_MATCH_DISTANCE_KM,
): { forecast: WeatherForecastEntry; matchedBy: 'coordinates' | 'state' } | null {
  const rawList = Array.isArray(payload)
    ? payload
    : typeof payload === 'object' && payload !== null && Array.isArray((payload as { forecasts?: unknown }).forecasts)
      ? ((payload as { forecasts: unknown[] }).forecasts)
      : [];

  const entries = rawList.filter(
    (item): item is WeatherForecastEntry => typeof item === 'object' && item !== null,
  );
  if (entries.length === 0) return null;

  // 1. Prefer verified coordinate proximity within `maxDistanceKm`.
  if (farmLocation.coords) {
    let nearest: WeatherForecastEntry | null = null;
    let nearestDist = Infinity;
    for (const entry of entries) {
      const pLat = entry.place?.lat;
      const pLon = entry.place?.lon;
      if (typeof pLat !== 'number' || typeof pLon !== 'number' || !Number.isFinite(pLat) || !Number.isFinite(pLon)) {
        continue;
      }
      const dist = haversineKm(farmLocation.coords, { lat: pLat, lon: pLon });
      if (dist <= maxDistanceKm && dist < nearestDist) {
        nearestDist = dist;
        nearest = entry;
      }
    }
    if (nearest) return { forecast: nearest, matchedBy: 'coordinates' };
  }

  // 2. Fall back to exact normalised state match (never arbitrary/unmatched state).
  const targetState = farmLocation.state?.trim().toLowerCase().replace(/\s+state$/i, '');
  if (targetState) {
    const match = entries.find((entry) => {
      const entryState = entry.place?.state?.trim().toLowerCase().replace(/\s+state$/i, '');
      return Boolean(entryState && entryState === targetState);
    });
    if (match) return { forecast: match, matchedBy: 'state' };
  }

  return null;
}

const VALID_RECORD_ID_RE = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,63}$/;
const VALID_ISO_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Deduplicates and strictly validates context references so they satisfy M3
 * `private.write_ai_audit_event` constraints (whitelisted source, max 100 entries,
 * valid record_id, valid ISO observed_at).
 */
export function normalizeAuditContextReferences(
  refs: readonly AuditContextReference[],
  maxCount: number = 100,
): AuditContextReference[] {
  const seen = new Set<string>();
  const out: AuditContextReference[] = [];

  for (const ref of refs) {
    if (out.length >= maxCount) break;
    if (!ALLOWED_AUDIT_SOURCE_SET.has(ref.source)) continue;
    if (!VALID_RECORD_ID_RE.test(ref.record_id)) continue;
    const key = `${ref.source}|${ref.record_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const normalized: AuditContextReference = {
      source: ref.source as AllowedAuditContextSource,
      record_id: ref.record_id,
    };
    if (ref.observed_at && VALID_ISO_TS_RE.test(ref.observed_at)) {
      const parsed = new Date(ref.observed_at);
      if (!Number.isNaN(parsed.getTime())) {
        normalized.observed_at = ref.observed_at;
      }
    }
    out.push(normalized);
  }

  return out;
}

/**
 * Extracts bounded, deduplicated audit context references from a complete snapshot.
 */
export function extractSnapshotAuditReferences(snapshot: LiveFarmContextSnapshot): AuditContextReference[] {
  const allRefs: AuditContextReference[] = [
    ...(snapshot.farmQueryStatus === 'ok'
      ? [{ source: 'farms' as const, record_id: snapshot.farmId, observed_at: snapshot.retrievedAt }]
      : []),
    ...Object.values(snapshot.domains).flatMap((section) => section.sourceRefs),
  ];
  return normalizeAuditContextReferences(allRefs, 100);
}
