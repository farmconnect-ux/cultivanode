// Hiring tractors and farm hands. The database does the real work (prices, distance, who may do what);
// these helpers shape input and turn its stable error codes (the HINT) into dictionary keys.
// No money moves through CultivaNode yet: the farmer pays the owner directly and both sides mark it paid.
import type { Database } from '@cultivanode/shared';
import { reportError } from './monitoring';
import { supabase } from './supabase';

type E = Database['public']['Enums'];
export type Unit = E['pricing_unit'];
export type EquipmentType = E['equipment_type'];
export type ProviderType = E['provider_type'];

export type HireMode = 'tractor' | 'hands';

/** What the farmer can ask for, and how each maps to listings. */
export const JOBS: Record<HireMode, { key: string; kind: E['listing_kind']; equipment?: EquipmentType; provider?: ProviderType; unit: Unit }[]> = {
  tractor: [
    { key: 'plough', kind: 'equipment', equipment: 'tractor', unit: 'hectare' },
    { key: 'harrow', kind: 'equipment', equipment: 'harrow', unit: 'hectare' },
    { key: 'ridge', kind: 'equipment', equipment: 'ridger', unit: 'hectare' },
    { key: 'plant', kind: 'equipment', equipment: 'planter', unit: 'hectare' },
    { key: 'spray', kind: 'equipment', equipment: 'sprayer', unit: 'hectare' },
    { key: 'harvest', kind: 'equipment', equipment: 'harvester', unit: 'hectare' },
    { key: 'haul', kind: 'equipment', equipment: 'transport_equipment', unit: 'job' },
  ],
  hands: [
    { key: 'farmHand', kind: 'service', provider: 'farm_hand', unit: 'day' },
    { key: 'sprayService', kind: 'service', provider: 'spraying_service', unit: 'hectare' },
    { key: 'operator', kind: 'service', provider: 'machine_operator', unit: 'day' },
    { key: 'agronomist', kind: 'service', provider: 'agronomist', unit: 'job' },
    { key: 'vet', kind: 'service', provider: 'vet', unit: 'job' },
    { key: 'mechanic', kind: 'service', provider: 'mechanic', unit: 'job' },
  ],
};

export type Offer = {
  listingId: string;
  title: string;
  description: string | null;
  distanceKm: number;
  operatorIncluded: boolean;
  rates: Partial<Record<Unit, number>>;
  provider: { name: string; state: string | null; tier: number; rating: { avg: number; count: number } | null };
};

type NearbyRow = {
  listing_id: string;
  title: string;
  description: string | null;
  distance_km: number;
  operator_included: boolean;
  rates: Partial<Record<Unit, number>> | null;
  provider: { name?: string; state?: string | null; tier?: number; rating?: { avg: number; count: number } | null } | null;
};

/** Listings that serve this farm, nearest first. Widens the search once when nothing is close. */
export async function findOffers(farmId: string, job: (typeof JOBS)[HireMode][number]): Promise<{ offers: Offer[]; radiusKm: number } | { error: 'offline' | 'errorGeneric' }> {
  for (const radius of [30, 80]) {
    const { data, error } = await supabase.rpc('nearby_listings_for_farm', {
      p_farm: farmId,
      p_radius_km: radius,
      p_kind: job.kind,
      p_equipment_type: job.equipment,
      p_provider_type: job.provider,
      p_limit: 30,
    });
    if (error) {
      if (!error.code && /network|fetch/i.test(error.message)) return { error: 'offline' };
      reportError('mobile_find_offers_failed', error, { reason: error.code ?? 'unknown' });
      return { error: 'errorGeneric' };
    }
    const offers = ((data ?? []) as unknown as NearbyRow[]).map((r) => ({
      listingId: r.listing_id,
      title: r.title,
      description: r.description,
      distanceKm: Number(r.distance_km),
      operatorIncluded: r.operator_included,
      rates: r.rates ?? {},
      provider: { name: r.provider?.name ?? '', state: r.provider?.state ?? null, tier: r.provider?.tier ?? 0, rating: r.provider?.rating ?? null },
    }));
    if (offers.length || radius === 80) return { offers, radiusKm: radius };
  }
  return { offers: [], radiusKm: 80 };
}

/** The unit to price in: the job's usual unit when the owner offers it, otherwise their first price. */
export function priceFor(offer: Offer, preferred: Unit): { unit: Unit; kobo: number } | null {
  if (offer.rates[preferred] != null) return { unit: preferred, kobo: Number(offer.rates[preferred]) };
  const first = (Object.entries(offer.rates) as [Unit, number][])[0];
  return first ? { unit: first[0], kobo: Number(first[1]) } : null;
}

export type BookingError =
  | 'tier_needed'
  | 'farmer_role_needed'
  | 'marketplace_closed'
  | 'listing_unavailable'
  | 'own_listing'
  | 'bad_unit'
  | 'bad_quantity'
  | 'bad_date'
  | 'out_of_range'
  | 'too_many_requests'
  | 'duplicate_request'
  | 'wrong_status'
  | 'too_late'
  | 'reason_needed'
  | 'bad_amount'
  | 'bad_rating'
  | 'already_rated'
  | 'not_allowed'
  | 'offline'
  | 'errorGeneric';

const KNOWN = new Set<string>([
  'tier_needed', 'farmer_role_needed', 'marketplace_closed', 'listing_unavailable', 'own_listing', 'bad_unit', 'bad_quantity',
  'bad_date', 'out_of_range', 'too_many_requests', 'duplicate_request', 'wrong_status', 'too_late', 'reason_needed', 'bad_amount',
  'bad_rating', 'already_rated', 'not_allowed',
]);

function codeOf(error: { hint?: string | null; code?: string; message?: string } | null, op: string): BookingError {
  if (!error) return 'errorGeneric';
  if (!error.code && /network|fetch/i.test(error.message ?? '')) return 'offline';
  if (error.hint && KNOWN.has(error.hint)) return error.hint as BookingError;
  reportError('mobile_booking_failed', error, { op, reason: error.code ?? 'unknown' });
  return 'errorGeneric';
}

export async function requestBooking(b: { listingId: string; farmId: string; date: string; unit: Unit; quantity: number; note: string }): Promise<{ id: string } | { error: BookingError }> {
  const { data, error } = await supabase.rpc('request_booking', {
    p_listing: b.listingId,
    p_farm: b.farmId,
    p_job_date: b.date,
    p_unit: b.unit,
    p_quantity: Math.round(b.quantity * 100) / 100,
    p_note: b.note.trim().slice(0, 500) || undefined,
  });
  if (error || !data) return { error: codeOf(error, 'request') };
  return { id: data };
}

export type BookingSummary = {
  id: string;
  my_side: 'farmer' | 'provider';
  status: E['booking_status'];
  title: string;
  kind: E['listing_kind'];
  job_date: string;
  unit: Unit;
  quantity: number;
  total_kobo: number;
  farm_name: string;
  other_name: string;
  created_at: string;
};

export async function myBookings(): Promise<BookingSummary[]> {
  const { data, error } = await supabase.rpc('my_bookings', { p_limit: 50 });
  if (error) throw error;
  return (data ?? []) as unknown as BookingSummary[];
}

export type BookingDetail = BookingSummary & {
  rate_kobo: number;
  distance_km: number;
  farmer_note: string | null;
  expires_at: string;
  closed_reason: string | null;
  confirm_by: string | null;
  hectares_done: number | null;
  other: { name: string; phone: string | null; tier: number } | null;
  payment: { mine: { at: string; kobo: number } | null; theirs_marked: boolean | null; disputed: boolean | null };
  my_rating: { stars: number } | null;
  can: { accept: boolean; decline: boolean; cancel: boolean; confirm: boolean; dispute: boolean; mark_paid: boolean; rate: boolean };
};

export async function bookingDetail(id: string): Promise<BookingDetail> {
  const { data, error } = await supabase.rpc('booking_detail', { p_booking: id });
  if (error || !data) throw error ?? new Error('not_found');
  return data as unknown as BookingDetail;
}

export async function cancelBooking(id: string, reason: string): Promise<BookingError | null> {
  const { error } = await supabase.rpc('cancel_booking', { p_booking: id, p_reason: reason.trim() || undefined });
  return error ? codeOf(error, 'cancel') : null;
}

export async function confirmWork(id: string): Promise<BookingError | null> {
  const { error } = await supabase.rpc('confirm_booking', { p_booking: id });
  return error ? codeOf(error, 'confirm') : null;
}

export async function markPaid(id: string, naira: number): Promise<BookingError | null> {
  if (!Number.isFinite(naira) || naira <= 0) return 'bad_amount';
  const { error } = await supabase.rpc('mark_paid', { p_booking: id, p_amount_kobo: Math.round(naira * 100) });
  return error ? codeOf(error, 'mark_paid') : null;
}

export const RATING_TAGS = ['on_time', 'good_work', 'careful', 'fair_price', 'good_communication', 'late', 'poor_work', 'overcharged', 'rude', 'no_show'] as const;

export async function rateBooking(id: string, stars: number, tags: string[], comment: string): Promise<BookingError | null> {
  const { error } = await supabase.rpc('rate_booking', { p_booking: id, p_stars: stars, p_tags: tags, p_comment: comment.trim() || undefined });
  return error ? codeOf(error, 'rate') : null;
}

// --- NIN (tier 1 unlocks booking) ------------------------------------------------------------------------

export type NinError = 'invalid_number' | 'consent_required' | 'name_required' | 'too_many_attempts' | 'already_verified' | 'service_not_ready' | 'not_found' | 'offline' | 'generic';

export async function myTier(): Promise<number> {
  const { data } = await supabase.rpc('my_verification_tier');
  return Number(data ?? 0);
}

/** Records the identity-check consent (asked right where it is needed), then checks the NIN. */
export async function verifyNin(nin: string, consentGiven: boolean, documentVersion: string): Promise<{ ok: true } | { error: NinError }> {
  const number = nin.replace(/\s+/g, '');
  if (!/^[0-9]{11}$/.test(number)) return { error: 'invalid_number' };
  if (consentGiven) {
    await supabase.from('consents').insert({ consent_type: 'data_processing', granted: true, document_version: documentVersion, channel: 'mobile' });
  }
  const { data, error } = await supabase.functions.invoke('verify-identity', { body: { action: 'nin', number } });
  if (error) {
    let code: string | undefined;
    try {
      const body = await (error as { context?: Response }).context?.json();
      code = body?.error;
    } catch {
      code = undefined;
    }
    if (!code && /network|fetch/i.test(error.message)) return { error: 'offline' };
    if (code === 'already_verified') return { ok: true };
    const known: NinError[] = ['invalid_number', 'consent_required', 'name_required', 'too_many_attempts', 'service_not_ready'];
    return { error: known.includes(code as NinError) ? (code as NinError) : 'generic' };
  }
  const res = data as { status?: string; failure_reason?: string | null };
  if (res?.status === 'verified') return { ok: true };
  return { error: 'not_found' };
}
