/**
 * CultivaNode 3.0 — Batch 03.1C Live Farm Context Provenance & Conflict Rules (ADR-007).
 *
 * Pure, deterministic helpers that classify facts into the 7 explicit context states,
 * enforce domain-specific precedence rules, and emit schema-valid audit context references.
 */

import type {
  AllowedAuditContextSource,
  AuditContextReference,
  ContextConflictDetail,
  ContextFact,
  ContextState,
  ContextValidationIssue,
  LiveFarmContextSnapshot,
} from './types';

export const PROVISIONAL_SOIL_TEST_VALIDITY_DAYS = 365;
export const PROVISIONAL_SOIL_VALIDITY_NOTE =
  'Provisional 365-day soil-test validity threshold pending qualified agronomist/soil-scientist validation (ADR-007).';

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
    const freshnessBonus = freshness.state === 'verified_current' ? 4 : freshness.state === 'unverified_provisional' ? 3 : freshness.state === 'stale' ? 2 : 1;
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
    return (b.record.testedOn ?? '').localeCompare(a.record.testedOn ?? '') || b.record.createdAt.localeCompare(a.record.createdAt);
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

/**
 * Evaluates Domain 5 (Farm Inventory) divergence between `farm_inventory.quantity` cache
 * and the ledger sum computed from `farm_inventory_transactions`.
 */
export function evaluateInventoryLedgerConsistency(params: {
  inventoryId: string;
  itemName: string;
  cachedQuantity: number | null;
  ledgerQuantity: number | null;
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
  if (params.cachedQuantity === null && params.ledgerQuantity === null) {
    return { state: 'missing', conflict: null, issue: null };
  }
  if (params.ledgerQuantity === null) {
    return { state: 'unverified_provisional', conflict: null, issue: null };
  }
  if (params.cachedQuantity !== null && Math.abs(params.cachedQuantity - params.ledgerQuantity) > 0.001) {
    return {
      state: 'conflicting',
      conflict: {
        field: `inventory:${params.inventoryId}:quantity`,
        summary: `Inventory item "${params.itemName}" cached quantity (${params.cachedQuantity}) diverges from ledger sum (${params.ledgerQuantity}).`,
        candidates: [
          { source: 'farm_inventory', recordId: params.inventoryId, value: params.cachedQuantity, observedAt: params.updatedAt },
          { source: 'farm_inventory_transactions', recordId: params.inventoryId, value: params.ledgerQuantity, observedAt: params.retrievedAt },
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
}

/**
 * Evaluates Domain 7 (Machinery & Telemetry) consistency:
 * - Negative or implausibly large engine hours (> 100,000h) -> `invalid_rejected`
 * - Non-monotonic engine_hours decreases across chronological telemetry -> `conflicting`
 * - Significant disagreement (> 25h) between telemetry engine_hours and logged usage/asset hours -> `conflicting`
 * Never allows invalid or unverified telemetry to silently override `farm_machinery_usage_logs`.
 */
export function evaluateMachineryTelemetryConsistency(params: {
  machineryId: string;
  machineryName: string;
  assetEngineHours: number | null;
  loggedUsageHoursTotal: number | null;
  /** Chronological ascending samples from `public.machinery_telemetry`. */
  telemetrySamples: readonly MachineryTelemetrySample[];
}): {
  state: ContextState;
  latestValidHours: number | null;
  latestObservedAt: string | null;
  conflicts: ContextConflictDetail[];
  issues: ContextValidationIssue[];
} {
  const conflicts: ContextConflictDetail[] = [];
  const issues: ContextValidationIssue[] = [];
  let previousValidHours: number | null = null;
  let previousSample: MachineryTelemetrySample | null = null;
  let latestValidHours: number | null = null;
  let latestObservedAt: string | null = null;
  let sawInvalid = false;
  let sawNonMonotonic = false;

  for (const sample of params.telemetrySamples) {
    if (sample.engineHours === null || !Number.isFinite(sample.engineHours)) continue;
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

    if (previousValidHours !== null && sample.engineHours < previousValidHours - 0.1) {
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
          { source: 'machinery_telemetry', recordId: previousSample!.id, value: previousValidHours, observedAt: previousSample!.recordedAt },
          { source: 'machinery_telemetry', recordId: sample.id, value: sample.engineHours, observedAt: sample.recordedAt },
        ],
      });
    }

    previousValidHours = sample.engineHours;
    previousSample = sample;
    latestValidHours = sample.engineHours;
    latestObservedAt = sample.recordedAt;
  }

  const baselineHours = params.assetEngineHours ?? params.loggedUsageHoursTotal;
  if (latestValidHours !== null && baselineHours !== null && Math.abs(latestValidHours - baselineHours) > 25) {
    issues.push({
      domain: 'equipment_and_iot_telemetry',
      field: 'engine_hours',
      code: 'machinery_usage_telemetry_mismatch',
      message: `Telemetry engine_hours (${latestValidHours}) disagrees with machinery asset/usage hours (${baselineHours}).`,
      source: 'machinery_telemetry',
      recordId: previousSample?.id ?? params.machineryId,
    });
    conflicts.push({
      field: `machinery:${params.machineryId}:usage_vs_telemetry`,
      summary: `Machinery "${params.machineryName}" telemetry hours (${latestValidHours}) disagree with asset/usage hours (${baselineHours}).`,
      candidates: [
        { source: 'farm_machinery_assets', recordId: params.machineryId, value: baselineHours, observedAt: null },
        { source: 'machinery_telemetry', recordId: previousSample?.id ?? params.machineryId, value: latestValidHours, observedAt: latestObservedAt },
      ],
    });
  }

  if (conflicts.length > 0 || sawNonMonotonic) {
    return { state: 'conflicting', latestValidHours, latestObservedAt, conflicts, issues };
  }
  if (sawInvalid && latestValidHours === null) {
    return { state: 'invalid_rejected', latestValidHours: null, latestObservedAt: null, conflicts, issues };
  }
  if (latestValidHours === null && baselineHours === null) {
    return { state: 'missing', latestValidHours: null, latestObservedAt: null, conflicts, issues };
  }
  return {
    state: latestValidHours !== null ? 'unverified_provisional' : 'verified_current',
    latestValidHours,
    latestObservedAt,
    conflicts,
    issues,
  };
}

const VALID_RECORD_ID_RE = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,63}$/;
const VALID_ISO_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Deduplicates and filters context references so they strictly satisfy M3
 * `private.write_ai_audit_event` constraints (max 100 entries, valid source/record_id/observed_at).
 */
export function normalizeAuditContextReferences(
  refs: readonly AuditContextReference[],
  maxCount: number = 100,
): AuditContextReference[] {
  const seen = new Set<string>();
  const out: AuditContextReference[] = [];

  for (const ref of refs) {
    if (out.length >= maxCount) break;
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
    { source: 'farms', record_id: snapshot.farmId, observed_at: snapshot.retrievedAt },
    ...Object.values(snapshot.domains).flatMap((section) => section.sourceRefs),
  ];
  return normalizeAuditContextReferences(allRefs, 100);
}
