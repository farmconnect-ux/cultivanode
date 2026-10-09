// =============================================================================
// Unit Tests: Sensor Telemetry Quality & Anomaly Checker
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert';
import { checkReadingQuality } from '../src/ingestion/quality-checker.js';
import { SensorChannel } from '../src/types/iot.js';

const soilChannel: SensorChannel = {
  id: 'ch-soil',
  deviceModelId: 'm1',
  channelCode: 'soil_moisture_pct',
  displayName: 'Soil Moisture',
  unit: '%',
  minValidValue: 0.0,
  maxValidValue: 100.0,
  precisionDecimals: 1,
  measurementPriority: 1
};

const tempChannel: SensorChannel = {
  id: 'ch-temp',
  deviceModelId: 'm1',
  channelCode: 'air_temperature_c',
  displayName: 'Air Temperature',
  unit: '°C',
  minValidValue: -10.0,
  maxValidValue: 60.0,
  precisionDecimals: 1,
  measurementPriority: 1
};

test('QualityChecker: Valid readings return "valid" flag and proper precision', () => {
  const res = checkReadingQuality(24.523, '%', soilChannel);
  assert.strictEqual(res.flag, 'valid');
  assert.strictEqual(res.calibratedValue, 24.5);
  assert.strictEqual(res.isAcceptableForRollup, true);
});

test('QualityChecker: Open circuit / hardware failure (-999, NaN) tagged "hardware_fault"', () => {
  const resFault = checkReadingQuality(-999, '%', soilChannel);
  assert.strictEqual(resFault.flag, 'hardware_fault');
  assert.strictEqual(resFault.isAcceptableForRollup, false);

  const resNan = checkReadingQuality(NaN, '%', soilChannel);
  assert.strictEqual(resNan.flag, 'hardware_fault');
  assert.strictEqual(resNan.isAcceptableForRollup, false);
});

test('QualityChecker: Out of bounds readings tagged "out_of_range"', () => {
  // Moisture impossible > 100%
  const resHigh = checkReadingQuality(125.0, '%', soilChannel);
  assert.strictEqual(resHigh.flag, 'out_of_range');
  assert.strictEqual(resHigh.isAcceptableForRollup, false);

  // Negative moisture
  const resLow = checkReadingQuality(-5.0, '%', soilChannel);
  assert.strictEqual(resLow.flag, 'out_of_range');
  assert.strictEqual(resLow.isAcceptableForRollup, false);
});

test('QualityChecker: Unit mismatches rejected unless auto-converted', () => {
  // Wrong unit for soil
  const resWrong = checkReadingQuality(25.0, 'volts', soilChannel);
  assert.strictEqual(resWrong.flag, 'out_of_range');
  assert.strictEqual(resWrong.isAcceptableForRollup, false);

  // Auto-conversion of Fahrenheit to Celsius (86°F -> 30.0°C)
  const resConverted = checkReadingQuality(86.0, '°F', tempChannel);
  assert.strictEqual(resConverted.flag, 'valid');
  assert.strictEqual(resConverted.calibratedValue, 30.0);
});

test('QualityChecker: Sudden impossible rate of change jumps tagged "suspicious"', () => {
  // Soil moisture jumped 35% in one step
  const lastVal = 18.0;
  const resSpike = checkReadingQuality(54.0, '%', soilChannel, lastVal);
  assert.strictEqual(resSpike.flag, 'suspicious');
  assert.strictEqual(resSpike.isAcceptableForRollup, true);
});
