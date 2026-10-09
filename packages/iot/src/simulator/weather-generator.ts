// =============================================================================
// CultivaNode Farm Intelligence: Weather & Diurnal Solar Generator
// =============================================================================

export interface WeatherCondition {
  ambientTempC: number;
  relativeHumidityPct: number;
  solarIrradianceWm2: number;
  batteryChargingRatePctPerHour: number;
}

export class WeatherGenerator {
  /**
   * Generates realistic South-West Nigeria tropical weather conditions by hour of day (0-23)
   */
  getConditionAtHour(hourOfDay: number, isRainy: boolean = false): WeatherCondition {
    // Diurnal temperature curve: minimum at 06:00 (approx 22°C), peak at 14:00 (approx 33°C)
    // Sinusoidal wave shifted so minimum is at hour 6 and peak at hour 14
    const rad = ((hourOfDay - 6) / 24) * 2 * Math.PI;
    const baseTemp = 27.5;
    const tempVariation = 5.5 * Math.sin(rad - Math.PI / 4);
    const ambientTempC = Math.round((baseTemp + tempVariation + (Math.random() * 0.8 - 0.4)) * 10) / 10;

    // Relative humidity is inverse to temperature: highest around dawn (88-96%), lowest in afternoon (50-65%)
    let relativeHumidityPct = Math.round(98 - (ambientTempC - 21.0) * 3.4);
    if (isRainy) {
      relativeHumidityPct = Math.min(100, relativeHumidityPct + 15);
    }
    relativeHumidityPct = Math.max(30, Math.min(100, relativeHumidityPct));

    // Solar Irradiance: daylight roughly from hour 6.5 to hour 18.5
    let solarIrradianceWm2 = 0;
    let batteryChargingRate = -0.15; // Small continuous quiescent discharge at night (-0.15% per hour)

    if (hourOfDay >= 7 && hourOfDay <= 18) {
      const solarRad = ((hourOfDay - 7) / 11) * Math.PI;
      const peakSun = isRainy ? 280 : 850;
      solarIrradianceWm2 = Math.round(Math.sin(solarRad) * peakSun);

      // Solar panel delivers net positive charge to LiFePO4 battery during sunshine
      batteryChargingRate = Math.round((solarIrradianceWm2 / 850) * 4.5 * 10) / 10;
    }

    return {
      ambientTempC,
      relativeHumidityPct,
      solarIrradianceWm2,
      batteryChargingRatePctPerHour: batteryChargingRate
    };
  }
}
