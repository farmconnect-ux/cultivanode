import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
 * The open farm (the one chosen on Home), for the farm-tool screens that only need its id and name.
 * Crops and jobs are loaded by lib/farm.ts; nothing here is invented when the farm has none.
 */
export async function loadFarmerWorkspaceData(userId: string): Promise<MobileFarmSummary | null> {
  try {
    const { data: farms, error } = await supabase.from('farms').select('id, name').eq('owner_id', userId).order('created_at');
    if (error || !farms || farms.length === 0) return null;
    const chosen = await AsyncStorage.getItem('cn.activeFarm').catch(() => null);
    const farm = farms.find((f) => f.id === chosen) ?? farms[0]!;
    const summary: MobileFarmSummary = { farmId: farm.id, farmName: farm.name, cropCyclesCount: 0, tasks: [] };
    await AsyncStorage.setItem(`cache_farm_summary_${userId}`, JSON.stringify(summary));
    return summary;
  } catch {
    const cached = await AsyncStorage.getItem(`cache_farm_summary_${userId}`);
    return cached ? (JSON.parse(cached) as MobileFarmSummary) : null;
  }
}

