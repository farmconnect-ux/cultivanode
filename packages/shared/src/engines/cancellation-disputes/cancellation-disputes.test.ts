import { describe, it, expect } from 'vitest';
import { evaluateCancellation } from './cancellation';
import { arbitrateDispute, calculateDistanceMeters, isEvidenceGpsValid } from './disputes';
import { validateAgentBookingAuthority } from './agent-booking';

describe('Cancellation Engine', () => {
  const baseBooking = {
    bookingId: 'book_123',
    agreedPriceKobo: 5000000, // ₦50,000
    jobDate: '2026-10-15',
    requestTimestamp: 100000,
    jobStartTimestamp: 100000 + 48 * 60 * 60 * 1000, // 48h in advance
    reason: 'Change of schedule',
  };

  it('allows free 100% refund for early farmer cancellation (>48h)', () => {
    const result = evaluateCancellation({
      ...baseBooking,
      actor: 'farmer',
      jobStartTimestamp: 100000 + 50 * 60 * 60 * 1000, // 50h in advance (>48h)
    });

    expect(result.allowed).toBe(true);
    expect(result.refundFarmerKobo).toBe(5000000);
    expect(result.payoutProviderKobo).toBe(0);
    expect(result.reasonCode).toBe('free_early_cancellation');
  });

  it('charges 10% cancellation fee for moderate farmer cancellation (24–48h)', () => {
    const result = evaluateCancellation({
      ...baseBooking,
      actor: 'farmer',
      jobStartTimestamp: 100000 + 36 * 60 * 60 * 1000, // 36h in advance (24-48h)
    });

    expect(result.allowed).toBe(true);
    expect(result.refundFarmerKobo).toBe(4500000); // 90% of ₦50,000 = ₦45,000
    expect(result.payoutProviderKobo).toBe(500000); // 10% of ₦50,000 = ₦5,000
    expect(result.reasonCode).toBe('moderate_farmer_cancellation');
  });

  it('charges 25% late cancellation fee for late farmer cancellation (<24h)', () => {
    const result = evaluateCancellation({
      ...baseBooking,
      actor: 'farmer',
      jobStartTimestamp: 100000 + 5 * 60 * 60 * 1000, // Only 5h in advance (<24h)
    });

    expect(result.allowed).toBe(true);
    expect(result.refundFarmerKobo).toBe(3750000); // 75% of ₦50,000 = ₦37,500
    expect(result.payoutProviderKobo).toBe(1250000); // 25% of ₦50,000 = ₦12,500
    expect(result.reasonCode).toBe('late_farmer_cancellation');
  });

  it('applies weather waiver with 0 penalty when severe weather occurs', () => {
    const result = evaluateCancellation({
      ...baseBooking,
      actor: 'farmer',
      jobStartTimestamp: 100000 + 2 * 60 * 60 * 1000, // <24h
      weather: { isSevere: true, rainMm: 35, conditionText: 'Heavy downpour' },
    });

    expect(result.allowed).toBe(true);
    expect(result.refundFarmerKobo).toBe(5000000);
    expect(result.payoutProviderKobo).toBe(0);
    expect(result.weatherWaiverApplied).toBe(true);
    expect(result.reasonCode).toBe('weather_reschedule_waiver');
  });

  it('adds strike and flags suspension when provider cancels late on 3rd strike', () => {
    const result = evaluateCancellation({
      ...baseBooking,
      actor: 'provider',
      jobStartTimestamp: 100000 + 3 * 60 * 60 * 1000,
      providerCurrentStrikes: 2,
    });

    expect(result.allowed).toBe(true);
    expect(result.refundFarmerKobo).toBe(5000000);
    expect(result.providerStrikeAdded).toBe(true);
    expect(result.providerTotalStrikes).toBe(3);
    expect(result.providerSuspensionRecommended).toBe(true);
    expect(result.reasonCode).toBe('provider_default_penalty');
  });
});

describe('Dispute Arbitration Engine', () => {
  const farmLocation = { lat: 7.3775, lng: 3.8967 }; // Ibadan, Oyo State

  it('calculates Haversine distance correctly', () => {
    const closePoint = { lat: 7.378, lng: 3.897 };
    const dist = calculateDistanceMeters(farmLocation, closePoint);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(200); // ~70m apart
  });

  it('validates evidence GPS within 1km and rejects distant GPS', () => {
    const closeEvidence = {
      photoUrl: 'http://img/1',
      uploaderId: 'u1',
      role: 'farmer' as const,
      capturedAt: Date.now(),
      gps: { lat: 7.378, lng: 3.897 },
    };
    const distantEvidence = {
      photoUrl: 'http://img/2',
      uploaderId: 'u1',
      role: 'farmer' as const,
      capturedAt: Date.now(),
      gps: { lat: 6.5244, lng: 3.3792 }, // Lagos (~120km away)
    };

    expect(isEvidenceGpsValid(closeEvidence, farmLocation)).toBe(true);
    expect(isEvidenceGpsValid(distantEvidence, farmLocation)).toBe(false);
  });

  it('upholds no-show dispute when provider has no on-site evidence', () => {
    const outcome = arbitrateDispute({
      disputeId: 'disp_1',
      bookingId: 'book_1',
      category: 'no_show',
      agreedPriceKobo: 10000000,
      farmLocation,
      evidences: [],
      disputeOpenedAt: Date.now(),
    });

    expect(outcome.decision).toBe('full_refund_to_farmer');
    expect(outcome.farmerRefundKobo).toBe(10000000);
    expect(outcome.providerPayoutKobo).toBe(0);
  });
});

describe('Agent Booking Validation', () => {
  it('allows agent to book for farmer they onboarded', () => {
    const res = validateAgentBookingAuthority({
      agentProfileId: 'agent_1',
      farmerProfileId: 'farmer_2',
      farmerOnboardedByAgentId: 'agent_1',
      agentRoles: ['field_agent'],
      agentActive: true,
    });
    expect(res.authorized).toBe(true);
  });

  it('rejects booking if farmer was onboarded by someone else', () => {
    const res = validateAgentBookingAuthority({
      agentProfileId: 'agent_1',
      farmerProfileId: 'farmer_2',
      farmerOnboardedByAgentId: 'agent_99',
      agentRoles: ['field_agent'],
      agentActive: true,
    });
    expect(res.authorized).toBe(false);
    expect(res.error).toBe('farmer_not_onboarded_by_agent');
  });
});
