import { NextResponse } from "next/server";
import { getLivePilotWeather } from "@/lib/weather";

// Same answer for everyone and refreshed every 15 minutes upstream, so let the CDN serve it.
export const revalidate = 900;

export async function GET() {
  const weather = await getLivePilotWeather();
  return NextResponse.json(weather, {
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
  });
}
