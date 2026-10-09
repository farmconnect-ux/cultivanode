// =============================================================================
// CultivaNode Farm Intelligence: IoT Store (Database & In-Memory Engine)
// =============================================================================

import {
  Device,
  DeviceAlert,
  DeviceInstallation,
  DeviceModel,
  SensorChannel,
  StoredTelemetryReading,
  TelemetryRollup,
  AlertRule
} from '../types/iot.js';
import { IIoTDataStore } from './pipeline.js';
import { IHistoricalReadingsProvider } from '../engine/alert-rules-engine.js';
import { IWatchdogStore } from '../engine/watchdog.js';
import { hashToken } from '../security/crypto.js';

export class InMemoryIoTStore implements IIoTDataStore, IHistoricalReadingsProvider, IWatchdogStore {
  public models: Map<string, DeviceModel> = new Map();
  public channels: Map<string, SensorChannel[]> = new Map();
  public devices: Map<string, Device> = new Map();
  public installations: Map<string, DeviceInstallation> = new Map();
  public readings: StoredTelemetryReading[] = [];
  public rollups: TelemetryRollup[] = [];
  public alerts: DeviceAlert[] = [];
  public rules: AlertRule[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // 1. Models
    const soilModel: DeviceModel = {
      id: 'model-soil-pro-01',
      modelCode: 'CN-SOIL-PRO-V1',
      name: 'CultivaNode Soil & Root Station',
      vendor: 'CultivaNode Hardware Labs',
      connectivity: 'lorawan',
      supportedPower: ['solar_lifepo4'],
      hardwareRevision: 'v1.2',
      defaultFirmware: '1.2.0',
      description: 'Precision FDR soil probe at root depth with canopy microclimate sensors.'
    };

    const tankModel: DeviceModel = {
      id: 'model-tank-flow-01',
      modelCode: 'CN-TANK-FLOW-V1',
      name: 'CultivaNode Water Infrastructure Node',
      vendor: 'CultivaNode Hardware Labs',
      connectivity: 'cellular_2g_4g',
      supportedPower: ['solar_lifepo4', 'mains_grid'],
      hardwareRevision: 'v1.1',
      defaultFirmware: '1.1.4',
      description: 'Ultrasonic tank reservoir level and digital flow meter.'
    };

    this.models.set(soilModel.id, soilModel);
    this.models.set(tankModel.id, tankModel);

    // 2. Channels
    this.channels.set(soilModel.id, [
      {
        id: 'ch-sm-1',
        deviceModelId: soilModel.id,
        channelCode: 'soil_moisture_pct',
        displayName: 'Soil Moisture (Root Depth)',
        unit: '%',
        minValidValue: 0.0,
        maxValidValue: 100.0,
        precisionDecimals: 1,
        measurementPriority: 1
      },
      {
        id: 'ch-st-1',
        deviceModelId: soilModel.id,
        channelCode: 'soil_temp_c',
        displayName: 'Soil Temperature',
        unit: '°C',
        minValidValue: -5.0,
        maxValidValue: 60.0,
        precisionDecimals: 1,
        measurementPriority: 1
      },
      {
        id: 'ch-at-1',
        deviceModelId: soilModel.id,
        channelCode: 'air_temperature_c',
        displayName: 'Air Temperature',
        unit: '°C',
        minValidValue: -10.0,
        maxValidValue: 60.0,
        precisionDecimals: 1,
        measurementPriority: 1
      },
      {
        id: 'ch-ah-1',
        deviceModelId: soilModel.id,
        channelCode: 'air_humidity_pct',
        displayName: 'Relative Humidity',
        unit: '%',
        minValidValue: 0.0,
        maxValidValue: 100.0,
        precisionDecimals: 1,
        measurementPriority: 1
      },
      {
        id: 'ch-bat-1',
        deviceModelId: soilModel.id,
        channelCode: 'battery_pct',
        displayName: 'Node Battery Level',
        unit: '%',
        minValidValue: 0.0,
        maxValidValue: 100.0,
        precisionDecimals: 1,
        measurementPriority: 1
      }
    ]);

    this.channels.set(tankModel.id, [
      {
        id: 'ch-wl-1',
        deviceModelId: tankModel.id,
        channelCode: 'water_level_pct',
        displayName: 'Water Reservoir Level',
        unit: '%',
        minValidValue: 0.0,
        maxValidValue: 100.0,
        precisionDecimals: 1,
        measurementPriority: 2
      },
      {
        id: 'ch-wf-1',
        deviceModelId: tankModel.id,
        channelCode: 'water_flow_lpm',
        displayName: 'Irrigation Flow Rate',
        unit: 'L/min',
        minValidValue: 0.0,
        maxValidValue: 1000.0,
        precisionDecimals: 1,
        measurementPriority: 2
      },
      {
        id: 'ch-bat-2',
        deviceModelId: tankModel.id,
        channelCode: 'battery_pct',
        displayName: 'Node Battery Level',
        unit: '%',
        minValidValue: 0.0,
        maxValidValue: 100.0,
        precisionDecimals: 1,
        measurementPriority: 1
      }
    ]);

    // 3. Devices
    const devTomato: Device = {
      id: 'dev-001-tomato',
      serialNumber: 'CN-NG-2026-00101',
      modelId: soilModel.id,
      status: 'active',
      firmwareVersion: '1.2.0',
      batteryLevelPct: 94.0,
      batteryVoltageMv: 4150,
      signalRssi: -74,
      signalSnr: 10.2,
      lastSeenAt: new Date(Date.now() - 5 * 60000).toISOString(),
      lastTelemetrySeq: 100,
      authTokenHash: hashToken('secret-token-tomato-101'),
      secretKeyHash: hashToken('hmac-key-tomato-101'),
      assignedOwnerId: 'farmer-adebayo-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const devMaize: Device = {
      id: 'dev-002-maize',
      serialNumber: 'CN-NG-2026-00102',
      modelId: soilModel.id,
      status: 'active',
      firmwareVersion: '1.2.0',
      batteryLevelPct: 88.0,
      batteryVoltageMv: 4020,
      signalRssi: -82,
      signalSnr: 8.5,
      lastSeenAt: new Date(Date.now() - 10 * 60000).toISOString(),
      lastTelemetrySeq: 140,
      authTokenHash: hashToken('secret-token-maize-102'),
      secretKeyHash: hashToken('hmac-key-maize-102'),
      assignedOwnerId: 'farmer-adebayo-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const devTank: Device = {
      id: 'dev-003-tank',
      serialNumber: 'CN-NG-2026-00103',
      modelId: tankModel.id,
      status: 'active',
      firmwareVersion: '1.1.4',
      batteryLevelPct: 98.0,
      batteryVoltageMv: 4200,
      signalRssi: -68,
      signalSnr: 12.0,
      lastSeenAt: new Date(Date.now() - 15 * 60000).toISOString(),
      lastTelemetrySeq: 85,
      authTokenHash: hashToken('secret-token-tank-103'),
      secretKeyHash: hashToken('hmac-key-tank-103'),
      assignedOwnerId: 'farmer-adebayo-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Spare device for Installer QR Onboarding test
    const devSpare: Device = {
      id: 'dev-004-spare',
      serialNumber: 'CN-NG-2026-00199',
      modelId: soilModel.id,
      status: 'registered',
      firmwareVersion: '1.2.0',
      batteryLevelPct: 100.0,
      batteryVoltageMv: 4250,
      lastTelemetrySeq: 0,
      authTokenHash: hashToken('token-installer-spare-199'),
      secretKeyHash: hashToken('hmac-installer-spare-199'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.devices.set(devTomato.id, devTomato);
    this.devices.set(devMaize.id, devMaize);
    this.devices.set(devTank.id, devTank);
    this.devices.set(devSpare.id, devSpare);

    // 4. Installations
    const instTomato: DeviceInstallation = {
      id: 'inst-001-tomato',
      deviceId: devTomato.id,
      farmId: 'farm-moniya-01',
      plotId: 'plot-tomato-01',
      sensorDepthCm: 15,
      probeInstallationAngle: 45,
      soilTexture: 'sandy_loam',
      powerMethod: 'solar_lifepo4',
      installedBy: 'agent-taiwo-01',
      siteSurvey: {
        cropType: 'tomato',
        variety: 'Roma VF',
        stage: 'flowering',
        networkSignal: 'LoRaWAN Good (-74 dBm)',
        theftRisk: 'Low (Fenced plot)'
      },
      isActive: true,
      calibratedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const instMaize: DeviceInstallation = {
      id: 'inst-002-maize',
      deviceId: devMaize.id,
      farmId: 'farm-moniya-01',
      plotId: 'plot-maize-02',
      sensorDepthCm: 30,
      probeInstallationAngle: 45,
      soilTexture: 'sandy_loam',
      powerMethod: 'solar_lifepo4',
      installedBy: 'agent-taiwo-01',
      siteSurvey: {
        cropType: 'maize',
        variety: 'SAMMAZ 15',
        stage: 'tasseling',
        networkSignal: 'LoRaWAN Moderate (-82 dBm)',
        theftRisk: 'Low'
      },
      isActive: true,
      calibratedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const instTank: DeviceInstallation = {
      id: 'inst-003-tank',
      deviceId: devTank.id,
      farmId: 'farm-moniya-01',
      plotId: 'plot-tomato-01',
      powerMethod: 'solar_lifepo4',
      installedBy: 'agent-taiwo-01',
      siteSurvey: {
        capacityLiters: 10000,
        source: 'Borehole with solar submersible pump'
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.installations.set(instTomato.id, instTomato);
    this.installations.set(instMaize.id, instMaize);
    this.installations.set(instTank.id, instTank);

    // 5. Seed Alert Rules
    this.rules = [
      {
        id: 'rule-tomato-stress-01',
        ruleCode: 'RULE_TOMATO_MOISTURE_DEFICIT',
        cropType: 'tomato',
        cropStage: 'flowering',
        soilType: 'sandy_loam',
        channelCode: 'soil_moisture_pct',
        operator: 'sustained_below',
        thresholdValue: 22.0,
        hysteresisDelta: 2.5,
        sustainedDurationMinutes: 360,
        cooldownMinutes: 720,
        title: 'Tomato Root-Zone Moisture Deficit',
        observationTemplate: 'Moisture has stayed below the crop-stage threshold ({threshold}%) for {duration} hours.',
        suggestedAction: 'Inspect drip lines on Plot 1 today. Flowering tomato is sensitive to moisture deficit.',
        severity: 'warning',
        isActive: true,
        approvedBy: 'Dr. A. Adebayo (Horticultural Agronomist)',
        version: '1.0'
      },
      {
        id: 'rule-tank-low-01',
        ruleCode: 'RULE_TANK_WATER_LOW',
        channelCode: 'water_level_pct',
        operator: 'sustained_below',
        thresholdValue: 25.0,
        hysteresisDelta: 5.0,
        sustainedDurationMinutes: 30,
        cooldownMinutes: 360,
        title: 'Low Irrigation Reservoir Level',
        observationTemplate: 'Tank level is low ({value}%); planned irrigation may not complete.',
        suggestedAction: 'Verify borehole pump operation and refill the main reservoir before starting drip cycles.',
        severity: 'warning',
        isActive: true,
        approvedBy: 'Irrigation Lead',
        version: '1.0'
      },
      {
        id: 'rule-tomato-fungal-01',
        ruleCode: 'RULE_TOMATO_FUNGAL_RISK',
        cropType: 'tomato',
        channelCode: 'air_humidity_pct',
        operator: 'sustained_above',
        thresholdValue: 85.0,
        hysteresisDelta: 5.0,
        sustainedDurationMinutes: 480,
        cooldownMinutes: 1440,
        title: 'Elevated Fungal & Blight Risk Condition',
        observationTemplate: 'High humidity (>85%) and warm temperatures increase fungal-risk conditions.',
        suggestedAction: 'Inspect tomato leaves for early blight spots before spraying. Delay foliar spray if rain is forecast.',
        severity: 'warning',
        isActive: true,
        approvedBy: 'Dr. A. Adebayo (Crop Protection)',
        version: '1.0'
      }
    ];
  }

  // IIoTDataStore methods
  async getDeviceBySerial(serial: string): Promise<Device | undefined> {
    for (const d of this.devices.values()) {
      if (d.serialNumber === serial) return d;
    }
    return undefined;
  }

  async getChannelsForModel(modelId: string): Promise<SensorChannel[]> {
    return this.channels.get(modelId) || [];
  }

  async getActiveInstallationForDevice(deviceId: string): Promise<DeviceInstallation | undefined> {
    for (const inst of this.installations.values()) {
      if (inst.deviceId === deviceId && inst.isActive) return inst;
    }
    return undefined;
  }

  async getLastReadingValue(deviceId: string, channelCode: string): Promise<number | undefined> {
    for (let i = this.readings.length - 1; i >= 0; i--) {
      const r = this.readings[i];
      if (r.deviceId === deviceId && r.channelCode === channelCode) {
        return r.calibratedValue;
      }
    }
    return undefined;
  }

  async storeTelemetryReading(reading: StoredTelemetryReading): Promise<void> {
    this.readings.push(reading);
  }

  async updateDeviceHealth(deviceId: string, updates: Partial<Device>): Promise<void> {
    const existing = this.devices.get(deviceId);
    if (existing) {
      this.devices.set(deviceId, {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      });
    }
  }

  async storeAlert(alert: DeviceAlert): Promise<void> {
    this.alerts.push(alert);
  }

  async getRecentAlert(plotId: string, ruleId: string): Promise<DeviceAlert | undefined> {
    for (let i = this.alerts.length - 1; i >= 0; i--) {
      const a = this.alerts[i];
      if (a.plotId === plotId && a.ruleId === ruleId) return a;
    }
    return undefined;
  }

  // IHistoricalReadingsProvider methods
  async getReadingsInWindow(
    deviceId: string,
    channelCode: string,
    sinceTimestampIso: string
  ): Promise<StoredTelemetryReading[]> {
    const sinceMs = new Date(sinceTimestampIso).getTime();
    return this.readings.filter(
      r =>
        r.deviceId === deviceId &&
        r.channelCode === channelCode &&
        new Date(r.sourceTimestamp).getTime() >= sinceMs
    );
  }

  async getLastAlertForRule(plotId: string, ruleCode: string): Promise<DeviceAlert | undefined> {
    for (let i = this.alerts.length - 1; i >= 0; i--) {
      const a = this.alerts[i];
      if (a.plotId === plotId && a.metadata?.ruleCode === ruleCode) return a;
    }
    return undefined;
  }

  // IWatchdogStore methods
  async getActiveDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getActiveInstallation(deviceId: string): Promise<DeviceInstallation | undefined> {
    return this.getActiveInstallationForDevice(deviceId);
  }

  async updateDeviceStatus(deviceId: string, status: 'degraded' | 'offline'): Promise<void> {
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.status = status;
      dev.updatedAt = new Date().toISOString();
    }
  }

  async createDeviceAlert(alert: DeviceAlert): Promise<void> {
    this.alerts.push(alert);
  }

  async hasOpenAlertForChannel(deviceId: string, channelCode: string): Promise<boolean> {
    return this.alerts.some(a => a.deviceId === deviceId && a.channelCode === channelCode && a.status === 'open');
  }
}
