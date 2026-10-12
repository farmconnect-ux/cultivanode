import { NextResponse } from 'next/server';
import { generatePlantingSchedule, type GenerateScheduleParams } from '@cultivanode/shared';
import { authorizeRequest } from '@/lib/engines-api-helper';

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as GenerateScheduleParams;
    const schedule = generatePlantingSchedule(body);
    return NextResponse.json(schedule);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const csv = [
    "Crop_Name,Target_Variety,Optimal_Planting_Window,Thermal_GDD_Requirement,Land_Prep_Lead_Days,Seed_Rate_Kg_Ha,Basal_Fertilizer_Spec,Top_Dress_GDD,Expected_Harvest_Window",
    "Cassava,TME 419 (Disease-Resistant),March 15 - May 30,2850 GDD,14 Days,50 Bundles/Ha,NPK 15-15-15 (200 kg/Ha),1100 GDD (Urea 100 kg),10 - 12 Months Post-Planting",
    "Yellow Maize,SAMMAZ-15 (High Yield),April 01 - May 15,1650 GDD,10 Days,20 Kg/Ha,NPK 20-10-10 (250 kg/Ha),750 GDD (Urea 150 kg),95 - 110 Days Post-Planting",
    "Soybean,TGX-1448-2E (Inoculated),June 01 - July 10,1480 GDD,12 Days,50 Kg/Ha,Single Super Phosphate (150 kg/Ha),600 GDD (Foliar Micronutrients),100 - 115 Days Post-Planting",
    "Cocoa,TC-1 to TC-8 Hybrid Pods,May 01 - June 30,3200 GDD,21 Days,1100 Seedlings/Ha,Well-cured Compost / Rock Phosphate,Annually Pre-Rains,3 - 4 Years to First Bearing",
    "Tomato,Roma VF / Platinum F1,August 15 - Sept 30,1250 GDD,14 Days,250 g/Ha,NPK 15-15-15 + Calcium Nitrate,450 GDD,75 - 85 Days Post-Transplant",
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cultivanode-regional-agronomy-schedule-${dateStr}.csv"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

