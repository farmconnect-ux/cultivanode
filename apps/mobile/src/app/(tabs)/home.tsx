import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { HomeScreen } from '../../screens/HomeScreen';
import { loadAccount, type Account } from '../../lib/account';
import { loadFarmerWorkspaceData, type MobileFarmSummary } from '../../lib/data';
import { supabase, sessionStorage } from '../../lib/supabase';
import { OfflineSyncQueue } from '../../lib/offline-sync';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@cultivanode/shared';

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

export default function HomeRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Account | null>(null);
  const [farmData, setFarmData] = useState<MobileFarmSummary | null>(null);
  const [pendingSync, setPendingSync] = useState(0);

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;
    if (!userId) return;

    try {
      const [acc, fData, q] = await Promise.all([
        loadAccount(userId),
        loadFarmerWorkspaceData(userId),
        syncQueue.getQueue(),
      ]);
      setAccount(acc);
      setFarmData(fData);
      setPendingSync(q.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !account) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.leaf[600]} />
      </View>
    );
  }

  return (
    <HomeScreen
      account={account}
      justJoined={false}
      onSignedOut={() => supabase.auth.signOut()}
      farmData={farmData}
      pendingSyncCount={pendingSync}
      onNavigate={(dest, filter) => {
        if (dest === 'marketplace') {
          router.push('/(tabs)/marketplace');
        } else if (dest === 'operations') {
          router.push('/(tabs)/tasks');
        } else if (dest === 'boundary_walk') {
          router.push('/farms/boundary_walk');
        } else if (dest === 'scouting') {
          router.push('/operations/scouting');
        } else if (dest === 'buy_inputs') {
          router.push('/inventory');
        } else if (dest === 'farm_books') {
          router.push('/books');
        } else if (dest === 'provider_workspace') {
          router.push('/(provider)/inbox');
        } else if (dest === 'ai_assistant') {
          router.push('/assistant');
        }
      }}
    />
  );
}
