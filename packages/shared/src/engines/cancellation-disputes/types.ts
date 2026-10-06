import type { LatLng } from '../../geo';

export type CancellationActor = 'farmer' | 'provider' | 'admin';

export interface WeatherCondition {
  isSevere: boolean;
  rainMm?: number;
  conditionText?: string;
}

export interface CancellationPolicySettings {
  freeCancellationNoticeHours: number; // default 24
  lateCancellationFeePercent: number; // default 20
  providerStrikeThreshold: number; // default 3
  weatherRainMmThreshold: number; // default 15
}

export interface CancellationRequest {
  bookingId: string;
  actor: CancellationActor;
  agreedPriceKobo: number;
  jobDate: string; // YYYY-MM-DD
  requestTimestamp: number; // ms
  jobStartTimestamp: number; // ms
  reason: string;
  weather?: WeatherCondition;
  providerCurrentStrikes?: number;
}

export interface CancellationOutcome {
  allowed: boolean;
  refundFarmerKobo: number;
  payoutProviderKobo: number;
  penaltyFeeKobo: number;
  providerStrikeAdded: boolean;
  providerTotalStrikes: number;
  providerSuspensionRecommended: boolean;
  weatherWaiverApplied: boolean;
  reasonCode:
    | 'free_early_cancellation'
    | 'late_farmer_cancellation'
    | 'weather_reschedule_waiver'
    | 'provider_default_penalty'
    | 'mutual_agreement';
}

export type DisputeCategory =
  | 'job_not_done'
  | 'poor_quality'
  | 'wrong_area'
  | 'damage'
  | 'no_show';

export interface DisputeEvidence {
  photoUrl: string;
  uploaderId: string;
  role: 'farmer' | 'provider';
  capturedAt: number;
  gps?: LatLng;
  note?: string;
}

export interface DisputeArbitrationInput {
  disputeId: string;
  bookingId: string;
  category: DisputeCategory;
  agreedPriceKobo: number;
  farmLocation: LatLng;
  farmBoundary?: LatLng[];
  evidences: DisputeEvidence[];
  disputeOpenedAt: number;
  jobCompletedAt?: number;
}

export type ArbitrationDecision =
  | 'full_refund_to_farmer'
  | 'full_payout_to_provider'
  | 'partial_settlement'
  | 'damage_offset';

export interface DisputeArbitrationOutcome {
  arbitrationId: string;
  disputeId: string;
  decision: ArbitrationDecision;
  farmerRefundKobo: number;
  providerPayoutKobo: number;
  platformFeeRetainedKobo: number;
  notes: string;
  evidenceScores: {
    farmerEvidenceValidCount: number;
    providerEvidenceValidCount: number;
  };
  settledAt: number;
}

export interface AgentBookingPermissionCheck {
  agentProfileId: string;
  farmerProfileId: string;
  farmerOnboardedByAgentId?: string | null;
  agentRoles: string[];
  agentActive: boolean;
}
