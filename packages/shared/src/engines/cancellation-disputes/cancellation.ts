import type { CancellationRequest, CancellationOutcome, CancellationPolicySettings } from './types';
import { percentOfKobo } from '../../money';

/**
 * Deterministically evaluates a booking cancellation request according to
 * CultivaNode's MVP rules without requiring database or network access.
 * Settings can be passed dynamically from database settings data (REQ-MKT-009).
 */
export function evaluateCancellation(
  req: CancellationRequest,
  settings: Partial<CancellationPolicySettings> = {}
): CancellationOutcome {
  const noticeHours = settings.freeCancellationNoticeHours ?? 24;
  const lateFeePercent = settings.lateCancellationFeePercent ?? 20;
  const maxStrikes = settings.providerStrikeThreshold ?? 3;
  const rainThreshold = settings.weatherRainMmThreshold ?? 15;

  const timeUntilJob = req.jobStartTimestamp - req.requestTimestamp;
  const isEarly = timeUntilJob >= noticeHours * 60 * 60 * 1000;
  const currentStrikes = req.providerCurrentStrikes ?? 0;
  const isSevereWeather =
    req.weather?.isSevere ||
    (req.weather?.rainMm !== undefined && req.weather.rainMm >= rainThreshold);

  // 1. Weather Waiver: Severe weather allows 100% penalty-free cancellation/reschedule
  if (isSevereWeather) {
    return {
      allowed: true,
      refundFarmerKobo: req.agreedPriceKobo,
      payoutProviderKobo: 0,
      penaltyFeeKobo: 0,
      providerStrikeAdded: false,
      providerTotalStrikes: currentStrikes,
      providerSuspensionRecommended: false,
      weatherWaiverApplied: true,
      reasonCode: 'weather_reschedule_waiver',
    };
  }

  // 2. Farmer Cancellation
  if (req.actor === 'farmer') {
    if (isEarly) {
      // More than 24 hours notice: 100% free cancellation
      return {
        allowed: true,
        refundFarmerKobo: req.agreedPriceKobo,
        payoutProviderKobo: 0,
        penaltyFeeKobo: 0,
        providerStrikeAdded: false,
        providerTotalStrikes: currentStrikes,
        providerSuspensionRecommended: false,
        weatherWaiverApplied: false,
        reasonCode: 'free_early_cancellation',
      };
    } else {
      // Late cancellation (< 24 hours): late fee goes to provider for travel/lost opportunity
      const lateFeeKobo = percentOfKobo(req.agreedPriceKobo, lateFeePercent);
      const refundKobo = req.agreedPriceKobo - lateFeeKobo;

      return {
        allowed: true,
        refundFarmerKobo: refundKobo,
        payoutProviderKobo: lateFeeKobo,
        penaltyFeeKobo: 0,
        providerStrikeAdded: false,
        providerTotalStrikes: currentStrikes,
        providerSuspensionRecommended: false,
        weatherWaiverApplied: false,
        reasonCode: 'late_farmer_cancellation',
      };
    }
  }

  // 3. Provider Cancellation
  if (req.actor === 'provider') {
    if (isEarly) {
      // Early provider cancellation (>24h): Farmer gets full refund, no strike recorded
      return {
        allowed: true,
        refundFarmerKobo: req.agreedPriceKobo,
        payoutProviderKobo: 0,
        penaltyFeeKobo: 0,
        providerStrikeAdded: false,
        providerTotalStrikes: currentStrikes,
        providerSuspensionRecommended: false,
        weatherWaiverApplied: false,
        reasonCode: 'free_early_cancellation',
      };
    } else {
      // Short notice (<24h) or job-day default by provider
      const newStrikes = currentStrikes + 1;
      const suspensionRecommended = newStrikes >= maxStrikes;

      return {
        allowed: true,
        refundFarmerKobo: req.agreedPriceKobo,
        payoutProviderKobo: 0,
        penaltyFeeKobo: 0,
        providerStrikeAdded: true,
        providerTotalStrikes: newStrikes,
        providerSuspensionRecommended: suspensionRecommended,
        weatherWaiverApplied: false,
        reasonCode: 'provider_default_penalty',
      };
    }
  }

  // Admin override cancellation
  return {
    allowed: true,
    refundFarmerKobo: req.agreedPriceKobo,
    payoutProviderKobo: 0,
    penaltyFeeKobo: 0,
    providerStrikeAdded: false,
    providerTotalStrikes: currentStrikes,
    providerSuspensionRecommended: false,
    weatherWaiverApplied: false,
    reasonCode: 'mutual_agreement',
  };
}
