import { NextResponse } from 'next/server';
import { evaluateCropWeatherHazards, type WeatherDayForecast } from '@cultivanode/shared';
import { authorizeRequest } from '@/lib/engines-api-helper';

interface WeatherAlertsRequestBody {
  cropId: string;
  stageName: string;
  forecasts: WeatherDayForecast[];
}

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as WeatherAlertsRequestBody;
    const alerts = evaluateCropWeatherHazards({
      cropId: body.cropId,
      stageName: body.stageName,
      forecasts: body.forecasts,
    });
    return NextResponse.json(alerts);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
