import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { CropOperationsScreen } from '../../screens/CropOperationsScreen';
import { loadFarmerWorkspaceData, type MobileFarmSummary } from '../../lib/data';
import { supabase, sessionStorage } from '../../lib/supabase';
import { OfflineSyncQueue } from '../../lib/offline-sync';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@cultivanode/shared';

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

export default function TasksRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farmData, setFarmData] = useState<MobileFarmSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (userId) {
        const fData = await loadFarmerWorkspaceData(userId);
        setFarmData(fData);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !farmData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.leaf[600]} />
      </View>
    );
  }

  return (
    <CropOperationsScreen
      cycleId={farmData?.tasks[0]?.cycleId || 'crop_cycle_live'}
      cropName={farmData?.activeCrop || 'Crop Cycle'}
      plotName={farmData?.plotName || 'Primary Plot'}
      tasks={farmData?.tasks || []}
      syncQueue={syncQueue}
      onBack={() => router.back()}
    />
  );
}
