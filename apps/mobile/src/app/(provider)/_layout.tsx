import { Tabs, useRouter } from 'expo-router';
import { colors } from '@cultivanode/shared';
import { View, ActivityIndicator, type ColorValue } from 'react-native';
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { loadProviderJobs, loadMachineryFleet, loadProviderMaintenanceDates, type ProviderJob, type MachineryItem } from '../../lib/provider-dispatch';
import { supabase } from '../../lib/supabase';
import Feather from '@expo/vector-icons/Feather';

export const ProviderContext = createContext<{
  jobs: ProviderJob[];
  fleet: MachineryItem[];
  maintenanceDates: string[];
  setJobs: React.Dispatch<React.SetStateAction<ProviderJob[]>>;
  setMaintenanceDates: React.Dispatch<React.SetStateAction<string[]>>;
  refresh: () => Promise<void>;
} | null>(null);

export function useProvider() {
  const ctx = useContext(ProviderContext);
  if (!ctx) throw new Error('useProvider must be used within ProviderContext');
  return ctx;
}

export default function ProviderTabsLayout() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<ProviderJob[]>([]);
  const [fleet, setFleet] = useState<MachineryItem[]>([]);
  const [maintenanceDates, setMaintenanceDates] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;
    if (!userId) return;

    setLoading(true);
    try {
      const [jobsData, fleetData, maintData] = await Promise.all([
        loadProviderJobs(),
        loadMachineryFleet(userId),
        loadProviderMaintenanceDates(),
      ]);
      setJobs(jobsData);
      setFleet(fleetData);
      setMaintenanceDates(maintData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.leaf[600]} />
      </View>
    );
  }

  return (
    <ProviderContext.Provider value={{ jobs, fleet, maintenanceDates, setJobs, setMaintenanceDates, refresh: loadData }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.leaf[600],
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            borderTopColor: colors.line,
            backgroundColor: colors.white,
          },
        }}
      >
        <Tabs.Screen
          name="inbox"
          options={{
            title: 'Inbox',
            tabBarIcon: ({ color }) => <Feather name="inbox" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Availability',
            tabBarIcon: ({ color }) => <Feather name="calendar" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="fleet"
          options={{
            title: 'Fleet',
            tabBarIcon: ({ color }) => <Feather name="truck" size={24} color={color} />,
          }}
        />
      </Tabs>
    </ProviderContext.Provider>
  );
}
