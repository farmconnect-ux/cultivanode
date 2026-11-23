import { describe, expect, it } from 'vitest';
import {
  ALLOWED_AUDIT_CONTEXT_SOURCES,
  CONTEXT_STATES,
  FARM_CONTEXT_DOMAINS,
  FARM_CONTEXT_EVIDENCE_SOURCES,
  aggregateMachineryUsageLogs,
  calculateInventoryLedgerBalances,
  evaluateInventoryLedgerConsistency,
  evaluateMachineryTelemetryConsistency,
  evaluateSoilTestFreshness,
  makeNumericFact,
  matchFarmWeatherForecast,
  normalizeAuditContextReferences,
  parseFarmLocationCoordinates,
  selectAuthoritativeSoilRecord,
} from './index';

describe('Batch 03.1C/D Live Farm Context — Shared Contract & Provenance Helpers', () => {
  it('exposes the 10 canonical domains (8 agricultural + Batch 03.4 labour and livestock) and 7 explicit context states', () => {
    expect(FARM_CONTEXT_DOMAINS).toHaveLength(10);
    expect(CONTEXT_STATES).toEqual([
      'verified_current',
      'unverified_provisional',
      'stale',
      'missing',
      'conflicting',
      'awaiting_sync',
      'invalid_rejected',
    ]);
    expect(ALLOWED_AUDIT_CONTEXT_SOURCES).toContain('soil_records');
    expect(FARM_CONTEXT_EVIDENCE_SOURCES).toContain('irrigation_zones');
    expect(FARM_CONTEXT_EVIDENCE_SOURCES).toContain('irrigation_events');
  });

  it('never coerces null, undefined, or NaN numeric facts to zero', () => {
    const prov = {
      source: 'soil_records' as const,
      recordId: 'rec-1',
      sourceTrust: 'agent_verified' as const,
      observedAt: '2026-10-01T00:00:00Z',
      retrievedAt: '2026-11-21T00:00:00Z',
    };
    expect(makeNumericFact(null, 'verified_current', prov)).toEqual({
      value: null,
      state: 'missing',
      provenance: null,
      note: undefined,
    });
    expect(makeNumericFact(undefined, 'verified_current', prov).value).toBeNull();
    expect(makeNumericFact(Number.NaN, 'verified_current', prov).state).toBe('missing');
    expect(makeNumericFact(0, 'verified_current', prov).value).toBe(0);
  });

  it('rejects future-dated soil tests, flags stale tests, and ranks verified soil_records highest', () => {
    const now = '2026-11-21T00:00:00Z';
    const future = evaluateSoilTestFreshness('2026-12-01', now, 'agent_verified', 's-future');
    expect(future.state).toBe('invalid_rejected');

    const stale = evaluateSoilTestFreshness('2025-01-01', now, 'agent_verified', 's-stale');
    expect(stale.state).toBe('stale');
    expect(stale.ageDays).toBeGreaterThan(365);

    const missingDate = evaluateSoilTestFreshness(null, now, 'agent_verified', 's-nodate');
    expect(missingDate.state).toBe('missing');

    const ranked = selectAuthoritativeSoilRecord(
      [
        {
          id: 's-self-new',
          plotId: 'p1',
          ph: 6.2,
          nitrogenPct: 0.15,
          phosphorusPpm: 12,
          potassiumCmolKg: 0.4,
          organicMatterPct: 2.1,
          soilType: 'loam',
          source: 'self_reported',
          testedOn: '2026-11-10',
          createdAt: '2026-11-10T00:00:00Z',
        },
        {
          id: 's-agent-valid',
          plotId: 'p1',
          ph: 6.5,
          nitrogenPct: 0.22,
          phosphorusPpm: 18,
          potassiumCmolKg: 0.5,
          organicMatterPct: 2.8,
          soilType: 'loam',
          source: 'agent_verified',
          testedOn: '2026-09-01',
          createdAt: '2026-09-01T00:00:00Z',
        },
        {
          id: 's-future-bad',
          plotId: 'p1',
          ph: 7.9,
          nitrogenPct: 0.5,
          phosphorusPpm: 40,
          potassiumCmolKg: 1.0,
          organicMatterPct: 5.0,
          soilType: 'clay',
          source: 'platform_verified',
          testedOn: '2027-02-01',
          createdAt: '2026-11-20T00:00:00Z',
        },
      ],
      now,
    );

    expect(ranked.selected?.id).toBe('s-agent-valid');
    expect(ranked.freshness.state).toBe('verified_current');
    expect(ranked.rejectedIssues).toHaveLength(1);
    expect(ranked.rejectedIssues[0]?.code).toBe('future_dated_soil_test');
  });

  describe('Finding 01: Inventory ledger aggregation & consistency', () => {
    it('calculates exact balances for <200 and >200 transactions, multiple items, reversals, adjustments, zero, and negative balances', () => {
      // >200 transactions (250 receipts of 1 + 40 issues of 1 = 210)
      const manyTxs = [
        ...Array.from({ length: 250 }, (_, i) => ({
          id: `tx-in-${i}`,
          inventoryId: 'inv-large',
          transactionType: 'receipt',
          quantity: 1,
          createdAt: `2026-10-01T00:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}Z`,
        })),
        ...Array.from({ length: 40 }, (_, i) => ({
          id: `tx-out-${i}`,
          inventoryId: 'inv-large',
          transactionType: 'issue_to_field',
          quantity: 1,
          createdAt: `2026-10-02T00:00:${String(i).padStart(2, '0')}Z`,
        })),
        // Item with reversal, adjustment, transfer, reservation, release -> zero balance
        { id: 'tx-z1', inventoryId: 'inv-zero', transactionType: 'purchase', quantity: 50, createdAt: '2026-10-01T00:00:00Z' },
        { id: 'tx-z2', inventoryId: 'inv-zero', transactionType: 'adjustment', quantity: 10, createdAt: '2026-10-02T00:00:00Z' },
        { id: 'tx-z3', inventoryId: 'inv-zero', transactionType: 'transfer', quantity: 20, createdAt: '2026-10-03T00:00:00Z' },
        { id: 'tx-z4', inventoryId: 'inv-zero', transactionType: 'reservation', quantity: 15, createdAt: '2026-10-04T00:00:00Z' },
        { id: 'tx-z5', inventoryId: 'inv-zero', transactionType: 'release', quantity: 15, createdAt: '2026-10-05T00:00:00Z' },
        { id: 'tx-z6', inventoryId: 'inv-zero', transactionType: 'reversal', quantity: 60, createdAt: '2026-10-06T00:00:00Z' },
        // Item with negative ledger balance
        { id: 'tx-n1', inventoryId: 'inv-neg', transactionType: 'receipt', quantity: 5, createdAt: '2026-10-01T00:00:00Z' },
        { id: 'tx-n2', inventoryId: 'inv-neg', transactionType: 'loss', quantity: 8, createdAt: '2026-10-02T00:00:00Z' },
        // Duplicate ID should not double count
        { id: 'tx-n2', inventoryId: 'inv-neg', transactionType: 'loss', quantity: 8, createdAt: '2026-10-02T00:00:00Z' },
      ];

      const balances = calculateInventoryLedgerBalances(manyTxs);
      expect(balances.get('inv-large')?.balance).toBe(210);
      expect(balances.get('inv-large')?.transactionCount).toBe(290);
      expect(balances.get('inv-large')?.latestTransactionId).toBe('tx-out-39');

      expect(balances.get('inv-zero')?.balance).toBe(0);
      expect(balances.get('inv-neg')?.balance).toBe(-3);
      expect(balances.get('inv-neg')?.transactionCount).toBe(2);
    });

    it('detects divergence, matches, missing history, awaiting_sync, and refuses truncated ledgers', () => {
      const matched = evaluateInventoryLedgerConsistency({
        inventoryId: 'inv-1',
        itemName: 'NPK 15-15-15',
        cachedQuantity: 210,
        ledgerQuantity: 210,
        latestTransactionId: 'tx-290',
        isLedgerComplete: true,
        retrievedAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-20T00:00:00Z',
      });
      expect(matched.state).toBe('verified_current');
      expect(matched.conflict).toBeNull();

      const diverged = evaluateInventoryLedgerConsistency({
        inventoryId: 'inv-1',
        itemName: 'NPK 15-15-15',
        cachedQuantity: 50,
        ledgerQuantity: 42,
        latestTransactionId: 'tx-99',
        latestTransactionAt: '2026-11-20T01:00:00Z',
        isLedgerComplete: true,
        retrievedAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-20T00:00:00Z',
      });
      expect(diverged.state).toBe('conflicting');
      expect(diverged.conflict?.candidates[1]?.recordId).toBe('tx-99');

      const truncated = evaluateInventoryLedgerConsistency({
        inventoryId: 'inv-1',
        itemName: 'NPK 15-15-15',
        cachedQuantity: 50,
        ledgerQuantity: 50,
        isLedgerComplete: false,
        retrievedAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-20T00:00:00Z',
      });
      expect(truncated.state).toBe('unverified_provisional');
      expect(truncated.issue?.code).toBe('inventory_ledger_truncated');

      const missingHistory = evaluateInventoryLedgerConsistency({
        inventoryId: 'inv-1',
        itemName: 'NPK 15-15-15',
        cachedQuantity: 50,
        ledgerQuantity: null,
        retrievedAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-20T00:00:00Z',
      });
      expect(missingHistory.state).toBe('unverified_provisional');

      const pendingSync = evaluateInventoryLedgerConsistency({
        inventoryId: 'inv-1',
        itemName: 'NPK 15-15-15',
        cachedQuantity: 50,
        ledgerQuantity: 42,
        hasPendingOutboxSync: true,
        retrievedAt: '2026-11-21T00:00:00Z',
        updatedAt: '2026-11-20T00:00:00Z',
      });
      expect(pendingSync.state).toBe('awaiting_sync');
    });
  });

  describe('Finding 02: Machinery telemetry chronological ordering & consistency', () => {
    it('sorts out-of-order samples, flags decreases, duplicate timestamps, invalid quality flags, null readings, and staleness', () => {
      // Out-of-order monotonic valid samples
      const monotonic = evaluateMachineryTelemetryConsistency({
        machineryId: 'm-1',
        machineryName: 'Tractor A',
        assetEngineHours: 250,
        retrievedAt: '2026-11-21T12:00:00Z',
        telemetrySamples: [
          { id: 't-3', engineHours: 255, recordedAt: '2026-11-21T10:00:00Z' },
          { id: 't-1', engineHours: 240, recordedAt: '2026-11-20T10:00:00Z' },
          { id: 't-2', engineHours: 248, recordedAt: '2026-11-20T18:00:00Z' },
        ],
      });
      expect(monotonic.state).toBe('unverified_provisional');
      expect(monotonic.latestValidHours).toBe(255);
      expect(monotonic.latestValidSampleId).toBe('t-3');
      expect(monotonic.conflicts).toHaveLength(0);

      // Decrease detection
      const decreased = evaluateMachineryTelemetryConsistency({
        machineryId: 'm-1',
        machineryName: 'Tractor A',
        assetEngineHours: 200,
        telemetrySamples: [
          { id: 't-1', engineHours: 210, recordedAt: '2026-11-20T10:00:00Z' },
          { id: 't-2', engineHours: 185, recordedAt: '2026-11-21T10:00:00Z' },
        ],
      });
      expect(decreased.state).toBe('conflicting');
      expect(decreased.issues.some((i) => i.code === 'non_monotonic_engine_hours')).toBe(true);

      // Duplicate timestamp with conflicting values
      const dupConflict = evaluateMachineryTelemetryConsistency({
        machineryId: 'm-1',
        machineryName: 'Tractor A',
        assetEngineHours: 200,
        telemetrySamples: [
          { id: 't-1', engineHours: 200, recordedAt: '2026-11-21T10:00:00Z' },
          { id: 't-2', engineHours: 205, recordedAt: '2026-11-21T10:00:00Z' },
        ],
      });
      expect(dupConflict.state).toBe('conflicting');
      expect(dupConflict.issues.some((i) => i.code === 'duplicate_telemetry_timestamp')).toBe(true);

      // Invalid quality flag + negative + null readings -> invalid_rejected (never verified_current)
      const invalid = evaluateMachineryTelemetryConsistency({
        machineryId: 'm-1',
        machineryName: 'Tractor A',
        assetEngineHours: 100,
        telemetrySamples: [
          { id: 't-null', engineHours: null, recordedAt: '2026-11-21T08:00:00Z' },
          { id: 't-badq', engineHours: 102, recordedAt: '2026-11-21T09:00:00Z', qualityFlag: 'quarantined' },
          { id: 't-neg', engineHours: -5, recordedAt: '2026-11-21T10:00:00Z' },
        ],
      });
      expect(invalid.state).toBe('invalid_rejected');
      expect(invalid.latestValidHours).toBeNull();
      expect(invalid.latestObservedHours).toBe(-5);

      // Stale telemetry (>168h)
      const stale = evaluateMachineryTelemetryConsistency({
        machineryId: 'm-1',
        machineryName: 'Tractor A',
        assetEngineHours: 200,
        retrievedAt: '2026-11-21T12:00:00Z',
        telemetrySamples: [{ id: 't-old', engineHours: 200, recordedAt: '2026-11-01T12:00:00Z' }],
      });
      expect(stale.state).toBe('stale');
      expect(stale.issues.some((i) => i.code === 'stale_telemetry')).toBe(true);
    });
  });

  describe('Finding 03: Machinery usage session aggregation', () => {
    it('aggregates >100 logs, rejects null/negative/implausible values, deduplicates IDs, and respects comparison periods', () => {
      const logs = [
        ...Array.from({ length: 120 }, (_, i) => ({
          id: `u-${i}`,
          machineryId: 'm-1',
          hoursOperated: 1.5,
          startTime: `2026-10-${String((i % 28) + 1).padStart(2, '0')}T08:00:00Z`,
          endTime: `2026-10-${String((i % 28) + 1).padStart(2, '0')}T09:30:00Z`,
        })),
        // Duplicate ID
        { id: 'u-0', machineryId: 'm-1', hoursOperated: 1.5, startTime: '2026-10-01T08:00:00Z', endTime: '2026-10-01T09:30:00Z' },
        // Zero hours (valid)
        { id: 'u-zero', machineryId: 'm-1', hoursOperated: 0, startTime: '2026-10-15T08:00:00Z', endTime: '2026-10-15T08:00:00Z' },
        // Null, negative, and implausible (>24h)
        { id: 'u-null', machineryId: 'm-1', hoursOperated: null, startTime: '2026-10-15T08:00:00Z', endTime: '2026-10-15T09:00:00Z' },
        { id: 'u-neg', machineryId: 'm-1', hoursOperated: -2, startTime: '2026-10-15T08:00:00Z', endTime: '2026-10-15T09:00:00Z' },
        { id: 'u-big', machineryId: 'm-1', hoursOperated: 48, startTime: '2026-10-15T08:00:00Z', endTime: '2026-10-15T09:00:00Z' },
        // Outside comparison period
        { id: 'u-old', machineryId: 'm-1', hoursOperated: 5, startTime: '2025-01-01T08:00:00Z', endTime: '2025-01-01T13:00:00Z' },
      ];

      const agg = aggregateMachineryUsageLogs(logs, {
        machineryName: 'Tractor A',
        isCompleteHistory: true,
        comparisonPeriodStart: '2026-10-01T00:00:00Z',
        comparisonPeriodEnd: '2026-10-31T23:59:59Z',
      });

      expect(agg.totalHours).toBe(180);
      expect(agg.recordCount).toBe(121);
      expect(agg.isCompleteHistory).toBe(true);
      expect(agg.issues.filter((i) => i.code === 'invalid_usage_log')).toHaveLength(3);
    });
  });

  describe('Finding 05: Farm location parsing & weather matching', () => {
    it('validates coordinates and matches only verified farm locations', () => {
      expect(parseFarmLocationCoordinates({ type: 'Point', coordinates: [3.947, 7.3775] })).toEqual({
        status: 'valid',
        coords: { lat: 7.3775, lon: 3.947 },
      });
      expect(parseFarmLocationCoordinates({ type: 'Point', coordinates: [0, 0] })).toEqual({ status: 'invalid' });
      expect(parseFarmLocationCoordinates({ type: 'Point', coordinates: [999, 99] })).toEqual({ status: 'invalid' });
      expect(parseFarmLocationCoordinates(null)).toEqual({ status: 'missing' });

      const payload = [
        { place: { state: 'Oyo', town: 'Ibadan', lat: 7.3775, lon: 3.947 }, now: { tempC: 31, humidity: 70, windKmh: 9 } },
        { place: { state: 'Lagos', town: 'Ikeja', lat: 6.6018, lon: 3.3515 }, now: { tempC: 29, humidity: 82, windKmh: 14 } },
      ];

      const byCoords = matchFarmWeatherForecast(payload, { state: null, coords: { lat: 7.39, lon: 3.95 } });
      expect(byCoords?.matchedBy).toBe('coordinates');
      expect(byCoords?.forecast.place?.state).toBe('Oyo');

      const byState = matchFarmWeatherForecast(payload, { state: 'Lagos State', coords: null });
      expect(byState?.matchedBy).toBe('state');
      expect(byState?.forecast.place?.town).toBe('Ikeja');

      const noMatch = matchFarmWeatherForecast(payload, { state: 'Kano', coords: { lat: 12.0, lon: 8.5 } });
      expect(noMatch).toBeNull();
    });
  });

  describe('Finding 07: Audit context reference validation', () => {
    it('deduplicates, caps at 100, and rejects malformed IDs and unwhitelisted sources', () => {
      const refs = normalizeAuditContextReferences([
        { source: 'farms', record_id: 'farm-1', observed_at: '2026-11-21T00:00:00Z' },
        { source: 'farms', record_id: 'farm-1', observed_at: '2026-11-21T01:00:00Z' },
        { source: 'soil_records', record_id: 'invalid id with spaces' },
        { source: 'arbitrary_table' as unknown as 'farms', record_id: 'bad-1' },
      ]);

      expect(refs).toEqual([{ source: 'farms', record_id: 'farm-1', observed_at: '2026-11-21T00:00:00Z' }]);
    });
  });

  describe('Batch 03.3 Workstream B4: Machinery telemetry provenance trust classification', () => {
    it('promotes verified device_authenticated telemetry to verified_current, keeps farmer_observation as unverified_provisional, and excludes rejected telemetry', () => {
      const deviceVerified = evaluateMachineryTelemetryConsistency({
        machineryId: 'm-1',
        machineryName: 'Tractor A',
        assetEngineHours: 120,
        retrievedAt: '2026-11-21T12:00:00Z',
        telemetrySamples: [
          {
            id: 't-dev-1',
            engineHours: 121.5,
            recordedAt: '2026-11-21T11:55:00Z',
            sourceCategory: 'device_authenticated',
            validationStatus: 'verified',
            trustClassification: 'verified_current',
          },
        ],
      });
      expect(deviceVerified.state).toBe('verified_current');
      expect(deviceVerified.latestValidHours).toBe(121.5);

      const farmerObs = evaluateMachineryTelemetryConsistency({
        machineryId: 'm-1',
        machineryName: 'Tractor A',
        assetEngineHours: 120,
        retrievedAt: '2026-11-21T12:00:00Z',
        telemetrySamples: [
          {
            id: 't-farm-1',
            engineHours: 121.0,
            recordedAt: '2026-11-21T11:55:00Z',
            sourceCategory: 'farmer_observation',
            validationStatus: 'provisional',
            trustClassification: 'unverified_provisional',
          },
        ],
      });
      expect(farmerObs.state).toBe('unverified_provisional');

      const rejected = evaluateMachineryTelemetryConsistency({
        machineryId: 'm-1',
        machineryName: 'Tractor A',
        assetEngineHours: 120,
        retrievedAt: '2026-11-21T12:00:00Z',
        telemetrySamples: [
          {
            id: 't-rej-1',
            engineHours: 121.0,
            recordedAt: '2026-11-21T11:55:00Z',
            sourceCategory: 'device_authenticated',
            validationStatus: 'rejected',
            trustClassification: 'invalid_rejected',
          },
        ],
      });
      expect(rejected.state).toBe('invalid_rejected');
      expect(rejected.latestValidHours).toBeNull();
    });
  });
});
