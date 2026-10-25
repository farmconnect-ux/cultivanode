// Admin feature switches (Admin → Feature switches on the website). The app hides a module while its
// switch is off. A switch that can't be read counts as off; the last known values are kept for offline use.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Flags = Record<string, boolean>;
const KEY = 'cn.flags';

export async function loadFlags(): Promise<Flags> {
  try {
    const { data, error } = await (supabase as unknown as SupabaseClient).from('feature_flags').select('key, enabled');
    if (error) throw error;
    const flags: Flags = {};
    for (const r of (data ?? []) as { key: string; enabled: boolean }[]) flags[r.key] = r.enabled === true;
    AsyncStorage.setItem(KEY, JSON.stringify(flags)).catch(() => undefined);
    return flags;
  } catch {
    return JSON.parse((await AsyncStorage.getItem(KEY).catch(() => null)) ?? '{}') as Flags;
  }
}

export function useFlags(): Flags {
  const [flags, setFlags] = useState<Flags>({});
  useEffect(() => {
    loadFlags().then(setFlags);
  }, []);
  return flags;
}
