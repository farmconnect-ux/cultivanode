// =============================================================================
// CultivaNode Farm Intelligence: Crop Foundation Bridge
// =============================================================================

import { DeviceAlert, TelemetryRollup, TrustLabel } from '../types/iot.js';

export interface CropMeasurement {
  id: string;
  plotId: string;
  measuredOn: string;
  measurementType: string;
  valueNumeric: number;
  unit: string;
  source: 'iot_sensor' | 'weather_forecast' | 'manual_scout';
  metadata: {
    deviceId?: string;
    rollupPeriod?: string;
    trustLabel: TrustLabel;
    calibrated: boolean;
  };
}

export interface WeatherVsSensorComparison {
  plotId: string;
  date: string;
  weatherForecast: {
    temperatureC?: number;
    rainfallMm?: number;
    humidityPct?: number;
    provider: string;
  };
  sensorPlotTruth: {
    temperatureC?: number;
    rainfallMm?: number;
    humidityPct?: number;
    soilMoisturePct?: number;
    deviceId: string;
  };
  variance: {
    temperatureDeltaC?: number;
    rainDiscrepancyMm?: number;
  };
  trustRecommendation: string;
}

export class CropFoundationBridge {
  /**
   * Transforms high-level rollups into crop_measurements records
   */
  deriveCropMeasurements(rollups: TelemetryRollup[]): CropMeasurement[] {
    const measurements: CropMeasurement[] = [];

    for (const r of rollups) {
      if (!r.plotId || r.validCount === 0) continue;

      let measurementType = r.channelCode;
      let val = r.avgValue;
      let unit = '%';

      if (r.channelCode === 'soil_moisture_pct') {
        measurementType = 'root_zone_soil_moisture';
        val = r.avgValue;
        unit = '%';
      } else if (r.channelCode === 'air_temperature_c') {
        measurementType = 'canopy_temperature';
        val = r.avgValue;
        unit = '°C';
      } else if (r.channelCode === 'rainfall_mm') {
        measurementType = 'plot_rainfall_total';
        val = r.maxValue; // Cumulative total
        unit = 'mm';
      }

      measurements.push({
        id: crypto.randomUUID(),
        plotId: r.plotId,
        measuredOn: r.bucketTimestamp.slice(0, 10),
        measurementType,
        valueNumeric: Math.round(val * 10) / 10,
        unit,
        source: 'iot_sensor',
        metadata: {
          deviceId: r.deviceId,
          rollupPeriod: r.period,
          trustLabel: 'sensor reading',
          calibrated: true
        }
      });
    }

    return measurements;
  }

  /**
   * Compares regional weather forecasts with ground IoT truth
   */
  compareWeatherWithGroundTruth(
    plotId: string,
    date: string,
    forecast: { tempC: number; rainMm: number; humidityPct: number; provider: string },
    sensorReadings: { tempC: number; rainMm: number; humidityPct: number; soilMoisturePct: number; deviceId: string }
  ): WeatherVsSensorComparison {
    const tempDelta = Math.round((sensorReadings.tempC - forecast.tempC) * 10) / 10;
    const rainDelta = Math.round((sensorReadings.rainMm - forecast.rainMm) * 10) / 10;

    let recommendation = 'Forecast and plot sensor align well.';
    if (rainDelta > 5.0) {
      recommendation = `Localised storm detected on plot (${sensorReadings.rainMm} mm) not captured by broad forecast. Irrigation can be deferred.`;
    } else if (sensorReadings.soilMoisturePct < 20.0 && forecast.rainMm === 0) {
      recommendation = 'Plot root-zone is dry and no rain forecast. Irrigation action required today.';
    }

    return {
      plotId,
      date,
      weatherForecast: {
        temperatureC: forecast.tempC,
        rainfallMm: forecast.rainMm,
        humidityPct: forecast.humidityPct,
        provider: forecast.provider
      },
      sensorPlotTruth: {
        temperatureC: sensorReadings.tempC,
        rainfallMm: sensorReadings.rainMm,
        humidityPct: sensorReadings.humidityPct,
        soilMoisturePct: sensorReadings.soilMoisturePct,
        deviceId: sensorReadings.deviceId
      },
      variance: {
        temperatureDeltaC: tempDelta,
        rainDiscrepancyMm: rainDelta
      },
      trustRecommendation: recommendation
    };
  }
}
