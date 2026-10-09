// =============================================================================
// CultivaNode Farm Intelligence: Simulator Fault Injection Modes
// =============================================================================

import { TelemetryPacket } from '../types/iot.js';

export type FaultMode =
  | 'none'
  | 'skew_timestamp_future'
  | 'skew_timestamp_past'
  | 'replay_old_sequence'
  | 'duplicate_sequence'
  | 'probe_open_circuit'
  | 'out_of_bounds_spike'
  | 'wrong_unit'
  | 'battery_critical'
  | 'tamper_silent';

export class FaultInjector {
  /**
   * Modifies a clean telemetry packet according to the requested fault injection mode
   */
  static injectFault(packet: TelemetryPacket, mode: FaultMode, lastKnownSeq: number): TelemetryPacket {
    const mutated: TelemetryPacket = JSON.parse(JSON.stringify(packet));

    switch (mode) {
      case 'skew_timestamp_future':
        // Timestamp 2 hours in the future
        mutated.timestamp = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        break;

      case 'skew_timestamp_past':
        // Timestamp 24 hours in the past
        mutated.timestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        break;

      case 'replay_old_sequence':
        // Sequence number older than last recorded
        mutated.sequenceNumber = Math.max(0, lastKnownSeq - 10);
        break;

      case 'duplicate_sequence':
        // Exact same sequence number as last recorded
        mutated.sequenceNumber = lastKnownSeq;
        break;

      case 'probe_open_circuit':
        // Sensor cable disconnected returning hardware fault code
        mutated.readings = mutated.readings.map(r =>
          r.channelCode === 'soil_moisture_pct' ? { ...r, rawValue: -999 } : r
        );
        break;

      case 'out_of_bounds_spike':
        // Physical impossibility: soil moisture 145%
        mutated.readings = mutated.readings.map(r =>
          r.channelCode === 'soil_moisture_pct' ? { ...r, rawValue: 145.0 } : r
        );
        break;

      case 'wrong_unit':
        // Sensor transmitting unexpected unit, e.g. Fahrenheit instead of Celsius
        mutated.readings = mutated.readings.map(r =>
          r.channelCode === 'air_temperature_c' ? { ...r, unit: 'kelvin' } : r
        );
        break;

      case 'battery_critical':
        // Battery drained to 8%
        mutated.batteryPct = 8.0;
        mutated.batteryVoltageMv = 3100;
        break;

      case 'none':
      default:
        break;
    }

    return mutated;
  }
}
