// Who is signed in, their account and farms, and which farm is open. Every screen reads this instead of
// loading the account itself, so switching farms or finishing set-up updates the whole app at once.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadAccount, type Account } from './account';
import { loadFarms, type Farm } from './farm';
import { supabase } from './supabase';

type State = {
  /** undefined while starting up. */
  session: Session | null | undefined;
  account: Account | null | undefined;
  farms: Farm[];
  farm: Farm | null;
  /** Failed to load the account (and nothing cached). */
  loadFailed: boolean;
  setFarm: (id: string) => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<State>({
  session: undefined,
  account: undefined,
  farms: [],
  farm: null,
  loadFailed: false,
  setFarm: () => undefined,
  refresh: async () => undefined,
});

const FARM_KEY = 'cn.activeFarm';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    AsyncStorage.getItem(FARM_KEY).then(setFarmId).catch(() => undefined);
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const refresh = useCallback(async () => {
    if (!userId) {
      setAccount(null);
      setFarms([]);
      return;
    }
    try {
      const [a, f] = await Promise.all([loadAccount(userId), loadFarms(userId).catch(() => [] as Farm[])]);
      setAccount(a);
      setFarms(f);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
      setAccount((prev) => prev ?? null);
    }
  }, [userId]);

  useEffect(() => {
    if (session === undefined) return;
    setAccount(undefined);
    refresh();
  }, [session, refresh]);

  const setFarm = useCallback((id: string) => {
    setFarmId(id);
    AsyncStorage.setItem(FARM_KEY, id).catch(() => undefined);
  }, []);

  const farm = farms.find((f) => f.id === farmId) ?? farms[0] ?? null;

  const value = useMemo(
    () => ({ session, account, farms, farm, loadFailed, setFarm, refresh }),
    [session, account, farms, farm, loadFailed, setFarm, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);

/** Roles that farm (crop or animal). Buyers and providers skip the farm set-up. */
export function isFarmer(account: Account | null | undefined): boolean {
  return Boolean(account?.roles.some((r) => r.role === 'crop_farmer' || r.role === 'animal_farmer'));
}

/** Where a signed-in person should be: finish set-up, add a farm, or the app. */
export function nextStep(account: Account | null | undefined, farms: Farm[]): 'setup' | 'farm' | 'app' {
  if (!account || !account.profile.onboarded_at) return 'setup';
  if (isFarmer(account) && farms.length === 0) return 'farm';
  return 'app';
}
