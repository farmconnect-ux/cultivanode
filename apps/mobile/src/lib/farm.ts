// The farmer's farms, crops and today's jobs. Reads are cached on the phone so Home still opens offline.
// Row level security limits every read and write to the signed-in person's own farms.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACRES_PER_HECTARE, getCropById, isInNigeria, NIGERIAN_STATES } from '@cultivanode/shared';
import { addDays, stageOn, suggestCropPlan } from '@cultivanode/shared/crop-plan';
import { stateCentroid } from '@cultivanode/shared/state-centroids';
import { reportError } from './monitoring';
import { supabase } from './supabase';

export type Farm = { id: string; name: string; state: string | null; lga: string | null; areaHa: number | null };

export type Crop = {
  id: string;
  farmId: string;
  cropId: string;
  cropName: string;
  /** Yorùbá name from the catalogue, when it has one. */
  cropLocal: string | null;
  varietyId: string | null;
  plantingDate: string;
  harvestDate: string;
  areaHa: number;
  status: string;
  /** Growth stage by calendar from the crop catalogue, e.g. "Seedling". */
  stage: string | null;
  day: number;
  totalDays: number;
};

export type Job = {
  id: string;
  cropCycleId: string;
  cropName: string;
  cropLocal: string | null;
  areaHa: number;
  name: string;
  stage: string;
  type: string;
  date: string;
  notes: string | null;
  machinery: string | null;
  status: string;
};

export type FarmError = 'errorName' | 'errorLocation' | 'errorSize' | 'needsFarmerRole' | 'offline' | 'errorGeneric';

/** "Maize (Corn)" → "Maize". */
export const cleanName = (name: string) => name.replace(/\s*\(.*\)\s*$/, '');

export const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
const isNetwork = (e: { message?: string; code?: string } | null) => !e?.code && /network|fetch/i.test(e?.message ?? '');

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  try {
    const value = await load();
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);
    return value;
  } catch (err) {
    const saved = await AsyncStorage.getItem(key).catch(() => null);
    if (saved) return JSON.parse(saved) as T;
    throw err;
  }
}

export function loadFarms(userId: string): Promise<Farm[]> {
  return cached(`cn.farms.${userId}`, async () => {
    const { data, error } = await supabase.from('farms').select('id, name, state, lga, area_ha').eq('owner_id', userId).order('created_at');
    if (error) throw error;
    return (data ?? []).map((f) => ({ id: f.id, name: f.name, state: f.state, lga: f.lga, areaHa: f.area_ha === null ? null : Number(f.area_ha) }));
  });
}

export type NewFarm = { name: string; state: string; lga: string; size: string; unit: 'ha' | 'acres'; lat: number | null; lng: number | null };

/** Adds a farm at the phone's GPS point, or at the centre of the chosen state when there is no GPS fix. */
export async function addFarm(userId: string, f: NewFarm): Promise<{ id: string } | { error: FarmError }> {
  const name = f.name.trim().slice(0, 120);
  if (name.length < 2) return { error: 'errorName' };
  let lat = f.lat;
  let lng = f.lng;
  if (lat === null || lng === null || !isInNigeria(lat, lng)) {
    const centre = stateCentroid(f.state);
    if (!centre) return { error: 'errorLocation' };
    lat = centre.lat;
    lng = centre.lng;
  }
  let areaHa: number | null = null;
  if (f.size.trim()) {
    const size = Number(f.size.replace(',', '.'));
    if (!Number.isFinite(size) || size <= 0 || size > 100000) return { error: 'errorSize' };
    areaHa = Math.round((f.unit === 'acres' ? size / ACRES_PER_HECTARE : size) * 10000) / 10000;
  }
  const row = {
    name,
    location: `SRID=4326;POINT(${lng.toFixed(6)} ${lat.toFixed(6)})`,
    area_ha: areaHa,
    state: (NIGERIAN_STATES as readonly string[]).includes(f.state) ? f.state : null,
    lga: f.lga.trim().slice(0, 60) || null,
    owner_id: userId,
  };
  const { data, error } = await supabase.from('farms').insert(row).select('id').single();
  if (!error && data) return { id: data.id };
  if (isNetwork(error)) return { error: 'offline' };
  if (error?.code === '42501') return { error: 'needsFarmerRole' };
  reportError('mobile_add_farm_failed', error, { reason: error?.code ?? 'unknown' });
  return { error: 'errorGeneric' };
}

function toCrop(row: {
  id: string;
  farm_id: string;
  crop_id: string;
  variety_id: string | null;
  planting_date: string;
  expected_harvest_date: string;
  target_area_ha: number;
  status: string;
}): Crop {
  const plan = suggestCropPlan(row.crop_id, row.planting_date, row.variety_id);
  const day = today();
  return {
    id: row.id,
    farmId: row.farm_id,
    cropId: row.crop_id,
    cropName: cleanName(getCropById(row.crop_id)?.commonName ?? row.crop_id.replace(/_/g, ' ')),
    cropLocal: getCropById(row.crop_id)?.localNames?.yo?.split(' / ')[0] ?? null,
    varietyId: row.variety_id,
    plantingDate: row.planting_date,
    harvestDate: row.expected_harvest_date,
    areaHa: Number(row.target_area_ha),
    status: row.status,
    stage: stageOn(plan.stages, day)?.name ?? null,
    day: Math.max(0, daysBetween(row.planting_date, day)),
    totalDays: Math.max(1, daysBetween(row.planting_date, row.expected_harvest_date)),
  };
}

/** Crops in the ground or planned on one farm, newest first. */
export function loadCrops(farmId: string): Promise<Crop[]> {
  return cached(`cn.crops.${farmId}`, async () => {
    const { data, error } = await supabase
      .from('crop_cycles')
      .select('id, farm_id, crop_id, variety_id, planting_date, expected_harvest_date, target_area_ha, status')
      .eq('farm_id', farmId)
      .not('status', 'in', '(completed,abandoned)')
      .order('planting_date', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []).map(toCrop);
  });
}

/** Jobs still to do on these crops, earliest first (overdue ones included). */
export function loadJobs(farmId: string, crops: Crop[]): Promise<Job[]> {
  return cached(`cn.jobs.${farmId}`, async () => {
    if (!crops.length) return [];
    const byId = new Map(crops.map((c) => [c.id, c]));
    const { data, error } = await supabase
      .from('crop_cycle_operations')
      .select('id, crop_cycle_id, name, stage, operation_type, scheduled_date, notes, required_machinery, status')
      .in('crop_cycle_id', crops.map((c) => c.id))
      .in('status', ['pending', 'in_progress'])
      .order('scheduled_date')
      .limit(60);
    if (error) throw error;
    return (data ?? []).map((o) => ({
      id: o.id,
      cropCycleId: o.crop_cycle_id,
      cropName: byId.get(o.crop_cycle_id)?.cropName ?? '',
      cropLocal: byId.get(o.crop_cycle_id)?.cropLocal ?? null,
      areaHa: byId.get(o.crop_cycle_id)?.areaHa ?? 0,
      name: o.name,
      stage: o.stage,
      type: o.operation_type,
      date: o.scheduled_date,
      notes: o.notes,
      machinery: o.required_machinery,
      status: o.status,
    }));
  });
}

export async function markJobDone(jobId: string): Promise<boolean> {
  const { error } = await supabase.from('crop_cycle_operations').update({ status: 'completed', completed_date: today() }).eq('id', jobId);
  if (error && !isNetwork(error)) reportError('mobile_job_done_failed', error, { reason: error.code ?? 'unknown' });
  return !error;
}

export async function moveJob(jobId: string, date: string): Promise<boolean> {
  const { error } = await supabase.from('crop_cycle_operations').update({ scheduled_date: date }).eq('id', jobId);
  return !error;
}

export type NewCrop = { farmId: string; cropId: string; plantingDate: string; areaHa: number; userId: string };

/**
 * Adds a crop and its job plan in one go, using the same catalogue as the website's crop planner.
 * For a crop already in the ground, jobs older than two weeks are left out.
 */
export async function addCrop(c: NewCrop): Promise<{ id: string; jobs: number } | { error: 'offline' | 'errorGeneric' }> {
  const plan = suggestCropPlan(c.cropId, c.plantingDate);
  const day = today();
  const { data: std } = await supabase.from('farm_agronomic_standards').select('id').eq('crop_or_livestock_id', plan.cropId).eq('is_active', true).limit(1).maybeSingle();
  const { data: cycle, error } = await supabase
    .from('crop_cycles')
    .insert({
      farm_id: c.farmId,
      standard_id: std?.id ?? null,
      crop_id: plan.cropId,
      variety_id: plan.varietyId,
      season: `${new Date().getFullYear()} season`,
      status: c.plantingDate > day ? 'planning' : 'planting',
      target_area_ha: c.areaHa,
      planting_date: c.plantingDate,
      expected_harvest_date: plan.harvestOn,
      target_yield_kg: plan.targetYieldKgPerHa ? Math.round(plan.targetYieldKgPerHa * c.areaHa) : undefined,
      created_by: c.userId,
    })
    .select('id')
    .single();
  if (error || !cycle) {
    if (isNetwork(error)) return { error: 'offline' };
    reportError('mobile_add_crop_failed', error, { reason: error?.code ?? 'unknown' });
    return { error: 'errorGeneric' };
  }
  const notBefore = addDays(day, -14);
  const ops = plan.operations
    .filter((o) => o.endsOn >= notBefore)
    .map((o) => ({
      crop_cycle_id: cycle.id,
      name: o.name.slice(0, 120),
      stage: o.stage.slice(0, 60) || 'General',
      operation_type: o.operationType,
      scheduled_date: o.startsOn,
      required_machinery: o.machinery,
      notes: o.description ? o.description.slice(0, 500) : null,
      status: 'pending',
    }));
  if (ops.length) {
    const { error: opErr } = await supabase.from('crop_cycle_operations').insert(ops);
    if (opErr) reportError('mobile_add_crop_jobs_failed', opErr, { reason: opErr.code ?? 'unknown' });
  }
  return { id: cycle.id, jobs: ops.length };
}
