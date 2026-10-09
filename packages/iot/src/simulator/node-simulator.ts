// =============================================================================
// CultivaNode Farm Intelligence: Autonomous Field Node Simulator
// =============================================================================

import { TelemetryPacket } from '../types/iot.js';
import { SoilWaterSimulator } from './soil-physics.js';
import { WeatherGenerator } from './weather-generator.js';
import { FaultInjector, FaultMode } from './fault-injection.js';
import { computeHmacSha256 } from '../security/crypto.js';

export interface SimulatedNodeConfig {
  serialNumber: string;
  secretKey: string;
  soilProfile: 'sandy_loam' | 'clay_loam';
  initialMoisturePct?: number;
  initialBatteryPct?: number;
  initialSequence?: number;
  transmissionIntervalMinutes?: number;
}

export class FieldNodeSimulator {
  private soilSim: SoilWaterSimulator;
  private weatherGen: WeatherGenerator;
  private sequenceCounter: number = 0;
  private batteryPct: number;
  private currentHour: number = 7; // Starts morning
  private isRaining: boolean = false;
  private rainfallMm: number = 0;
  private waterTankPct: number = 85.0;

  constructor(public config: SimulatedNodeConfig) {
    this.soilSim = new SoilWaterSimulator(config.soilProfile, config.initialMoisturePct);
    this.weatherGen = new WeatherGenerator();
    this.batteryPct = config.initialBatteryPct ?? 95.0;
    this.sequenceCounter = config.initialSequence ?? 0;
  }

  getSequenceCounter(): number {
    return this.sequenceCounter;
  }

  triggerRainEvent(amountMm: number) {
    this.isRaining = true;
    this.rainfallMm = amountMm;
  }

  triggerIrrigation(liters: number) {
    this.soilSim.applyIrrigation(liters);
    this.waterTankPct = Math.max(10.0, this.waterTankPct - liters * 0.25);
  }

  setTankLevel(levelPct: number) {
    this.waterTankPct = Math.max(0, Math.min(100, levelPct));
  }

  /**
   * Generates next telemetry transmission packet with physics simulation
   */
  generateNextPacket(fault: FaultMode = 'none'): {
    packet: TelemetryPacket;
    rawPayload: string;
    signature: string;
  } {
    this.sequenceCounter++;
    const intervalHours = (this.config.transmissionIntervalMinutes || 15) / 60;
    this.currentHour = (this.currentHour + intervalHours) % 24;

    // 1. Weather condition
    const weather = this.weatherGen.getConditionAtHour(this.currentHour, this.isRaining);

    // 2. Battery charge/discharge cycle
    this.batteryPct = Math.min(100, Math.max(5, this.batteryPct + weather.batteryChargingRatePctPerHour * intervalHours));

    // 3. Soil physics step
    const moisture = this.soilSim.step(intervalHours, weather.ambientTempC, this.rainfallMm, 0);

    // Reset rain event after 1 interval
    if (this.isRaining) {
      this.isRaining = false;
      this.rainfallMm = 0;
    }

    // 4. Construct clean packet
    const basePacket: TelemetryPacket = {
      deviceSerial: this.config.serialNumber,
      timestamp: new Date().toISOString(),
      sequenceNumber: this.sequenceCounter,
      batteryPct: Math.round(this.batteryPct * 10) / 10,
      batteryVoltageMv: Math.round(3000 + (this.batteryPct / 100) * 1200),
      signalRssi: -75 - Math.floor(Math.random() * 8),
      signalSnr: 9.2,
      readings: [
        {
          channelCode: 'soil_moisture_pct',
          rawValue: moisture,
          unit: '%'
        },
        {
          channelCode: 'soil_temp_c',
          rawValue: Math.round((weather.ambientTempC - 2.5) * 10) / 10,
          unit: '°C'
        },
        {
          channelCode: 'air_temperature_c',
          rawValue: weather.ambientTempC,
          unit: '°C'
        },
        {
          channelCode: 'air_humidity_pct',
          rawValue: weather.relativeHumidityPct,
          unit: '%'
        },
        {
          channelCode: 'water_level_pct',
          rawValue: Math.round(this.waterTankPct * 10) / 10,
          unit: '%'
        },
        {
          channelCode: 'battery_pct',
          rawValue: Math.round(this.batteryPct * 10) / 10,
          unit: '%'
        }
      ]
    };

    // 5. Apply fault injection if requested
    const finalPacket = FaultInjector.injectFault(basePacket, fault, this.sequenceCounter - 1);

    const rawPayload = JSON.stringify(finalPacket);
    const signature = computeHmacSha256(rawPayload, this.config.secretKey);

    return {
      packet: finalPacket,
      rawPayload,
      signature
    };
  }
}
