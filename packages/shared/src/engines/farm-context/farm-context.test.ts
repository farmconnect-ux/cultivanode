import { describe, expect, it } from 'vitest';
import {
  CONTEXT_STATES,
  FARM_CONTEXT_DOMAINS,
  PROVISIONAL_SOIL_TEST_VALIDITY_DAYS,
  evaluateInventoryLedgerConsistency,
  evaluateMachineryTelemetryConsistency,
  evaluateSoilTestFreshness,
  makeNumericFact,
  normalizeAuditContextReferences,
  selectAuthoritativeSoilRecord,
  type SoilRecordCandidate,
} from './index';

describe('Farm Context Domain Contract & Provenance Rules (ADR-007)', () => {
  it('defines all 7 canonical context states and 8 canonical farm data domains', () => {
    expect(CONTEXT_STATES).toEqual([
      'verified_current',
      'unverified_provisional',
      'stale',
      'missing',
      'conflicting',
      'awaiting_sync',
      'invalid_rejected',
    ]);
    expect(FARM_CONTEXT_DOMAINS).toHaveLength(8);
  });

  it('never coerces null, undefined, or NaN numeric facts to zero', () => {
    expect(makeNumericFact(null, 'verified_current', null)).toEqual({
      value: null,
      state: 'missing',
      provenance: null,
      note: undefined,
    });
    expect(makeNumericFact(undefined, 'verified_current', null).state).toBe('missing');
    expect(makeNumericFact(Number.NaN, 'verified_current', null).state).toBe('missing');
    expect(makeNumericFact(0, 'verified_current', null).value).toBe(0);
    expect(makeNumericFact(0, 'verified_current', null).state).toBe('verified_current');
  });

  it('classifies soil tests: future -> invalid_rejected, missing -> missing, >365d -> stale, verified vs self_reported', () => {
    const now = '2026-11-21T04:00:00Z';

    const future = evaluateSoilTestFreshness('2026-12-01', now, 'agent_verified', 'soil-1');
    expect(future.state).toBe('invalid_rejected');
    expect(future.issue?.code).toBe('future_dated_soil_test');

    const missing = evaluateSoilTestFreshness(null, now, 'agent_verified', 'soil-2');
    expect(missing.state).toBe('missing');
    expect(missing.ageDays).toBeNull();
    expect(missing.issue?.code).toBe('missing_soil_test_date');

    const stale = evaluateSoilTestFreshness('2025-10-01', now, 'agent_verified', 'soil-3');
    expect(stale.state).toBe('stale');
    expect(stale.ageDays).toBeGreaterThan(PROVISIONAL_SOIL_TEST_VALIDITY_DAYS);
    expect(stale.issue?.code).toBe('provisional_stale_soil_test');

    const verified = evaluateSoilTestFreshness('2026-10-01', now, 'agent_verified', 'soil-4');
    expect(verified.state).toBe('verified_current');
    expect(verified.ageDays).toBe(51);

    const selfReported = evaluateSoilTestFreshness('2026-10-01', now, 'self_reported', 'soil-5');
    expect(selfReported.state).toBe('unverified_provisional');
  });

  it('prioritises verified lab soil records over newer self-reported records and rejects future-dated records', () => {
    const records: SoilRecordCandidate[] = [
      {
        id: 'soil-future',
        plotId: 'plot-1',
        ph: 7.0,
        nitrogenPct: 0.2,
        phosphorusPpm: 20,
        potassiumCmolKg: 0.4,
        organicMatterPct: 2.0,
        soilType: 'loam',
        source: 'agent_verified',
        testedOn: '2027-01-01',
        createdAt: '2026-11-20T00:00:00Z',
      },
      {
        id: 'soil-self',
        plotId: 'plot-1',
        ph: 5.1,
        nitrogenPct: null,
        phosphorusPpm: 10,
        potassiumCmolKg: 0.2,
        organicMatterPct: 1.1,
        soilType: 'sandy',
        source: 'self_reported',
        testedOn: '2026-11-15',
        createdAt: '2026-11-16T00:00:00Z',
      },
      {
        id: 'soil-verified',
        plotId: 'plot-1',
        ph: 6.3,
        nitrogenPct: 0.18,
        phosphorusPpm: 18,
        potassiumCmolKg: 0.35,
        organicMatterPct: 2.4,
        soilType: 'loam',
        source: 'platform_verified',
        testedOn: '2026-09-01',
        createdAt: '2026-09-02T00:00:00Z',
      },
    ];

    const res = selectAuthoritativeSoilRecord(records, '2026-11-21T04:00:00Z');
    expect(res.selected?.id).toBe('soil-verified');
    expect(res.freshness.state).toBe('verified_current');
    expect(res.rejectedIssues).toHaveLength(1);
    expect(res.rejectedIssues[0]?.recordId).toBe('soil-future');
  });

  it('detects inventory ledger-vs-cache divergence as conflicting and respects awaiting_sync', () => {
    const conflict = evaluateInventoryLedgerConsistency({
      inventoryId: 'inv-1',
      itemName: 'NPK 15-15-15',
      cachedQuantity: 10,
      ledgerQuantity: 7,
      retrievedAt: '2026-11-21T04:00:00Z',
      updatedAt: '2026-11-20T12:00:00Z',
    });
    expect(conflict.state).toBe('conflicting');
    expect(conflict.conflict?.field).toBe('inventory:inv-1:quantity');
    expect(conflict.issue?.code).toBe('inventory_ledger_cache_divergence');

    const synced = evaluateInventoryLedgerConsistency({
      inventoryId: 'inv-1',
      itemName: 'NPK 15-15-15',
      cachedQuantity: 10,
      ledgerQuantity: 10,
      retrievedAt: '2026-11-21T04:00:00Z',
      updatedAt: '2026-11-20T12:00:00Z',
    });
    expect(synced.state).toBe('verified_current');

    const pending = evaluateInventoryLedgerConsistency({
      inventoryId: 'inv-1',
      itemName: 'NPK 15-15-15',
      cachedQuantity: 10,
      ledgerQuantity: 7,
      hasPendingOutboxSync: true,
      retrievedAt: '2026-11-21T04:00:00Z',
      updatedAt: '2026-11-20T12:00:00Z',
    });
    expect(pending.state).toBe('awaiting_sync');
  });

  it('flags non-monotonic, implausible, and usage-disagreeing machinery telemetry as conflicting/invalid_rejected', () => {
    const nonMonotonic = evaluateMachineryTelemetryConsistency({
      machineryId: 'mach-1',
      machineryName: 'Massey Ferguson 375',
      assetEngineHours: 120,
      loggedUsageHoursTotal: 120,
      telemetrySamples: [
        { id: 'tel-1', engineHours: 125, recordedAt: '2026-11-19T08:00:00Z' },
        { id: 'tel-2', engineHours: 110, recordedAt: '2026-11-20T08:00:00Z' },
      ],
    });
    expect(nonMonotonic.state).toBe('conflicting');
    expect(nonMonotonic.issues.some((i) => i.code === 'non_monotonic_engine_hours')).toBe(true);

    const implausible = evaluateMachineryTelemetryConsistency({
      machineryId: 'mach-2',
      machineryName: 'Harvester',
      assetEngineHours: null,
      loggedUsageHoursTotal: null,
      telemetrySamples: [{ id: 'tel-bad', engineHours: -5, recordedAt: '2026-11-20T08:00:00Z' }],
    });
    expect(implausible.state).toBe('invalid_rejected');

    const mismatch = evaluateMachineryTelemetryConsistency({
      machineryId: 'mach-3',
      machineryName: 'Planter',
      assetEngineHours: 50,
      loggedUsageHoursTotal: 50,
      telemetrySamples: [{ id: 'tel-3', engineHours: 120, recordedAt: '2026-11-20T08:00:00Z' }],
    });
    expect(mismatch.state).toBe('conflicting');
    expect(mismatch.issues.some((i) => i.code === 'machinery_usage_telemetry_mismatch')).toBe(true);
  });

  it('normalizes and deduplicates audit context references and strips malformed IDs/timestamps', () => {
    const refs = normalizeAuditContextReferences([
      { source: 'farms', record_id: 'farm-001', observed_at: '2026-11-21T04:00:00Z' },
      { source: 'farms', record_id: 'farm-001', observed_at: '2026-11-21T04:00:00Z' },
      { source: 'soil_records', record_id: 'farmer@example.com' },
      { source: 'weather_cache', record_id: 'oyo:ibadan', observed_at: 'not-a-date' },
    ]);
    expect(refs).toEqual([
      { source: 'farms', record_id: 'farm-001', observed_at: '2026-11-21T04:00:00Z' },
      { source: 'weather_cache', record_id: 'oyo:ibadan' },
    ]);
  });
});
