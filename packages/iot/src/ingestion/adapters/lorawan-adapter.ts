// =============================================================================
// CultivaNode Farm Intelligence: LoRaWAN Uplink Adapter (ChirpStack / TTN)
// =============================================================================

import { TelemetryPacket, TelemetryReadingInput } from '../../types/iot.js';

/**
 * Normalizes ChirpStack v4 or The Things Network v3 uplink webhooks into TelemetryPacket
 */
export function parseLoRaWANPayload(body: any): TelemetryPacket {
  if (!body || typeof body !== 'object') {
    throw new Error('Malformed LoRaWAN payload: expected JSON object');
  }

  // 1. Extract Device EUI / Serial
  const devEui =
    body.deviceInfo?.devEui ||
    body.end_device_ids?.dev_eui ||
    body.devEUI ||
    body.device_id ||
    'UNKNOWN_LORAWAN';

  // 2. Extract Frame Counter / Sequence
  const sequenceNumber =
    body.fCnt ??
    body.uplink_message?.f_cnt ??
    body.fcnt ??
    0;

  // 3. Extract Timestamp
  const timestamp =
    body.time ||
    body.received_at ||
    body.uplink_message?.received_at ||
    new Date().toISOString();

  // 4. Extract Radio Metadata (RSSI, SNR, Gateway)
  let signalRssi: number | undefined;
  let signalSnr: number | undefined;
  let gatewayId: string | undefined;

  const rxInfo = body.rxInfo || body.uplink_message?.rx_metadata;
  if (Array.isArray(rxInfo) && rxInfo.length > 0) {
    signalRssi = rxInfo[0].rssi;
    signalSnr = rxInfo[0].snr;
    gatewayId = rxInfo[0].gatewayId || rxInfo[0].gateway_ids?.gateway_id;
  }

  // 5. Extract Decoded Telemetry Object
  const decoded =
    body.object ||
    body.uplink_message?.decoded_payload ||
    {};

  const readings: TelemetryReadingInput[] = [];

  if (typeof decoded.soil_moisture_pct === 'number') {
    readings.push({ channelCode: 'soil_moisture_pct', rawValue: decoded.soil_moisture_pct, unit: '%' });
  } else if (typeof decoded.moisture === 'number') {
    readings.push({ channelCode: 'soil_moisture_pct', rawValue: decoded.moisture, unit: '%' });
  }

  if (typeof decoded.soil_temp_c === 'number') {
    readings.push({ channelCode: 'soil_temp_c', rawValue: decoded.soil_temp_c, unit: '°C' });
  }

  if (typeof decoded.air_temperature_c === 'number') {
    readings.push({ channelCode: 'air_temperature_c', rawValue: decoded.air_temperature_c, unit: '°C' });
  } else if (typeof decoded.temperature === 'number') {
    readings.push({ channelCode: 'air_temperature_c', rawValue: decoded.temperature, unit: '°C' });
  }

  if (typeof decoded.air_humidity_pct === 'number') {
    readings.push({ channelCode: 'air_humidity_pct', rawValue: decoded.air_humidity_pct, unit: '%' });
  } else if (typeof decoded.humidity === 'number') {
    readings.push({ channelCode: 'air_humidity_pct', rawValue: decoded.humidity, unit: '%' });
  }

  if (typeof decoded.rainfall_mm === 'number') {
    readings.push({ channelCode: 'rainfall_mm', rawValue: decoded.rainfall_mm, unit: 'mm' });
  }

  if (typeof decoded.water_level_pct === 'number') {
    readings.push({ channelCode: 'water_level_pct', rawValue: decoded.water_level_pct, unit: '%' });
  }

  if (typeof decoded.water_flow_lpm === 'number') {
    readings.push({ channelCode: 'water_flow_lpm', rawValue: decoded.water_flow_lpm, unit: 'L/min' });
  }

  const batteryPct = decoded.battery_pct ?? decoded.battery;
  const batteryVoltageMv = decoded.battery_voltage_mv ?? decoded.voltage;

  return {
    deviceSerial: devEui,
    timestamp,
    sequenceNumber: Number(sequenceNumber),
    batteryPct: typeof batteryPct === 'number' ? batteryPct : undefined,
    batteryVoltageMv: typeof batteryVoltageMv === 'number' ? batteryVoltageMv : undefined,
    signalRssi,
    signalSnr,
    readings,
    gatewayId
  };
}
