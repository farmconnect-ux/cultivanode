import { NextResponse } from 'next/server';
import { z } from 'zod';
import { evaluateCropWeatherHazards, type WeatherDayForecast } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

const WeatherAlertsSchema = z.object({
  cropId: z.string().min(1).max(80),
  stageName: z.string().min(1).max(80),
  forecasts: z
    .array(
      z.object({
        date: z.string().min(8).max(32),
        rainMm: z.number().min(0),
        tempMaxC: z.number(),
        tempMinC: z.number(),
        windMaxKmh: z.number().min(0),
      }),
    )
    .min(1)
    .max(30),
});

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, WeatherAlertsSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const alerts = evaluateCropWeatherHazards({
      cropId: parsed.data.cropId,
      stageName: parsed.data.stageName,
      forecasts: parsed.data.forecasts as WeatherDayForecast[],
    });
    return NextResponse.json(alerts);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
