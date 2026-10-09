// =============================================================================
// CultivaNode Farm Intelligence: Simulator CLI Utility
// =============================================================================

import { FieldNodeSimulator } from './node-simulator.js';
import { InMemoryIoTStore } from '../ingestion/memory-store.js';
import { TelemetryIngestionPipeline } from '../ingestion/pipeline.js';
import { AlertRulesEngine } from '../engine/alert-rules-engine.js';
import { DeviceWatchdog } from '../engine/watchdog.js';

async function runCli() {
  console.log(`\n===============================================================`);
  console.log(`⚡ CultivaNode IoT Field Node Simulator & Agronomy Validator`);
  console.log(`===============================================================\n`);

  const store = new InMemoryIoTStore();
  const alertEngine = new AlertRulesEngine(store, store.rules);
  const pipeline = new TelemetryIngestionPipeline(store, alertEngine);
  const watchdog = new DeviceWatchdog(store);

  // Initialize simulated node
  const sim = new FieldNodeSimulator({
    serialNumber: 'CN-NG-2026-00101',
    secretKey: 'hmac-key-tomato-101',
    soilProfile: 'sandy_loam',
    initialMoisturePct: 24.2,
    initialBatteryPct: 92.0,
    initialSequence: 100
  });

  console.log(`[SIMULATOR] Field Node CN-NG-2026-00101 initialized.`);
  console.log(`[SIMULATOR] Soil Profile: Sandy Loam (Field capacity: 26%, Wilting point: 13%)`);
  console.log(`[SIMULATOR] Generating 3 consecutive clean transmission packets...\n`);

  for (let i = 1; i <= 3; i++) {
    const { packet } = sim.generateNextPacket('none');
    console.log(`Packet #${i}: Seq=${packet.sequenceNumber}, SoilMoisture=${packet.readings.find(r => r.channelCode === 'soil_moisture_pct')?.rawValue}%, AirTemp=${packet.readings.find(r => r.channelCode === 'air_temperature_c')?.rawValue}°C, Bat=${packet.batteryPct}%`);
    const result = await pipeline.processPacket(packet, {
      bearerToken: 'secret-token-tomato-101'
    });
    console.log(`  -> Ingestion: ${result.code} (${result.acceptedReadingsCount} readings accepted, ${result.alertsGenerated.length} alerts)`);
  }

  console.log(`\n---------------------------------------------------------------`);
  console.log(`[TEST 1] Replaying Packet #2 (Anti-Replay Attack Defense)...`);
  const replayPacket = sim.generateNextPacket('none');
  replayPacket.packet.sequenceNumber = 2; // Replay sequence 2
  const replayRes = await pipeline.processPacket(replayPacket.packet, {
    bearerToken: 'secret-token-tomato-101'
  });
  console.log(`  -> Result: Code=${replayRes.code}, Message="${replayRes.message}"`);

  console.log(`\n---------------------------------------------------------------`);
  console.log(`[TEST 2] Injecting 2-Hour Future Clock Skew...`);
  const skewPacket = sim.generateNextPacket('skew_timestamp_future');
  const skewRes = await pipeline.processPacket(skewPacket.packet, {
    bearerToken: 'secret-token-tomato-101'
  });
  console.log(`  -> Result: Code=${skewRes.code}, Message="${skewRes.message}"`);

  console.log(`\n---------------------------------------------------------------`);
  console.log(`[TEST 3] Disconnecting Probe Sensor (Open Circuit -999)...`);
  const faultPacket = sim.generateNextPacket('probe_open_circuit');
  const faultRes = await pipeline.processPacket(faultPacket.packet, {
    bearerToken: 'secret-token-tomato-101'
  });
  const faultyReading = faultRes.readings.find(r => r.channelCode === 'soil_moisture_pct');
  console.log(`  -> Result: QualityFlag=${faultyReading?.qualityFlag}, RawValue=${faultyReading?.rawValue}`);

  console.log(`\n---------------------------------------------------------------`);
  console.log(`[TEST 4] Simulating 14-Hour Silence (Device Watchdog Scan)...`);
  const dev = await store.getDeviceBySerial('CN-NG-2026-00101');
  if (dev) {
    dev.lastSeenAt = new Date(Date.now() - 14 * 3600000).toISOString();
  }
  const watchdogRes = await watchdog.scanForSilentDevices(new Date(), 12);
  console.log(`  -> Watchdog flagged ${watchdogRes.silentCount} device(s) offline: [${watchdogRes.alertedDevices.join(', ')}]`);
  const watchdogAlert = store.alerts.find(a => a.source === 'device watchdog');
  console.log(`  -> Generated Alert Observation: "${watchdogAlert?.observation}"`);

  console.log(`\n===============================================================`);
  console.log(`✅ All CLI simulator test scenarios completed successfully!`);
  console.log(`===============================================================\n`);
}

runCli().catch(err => {
  console.error('Simulator CLI failed:', err);
  process.exit(1);
});
