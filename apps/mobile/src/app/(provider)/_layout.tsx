import { Tabs } from 'expo-router';
import { colors } from '@cultivanode/shared';
import { View, ActivityIndicator } from 'react-native';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  loadProviderJobs,
  loadMachineryFleet,
  loadProviderMaintenanceDates,
  type DispatchFailureKind,
  type ProviderJob,
  type MachineryItem,
} from '../../lib/provider-dispatch';
import { supabase } from '../../lib/supabase';
import Feather from '@expo/vector-icons/Feather';

export type DispatchErrorState = {
  kind: DispatchFailureKind;
  message: string;
} | null;

export const ProviderContext = createContext<{
  jobs: ProviderJob[];
  fleet: MachineryItem[];
  maintenanceDates: string[];
  jobsError: DispatchErrorState;
  fleetError: DispatchErrorState;
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
  const [jobsError, setJobsError] = useState<DispatchErrorState>(null);
  const [fleetError, setFleetError] = useState<DispatchErrorState>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (sessErr || !userId) {
        const authErr: DispatchErrorState = {
          kind: 'unauthenticated',
          message: 'Please sign in to view your provider workspace.',
        };
        setJobs([]);
        setFleet([]);
        setJobsError(authErr);
        setFleetError(authErr);
        return;
      }

      const [jobsRes, fleetRes, maintData] = await Promise.all([
        loadProviderJobs(),
        loadMachineryFleet(userId),
        loadProviderMaintenanceDates(),
      ]);

      if (jobsRes.ok) {
        setJobs(jobsRes.data);
        setJobsError(null);
      } else {
        setJobs([]);
        setJobsError({ kind: jobsRes.kind, message: jobsRes.message });
      }

      if (fleetRes.ok) {
        setFleet(fleetRes.data);
        setFleetError(null);
      } else {
        setFleet([]);
        setFleetError({ kind: fleetRes.kind, message: fleetRes.message });
      }

      setMaintenanceDates(maintData);
    } catch {
      const fallbackErr: DispatchErrorState = {
        kind: 'network',
        message: 'Could not load provider workspace. Check your signal and try again.',
      };
      setJobsError(fallbackErr);
      setFleetError(fallbackErr);
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
    <ProviderContext.Provider
      value={{
        jobs,
        fleet,
        maintenanceDates,
        jobsError,
        fleetError,
        setJobs,
        setMaintenanceDates,
        refresh: loadData,
      }}
    >
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
