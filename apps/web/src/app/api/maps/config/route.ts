import { NextResponse } from "next/server";
import { getPublicGoogleMapsConfig } from "@/lib/maps/google-maps";

export async function GET() {
  const config = await getPublicGoogleMapsConfig();
  return NextResponse.json(config);
}
