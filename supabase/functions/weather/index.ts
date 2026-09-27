// Pilot-state weather for the admin dashboard (analytics.read). Provider chosen in Admin > Integrations.
import { readEnv } from '../_shared/env.ts';
import { handleWeather } from '../_shared/handlers/weather.ts';

const env = readEnv(Deno.env);

Deno.serve((req) => handleWeather(req, { env }));
