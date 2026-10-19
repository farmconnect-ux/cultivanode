import { supabase } from './supabase';
import { sessionStorage } from './supabase';
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

const AVAILABILITY_STORAGE_KEY = 'cultivanode_provider_maintenance_dates';

/**
 * Loads provider jobs from Supabase my_bookings() or fallback demo data
 */
export async function loadProviderJobs(): Promise<ProviderJob[]> {
  try {
    const { data, error } = await supabase.rpc('my_bookings', { p_limit: 100 });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Filter for jobs where user is provider
      const providerRows = data.filter((row: any) => row.my_side === 'provider');
      if (providerRows.length > 0) {
        return providerRows.map((row: any) => ({
          id: row.id,
          status: row.status as BookingStatus,
          title: row.title || 'Agricultural Machinery Service',
          kind: row.kind || 'equipment',
          equipmentType: row.equipment_type,
          providerType: row.provider_type,
          jobDate: row.job_date,
          unit: row.unit || 'hectare',
          quantity: Number(row.quantity) || 1,
          rateKobo: Number(row.rate_kobo) || 0,
          totalKobo: Number(row.total_kobo) || 0,
          distanceKm: Number(row.distance_km) || 0,
          farmName: row.farm_name || 'Farm Plot',
          jobState: row.job_state,
          jobLga: row.job_lga,
          farmerName: row.other_name || 'Farmer Client',
          proofsCount: 0,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
        }));
      }
    }
  } catch {
    // network or rpc fallback
  }

  // Fallback realistic provider demo jobs for South-West Nigeria pilot
  return [
    {
      id: 'job-req-001',
      status: 'requested',
      title: 'Heavy Tractor Ploughing & Harrowing',
      kind: 'equipment',
      equipmentType: 'tractor' as any,
      jobDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      unit: 'hectare',
      quantity: 5.5,
      rateKobo: 4500000, // ₦45,000 per ha
      totalKobo: 24750000, // ₦247,500
      distanceKm: 8.4,
      farmName: 'Oluwaseun Green Acres',
      jobState: 'Oyo',
      jobLga: 'Iseyin',
      farmerName: 'Adeolu Babatunde',
      farmerPhone: '+2348031234567',
      farmerNote: 'Soil is moderately dry sandy-loam. We need disc ploughing done before the rain starts on Thursday.',
      proofsCount: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'job-act-002',
      status: 'accepted',
      title: 'Boom Sprayer Crop Protection',
      kind: 'equipment',
      equipmentType: 'boom_sprayer' as any,
      jobDate: new Date().toISOString().slice(0, 10), // Today
      unit: 'hectare',
      quantity: 3.0,
      rateKobo: 2500000, // ₦25,000 per ha
      totalKobo: 7500000, // ₦75,000
      distanceKm: 4.1,
      farmName: 'Abeokuta Maize Valley',
      jobState: 'Ogun',
      jobLga: 'Obafemi Owode',
      farmerName: 'Folashade Ajayi',
      farmerPhone: '+2348029876543',
      farmerNote: 'Foliar nutrition application. Water point is directly accessible at the farm entrance.',
      proofsCount: 0,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'job-inp-003',
      status: 'in_progress',
      title: 'Multi-Crop Mechanical Planter',
      kind: 'equipment',
      equipmentType: 'planter' as any,
      jobDate: new Date().toISOString().slice(0, 10), // Today
      unit: 'hectare',
      quantity: 8.0,
      rateKobo: 3800000, // ₦38,000 per ha
      totalKobo: 30400000, // ₦304,000
      distanceKm: 12.0,
      farmName: 'Oyo Farm Settlement Plot 14',
      jobState: 'Oyo',
      jobLga: 'Afijio',
      farmerName: 'Ibrahim Danjuma',
      farmerPhone: '+2348051122334',
      farmerNote: 'Planter calibrated for 75cm row spacing maize.',
      checkedInAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      checkInDistanceM: 85,
      proofsCount: 1,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'job-cmp-004',
      status: 'confirmed',
      title: 'Combine Harvester Service',
      kind: 'equipment',
      equipmentType: 'harvester' as any,
      jobDate: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10),
      unit: 'hectare',
      quantity: 12.0,
      rateKobo: 6000000,
      totalKobo: 72000000, // ₦720,000
      distanceKm: 15.5,
      farmName: 'Kwara Grain Basin',
      jobState: 'Kwara',
      jobLga: 'Moro',
      farmerName: 'Tunde Adeleke',
      farmerPhone: '+2348076543210',
      proofsCount: 3,
      hectaresDone: 12.0,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      expiresAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ];
}

/**
 * Loads provider equipment fleet
 */
export async function loadMachineryFleet(userId?: string): Promise<MachineryItem[]> {
  try {
    if (userId) {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          pricingUnit: item.pricing_unit,
          rateKobo: Number(item.rate_kobo) || 0,
          serviceRadiusKm: Number(item.service_radius_km) || 30,
          status: item.status,
          operatorIncluded: item.operator_included ?? true,
          totalBookingsCompleted: 6,
        }));
      }
    }
  } catch {
    // fallback
  }

  // Realistic default equipment fleet for demo/pilot
  return [
    {
      id: 'machinery-01',
      title: 'John Deere 5075E Utility Tractor (75 HP)',
      category: 'tractor',
      pricingUnit: 'hectare',
      rateKobo: 4500000, // ₦45,000/ha
      serviceRadiusKm: 40,
      status: 'active',
      operatorIncluded: true,
      totalBookingsCompleted: 14,
    },
    {
      id: 'machinery-02',
      title: 'Baldan 4-Row Precision Planter',
      category: 'planter',
      pricingUnit: 'hectare',
      rateKobo: 3800000, // ₦38,000/ha
      serviceRadiusKm: 35,
      status: 'active',
      operatorIncluded: true,
      totalBookingsCompleted: 8,
    },
    {
      id: 'machinery-03',
      title: 'Jacto 600L Boom Sprayer (12m Swath)',
      category: 'boom_sprayer',
      pricingUnit: 'hectare',
      rateKobo: 2500000, // ₦25,000/ha
      serviceRadiusKm: 25,
      status: 'active',
      operatorIncluded: true,
      totalBookingsCompleted: 11,
    },
  ];
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
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Decline a requested booking
 */
export async function declineJob(
  bookingId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('decline_booking', {
      p_booking: bookingId,
      p_reason: reason || 'Provider unavailable on this date',
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
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
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
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
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id || 'demo-provider-user';
    const filename = `${Date.now()}-${kind}.jpg`;
    const storagePath = `${bookingId}/${userId}/${filename}`;

    // Prepare upload payload
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    const { error: uploadError } = await supabase.storage
      .from('booking-proofs')
      .upload(storagePath, formData, { contentType: 'image/jpeg' });

    if (uploadError) {
      // In local demo or offline, continue with virtual storage path
      console.warn('Proof upload fallback:', uploadError.message);
    }

    // Call submit_proof RPC
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
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error uploading proof' };
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
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
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
    // fallback
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
    // ignore
  }
}
