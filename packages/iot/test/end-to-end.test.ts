// =============================================================================
// Integration Tests: End-to-End IoT Telemetry Ingestion Pipeline
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert';
import { createIngestionApp } from '../src/ingestion/server.js';
import { FieldNodeSimulator } from '../src/simulator/node-simulator.js';

test('End-to-End: Ingestion pipeline validates, authenticates, deduplicates and tracks health', async () => {
  const { pipeline, store } = createIngestionApp();

  const sim = new FieldNodeSimulator({
    serialNumber: 'CN-NG-2026-00101',
    secretKey: 'hmac-key-tomato-101',
    soilProfile: 'sandy_loam',
    initialMoisturePct: 25.0,
    initialBatteryPct: 95.0,
    initialSequence: 100
  });

  // 1. Send clean packet #1
  const p1 = sim.generateNextPacket('none');
  const res1 = await pipeline.processPacket(p1.packet, {
    bearerToken: 'secret-token-tomato-101'
  });

  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.code, 'INGESTION_SUCCESS');
  assert.strictEqual(res1.acceptedReadingsCount > 0, true);

  // Verify device health updated
  const dev = await store.getDeviceBySerial('CN-NG-2026-00101');
  assert.strictEqual(dev?.lastTelemetrySeq, p1.packet.sequenceNumber);
  assert.strictEqual(dev?.status, 'active');

  // 2. Test Anti-Replay: Send exact duplicate sequence number
  const resDup = await pipeline.processPacket(p1.packet, {
    bearerToken: 'secret-token-tomato-101'
  });
  assert.strictEqual(resDup.success, true);
  assert.strictEqual(resDup.code, 'DUPLICATE_IDEMPOTENT');
  assert.strictEqual(resDup.acceptedReadingsCount, 0);

  // 3. Test Unauthorized device token
  const p2 = sim.generateNextPacket('none');
  const resBadAuth = await pipeline.processPacket(p2.packet, {
    bearerToken: 'invalid-attacker-token'
  });
  assert.strictEqual(resBadAuth.success, false);
  assert.strictEqual(resBadAuth.code, 'UNAUTHORIZED_DEVICE');

  // 4. Test Skewed Timestamp (+3 hours future)
  const pSkew = sim.generateNextPacket('skew_timestamp_future');
  const resSkew = await pipeline.processPacket(pSkew.packet, {
    bearerToken: 'secret-token-tomato-101'
  });
  assert.strictEqual(resSkew.success, false);
  assert.strictEqual(resSkew.code, 'TIMESTAMP_SKEW_EXCEEDED');

  // 5. Test Hardware Sensor Cable Cut (-999)
  const pFault = sim.generateNextPacket('probe_open_circuit');
  const resFault = await pipeline.processPacket(pFault.packet, {
    bearerToken: 'secret-token-tomato-101'
  });
  assert.strictEqual(resFault.success, true);
  const faultySoilReading = resFault.readings.find(r => r.channelCode === 'soil_moisture_pct');
  assert.strictEqual(faultySoilReading?.qualityFlag, 'hardware_fault');
});
