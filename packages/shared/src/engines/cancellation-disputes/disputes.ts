import type {
  DisputeArbitrationInput,
  DisputeArbitrationOutcome,
  DisputeEvidence,
  ArbitrationDecision,
} from './types';
import type { LatLng } from '../../geo';
import { percentOfKobo } from '../../money';

/** Calculates rough distance in meters between two coordinates via Haversine. */
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Verifies whether an evidence photo was captured within permissible distance from the farm (max 1000m). */
export function isEvidenceGpsValid(evidence: DisputeEvidence, farmLocation: LatLng, maxDistanceMeters = 1000): boolean {
  if (!evidence.gps) return false;
  const distance = calculateDistanceMeters(evidence.gps, farmLocation);
  return distance <= maxDistanceMeters;
}

/**
 * Arbitrates a dispute deterministically based on categories, evidence validity, and farm location.
 */
export function arbitrateDispute(input: DisputeArbitrationInput): DisputeArbitrationOutcome {
  const farmerEvidences = input.evidences.filter((e) => e.role === 'farmer');
  const providerEvidences = input.evidences.filter((e) => e.role === 'provider');

  const validFarmerEvidences = farmerEvidences.filter((e) => isEvidenceGpsValid(e, input.farmLocation));
  const validProviderEvidences = providerEvidences.filter((e) => isEvidenceGpsValid(e, input.farmLocation));

  let decision: ArbitrationDecision;
  let farmerRefundKobo = 0;
  let providerPayoutKobo = 0;
  let notes = '';

  switch (input.category) {
    case 'no_show': {
      // Provider failed to appear
      if (validProviderEvidences.length === 0) {
        decision = 'full_refund_to_farmer';
        farmerRefundKobo = input.agreedPriceKobo;
        providerPayoutKobo = 0;
        notes = 'Upheld: Provider showed no valid on-site evidence of presence.';
      } else {
        // Provider was present with GPS proof; contested no-show
        decision = 'full_payout_to_provider';
        farmerRefundKobo = 0;
        providerPayoutKobo = input.agreedPriceKobo;
        notes = 'Rejected: Provider verified on-site presence with geotagged proof.';
      }
      break;
    }

    case 'job_not_done': {
      if (validFarmerEvidences.length > 0 && validProviderEvidences.length === 0) {
        decision = 'full_refund_to_farmer';
        farmerRefundKobo = input.agreedPriceKobo;
        providerPayoutKobo = 0;
        notes = 'Upheld: Farmer demonstrated unperformed work with valid evidence.';
      } else if (validProviderEvidences.length > 0 && validFarmerEvidences.length === 0) {
        decision = 'full_payout_to_provider';
        farmerRefundKobo = 0;
        providerPayoutKobo = input.agreedPriceKobo;
        notes = 'Rejected: Provider supplied valid on-site completion proof.';
      } else {
        // Conflicting evidence: 50% compromise settlement
        decision = 'partial_settlement';
        farmerRefundKobo = percentOfKobo(input.agreedPriceKobo, 50);
        providerPayoutKobo = input.agreedPriceKobo - farmerRefundKobo;
        notes = 'Partial settlement: Conflicting evidence from both parties.';
      }
      break;
    }

    case 'poor_quality':
    case 'wrong_area': {
      // Typically resolved with a negotiated partial settlement
      decision = 'partial_settlement';
      // 40% refund to farmer, 60% payout to provider for machine hours/fuel
      farmerRefundKobo = percentOfKobo(input.agreedPriceKobo, 40);
      providerPayoutKobo = input.agreedPriceKobo - farmerRefundKobo;
      notes = `Partial settlement for ${input.category.replace('_', ' ')}: 40% refunded to farmer, 60% released for operator hours.`;
      break;
    }

    case 'damage': {
      decision = 'damage_offset';
      // Damage offset: 50% retained for farmer repairs, 50% paid to provider
      farmerRefundKobo = percentOfKobo(input.agreedPriceKobo, 50);
      providerPayoutKobo = input.agreedPriceKobo - farmerRefundKobo;
      notes = 'Damage offset applied against provider payout.';
      break;
    }

    default: {
      decision = 'partial_settlement';
      farmerRefundKobo = percentOfKobo(input.agreedPriceKobo, 50);
      providerPayoutKobo = input.agreedPriceKobo - farmerRefundKobo;
      notes = 'Default standard compromise resolution.';
    }
  }

  return {
    arbitrationId: `arb_${Date.now()}_${input.disputeId.slice(0, 8)}`,
    disputeId: input.disputeId,
    decision,
    farmerRefundKobo,
    providerPayoutKobo,
    platformFeeRetainedKobo: 0, // 0% commission in pilot
    notes,
    evidenceScores: {
      farmerEvidenceValidCount: validFarmerEvidences.length,
      providerEvidenceValidCount: validProviderEvidences.length,
    },
    settledAt: Date.now(),
  };
}
