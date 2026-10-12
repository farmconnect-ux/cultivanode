import { NextResponse } from "next/server";
import { getGoogleMapsConfig } from "@/lib/maps/google-maps";

export async function GET() {
  const config = await getGoogleMapsConfig();
  return NextResponse.json(config);
}
