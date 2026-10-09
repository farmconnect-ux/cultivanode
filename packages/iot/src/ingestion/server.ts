// =============================================================================
// CultivaNode Farm Intelligence: Secure Ingestion Service
// =============================================================================

import express, { Request, Response } from 'express';
import cors from 'cors';
import { TelemetryIngestionPipeline } from './pipeline.js';
import { InMemoryIoTStore } from './memory-store.js';
import { AlertRulesEngine } from '../engine/alert-rules-engine.js';
import { parseCellularPayload } from './adapters/cellular-adapter.js';
import { parseLoRaWANPayload } from './adapters/lorawan-adapter.js';
import { DeviceWatchdog } from '../engine/watchdog.js';

export function createIngestionApp(
  store: InMemoryIoTStore = new InMemoryIoTStore()
) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  const alertEngine = new AlertRulesEngine(store, store.rules);
  const pipeline = new TelemetryIngestionPipeline(store, alertEngine);
  const watchdog = new DeviceWatchdog(store);

  // Metrics tracking
  const metrics = {
    totalPacketsReceived: 0,
    acceptedPacketsCount: 0,
    rejectedPacketsCount: 0,
    duplicatesCount: 0,
    errorsByCode: {} as Record<string, number>,
    startedAt: new Date().toISOString()
  };

  function recordMetric(code: string, isSuccess: boolean, isDuplicate: boolean) {
    metrics.totalPacketsReceived++;
    if (isSuccess && !isDuplicate) metrics.acceptedPacketsCount++;
    else if (isDuplicate) metrics.duplicatesCount++;
    else metrics.rejectedPacketsCount++;

    metrics.errorsByCode[code] = (metrics.errorsByCode[code] || 0) + 1;
  }

  // Health check
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'cultivanode-iot-ingestion',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Metrics & diagnostics
  app.get('/api/v1/metrics', (_req: Request, res: Response) => {
    const devices = Array.from(store.devices.values());
    const active = devices.filter(d => d.status === 'active').length;
    const degraded = devices.filter(d => d.status === 'degraded').length;
    const offline = devices.filter(d => d.status === 'offline').length;

    res.json({
      metrics,
      fleet: {
        totalDevices: devices.length,
        active,
        degraded,
        offline,
        staleRate: devices.length > 0 ? Math.round((offline / devices.length) * 100) : 0
      },
      readingsTotal: store.readings.length,
      alertsTotal: store.alerts.length
    });
  });

  // 1. Cellular HTTP Ingestion endpoint
  app.post('/api/v1/telemetry/cellular', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers['authorization'];
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-device-token'] as string);

      const packet = parseCellularPayload(req.body);

      const result = await pipeline.processPacket(packet, {
        bearerToken
      });

      recordMetric(result.code, result.success, result.code === 'DUPLICATE_IDEMPOTENT');

      if (!result.success) {
        return res.status(result.code === 'AUTH_REQUIRED' || result.code === 'UNAUTHORIZED_DEVICE' ? 401 : 400).json(result);
      }

      res.status(result.code === 'DUPLICATE_IDEMPOTENT' ? 200 : 201).json(result);
    } catch (err: any) {
      recordMetric('MALFORMED_PAYLOAD', false, false);
      res.status(400).json({
        success: false,
        code: 'MALFORMED_PAYLOAD',
        message: err.message || 'Failed to parse telemetry body'
      });
    }
  });

  // 2. LoRaWAN Webhook (ChirpStack / TTN) Ingestion endpoint
  app.post('/api/v1/telemetry/lorawan', async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-signature'] as string;
      const rawPayload = JSON.stringify(req.body);

      const packet = parseLoRaWANPayload(req.body);

      // In LoRaWAN, sharedSecret can be configured or pre-authenticated by gateway
      const result = await pipeline.processPacket(packet, {
        signature,
        rawPayload,
        sharedSecret: 'hmac-key-tomato-101' // Example gateway/device mapping
      });

      recordMetric(result.code, result.success, result.code === 'DUPLICATE_IDEMPOTENT');

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (err: any) {
      recordMetric('MALFORMED_LORAWAN_PAYLOAD', false, false);
      res.status(400).json({
        success: false,
        code: 'MALFORMED_LORAWAN_PAYLOAD',
        message: err.message || 'Failed to parse LoRaWAN uplink'
      });
    }
  });

  // 3. Trigger Watchdog check
  app.post('/api/v1/watchdog/run', async (req: Request, res: Response) => {
    const thresholdHours = Number(req.query.thresholdHours) || 12;
    const result = await watchdog.scanForSilentDevices(new Date(), thresholdHours);
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  });

  return { app, store, pipeline, alertEngine, watchdog };
}

// Standalone execution
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  const { app } = createIngestionApp();
  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`[CultivaNode IoT] Ingestion Service listening on http://localhost:${PORT}`);
  });
}
