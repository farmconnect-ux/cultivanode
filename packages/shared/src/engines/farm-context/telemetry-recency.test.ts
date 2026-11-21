import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VERIFIED_TELEMETRY_MAX_AGE_HOURS,
  evaluateMachineryTelemetryConsistency,
} from './provenance';

const verifiedSample = (recordedAt: string) => ({
  id: 't-dev',
  engineHours: 121.5,
  recordedAt,
  sourceCategory: 'device_authenticated',
  validationStatus: 'verified',
  trustClassification: 'verified_current',
});

const evaluate = (recordedAt: string, retrievedAt?: string) =>
  evaluateMachineryTelemetryConsistency({
    machineryId: 'm-1',
    machineryName: 'Tractor A',
    assetEngineHours: 120,
    retrievedAt,
    telemetrySamples: [verifiedSample(recordedAt)],
  });

describe('Batch 03.3 (PR #24 review, Low): verified telemetry must be recent to be current', () => {
  it('keeps a recent verified device reading as verified_current', () => {
    expect(evaluate('2026-11-21T11:00:00Z', '2026-11-21T12:00:00Z').state).toBe('verified_current');
  });

  it('downgrades a verified reading older than the current limit to unverified_provisional', () => {
    const res = evaluate('2026-11-19T12:00:00Z', '2026-11-21T12:00:00Z');
    expect(DEFAULT_VERIFIED_TELEMETRY_MAX_AGE_HOURS).toBe(24);
    expect(res.state).toBe('unverified_provisional');
    expect(res.issues.some((i) => i.code === 'verified_telemetry_not_recent')).toBe(true);
  });

  it('marks a very old verified reading (e.g. 2015) as stale, never verified_current', () => {
    expect(evaluate('2015-06-01T00:00:00Z', '2026-11-21T12:00:00Z').state).toBe('stale');
  });

  it('does not treat a reading as current when its age is unknown (no retrievedAt)', () => {
    expect(evaluate('2026-11-21T11:00:00Z').state).toBe('unverified_provisional');
  });

  it('does not treat a future-dated reading as current', () => {
    const res = evaluate('2026-11-21T13:00:00Z', '2026-11-21T12:00:00Z');
    expect(res.state).toBe('unverified_provisional');
    expect(res.issues.some((i) => i.code === 'future_telemetry_timestamp')).toBe(true);
  });

  it('allows a custom verified max age', () => {
    const res = evaluateMachineryTelemetryConsistency({
      machineryId: 'm-1',
      machineryName: 'Tractor A',
      assetEngineHours: 120,
      retrievedAt: '2026-11-21T12:00:00Z',
      verifiedMaxAgeHours: 72,
      telemetrySamples: [verifiedSample('2026-11-19T12:00:00Z')],
    });
    expect(res.state).toBe('verified_current');
  });
});
