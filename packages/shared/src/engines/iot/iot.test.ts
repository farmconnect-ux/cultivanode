import { describe, expect, it } from "vitest";
import {
  CropFoundationBridge,
  AlertRulesEngine,
  DeviceWatchdog,
  checkReadingQuality,
  type AlertRule,
  type Device,
  type DeviceAlert,
  type DeviceInstallation,
  type SensorChannel,
  type StoredTelemetryReading,
  type TelemetryRollup,
  type IHistoricalReadingsProvider,
  type IWatchdogStore,
} from "./index";

describe("IoT Quality Checker", () => {
  const moistureChannel: SensorChannel = {
    id: "ch-1",
    deviceModelId: "mod-1",
    channelCode: "soil_moisture_pct",
    displayName: "Root Zone Soil Moisture",
    unit: "%",
    minValidValue: 0.0,
    maxValidValue: 100.0,
    precisionDecimals: 1,
    measurementPriority: 1,
  };

  const tempChannel: SensorChannel = {
    id: "ch-2",
    deviceModelId: "mod-1",
    channelCode: "air_temperature_c",
    displayName: "Air Temperature",
    unit: "°C",
    minValidValue: -10.0,
    maxValidValue: 60.0,
    precisionDecimals: 1,
    measurementPriority: 1,
  };

  it("identifies valid sensor readings within range", () => {
    const res = checkReadingQuality(45.2, "%", moistureChannel);
    expect(res.flag).toBe("valid");
    expect(res.isAcceptableForRollup).toBe(true);
  });

  it("detects electrical open circuit or hardware fault codes", () => {
    const res = checkReadingQuality(-999, "%", moistureChannel);
    expect(res.flag).toBe("hardware_fault");
    expect(res.isAcceptableForRollup).toBe(false);
  });

  it("flags values exceeding physical sensor bounds", () => {
    const res = checkReadingQuality(125.0, "%", moistureChannel);
    expect(res.flag).toBe("out_of_range");
    expect(res.isAcceptableForRollup).toBe(false);
  });

  it("flags sudden rate-of-change spikes exceeding hydraulic infiltration limits", () => {
    const res = checkReadingQuality(80.0, "%", moistureChannel, 30.0);
    expect(res.flag).toBe("suspicious");
    expect(res.isAcceptableForRollup).toBe(true);
  });

  it("converts Fahrenheit units automatically to Celsius", () => {
    const res = checkReadingQuality(86.0, "°F", tempChannel);
    expect(res.flag).toBe("valid");
    expect(res.calibratedValue).toBe(30.0);
  });
});

describe("IoT Crop Foundation Bridge", () => {
  const bridge = new CropFoundationBridge();

  it("derives clean daily crop_measurements from rollups", () => {
    const rollups: TelemetryRollup[] = [
      {
        id: "roll-1",
        deviceId: "dev-1",
        plotId: "plot-tomato-01",
        channelCode: "soil_moisture_pct",
        period: "1d",
        bucketTimestamp: "2026-10-08T00:00:00Z",
        avgValue: 25.4,
        minValue: 23.8,
        maxValue: 26.9,
        lastValue: 25.1,
        sampleCount: 96,
        validCount: 96,
      },
      {
        id: "roll-2",
        deviceId: "dev-1",
        plotId: "plot-tomato-01",
        channelCode: "rainfall_mm",
        period: "1d",
        bucketTimestamp: "2026-10-08T00:00:00Z",
        avgValue: 0.2,
        minValue: 0.0,
        maxValue: 14.5,
        lastValue: 14.5,
        sampleCount: 96,
        validCount: 96,
      },
    ];

    const measurements = bridge.deriveCropMeasurements(rollups);
    expect(measurements).toHaveLength(2);

    const moisture = measurements.find((m) => m.measurementType === "root_zone_soil_moisture");
    expect(moisture).toBeDefined();
    expect(moisture?.valueNumeric).toBe(25.4);
    expect(moisture?.source).toBe("iot_sensor");

    const rain = measurements.find((m) => m.measurementType === "plot_rainfall_total");
    expect(rain).toBeDefined();
    expect(rain?.valueNumeric).toBe(14.5);
  });

  it("detects microclimate variance when local storm hits field", () => {
    const comparison = bridge.compareWeatherWithGroundTruth(
      "plot-maize-01",
      "2026-10-08",
      { tempC: 32.0, rainMm: 0.0, humidityPct: 55, provider: "Regional OpenWeather" },
      { tempC: 28.5, rainMm: 12.0, humidityPct: 85, soilMoisturePct: 62.0, deviceId: "dev-rain-01" }
    );

    expect(comparison.variance.rainDiscrepancyMm).toBe(12.0);
    expect(comparison.trustRecommendation).toContain("Localised storm detected on plot");
  });
});

describe("IoT Alert Rules Engine", () => {
  const dummyHistory: IHistoricalReadingsProvider = {
    async getReadingsInWindow() {
      return [];
    },
    async getLastAlertForRule() {
      return undefined;
    },
  };

  const sampleRule: AlertRule = {
    id: "rule-dry",
    ruleCode: "moisture_critically_low",
    name: "Severe Root Moisture Deficit",
    channelCode: "soil_moisture_pct",
    operator: "lt",
    thresholdValue: 25.0,
    durationMinutes: 0,
    severity: "critical",
    adviceTemplate: "Soil moisture is critically low at {val}%. Irrigate immediately.",
    actionCode: "schedule_drip_irrigation",
    isActive: true,
  };

  const sampleDevice: Device = {
    id: "dev-1",
    serialNumber: "CN-001",
    modelId: "mod-1",
    status: "active",
    firmwareVersion: "1.0.0",
    batteryPercentage: 90,
  };

  const sampleInstallation: DeviceInstallation = {
    id: "inst-1",
    deviceId: "dev-1",
    farmId: "farm-1",
    plotId: "plot-1",
    installedAt: "2026-10-01T00:00:00Z",
    installedBy: "user-1",
    latitude: 7.3775,
    longitude: 3.947,
    status: "active",
  };

  it("triggers critical alert when soil moisture breaches threshold", async () => {
    const engine = new AlertRulesEngine(dummyHistory, [sampleRule]);

    const readings: StoredTelemetryReading[] = [
      {
        id: "read-1",
        deviceId: "dev-1",
        channelCode: "soil_moisture_pct",
        recordedAt: "2026-10-08T12:00:00Z",
        valueNumeric: 18.5,
        unit: "%",
        qualityFlag: "valid",
      },
    ];

    const alerts = await engine.evaluateReadings(sampleDevice, sampleInstallation, readings);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.severity).toBe("critical");
    expect(alerts[0]?.recommendedAction).toBe("schedule_drip_irrigation");
    expect(alerts[0]?.message).toContain("18.5%");
  });

  it("suppresses alerts for offline or retired devices", async () => {
    const engine = new AlertRulesEngine(dummyHistory, [sampleRule]);
    const offlineDevice = { ...sampleDevice, status: "offline" as const };

    const readings: StoredTelemetryReading[] = [
      {
        id: "read-1",
        deviceId: "dev-1",
        channelCode: "soil_moisture_pct",
        recordedAt: "2026-10-08T12:00:00Z",
        valueNumeric: 15.0,
        unit: "%",
        qualityFlag: "valid",
      },
    ];

    const alerts = await engine.evaluateReadings(offlineDevice, sampleInstallation, readings);
    expect(alerts).toHaveLength(0);
  });
});

describe("IoT Device Watchdog", () => {
  it("detects silent devices exceeding timeout and generates health alert", async () => {
    const alertsCreated: DeviceAlert[] = [];

    const mockStore: IWatchdogStore = {
      async getActiveDevices() {
        return [
          {
            id: "dev-dead",
            serialNumber: "CN-DEAD-999",
            modelId: "mod-1",
            status: "active",
            firmwareVersion: "1.0",
            batteryPercentage: 15,
            lastSeenAt: "2026-10-07T00:00:00Z", // 36 hours ago
          },
        ];
      },
      async getActiveInstallation() {
        return {
          id: "inst-1",
          deviceId: "dev-dead",
          farmId: "farm-1",
          plotId: "plot-1",
          installedAt: "2026-10-01T00:00:00Z",
          installedBy: "user-1",
          latitude: 7.37,
          longitude: 3.94,
          status: "active",
        };
      },
      async updateDeviceStatus() {},
      async createDeviceAlert(alert: DeviceAlert) {
        alertsCreated.push(alert);
      },
      async hasOpenAlertForChannel() {
        return false;
      },
    };

    const watchdog = new DeviceWatchdog(mockStore, 12);
    const now = new Date("2026-10-08T12:00:00Z");

    const result = await watchdog.scanForSilentDevices(now, 12);
    expect(result.silentCount).toBe(1);
    expect(result.alertedDevices).toContain("CN-DEAD-999");
    expect(alertsCreated).toHaveLength(1);
    expect(alertsCreated[0]?.title).toContain("CN-DEAD-999");
  });
});
