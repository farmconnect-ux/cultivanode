import { NextResponse } from "next/server";
import { getLivePilotWeather } from "@/lib/weather";

export async function GET() {
  const weather = await getLivePilotWeather();
  return NextResponse.json(weather);
}
