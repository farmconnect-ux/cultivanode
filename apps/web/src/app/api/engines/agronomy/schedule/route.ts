import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CROP_CATALOGUE, generatePlantingSchedule, type GenerateScheduleParams } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

const ScheduleSchema = z.object({
  cropId: z.string().min(1).max(80),
  varietyId: z.string().max(80).optional(),
  plantingDate: z.string().min(8).max(32),
  zone: z.enum(['rainforest', 'derived_savanna']),
  areaHectares: z.number().positive().max(100_000),
});

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, ScheduleSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const schedule = generatePlantingSchedule(parsed.data as GenerateScheduleParams);
    return NextResponse.json(schedule);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const header = 'Crop_ID,Crop_Name,Scientific_Name,Category,Suitable_Zones,Duration_Days,Seed_Rate_Per_Ha';
  const rows = CROP_CATALOGUE.map((c) => {
    const zones = c.suitableZones.join('; ');
    const seed = `${c.seedRate.amountPerHa} ${c.seedRate.unit}`;
    return [c.id, c.commonName, c.scientificName, c.category, zones, c.typicalDurationDays, seed]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });

  return new Response([header, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cultivanode-agronomy-catalogue-${dateStr}.csv"`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
