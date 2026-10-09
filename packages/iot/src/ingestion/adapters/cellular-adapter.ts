// =============================================================================
// CultivaNode Farm Intelligence: Cellular Telemetry Payload Adapter
// =============================================================================

import { z } from 'zod';
import { TelemetryPacket } from '../../types/iot.js';

export const CellularPayloadSchema = z.object({
  deviceSerial: z.string().min(3),
  timestamp: z.string().datetime({ offset: true }),
  sequenceNumber: z.number().int().nonnegative(),
  batteryPct: z.number().min(0).max(100).optional(),
  batteryVoltageMv: z.number().int().positive().optional(),
  signalRssi: z.number().int().optional(),
  signalSnr: z.number().optional(),
  readings: z.array(
    z.object({
      channelCode: z.string().min(1),
      rawValue: z.number(),
      unit: z.string().min(1)
    })
  ).min(1),
  gatewayId: z.string().optional()
});

export type CellularPayload = z.infer<typeof CellularPayloadSchema>;

/**
 * Parses and normalizes incoming Cellular HTTP payload
 */
export function parseCellularPayload(body: unknown): TelemetryPacket {
  const parsed = CellularPayloadSchema.parse(body);
  return {
    deviceSerial: parsed.deviceSerial,
    timestamp: parsed.timestamp,
    sequenceNumber: parsed.sequenceNumber,
    batteryPct: parsed.batteryPct,
    batteryVoltageMv: parsed.batteryVoltageMv,
    signalRssi: parsed.signalRssi,
    signalSnr: parsed.signalSnr,
    readings: parsed.readings,
    gatewayId: parsed.gatewayId
  };
}
