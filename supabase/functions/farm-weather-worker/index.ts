// Farm weather worker, woken daily by pg_cron (private.wake_weather_worker) before the farm monitors run.
// Deployed with JWT verification OFF: the x-worker-secret header is checked against Vault instead.
import { readEnv } from '../_shared/env.ts';
import { handleFarmWeatherWorker } from '../_shared/handlers/farm-weather-worker.ts';

const env = readEnv(Deno.env);

Deno.serve((req) => handleFarmWeatherWorker(req, { env }));
