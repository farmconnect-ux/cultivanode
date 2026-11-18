import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CROP_CATALOGUE, generatePlantingSchedule, type GenerateScheduleParams } from '@cultivanode/shared';
import { authorizeRequest, parseJsonBody } from '@/lib/engines-api-helper';

const ScheduleSchema = z.object({
  cropId: z.string().min(1).max(80),
  varietyId: z.string().max(80).optional(),
  plantingDate: z.string().min(8).max(32),
  zone: z.enum(['rainforest', 'derived_savanna']),
  farmAreaHectares: z.number().positive().max(100_000).optional(),
  areaHectares: z.number().positive().max(100_000).optional(),
});

export async function POST(req: Request) {
  const auth = await authorizeRequest(req);
  if (!auth.authorized) return auth.response;

  const parsed = await parseJsonBody(req, ScheduleSchema);
  if (!parsed.ok) return parsed.response;

  const farmAreaHectares = parsed.data.farmAreaHectares ?? parsed.data.areaHectares;
  if (!farmAreaHectares) {
    return NextResponse.json({ error: 'farmAreaHectares is required' }, { status: 400 });
  }

  try {
    const params: GenerateScheduleParams = {
      cropId: parsed.data.cropId,
      varietyId: parsed.data.varietyId ?? '',
      plantingDate: parsed.data.plantingDate,
      zone: parsed.data.zone,
      farmAreaHectares,
    };
    const schedule = generatePlantingSchedule(params);
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
    const seed = c.seedRate ? `${c.seedRate.amountPerHa} ${c.seedRate.unit}` : '';
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
