// =============================================================================
// CultivaNode Farm Intelligence: Device Watchdog & Health Monitor
// =============================================================================

import type { Device, DeviceAlert, DeviceInstallation } from './types';

export interface IWatchdogStore {
  getActiveDevices(): Promise<Device[]>;
  getActiveInstallation(deviceId: string): Promise<DeviceInstallation | undefined>;
  updateDeviceStatus(deviceId: string, status: 'degraded' | 'offline'): Promise<void>;
  createDeviceAlert(alert: DeviceAlert): Promise<void>;
  hasOpenAlertForChannel(deviceId: string, channelCode: string): Promise<boolean>;
}

export class DeviceWatchdog {
  constructor(
    private store: IWatchdogStore,
    private defaultSilenceThresholdHours: number = 12
  ) {}

  /**
   * Scans all active devices and detects stale or silent devices
   */
  async scanForSilentDevices(
    now: Date = new Date(),
    thresholdHours: number = this.defaultSilenceThresholdHours
  ): Promise<{ silentCount: number; alertedDevices: string[] }> {
    const devices = await this.store.getActiveDevices();
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const nowMs = now.getTime();

    let silentCount = 0;
    const alertedDevices: string[] = [];

    for (const dev of devices) {
      if (dev.status === 'retired' || dev.status === 'maintenance') {
        continue;
      }

      const lastSeenMs = dev.lastSeenAt ? new Date(dev.lastSeenAt).getTime() : 0;
      const isSilent = nowMs - lastSeenMs > thresholdMs;

      if (isSilent) {
        silentCount++;
        alertedDevices.push(dev.serialNumber);

        // Update device status to offline
        await this.store.updateDeviceStatus(dev.id, 'offline');

        // Check if device is installed on a plot
        const installation = await this.store.getActiveInstallation(dev.id);
        if (installation) {
          const alreadyAlerted = await this.store.hasOpenAlertForChannel(dev.id, 'device_health');

          if (!alreadyAlerted) {
            const watchdogAlert: DeviceAlert = {
              id: crypto.randomUUID(),
              farmId: installation.farmId,
              plotId: installation.plotId,
              deviceId: dev.id,
              severity: 'warning',
              alertType: 'device_silent_timeout',
              title: `Telemetry Offline: Node ${dev.serialNumber}`,
              message: `Sensor node has not transmitted packets for over ${thresholdHours} hours. Verify solar battery, line of sight, or gateway cluster.`,
              recommendedAction: 'inspect_field_hardware',
              status: 'open',
              triggeredAt: now.toISOString(),
            };

            await this.store.createDeviceAlert(watchdogAlert);
          }
        }
      }
    }

    return { silentCount, alertedDevices };
  }
}
