// =============================================================================
// CultivaNode Farm Intelligence: Web App & Experience Server
// =============================================================================

import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createIngestionApp } from '../ingestion/server.js';
import { FieldNodeSimulator } from '../simulator/node-simulator.js';
import { CropFoundationBridge } from '../engine/crop-bridge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createWebApp() {
  const { app, store, pipeline, alertEngine, watchdog } = createIngestionApp();
  const cropBridge = new CropFoundationBridge();

  // Create active simulators for pilot farm
  const tomatoSim = new FieldNodeSimulator({
    serialNumber: 'CN-NG-2026-00101',
    secretKey: 'hmac-key-tomato-101',
    soilProfile: 'sandy_loam',
    initialMoisturePct: 24.5,
    initialBatteryPct: 94.0,
    initialSequence: 100
  });

  const maizeSim = new FieldNodeSimulator({
    serialNumber: 'CN-NG-2026-00102',
    secretKey: 'hmac-key-maize-102',
    soilProfile: 'sandy_loam',
    initialMoisturePct: 28.0,
    initialBatteryPct: 88.0,
    initialSequence: 140
  });

  // Serve static assets
  app.use(express.static(path.join(__dirname, 'public')));

  // API 1: Farmer View Data
  app.get('/api/farmer/summary', async (_req: Request, res: Response) => {
    // Current readings
    const tomatoDevice = await store.getDeviceBySerial('CN-NG-2026-00101');
    const maizeDevice = await store.getDeviceBySerial('CN-NG-2026-00102');
    const tankDevice = await store.getDeviceBySerial('CN-NG-2026-00103');

    const lastTomatoMoisture = await store.getLastReadingValue(tomatoDevice?.id || '', 'soil_moisture_pct') ?? 24.5;
    const lastTomatoTemp = await store.getLastReadingValue(tomatoDevice?.id || '', 'air_temperature_c') ?? 31.2;
    const lastTomatoHumidity = await store.getLastReadingValue(tomatoDevice?.id || '', 'air_humidity_pct') ?? 72.0;

    const lastMaizeMoisture = await store.getLastReadingValue(maizeDevice?.id || '', 'soil_moisture_pct') ?? 27.8;
    const lastTankLevel = await store.getLastReadingValue(tankDevice?.id || '', 'water_level_pct') ?? 82.0;

    // Weather comparison for Moniya, Oyo
    const weatherComparison = cropBridge.compareWeatherWithGroundTruth(
      'plot-tomato-01',
      new Date().toISOString().slice(0, 10),
      { tempC: 33.0, rainMm: 0.0, humidityPct: 65, provider: 'Open-Meteo & NiMet Outlook' },
      {
        tempC: lastTomatoTemp,
        rainMm: 0.0,
        humidityPct: lastTomatoHumidity,
        soilMoisturePct: lastTomatoMoisture,
        deviceId: tomatoDevice?.id || ''
      }
    );

    // Active open alerts
    const openAlerts = store.alerts.filter(a => a.status === 'open');

    res.json({
      farm: {
        id: 'farm-moniya-01',
        name: 'Al-Barakah Pilot Farm',
        state: 'Oyo State (Moniya Cluster)',
        zone: 'Derived Savanna',
        manager: 'Adewale Adebayo'
      },
      plots: [
        {
          id: 'plot-tomato-01',
          name: 'Plot 1: Tomato (Roma VF)',
          stage: 'Flowering & Early Fruit Set (Week 7)',
          areaHa: 1.2,
          currentMoisturePct: lastTomatoMoisture,
          targetMoistureMin: 22.0,
          targetMoistureMax: 32.0,
          status: lastTomatoMoisture < 22.0 ? 'Moisture Deficit' : 'Optimal Moisture',
          temperatureC: lastTomatoTemp,
          humidityPct: lastTomatoHumidity,
          probeDepthCm: 15,
          device: {
            serial: tomatoDevice?.serialNumber,
            status: tomatoDevice?.status,
            batteryPct: tomatoDevice?.batteryLevelPct,
            lastSeenAt: tomatoDevice?.lastSeenAt
          }
        },
        {
          id: 'plot-maize-02',
          name: 'Plot 2: Maize (SAMMAZ 15)',
          stage: 'Vegetative V8 (Week 5)',
          areaHa: 2.5,
          currentMoisturePct: lastMaizeMoisture,
          targetMoistureMin: 20.0,
          targetMoistureMax: 30.0,
          status: 'Optimal Moisture',
          temperatureC: 30.8,
          humidityPct: 68.0,
          probeDepthCm: 30,
          device: {
            serial: maizeDevice?.serialNumber,
            status: maizeDevice?.status,
            batteryPct: maizeDevice?.batteryLevelPct,
            lastSeenAt: maizeDevice?.lastSeenAt
          }
        }
      ],
      infrastructure: {
        tankLevelPct: lastTankLevel,
        tankStatus: lastTankLevel < 25.0 ? 'Low Level Warning' : 'Adequate',
        device: {
          serial: tankDevice?.serialNumber,
          batteryPct: tankDevice?.batteryLevelPct,
          lastSeenAt: tankDevice?.lastSeenAt
        }
      },
      weatherComparison,
      alerts: openAlerts
    });
  });

  // API 2: Field Agent Commissioning Endpoint
  app.post('/api/installer/provision', async (req: Request, res: Response) => {
    const { serialNumber, plotId, farmId, sensorDepthCm, soilTexture, siteSurvey, photoUrl } = req.body;

    const device = await store.getDeviceBySerial(serialNumber);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found in registry.' });
    }

    const installationId = `inst-${Date.now()}`;
    const installation = {
      id: installationId,
      deviceId: device.id,
      farmId: farmId || 'farm-moniya-01',
      plotId: plotId || 'plot-tomato-01',
      sensorDepthCm: Number(sensorDepthCm) || 15,
      soilTexture: soilTexture || 'sandy_loam',
      powerMethod: 'solar_lifepo4' as const,
      installedBy: 'agent-taiwo-01',
      siteSurvey: siteSurvey || {},
      photoUrl,
      isActive: true,
      calibratedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.installations.set(installation.id, installation);
    device.status = 'installed';
    device.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: `Device ${serialNumber} successfully installed on ${installation.plotId}.`,
      installation
    });
  });

  // API 3: Installer Connectivity Ping Test
  app.get('/api/installer/ping-test/:serial', async (req: Request, res: Response) => {
    const { serial } = req.params;
    const device = await store.getDeviceBySerial(serial);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    res.json({
      success: true,
      serialNumber: device.serialNumber,
      status: device.status,
      signalRssi: device.signalRssi ?? -76,
      signalSnr: device.signalSnr ?? 9.5,
      batteryPct: device.batteryLevelPct ?? 95,
      lastSeenAt: device.lastSeenAt || 'Never (Ready for first transmission)',
      connectionQuality: (device.signalRssi ?? -76) > -85 ? 'Excellent' : 'Fair'
    });
  });

  // API 4: Admin Fleet Diagnostics
  app.get('/api/admin/fleet', async (_req: Request, res: Response) => {
    const devices = Array.from(store.devices.values());
    const installations = Array.from(store.installations.values());

    res.json({
      summary: {
        totalDevices: devices.length,
        activeCount: devices.filter(d => d.status === 'active').length,
        degradedCount: devices.filter(d => d.status === 'degraded').length,
        offlineCount: devices.filter(d => d.status === 'offline').length,
        installedCount: devices.filter(d => d.status === 'installed').length,
        registeredCount: devices.filter(d => d.status === 'registered').length,
        lowBatteryCount: devices.filter(d => (d.batteryLevelPct ?? 100) < 20).length
      },
      devices: devices.map(d => {
        const inst = installations.find(i => i.deviceId === d.id && i.isActive);
        return {
          ...d,
          installation: inst ? { plotId: inst.plotId, depthCm: inst.sensorDepthCm, calibratedAt: inst.calibratedAt } : null
        };
      }),
      recentReadingsCount: store.readings.length,
      alertsCount: store.alerts.length
    });
  });

  // API 5: Simulator Actions
  app.post('/api/simulator/action', async (req: Request, res: Response) => {
    const { action, targetDevice, param } = req.body;

    let sim = tomatoSim;
    let devId = 'dev-001-tomato';
    if (targetDevice === 'CN-NG-2026-00102') {
      sim = maizeSim;
      devId = 'dev-002-maize';
    }

    if (action === 'send_clean_reading') {
      const generated = sim.generateNextPacket('none');
      const result = await pipeline.processPacket(generated.packet, {
        bearerToken: targetDevice === 'CN-NG-2026-00102' ? 'secret-token-maize-102' : 'secret-token-tomato-101'
      });
      return res.json({ action, success: true, result });
    }

    if (action === 'trigger_rain') {
      sim.triggerRainEvent(param || 25.0);
      const generated = sim.generateNextPacket('none');
      const result = await pipeline.processPacket(generated.packet, {
        bearerToken: targetDevice === 'CN-NG-2026-00102' ? 'secret-token-maize-102' : 'secret-token-tomato-101'
      });
      return res.json({ action, rainAddedMm: param || 25.0, result });
    }

    if (action === 'trigger_irrigation') {
      sim.triggerIrrigation(param || 50.0);
      const generated = sim.generateNextPacket('none');
      const result = await pipeline.processPacket(generated.packet, {
        bearerToken: targetDevice === 'CN-NG-2026-00102' ? 'secret-token-maize-102' : 'secret-token-tomato-101'
      });
      return res.json({ action, irrigationLiters: param || 50.0, result });
    }

    if (action === 'trigger_tank_low') {
      sim.setTankLevel(18.0);
      const generated = sim.generateNextPacket('none');
      // Override water_level_pct
      generated.packet.readings = generated.packet.readings.map(r =>
        r.channelCode === 'water_level_pct' ? { ...r, rawValue: 18.0 } : r
      );
      const result = await pipeline.processPacket(generated.packet, {
        bearerToken: targetDevice === 'CN-NG-2026-00102' ? 'secret-token-maize-102' : 'secret-token-tomato-101'
      });
      return res.json({ action, tankLevelPct: 18.0, result });
    }

    if (action === 'trigger_moisture_stress') {
      // Simulate sustained moisture below threshold (e.g. 19.5% for 6 hours)
      const now = Date.now();
      const readingsToPreload = [
        { hoursAgo: 6, val: 19.8 },
        { hoursAgo: 4, val: 19.5 },
        { hoursAgo: 2, val: 19.2 },
        { hoursAgo: 0, val: 18.9 }
      ];

      for (const item of readingsToPreload) {
        const timeIso = new Date(now - item.hoursAgo * 3600000).toISOString();
        const storedReading = {
          id: crypto.randomUUID(),
          deviceId: devId,
          plotId: 'plot-tomato-01',
          channelCode: 'soil_moisture_pct',
          rawValue: item.val,
          calibratedValue: item.val,
          unit: '%',
          sourceTimestamp: timeIso,
          receivedTimestamp: timeIso,
          sequenceNumber: 200 + item.hoursAgo,
          qualityFlag: 'valid' as const,
          gatewayMetadata: {},
          createdAt: timeIso
        };
        await store.storeTelemetryReading(storedReading);
      }

      // Now send latest reading to trigger rule
      const inst = await store.getActiveInstallationForDevice(devId);
      const dev = await store.getDeviceBySerial(targetDevice || 'CN-NG-2026-00101');
      if (inst && dev) {
        const alerts = await alertEngine.evaluateReadings(dev, inst, [
          {
            id: crypto.randomUUID(),
            deviceId: devId,
            plotId: 'plot-tomato-01',
            channelCode: 'soil_moisture_pct',
            rawValue: 18.9,
            calibratedValue: 18.9,
            unit: '%',
            sourceTimestamp: new Date().toISOString(),
            receivedTimestamp: new Date().toISOString(),
            sequenceNumber: 250,
            qualityFlag: 'valid' as const,
            gatewayMetadata: {},
            createdAt: new Date().toISOString()
          }
        ]);

        for (const a of alerts) {
          await store.storeAlert(a);
        }
        return res.json({ action, success: true, alertsGenerated: alerts });
      }

      return res.json({ action, success: true });
    }

    if (action === 'inject_fault') {
      const faultMode = param; // e.g. 'probe_open_circuit', 'replay_old_sequence', 'skew_timestamp_future'
      const generated = sim.generateNextPacket(faultMode);
      const result = await pipeline.processPacket(generated.packet, {
        bearerToken: targetDevice === 'CN-NG-2026-00102' ? 'secret-token-maize-102' : 'secret-token-tomato-101'
      });
      return res.json({ action, faultMode, result });
    }

    if (action === 'trigger_watchdog_silence') {
      // Set device last seen 14 hours ago
      const dev = await store.getDeviceBySerial(targetDevice || 'CN-NG-2026-00101');
      if (dev) {
        dev.lastSeenAt = new Date(Date.now() - 14 * 3600000).toISOString();
        dev.updatedAt = new Date().toISOString();
      }
      const scanResult = await watchdog.scanForSilentDevices(new Date(), 12);
      return res.json({ action, scanResult });
    }

    if (action === 'acknowledge_alert') {
      const alertId = param;
      const targetAlert = store.alerts.find(a => a.id === alertId);
      if (targetAlert) {
        targetAlert.status = 'acknowledged';
        targetAlert.acknowledgedAt = new Date().toISOString();
        targetAlert.acknowledgedBy = 'farmer-adebayo-001';
      }
      return res.json({ action, success: true, alertId });
    }

    res.status(400).json({ error: 'Unknown action' });
  });

  return app;
}

// Standalone execution
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  const app = createWebApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[CultivaNode IoT] Farm Intelligence Web Console listening on http://localhost:${PORT}`);
  });
}
