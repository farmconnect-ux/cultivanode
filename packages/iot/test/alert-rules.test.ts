// =============================================================================
// Unit Tests: Conservative Crop-Aware Alert Engine
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert';
import { AlertRulesEngine, IHistoricalReadingsProvider } from '../src/engine/alert-rules-engine.js';
import {
  AlertRule,
  Device,
  DeviceAlert,
  DeviceInstallation,
  StoredTelemetryReading
} from '../src/types/iot.js';

class MockHistoryProvider implements IHistoricalReadingsProvider {
  public history: StoredTelemetryReading[] = [];
  public lastAlerts: Map<string, DeviceAlert> = new Map();

  async getReadingsInWindow(
    deviceId: string,
    channelCode: string,
    sinceTimestampIso: string
  ): Promise<StoredTelemetryReading[]> {
    const sinceMs = new Date(sinceTimestampIso).getTime();
    return this.history.filter(
      r =>
        r.deviceId === deviceId &&
        r.channelCode === channelCode &&
        new Date(r.sourceTimestamp).getTime() >= sinceMs
    );
  }

  async getLastAlertForRule(plotId: string, ruleCode: string): Promise<DeviceAlert | undefined> {
    return this.lastAlerts.get(`${plotId}:${ruleCode}`);
  }
}

const mockDevice: Device = {
  id: 'dev-1',
  serialNumber: 'CN-001',
  modelId: 'mod-1',
  status: 'active',
  firmwareVersion: '1.0.0',
  lastTelemetrySeq: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const mockInstallation: DeviceInstallation = {
  id: 'inst-1',
  deviceId: 'dev-1',
  farmId: 'farm-1',
  plotId: 'plot-1',
  sensorDepthCm: 15,
  powerMethod: 'solar_lifepo4',
  siteSurvey: { cropType: 'tomato' },
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const tomatoMoistureRule: AlertRule = {
  id: 'rule-tomato-stress',
  ruleCode: 'RULE_TOMATO_MOISTURE_DEFICIT',
  cropType: 'tomato',
  channelCode: 'soil_moisture_pct',
  operator: 'sustained_below',
  thresholdValue: 22.0,
  hysteresisDelta: 2.5,
  sustainedDurationMinutes: 360, // 6 hours
  cooldownMinutes: 720,          // 12 hours
  title: 'Tomato Moisture Deficit',
  observationTemplate: 'Moisture has stayed below the crop-stage threshold ({threshold}%) for {duration} hours.',
  suggestedAction: 'Check irrigation on Plot {plot_name}.',
  severity: 'warning',
  isActive: true,
  approvedBy: 'Agronomist',
  version: '1.0'
};

test('AlertEngine: Single abnormal reading does NOT trigger sustained alert', async () => {
  const provider = new MockHistoryProvider();
  const engine = new AlertRulesEngine(provider, [tomatoMoistureRule]);

  // Only one single reading below 22%
  const freshReadings: StoredTelemetryReading[] = [
    {
      id: 'r1',
      deviceId: 'dev-1',
      channelCode: 'soil_moisture_pct',
      rawValue: 19.5,
      calibratedValue: 19.5,
      unit: '%',
      sourceTimestamp: new Date().toISOString(),
      receivedTimestamp: new Date().toISOString(),
      sequenceNumber: 1,
      qualityFlag: 'valid',
      gatewayMetadata: {},
      createdAt: new Date().toISOString()
    }
  ];

  const alerts = await engine.evaluateReadings(mockDevice, mockInstallation, freshReadings);
  // Conservative: Must be sustained over 6 hours, not a single dip
  assert.strictEqual(alerts.length, 0);
});

test('AlertEngine: Sustained condition over 6 hours generates plain-language alert', async () => {
  const provider = new MockHistoryProvider();
  const engine = new AlertRulesEngine(provider, [tomatoMoistureRule]);

  const now = Date.now();
  // Pre-load readings covering the 6 hour window, all below 22%
  provider.history = [
    {
      id: 'r-old-1',
      deviceId: 'dev-1',
      channelCode: 'soil_moisture_pct',
      rawValue: 20.2,
      calibratedValue: 20.2,
      unit: '%',
      sourceTimestamp: new Date(now - 6 * 3600000).toISOString(),
      receivedTimestamp: new Date(now - 6 * 3600000).toISOString(),
      sequenceNumber: 10,
      qualityFlag: 'valid',
      gatewayMetadata: {},
      createdAt: new Date(now - 6 * 3600000).toISOString()
    },
    {
      id: 'r-old-2',
      deviceId: 'dev-1',
      channelCode: 'soil_moisture_pct',
      rawValue: 19.8,
      calibratedValue: 19.8,
      unit: '%',
      sourceTimestamp: new Date(now - 3 * 3600000).toISOString(),
      receivedTimestamp: new Date(now - 3 * 3600000).toISOString(),
      sequenceNumber: 11,
      qualityFlag: 'valid',
      gatewayMetadata: {},
      createdAt: new Date(now - 3 * 3600000).toISOString()
    }
  ];

  // Fresh current reading
  const freshReadings: StoredTelemetryReading[] = [
    {
      id: 'r-now',
      deviceId: 'dev-1',
      channelCode: 'soil_moisture_pct',
      rawValue: 19.4,
      calibratedValue: 19.4,
      unit: '%',
      sourceTimestamp: new Date(now).toISOString(),
      receivedTimestamp: new Date(now).toISOString(),
      sequenceNumber: 12,
      qualityFlag: 'valid',
      gatewayMetadata: {},
      createdAt: new Date(now).toISOString()
    }
  ];

  const alerts = await engine.evaluateReadings(mockDevice, mockInstallation, freshReadings);
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].severity, 'warning');
  assert.strictEqual(alerts[0].observation.includes('Moisture has stayed below the crop-stage threshold (22%) for 6 hours'), true);
  assert.strictEqual(alerts[0].source, 'sensor reading');
});

test('AlertEngine: Cooldown suppresses repeat notification spam', async () => {
  const provider = new MockHistoryProvider();
  const engine = new AlertRulesEngine(provider, [tomatoMoistureRule]);

  const now = Date.now();
  // Existing alert fired 2 hours ago (within 12h cooldown)
  provider.lastAlerts.set('plot-1:RULE_TOMATO_MOISTURE_DEFICIT', {
    id: 'prior-alert',
    farmId: 'farm-1',
    plotId: 'plot-1',
    deviceId: 'dev-1',
    channelCode: 'soil_moisture_pct',
    observation: 'Prior alert',
    confidence: 0.95,
    suggestedAction: 'Action',
    source: 'sensor reading',
    severity: 'warning',
    status: 'open',
    triggeredAt: new Date(now - 2 * 3600000).toISOString(),
    cooldownUntil: new Date(now + 10 * 3600000).toISOString()
  });

  const freshReadings: StoredTelemetryReading[] = [
    {
      id: 'r-now',
      deviceId: 'dev-1',
      channelCode: 'soil_moisture_pct',
      rawValue: 19.1,
      calibratedValue: 19.1,
      unit: '%',
      sourceTimestamp: new Date(now).toISOString(),
      receivedTimestamp: new Date(now).toISOString(),
      sequenceNumber: 20,
      qualityFlag: 'valid',
      gatewayMetadata: {},
      createdAt: new Date(now).toISOString()
    }
  ];

  const alerts = await engine.evaluateReadings(mockDevice, mockInstallation, freshReadings);
  // Must be suppressed due to cooldown
  assert.strictEqual(alerts.length, 0);
});

test('AlertEngine: Offline or silent device never drives agronomic advice', async () => {
  const provider = new MockHistoryProvider();
  const engine = new AlertRulesEngine(provider, [tomatoMoistureRule]);

  const offlineDevice: Device = {
    ...mockDevice,
    status: 'offline'
  };

  const freshReadings: StoredTelemetryReading[] = [
    {
      id: 'r-now',
      deviceId: 'dev-1',
      channelCode: 'soil_moisture_pct',
      rawValue: 15.0,
      calibratedValue: 15.0,
      unit: '%',
      sourceTimestamp: new Date().toISOString(),
      receivedTimestamp: new Date().toISOString(),
      sequenceNumber: 25,
      qualityFlag: 'valid',
      gatewayMetadata: {},
      createdAt: new Date().toISOString()
    }
  ];

  const alerts = await engine.evaluateReadings(offlineDevice, mockInstallation, freshReadings);
  assert.strictEqual(alerts.length, 0);
});
