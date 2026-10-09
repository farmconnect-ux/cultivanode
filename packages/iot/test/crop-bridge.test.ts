// =============================================================================
// Unit Tests: Crop Foundation Bridge & Weather Comparison
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert';
import { CropFoundationBridge } from '../src/engine/crop-bridge.js';
import { TelemetryRollup } from '../src/types/iot.js';

test('CropBridge: Derives clean daily crop_measurements from rollups', () => {
  const bridge = new CropFoundationBridge();

  const rollups: TelemetryRollup[] = [
    {
      id: 'roll-1',
      deviceId: 'dev-1',
      plotId: 'plot-tomato-01',
      channelCode: 'soil_moisture_pct',
      period: '1d',
      bucketTimestamp: '2026-10-08T00:00:00Z',
      avgValue: 25.4,
      minValue: 23.8,
      maxValue: 26.9,
      lastValue: 25.1,
      sampleCount: 96,
      validCount: 96
    },
    {
      id: 'roll-2',
      deviceId: 'dev-1',
      plotId: 'plot-tomato-01',
      channelCode: 'rainfall_mm',
      period: '1d',
      bucketTimestamp: '2026-10-08T00:00:00Z',
      avgValue: 0.2,
      minValue: 0.0,
      maxValue: 14.5,
      lastValue: 14.5,
      sampleCount: 96,
      validCount: 96
    }
  ];

  const measurements = bridge.deriveCropMeasurements(rollups);
  assert.strictEqual(measurements.length, 2);

  const moistureMeas = measurements.find(m => m.measurementType === 'root_zone_soil_moisture');
  assert.ok(moistureMeas);
  assert.strictEqual(moistureMeas.valueNumeric, 25.4);
  assert.strictEqual(moistureMeas.source, 'iot_sensor');
  assert.strictEqual(moistureMeas.metadata.trustLabel, 'sensor reading');
  assert.strictEqual(moistureMeas.metadata.calibrated, true);

  const rainMeas = measurements.find(m => m.measurementType === 'plot_rainfall_total');
  assert.ok(rainMeas);
  assert.strictEqual(rainMeas.valueNumeric, 14.5);
});

test('CropBridge: Compares broad weather forecast with plot truth', () => {
  const bridge = new CropFoundationBridge();

  const comparison = bridge.compareWeatherWithGroundTruth(
    'plot-1',
    '2026-10-08',
    { tempC: 34.0, rainMm: 0.0, humidityPct: 60, provider: 'Open-Meteo' },
    { tempC: 31.5, rainMm: 18.0, humidityPct: 82, soilMoisturePct: 28.0, deviceId: 'dev-1' }
  );

  assert.strictEqual(comparison.variance.temperatureDeltaC, -2.5);
  assert.strictEqual(comparison.variance.rainDiscrepancyMm, 18.0);
  assert.strictEqual(comparison.trustRecommendation.includes('Localised storm detected'), true);
});
