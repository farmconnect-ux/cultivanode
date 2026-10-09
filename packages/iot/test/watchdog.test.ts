// =============================================================================
// Unit Tests: Device Watchdog & Health Monitor
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert';
import { DeviceWatchdog, IWatchdogStore } from '../src/engine/watchdog.js';
import { Device, DeviceAlert, DeviceInstallation } from '../src/types/iot.js';

class MockWatchdogStore implements IWatchdogStore {
  public devices: Device[] = [];
  public installation?: DeviceInstallation;
  public alerts: DeviceAlert[] = [];

  async getActiveDevices(): Promise<Device[]> {
    return this.devices;
  }

  async getActiveInstallation(_deviceId: string): Promise<DeviceInstallation | undefined> {
    return this.installation;
  }

  async updateDeviceStatus(deviceId: string, status: 'degraded' | 'offline'): Promise<void> {
    const dev = this.devices.find(d => d.id === deviceId);
    if (dev) dev.status = status;
  }

  async createDeviceAlert(alert: DeviceAlert): Promise<void> {
    this.alerts.push(alert);
  }

  async hasOpenAlertForChannel(deviceId: string, channelCode: string): Promise<boolean> {
    return this.alerts.some(a => a.deviceId === deviceId && a.channelCode === channelCode && a.status === 'open');
  }
}

test('Watchdog: Flags silent node (> 12 hours) offline and pauses crop advice', async () => {
  const store = new MockWatchdogStore();
  const watchdog = new DeviceWatchdog(store, 12);

  const now = new Date();
  const fourteenHoursAgo = new Date(now.getTime() - 14 * 3600000).toISOString();

  store.devices = [
    {
      id: 'd-silent',
      serialNumber: 'CN-SILENT-01',
      modelId: 'm1',
      status: 'active',
      firmwareVersion: '1.0.0',
      lastSeenAt: fourteenHoursAgo,
      lastTelemetrySeq: 10,
      createdAt: fourteenHoursAgo,
      updatedAt: fourteenHoursAgo
    },
    {
      id: 'd-active',
      serialNumber: 'CN-HEALTHY-02',
      modelId: 'm1',
      status: 'active',
      firmwareVersion: '1.0.0',
      lastSeenAt: new Date(now.getTime() - 10 * 60000).toISOString(), // 10 minutes ago
      lastTelemetrySeq: 55,
      createdAt: fourteenHoursAgo,
      updatedAt: fourteenHoursAgo
    }
  ];

  store.installation = {
    id: 'inst-1',
    deviceId: 'd-silent',
    farmId: 'farm-1',
    plotId: 'plot-1',
    powerMethod: 'solar_lifepo4',
    isActive: true,
    createdAt: fourteenHoursAgo,
    updatedAt: fourteenHoursAgo
  };

  const res = await watchdog.scanForSilentDevices(now, 12);

  assert.strictEqual(res.silentCount, 1);
  assert.strictEqual(res.alertedDevices.includes('CN-SILENT-01'), true);

  // Status must be offline
  const silentDev = store.devices.find(d => d.id === 'd-silent');
  assert.strictEqual(silentDev?.status, 'offline');

  // Healthy device must remain active
  const healthyDev = store.devices.find(d => d.id === 'd-active');
  assert.strictEqual(healthyDev?.status, 'active');

  // Device alert must be generated with exact wording
  assert.strictEqual(store.alerts.length, 1);
  const alert = store.alerts[0];
  assert.strictEqual(alert.source, 'device watchdog');
  assert.strictEqual(
    alert.observation,
    'This soil sensor has not reported for 12 hours; crop advice from it is paused.'
  );
  assert.strictEqual(alert.metadata?.advicePaused, true);
});
