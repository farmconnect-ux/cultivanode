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

export interface MobileInventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'ok' | 'low';
}

export interface MobileTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amountKobo: number;
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

/**
 * Loads farm inventory items.
 */
export async function loadInventory(farmId: string): Promise<MobileInventoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('farm_inventory')
      .select('id, item_name, category, quantity, unit, reorder_threshold')
      .eq('farm_id', farmId)
      .order('item_name', { ascending: true });

    if (error || !data) throw error || new Error('No data');

    const result: MobileInventoryItem[] = data.map((item: any) => ({
      id: item.id,
      name: item.item_name,
      category: item.category,
      quantity: Number(item.quantity) || 0,
      unit: item.unit,
      status: (item.reorder_threshold !== null && Number(item.quantity) <= Number(item.reorder_threshold)) ? 'low' : 'ok',
    }));

    await AsyncStorage.setItem(`cache_inventory_${farmId}`, JSON.stringify(result));
    return result;
  } catch {
    const cached = await AsyncStorage.getItem(`cache_inventory_${farmId}`);
    if (cached) return JSON.parse(cached);
    return [];
  }
}

/**
 * Loads recent financial transactions.
 */
export async function loadTransactions(farmId: string): Promise<MobileTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('farm_financial_transactions')
      .select('id, transaction_date, type, category, description, amount_kobo')
      .eq('farm_id', farmId)
      .order('transaction_date', { ascending: false })
      .limit(50);

    if (error || !data) throw error || new Error('No data');

    const result: MobileTransaction[] = data.map((t: any) => ({
      id: t.id,
      date: t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : '',
      type: t.type === 'income' ? 'income' : 'expense',
      category: t.category,
      description: t.description || 'Unknown Transaction',
      amountKobo: Number(t.amount_kobo) || 0,
    }));

    await AsyncStorage.setItem(`cache_txs_${farmId}`, JSON.stringify(result));
    return result;
  } catch {
    const cached = await AsyncStorage.getItem(`cache_txs_${farmId}`);
    if (cached) return JSON.parse(cached);
    return [];
  }
}
