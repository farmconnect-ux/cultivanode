import type { WeatherDayForecast, CropWeatherAlert } from './types';

export interface EvaluateWeatherHazardParams {
  cropId: string;
  stageName: string; // e.g. 'Flowering', 'Vegetative', 'Harvest', 'Sowing'
  forecasts: WeatherDayForecast[];
}

/**
 * Evaluates weather forecasts in conjunction with crop stage vulnerability
 * to provide proactive agronomic hazard alerts.
 */
export function evaluateCropWeatherHazards(params: EvaluateWeatherHazardParams): CropWeatherAlert[] {
  const alerts: CropWeatherAlert[] = [];

  for (const day of params.forecasts) {
    // 1. High Rain / Leaching Risk
    if (day.rainMm >= 35) {
      alerts.push({
        date: day.date,
        alertType: 'fertiliser_leaching',
        severity: day.rainMm >= 60 ? 'critical' : 'high',
        headline: `Heavy Rain Alert (${day.rainMm} mm expected)`,
        recommendation:
          'Postpone fertiliser top-dressing and chemical spraying. Ensure field drainage furrows are cleared to prevent waterlogging.',
      });
    }

    // 2. High Wind / Lodging Risk during reproductive/maturity stages
    if (day.windSpeedKmh >= 35 && (params.stageName.includes('Flowering') || params.stageName.includes('Maturity'))) {
      alerts.push({
        date: day.date,
        alertType: 'lodging_wind',
        severity: 'high',
        headline: `High Wind Speed (${day.windSpeedKmh} km/h)`,
        recommendation: `High risk of crop lodging in ${params.cropId}. Check crop staking/earthing up and prepare for emergency harvesting if grain is mature.`,
      });
    }

    // 3. Fungal Blight Risk (High humidity > 85% and warm temp > 28C)
    if (day.humidityPercent >= 85 && day.tempMaxC >= 28 && (params.cropId === 'tomato' || params.cropId === 'pepper')) {
      alerts.push({
        date: day.date,
        alertType: 'fungal_blight_risk',
        severity: 'high',
        headline: 'Favourable Microclimate for Fungal Blight',
        recommendation:
          'High heat and humidity promote late blight. Inspect lower leaves and apply preventative copper or mancozeb fungicide.',
      });
    }
  }

  // 4. Consecutive Dry Days during sensitive moisture stages (Flowering/Grain filling)
  const dryDaysCount = params.forecasts.filter((f) => f.rainMm < 1).length;
  if (dryDaysCount >= 7 && (params.stageName.includes('Flowering') || params.stageName.includes('Grain'))) {
    const firstDryDate = params.forecasts[0]?.date ?? '';
    alerts.push({
      date: firstDryDate,
      alertType: 'drought_stress',
      severity: 'critical',
      headline: `Drying Spell (${dryDaysCount} consecutive dry days) during Critical Growth Stage`,
      recommendation: `${params.cropId} moisture stress during ${params.stageName} will severely reduce grain/fruit yield. Schedule supplemental irrigation immediately.`,
    });
  }

  return alerts;
}
