import { Redirect, Tabs, useRouter } from 'expo-router';
import { colors } from '@cultivanode/shared';
import { View, ActivityIndicator } from 'react-native';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { isProviderRole } from '../../lib/account';
import { useSession } from '../../lib/session';
import { Button, Card, Header, Notice, Screen, Text } from '../../ui';
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
  const router = useRouter();
  const { session, account } = useSession();
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

  if (session === null) return <Redirect href="/(auth)/welcome" />;

  if (session === undefined || account === undefined || loading) {
  return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.leaf[600]} />
      </View>
    );
  }

  if (!isProviderRole(account)) {
    return (
      <Screen>
        <Header title="Provider Workspace" onBack={() => router.replace('/(tabs)/home')} backLabel="Home" />
        <Card>
          <Notice tone="warning">
            Provider tools are only available to approved machinery owners and service providers.
          </Notice>
          <Text muted>
            Request a Machinery Owner or Service Provider role and upload any required verification documents to unlock this workspace.
          </Text>
          <Button title="Manage roles & documents" onPress={() => router.push('/me/roles')} />
          <Button title="Back to Home" variant="secondary" onPress={() => router.replace('/(tabs)/home')} />
        </Card>
      </Screen>
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
