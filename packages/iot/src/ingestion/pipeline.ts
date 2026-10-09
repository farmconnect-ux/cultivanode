// =============================================================================
// CultivaNode Farm Intelligence: Telemetry Ingestion Pipeline
// =============================================================================

import {
  Device,
  DeviceInstallation,
  SensorChannel,
  StoredTelemetryReading,
  TelemetryPacket,
  IngestionResult,
  DeviceAlert
} from '../types/iot.js';
import {
  validateTimestampSkew,
  validateSequenceNumber,
  validateDeviceOperationalStatus
} from '../security/validation.js';
import { checkReadingQuality } from './quality-checker.js';
import { AlertRulesEngine } from '../engine/alert-rules-engine.js';
import { timingSafeCompare, hashToken, verifySignature } from '../security/crypto.js';

export interface IIoTDataStore {
  getDeviceBySerial(serial: string): Promise<Device | undefined>;
  getChannelsForModel(modelId: string): Promise<SensorChannel[]>;
  getActiveInstallationForDevice(deviceId: string): Promise<DeviceInstallation | undefined>;
  getLastReadingValue(deviceId: string, channelCode: string): Promise<number | undefined>;
  storeTelemetryReading(reading: StoredTelemetryReading): Promise<void>;
  updateDeviceHealth(deviceId: string, updates: Partial<Device>): Promise<void>;
  storeAlert(alert: DeviceAlert): Promise<void>;
  getRecentAlert(plotId: string, ruleId: string): Promise<DeviceAlert | undefined>;
}

export class TelemetryIngestionPipeline {
  constructor(
    private dataStore: IIoTDataStore,
    private alertEngine: AlertRulesEngine,
    private options: { maxTimestampSkewMs?: number } = {}
  ) {}

  /**
   * Main pipeline entry point to ingest and validate a telemetry packet
   */
  async processPacket(
    packet: TelemetryPacket,
    authContext: {
      bearerToken?: string;
      signature?: string;
      rawPayload?: string;
      sharedSecret?: string;
    } = {}
  ): Promise<IngestionResult> {
    // 1. Device lookup
    const device = await this.dataStore.getDeviceBySerial(packet.deviceSerial);
    if (!device) {
      return {
        success: false,
        code: 'DEVICE_NOT_FOUND',
        message: `Device with serial '${packet.deviceSerial}' is not registered in the CultivaNode fleet.`,
        acceptedReadingsCount: 0,
        rejectedReadingsCount: 0,
        readings: [],
        alertsGenerated: []
      };
    }

    // 2. Authentication Verification
    if (device.authTokenHash) {
      if (!authContext.bearerToken) {
        return {
          success: false,
          code: 'AUTH_REQUIRED',
          message: 'Device requires authentication token.',
          acceptedReadingsCount: 0,
          rejectedReadingsCount: 0,
          readings: [],
          alertsGenerated: []
        };
      }
      const hashedProvided = hashToken(authContext.bearerToken);
      if (!timingSafeCompare(device.authTokenHash, hashedProvided)) {
        return {
          success: false,
          code: 'UNAUTHORIZED_DEVICE',
          message: 'Invalid device bearer token.',
          acceptedReadingsCount: 0,
          rejectedReadingsCount: 0,
          readings: [],
          alertsGenerated: []
        };
      }
    } else if (device.secretKeyHash && authContext.signature && authContext.rawPayload && authContext.sharedSecret) {
      const isValidSig = verifySignature(authContext.rawPayload, authContext.signature, authContext.sharedSecret);
      if (!isValidSig) {
        return {
          success: false,
          code: 'INVALID_SIGNATURE',
          message: 'HMAC-SHA256 signature verification failed.',
          acceptedReadingsCount: 0,
          rejectedReadingsCount: 0,
          readings: [],
          alertsGenerated: []
        };
      }
    }

    // 3. Operational status validation (revoked, retired, maintenance)
    const statusValidation = validateDeviceOperationalStatus(device);
    if (!statusValidation.isValid) {
      return {
        success: false,
        code: statusValidation.errorCode || 'DEVICE_INACTIVE',
        message: statusValidation.errorMessage || 'Device cannot transmit.',
        acceptedReadingsCount: 0,
        rejectedReadingsCount: 0,
        readings: [],
        alertsGenerated: []
      };
    }

    // 4. Timestamp Skew validation
    const skewValidation = validateTimestampSkew(packet.timestamp, Date.now(), this.options.maxTimestampSkewMs);
    if (!skewValidation.isValid) {
      return {
        success: false,
        code: skewValidation.errorCode || 'TIMESTAMP_SKEW_ERROR',
        message: skewValidation.errorMessage || 'Timestamp skew rejected.',
        acceptedReadingsCount: 0,
        rejectedReadingsCount: 0,
        readings: [],
        alertsGenerated: []
      };
    }

    // 5. Sequence Number & Anti-Replay check
    const seqValidation = validateSequenceNumber(packet.sequenceNumber, device.lastTelemetrySeq);
    if (!seqValidation.isValid) {
      if (seqValidation.isDuplicate) {
        // Idempotent duplicate: return success acknowledging packet was previously received
        return {
          success: true,
          code: 'DUPLICATE_IDEMPOTENT',
          message: seqValidation.errorMessage || 'Duplicate sequence accepted idempotently.',
          acceptedReadingsCount: 0,
          rejectedReadingsCount: 0,
          readings: [],
          alertsGenerated: []
        };
      }

      return {
        success: false,
        code: seqValidation.errorCode || 'SEQUENCE_ERROR',
        message: seqValidation.errorMessage || 'Invalid sequence counter.',
        acceptedReadingsCount: 0,
        rejectedReadingsCount: 0,
        readings: [],
        alertsGenerated: []
      };
    }

    // 6. Channel Definitions & Active Installation Context
    const channels = await this.dataStore.getChannelsForModel(device.modelId);
    const channelMap = new Map<string, SensorChannel>();
    for (const ch of channels) {
      channelMap.set(ch.channelCode, ch);
    }

    const installation = await this.dataStore.getActiveInstallationForDevice(device.id);

    // 7. Validate and store readings
    const storedReadings: StoredTelemetryReading[] = [];
    let acceptedCount = 0;
    let rejectedCount = 0;

    for (const item of packet.readings) {
      const channel = channelMap.get(item.channelCode);
      if (!channel) {
        rejectedCount++;
        continue;
      }

      const lastVal = await this.dataStore.getLastReadingValue(device.id, item.channelCode);
      const quality = checkReadingQuality(item.rawValue, item.unit, channel, lastVal);

      const readingRecord: StoredTelemetryReading = {
        id: crypto.randomUUID(),
        deviceId: device.id,
        installationId: installation?.id,
        plotId: installation?.plotId,
        channelCode: item.channelCode,
        rawValue: item.rawValue,
        calibratedValue: quality.calibratedValue,
        unit: item.unit,
        sourceTimestamp: packet.timestamp,
        receivedTimestamp: new Date().toISOString(),
        sequenceNumber: packet.sequenceNumber,
        qualityFlag: quality.flag,
        gatewayMetadata: {
          gatewayId: packet.gatewayId,
          signalRssi: packet.signalRssi,
          signalSnr: packet.signalSnr,
          batteryPct: packet.batteryPct
        },
        createdAt: new Date().toISOString()
      };

      await this.dataStore.storeTelemetryReading(readingRecord);
      storedReadings.push(readingRecord);
      acceptedCount++;
    }

    // 8. Update Device Health & Telemetry State
    let newStatus = device.status;
    if (device.status === 'registered' || device.status === 'assigned') {
      newStatus = 'active';
    }

    // Degraded mode if low battery (< 20%) or weak signal (< -115 dBm)
    if (packet.batteryPct !== undefined && packet.batteryPct < 20) {
      newStatus = 'degraded';
    }

    await this.dataStore.updateDeviceHealth(device.id, {
      lastSeenAt: packet.timestamp,
      lastTelemetrySeq: packet.sequenceNumber,
      batteryLevelPct: packet.batteryPct ?? device.batteryLevelPct,
      batteryVoltageMv: packet.batteryVoltageMv ?? device.batteryVoltageMv,
      signalRssi: packet.signalRssi ?? device.signalRssi,
      signalSnr: packet.signalSnr ?? device.signalSnr,
      status: newStatus
    });

    // 9. Evaluate Agronomy Alert Rules
    const generatedAlerts: DeviceAlert[] = [];
    if (installation && storedReadings.length > 0) {
      const alerts = await this.alertEngine.evaluateReadings(
        device,
        installation,
        storedReadings
      );

      for (const alert of alerts) {
        await this.dataStore.storeAlert(alert);
        generatedAlerts.push(alert);
      }
    }

    return {
      success: true,
      code: 'INGESTION_SUCCESS',
      message: `Processed ${acceptedCount} readings from device ${device.serialNumber}.`,
      acceptedReadingsCount: acceptedCount,
      rejectedReadingsCount: rejectedCount,
      readings: storedReadings,
      alertsGenerated: generatedAlerts
    };
  }
}
