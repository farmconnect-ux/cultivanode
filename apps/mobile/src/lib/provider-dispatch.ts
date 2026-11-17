import { supabase, sessionStorage } from './supabase';
import type { GpsAccuracyReading } from './gps-tracker';

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'disputed'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'expired';

export interface ProviderJob {
  id: string;
  status: BookingStatus;
  title: string;
  kind: 'equipment' | 'service';
  equipmentType?: string | null;
  providerType?: string | null;
  jobDate: string; // YYYY-MM-DD
  unit: 'hour' | 'day' | 'hectare' | 'job';
  quantity: number;
  rateKobo: number;
  totalKobo: number;
  distanceKm: number;
  farmName: string;
  jobState?: string | null;
  jobLga?: string | null;
  farmerName: string;
  farmerPhone?: string | null;
  farmerNote?: string | null;
  checkedInAt?: string | null;
  checkInDistanceM?: number | null;
  workSubmittedAt?: string | null;
  hectaresDone?: number | null;
  proofsCount: number;
  createdAt: string;
  expiresAt: string;
}

export interface MachineryItem {
  id: string;
  title: string;
  category: string;
  pricingUnit: 'hour' | 'day' | 'hectare' | 'job';
  rateKobo: number;
  serviceRadiusKm: number;
  status: 'active' | 'paused' | 'draft';
  operatorIncluded: boolean;
  totalBookingsCompleted: number;
}

export interface ProviderAvailabilityCalendarDay {
  date: string; // YYYY-MM-DD
  isMaintenance: boolean;
  jobs: ProviderJob[];
}

export type DispatchFailureKind = 'unauthenticated' | 'forbidden' | 'network' | 'database' | 'invalid';

export type DispatchLoadResult<T> =
  | { ok: true; data: T[] }
  | { ok: false; kind: DispatchFailureKind; message: string };

export type DispatchSingleResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: DispatchFailureKind | 'not_found'; message: string };

const AVAILABILITY_STORAGE_KEY = 'cultivanode_provider_maintenance_dates';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidJobId(jobId: unknown): jobId is string {
  return typeof jobId === 'string' && UUID_RE.test(jobId.trim());
}

export function hasProviderAccess(
  roles: ReadonlyArray<{ role: string }> | null | undefined
): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => r.role === 'equipment_provider' || r.role === 'service_provider');
}

export function validateDeclineReason(reason: string): { valid: true; trimmed: string } | { valid: false; error: string } {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: 'Please enter a brief reason (at least 3 characters).' };
  }
  if (trimmed.length > 300) {
    return { valid: false, error: 'Reason must be 300 characters or fewer.' };
  }
  return { valid: true, trimmed };
}

export function classifyDispatchError(err: { code?: string; message?: string; status?: number } | null | undefined): {
  kind: DispatchFailureKind;
  message: string;
} {
  const code = err?.code ?? '';
  const msg = (err?.message ?? '').toLowerCase();
  const status = err?.status;

  if (status === 401 || code === 'PGRST301' || msg.includes('jwt') || msg.includes('not authenticated') || msg.includes('sign in')) {
    return { kind: 'unauthenticated', message: 'Your session expired. Please sign in again.' };
  }
  if (status === 403 || code === '42501' || msg.includes('permission denied') || msg.includes('not allowed') || msg.includes('policy')) {
    return { kind: 'forbidden', message: 'Your account does not have provider access to these records.' };
  }
  if (!code && (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('failed to fetch'))) {
    return { kind: 'network', message: 'Could not reach CultivaNode. Check your signal and try again.' };
  }
  if (!code && !msg) {
    return { kind: 'network', message: 'Could not reach CultivaNode. Check your signal and try again.' };
  }
  return { kind: 'database', message: err?.message || 'Could not load provider records. Please try again.' };
}

function mapProviderJobRow(row: Record<string, unknown>): ProviderJob {
  return {
    id: String(row.id),
    status: (row.status as BookingStatus) || 'requested',
    title: typeof row.title === 'string' && row.title ? row.title : 'Agricultural Machinery Service',
    kind: row.kind === 'service' ? 'service' : 'equipment',
    equipmentType: (row.equipment_type as string | null) ?? null,
    providerType: (row.provider_type as string | null) ?? null,
    jobDate: String(row.job_date ?? ''),
    unit: (row.unit as ProviderJob['unit']) || 'hectare',
    quantity: Number(row.quantity) || 1,
    rateKobo: Number(row.rate_kobo) || 0,
    totalKobo: Number(row.total_kobo) || 0,
    distanceKm: Number(row.distance_km) || 0,
    farmName: typeof row.farm_name === 'string' && row.farm_name ? row.farm_name : 'Farm Plot',
    jobState: (row.job_state as string | null) ?? null,
    jobLga: (row.job_lga as string | null) ?? null,
    farmerName: typeof row.other_name === 'string' && row.other_name ? row.other_name : 'Farmer Client',
    farmerPhone: (row.other_phone as string | null) ?? null,
    farmerNote: (row.notes as string | null) ?? null,
    checkedInAt: (row.checked_in_at as string | null) ?? null,
    checkInDistanceM: row.check_in_distance_m != null ? Number(row.check_in_distance_m) : null,
    workSubmittedAt: (row.work_submitted_at as string | null) ?? null,
    hectaresDone: row.hectares_done != null ? Number(row.hectares_done) : null,
    proofsCount: Number(row.proofs_count) || 0,
    createdAt: String(row.created_at ?? ''),
    expiresAt: String(row.expires_at ?? ''),
  };
}

/**
 * Loads live provider jobs from Supabase my_bookings() without demo fallbacks.
 */
export async function loadProviderJobs(): Promise<DispatchLoadResult<ProviderJob>> {
  try {
    const { data, error } = await supabase.rpc('my_bookings', { p_limit: 100 });
    if (error) {
      const classified = classifyDispatchError(error);
      return { ok: false, ...classified };
    }
    if (!Array.isArray(data)) {
      return { ok: false, kind: 'invalid', message: 'Received an unexpected booking response from the server.' };
    }
    const providerRows = (data as unknown[]).filter(
      (row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object' && (row as Record<string, unknown>).my_side === 'provider'
    );
    return { ok: true, data: providerRows.map(mapProviderJobRow) };
  } catch (err) {
    const classified = classifyDispatchError(err as { code?: string; message?: string; status?: number });
    return { ok: false, ...classified };
  }
}

/**
 * Loads a single provider job by UUID for direct navigation / deep-linking.
 */
export async function loadProviderJobById(jobId: string): Promise<DispatchSingleResult<ProviderJob>> {
  if (!isValidJobId(jobId)) {
    return { ok: false, kind: 'invalid', message: 'Invalid job reference.' };
  }
  const result = await loadProviderJobs();
  if (!result.ok) {
    return result;
  }
  const match = result.data.find((j) => j.id === jobId.trim());
  if (!match) {
    return { ok: false, kind: 'not_found', message: 'This job was not found on your provider account.' };
  }
  return { ok: true, data: match };
}

/**
 * Loads live provider equipment listings owned by the authenticated user without demo fallbacks.
 */
export async function loadMachineryFleet(userId?: string): Promise<DispatchLoadResult<MachineryItem>> {
  if (!userId) {
    return { ok: false, kind: 'unauthenticated', message: 'Please sign in to view your registered equipment.' };
  }
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, kind, equipment_type, provider_type, service_radius_km, status, operator_included, listing_rates(unit, rate_kobo)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      const classified = classifyDispatchError(error);
      return { ok: false, ...classified };
    }
    if (!Array.isArray(data)) {
      return { ok: false, kind: 'invalid', message: 'Received an unexpected equipment list from the server.' };
    }

    return {
      ok: true,
      data: data.map((item) => {
        const rates = Array.isArray(item.listing_rates) ? item.listing_rates : [];
        const firstRate = rates[0] as { unit?: string; rate_kobo?: number } | undefined;
        return {
          id: String(item.id),
          title: String(item.title),
          category: String(item.equipment_type || item.provider_type || item.kind || 'equipment'),
          pricingUnit: (firstRate?.unit as MachineryItem['pricingUnit']) || 'hectare',
          rateKobo: Number(firstRate?.rate_kobo) || 0,
          serviceRadiusKm: Number(item.service_radius_km) || 30,
          status: (item.status === 'active' || item.status === 'paused' ? item.status : 'draft') as MachineryItem['status'],
          operatorIncluded: item.operator_included ?? true,
          totalBookingsCompleted: 0,
        };
      }),
    };
  } catch (err) {
    const classified = classifyDispatchError(err as { code?: string; message?: string; status?: number });
    return { ok: false, ...classified };
  }
}

/**
 * Accept a requested booking
 */
export async function acceptJob(bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('accept_booking', { p_booking: bookingId });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || 'Network error' };
  }
}

/**
 * Decline a requested booking
 */
export async function declineJob(
  bookingId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const checked = validateDeclineReason(reason);
  if (!checked.valid) {
    return { success: false, error: checked.error };
  }
  try {
    const { error } = await supabase.rpc('decline_booking', {
      p_booking: bookingId,
      p_reason: checked.trimmed,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || 'Network error' };
  }
}

/**
 * Check-in at farm using device GPS
 */
export async function checkInJob(
  bookingId: string,
  coords: { lat: number; lng: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('check_in_booking', {
      p_booking: bookingId,
      p_lat: coords.lat,
      p_lng: coords.lng,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || 'Network error' };
  }
}

/**
 * Submit work proof photo with GPS and timestamp
 */
export async function submitWorkProofPhoto(
  bookingId: string,
  fileUri: string,
  kind: 'before' | 'after' | 'extra',
  gps: GpsAccuracyReading,
  hectares?: number
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const { data: userRes, error: authErr } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    if (authErr || !userId) {
      return { success: false, error: 'Please sign in again to upload work proof.' };
    }
    const filename = `${Date.now()}-${kind}.jpg`;
    const storagePath = `${bookingId}/${userId}/${filename}`;

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: 'image/jpeg',
    } as unknown as Blob);

    const { error: uploadError } = await supabase.storage
      .from('booking-proofs')
      .upload(storagePath, formData, { contentType: 'image/jpeg' });

    if (uploadError) {
      return { success: false, error: uploadError.message || 'Could not upload proof photo.' };
    }

    const { error: rpcError } = await supabase.rpc('submit_proof', {
      p_booking: bookingId,
      p_path: storagePath,
      p_kind: kind,
      p_taken_at: new Date(gps.timestamp).toISOString(),
      p_lat: gps.latitude,
      p_lng: gps.longitude,
      ...(hectares && hectares > 0 ? { p_hectares: Math.round(hectares * 100) / 100 } : {}),
    });

    if (rpcError) {
      return { success: false, error: rpcError.message };
    }

    return { success: true, path: storagePath };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || 'Error uploading proof' };
  }
}

/**
 * Mark job work completed
 */
export async function finishJobWork(
  bookingId: string,
  hectares: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('finish_booking_work', {
      p_booking: bookingId,
      p_hectares: Math.round(hectares * 100) / 100,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error)?.message || 'Network error' };
  }
}

/**
 * Load provider blackout/maintenance dates
 */
export async function loadProviderMaintenanceDates(): Promise<string[]> {
  try {
    const stored = await sessionStorage.getItem(AVAILABILITY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore storage read error
  }
  return [];
}

/**
 * Save provider blackout/maintenance dates
 */
export async function saveProviderMaintenanceDates(dates: string[]): Promise<void> {
  try {
    await sessionStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(dates));
  } catch {
    // ignore storage write error
  }
}
