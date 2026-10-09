// =============================================================================
// CultivaNode Farm Intelligence: IoT Module Types & Interfaces
// =============================================================================

export type DeviceStatus =
  | 'registered'
  | 'provisioned'
  | 'installed'
  | 'assigned'
  | 'active'
  | 'degraded'
  | 'offline'
  | 'maintenance'
  | 'retired';

export type ConnectivityType =
  | 'lorawan'
  | 'cellular_nb_iot'
  | 'cellular_2g_4g'
  | 'ble_direct';

export type PowerSourceType =
  | 'solar_lifepo4'
  | 'solar_li_ion'
  | 'primary_battery'
  | 'mains_grid'
  | 'generator_backed';

export type TelemetryQualityFlag =
  | 'valid'
  | 'suspicious'
  | 'out_of_range'
  | 'hardware_fault'
  | 'stale'
  | 'replayed';

export type RollupPeriod = '15m' | '1h' | '1d';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'suppressed';

export type TrustLabel =
  | 'sensor reading'
  | 'weather forecast'
  | 'calculated recommendation'
  | 'device watchdog';

export interface DeviceModel {
  id: string;
  modelCode: string;
  name: string;
  vendor: string;
  connectivity: ConnectivityType;
  supportedPower: PowerSourceType[];
  hardwareRevision: string;
  defaultFirmware: string;
  description: string;
}

export interface SensorChannel {
  id: string;
  deviceModelId: string;
  channelCode: string;
  displayName: string;
  unit: string;
  minValidValue: number;
  maxValidValue: number;
  precisionDecimals: number;
  measurementPriority: number; // 1 = Priority 1, 2 = Priority 2
}

export interface Device {
  id: string;
  serialNumber: string;
  modelId: string;
  status: DeviceStatus;
  firmwareVersion: string;
  batteryPercentage: number;
  batteryVoltage?: number;
  lastSeenAt?: string;
  gatewayAddress?: string;
  networkRssi?: number;
  networkSnr?: number;
}

export interface DeviceInstallation {
  id: string;
  deviceId: string;
  farmId: string;
  plotId: string;
  cropCycleId?: string;
  installedAt: string;
  installedBy: string;
  latitude: number;
  longitude: number;
  probeDepthCm?: number;
  status: 'active' | 'relocated' | 'removed';
}

export interface RawTelemetryReading {
  channelCode: string;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface StoredTelemetryReading {
  id: string;
  deviceId: string;
  channelCode: string;
  recordedAt: string;
  valueNumeric: number;
  unit: string;
  qualityFlag: TelemetryQualityFlag;
  batteryPercentage?: number;
  batteryVoltage?: number;
  rssi?: number;
  snr?: number;
}

export interface TelemetryRollup {
  id: string;
  deviceId: string;
  plotId?: string;
  channelCode: string;
  period: RollupPeriod;
  bucketTimestamp: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  lastValue: number;
  sampleCount: number;
  validCount: number;
}

export interface AlertRule {
  id: string;
  ruleCode: string;
  name: string;
  channelCode: string;
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'outside_range';
  thresholdValue: number;
  thresholdHighValue?: number;
  durationMinutes: number;
  severity: AlertSeverity;
  cropStageFilter?: string;
  soilTextureFilter?: string;
  adviceTemplate: string;
  actionCode: string;
  isActive: boolean;
}

export interface DeviceAlert {
  id: string;
  farmId: string;
  plotId?: string;
  deviceId?: string;
  ruleId?: string;
  severity: AlertSeverity;
  alertType: string;
  title: string;
  message: string;
  recommendedAction: string;
  actionPayload?: Record<string, unknown>;
  status: AlertStatus;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}
