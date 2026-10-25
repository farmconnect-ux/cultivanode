import type { AppRole, ProviderType } from '@cultivanode/shared';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: 'en' | 'yo' | 'pcm';
  verification_tier: number;
  account_type: 'individual' | 'business';
  onboarded_at: string | null;
  state: string | null;
  lga: string | null;
};

export type Account = {
  profile: Profile;
  roles: { role: AppRole; provider_type: ProviderType | null }[];
  pending: { role: AppRole; provider_type: ProviderType | null }[];
};

export type RoleOption = { role: AppRole; auto_approve: boolean };

/** The signed-in person's profile, roles and pending role requests. Row-level security limits it to them. */
export async function loadAccount(userId: string): Promise<Account | null> {
  try {
    const [profile, roles, requests] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, phone, preferred_language, verification_tier, account_type, onboarded_at, state, lga')
        .eq('id', userId)
        .maybeSingle(),
      supabase.from('user_roles').select('role, provider_type').eq('profile_id', userId),
      supabase.from('role_requests').select('role, provider_type').eq('profile_id', userId).eq('status', 'pending'),
    ]);
    if (profile.error || roles.error || requests.error) throw new Error('account_load_failed');
    if (!profile.data) return null;

    const account: Account = { profile: profile.data as Profile, roles: roles.data ?? [], pending: requests.data ?? [] };
    await AsyncStorage.setItem(`cache_account_${userId}`, JSON.stringify(account));
    return account;
  } catch (err) {
    const cached = await AsyncStorage.getItem(`cache_account_${userId}`);
    if (cached) return JSON.parse(cached);
    throw err;
  }
}

/** Roles open for sign-up, auto-approved ones first (same list the website shows). */
export async function loadRoleOptions(): Promise<RoleOption[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('role, auto_approve')
    .eq('available', true)
    .order('auto_approve', { ascending: false });
  if (error) throw new Error('roles_load_failed');
  return data ?? [];
}
