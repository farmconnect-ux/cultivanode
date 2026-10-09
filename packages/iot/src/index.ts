// =============================================================================
// CultivaNode Farm Intelligence: IoT Module Main Entrypoint
// =============================================================================

export * from './types/iot.js';
export * from './security/crypto.js';
export * from './security/validation.js';
export * from './ingestion/quality-checker.js';
export * from './ingestion/pipeline.js';
export * from './ingestion/memory-store.js';
export * from './ingestion/server.js';
export * from './ingestion/adapters/cellular-adapter.js';
export * from './ingestion/adapters/lorawan-adapter.js';
export * from './engine/alert-rules-engine.js';
export * from './engine/watchdog.js';
export * from './engine/crop-bridge.js';
export * from './simulator/soil-physics.js';
export * from './simulator/weather-generator.js';
export * from './simulator/node-simulator.js';
export * from './simulator/fault-injection.js';
export * from './web/server.js';

import { createWebApp } from './web/server.js';

// Auto-start web server if run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const PORT = process.env.PORT || 3000;
  const app = createWebApp();
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🌱 CultivaNode Farm Intelligence: IoT Module Started`);
    console.log(`📍 Dashboard & Web Console: http://localhost:${PORT}`);
    console.log(`📡 Ingestion Endpoint:       http://localhost:${PORT}/api/v1/telemetry/cellular`);
    console.log(`LoRaWAN Webhook:         http://localhost:${PORT}/api/v1/telemetry/lorawan`);
    console.log(`======================================================\n`);
  });
}
