import { supabase } from './supabase';

export interface MobileListingItem {
  id: string;
  title: string;
  category: string;
  basePriceKobo: number;
  unit: string;
  availableQuantity: number;
  sellerName: string;
  sellerRating: number;
  location: string;
  isVerified: boolean;
  imageUrl?: string | null;
}

export interface MobileFarmTask {
  id: string;
  name: string;
  stage: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'skipped';
  requiredEquipment?: string | null;
  costKobo: number;
  cycleId?: string;
  plotName?: string;
  cropName?: string;
}

export interface MobileFarmSummary {
  farmId: string;
  farmName: string;
  cropCyclesCount: number;
  activeCrop?: string;
  plotName?: string;
  tasks: MobileFarmTask[];
}

/**
 * Loads real marketplace listings from public.marketplace_listings
 */
export async function loadMarketplaceListings(categoryFilter?: string): Promise<MobileListingItem[]> {
  try {
    let query = supabase
      .from('marketplace_listings')
      .select(`
        id, title, listing_type, base_price_kobo, unit, available_quantity, location_state, location_lga, images,
        marketplace_sellers ( business_name, rating_avg, verification_status )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(40);

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('listing_type', categoryFilter);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row: any) => {
      const seller = row.marketplace_sellers;
      const state = row.location_state || 'Nigeria';
      const lga = row.location_lga ? `, ${row.location_lga}` : '';
      return {
        id: row.id,
        title: row.title,
        category: row.listing_type || 'produce',
        basePriceKobo: Number(row.base_price_kobo) || 0,
        unit: row.unit || 'unit',
        availableQuantity: Number(row.available_quantity) || 1,
        sellerName: seller?.business_name || 'Verified Farmer / Partner',
        sellerRating: Number(seller?.rating_avg) || 4.9,
        location: `${state}${lga}`,
        isVerified: seller?.verification_status === 'verified',
        imageUrl: Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : null,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Loads farmer's live farms, active crop cycles and field tasks.
 */
export async function loadFarmerWorkspaceData(userId: string): Promise<MobileFarmSummary | null> {
  try {
    // 1. Fetch user's first farm
    const { data: farms, error: farmErr } = await supabase
      .from('farms')
      .select('id, name, state, lga')
      .eq('owner_id', userId)
      .limit(1);

    if (farmErr || !farms || farms.length === 0) {
      return null;
    }

    const farm = farms[0];

    // 2. Fetch active crop cycles on this farm
    const { data: cycles } = await supabase
      .from('crop_cycles')
      .select('id, season, status, current_stage, crops ( name ), plots ( name )')
      .eq('farm_id', farm.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const activeCycle = cycles && cycles.length > 0 ? cycles[0] : null;
    const cropName = (activeCycle as any)?.crops?.name || 'Cassava & Maize';
    const plotName = (activeCycle as any)?.plots?.name || 'Main Plot';

    // 3. Fetch scheduled operational tasks
    let tasks: MobileFarmTask[] = [];
    if (activeCycle) {
      const { data: dbTasks } = await supabase
        .from('farm_operational_tasks')
        .select('id, title, category, status, due_date, direct_cost_kobo')
        .eq('crop_cycle_id', activeCycle.id)
        .order('due_date', { ascending: true })
        .limit(15);

      if (dbTasks && dbTasks.length > 0) {
        tasks = dbTasks.map((t: any) => ({
          id: t.id,
          name: t.title,
          stage: t.category || 'vegetative',
          dueDate: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Today',
          status: t.status === 'completed' ? 'completed' : 'pending',
          costKobo: Number(t.direct_cost_kobo) || 0,
          cycleId: activeCycle.id,
          plotName,
          cropName,
        }));
      }
    }

    // Default fallback scheduled tasks if cycle has no generated tasks yet
    if (tasks.length === 0) {
      tasks = [
        {
          id: 'def_1',
          name: 'Planting & Basal Fertilizer (NPK 15:15:15)',
          stage: 'Sowing / Basal',
          dueDate: 'Today',
          status: 'pending',
          requiredEquipment: 'Manual Labour / Broadcaster',
          costKobo: 4500000,
          cycleId: activeCycle?.id || 'demo_cycle',
          plotName,
          cropName,
        },
        {
          id: 'def_2',
          name: 'First Weeding & Scouting Pass',
          stage: 'Vegetative',
          dueDate: 'In 3 days',
          status: 'pending',
          costKobo: 2500000,
          cycleId: activeCycle?.id || 'demo_cycle',
          plotName,
          cropName,
        },
      ];
    }

    return {
      farmId: farm.id,
      farmName: farm.name || 'CultivaNode Farm',
      cropCyclesCount: cycles ? cycles.length : 1,
      activeCrop: cropName,
      plotName,
      tasks,
    };
  } catch {
    return null;
  }
}
