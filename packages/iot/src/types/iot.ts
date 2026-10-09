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
  batteryLevelPct?: number;
  batteryVoltageMv?: number;
  signalRssi?: number;
  signalSnr?: number;
  lastSeenAt?: string;
  lastTelemetrySeq: number;
  authTokenHash?: string;
  secretKeyHash?: string;
  revokedAt?: string;
  assignedOwnerId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceInstallation {
  id: string;
  deviceId: string;
  farmId: string;
  plotId: string;
  cropCycleId?: string;
  sensorDepthCm?: number;
  probeInstallationAngle?: number;
  soilTexture?: string;
  latitude?: number;
  longitude?: number;
  powerMethod: PowerSourceType;
  installedBy?: string;
  siteSurvey?: Record<string, unknown>;
  photoUrl?: string;
  isActive: boolean;
  calibratedAt?: string;
  nextCalibrationDue?: string;
  calibrationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryReadingInput {
  channelCode: string;
  rawValue: number;
  unit: string;
}

export interface TelemetryPacket {
  deviceSerial: string;
  timestamp: string; // ISO 8601 UTC
  sequenceNumber: number;
  batteryPct?: number;
  batteryVoltageMv?: number;
  signalRssi?: number;
  signalSnr?: number;
  readings: TelemetryReadingInput[];
  gatewayId?: string;
}

export interface StoredTelemetryReading {
  id: string;
  deviceId: string;
  installationId?: string;
  plotId?: string;
  channelCode: string;
  rawValue: number;
  calibratedValue: number;
  unit: string;
  sourceTimestamp: string;
  receivedTimestamp: string;
  sequenceNumber: number;
  qualityFlag: TelemetryQualityFlag;
  gatewayMetadata: Record<string, unknown>;
  createdAt: string;
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
  cropType?: string;
  cropStage?: string;
  soilType?: string;
  channelCode: string;
  operator: '<' | '>' | '<=' | '>=' | 'sustained_below' | 'sustained_above';
  thresholdValue: number;
  hysteresisDelta: number;
  sustainedDurationMinutes: number;
  cooldownMinutes: number;
  title: string;
  observationTemplate: string;
  suggestedAction: string;
  severity: AlertSeverity;
  isActive: boolean;
  approvedBy: string;
  version: string;
}

export interface DeviceAlert {
  id: string;
  farmId: string;
  plotId: string;
  deviceId: string;
  ruleId?: string;
  channelCode: string;
  observation: string;
  confidence: number;
  suggestedAction: string;
  source: TrustLabel;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  cooldownUntil?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestionResult {
  success: boolean;
  code: string;
  message: string;
  acceptedReadingsCount: number;
  rejectedReadingsCount: number;
  readings: StoredTelemetryReading[];
  alertsGenerated: DeviceAlert[];
}
