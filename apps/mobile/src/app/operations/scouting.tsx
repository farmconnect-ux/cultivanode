import { useRouter } from 'expo-router';
import { CropScoutingScreen } from '../../screens/CropScoutingScreen';
import { OfflineSyncQueue } from '../../lib/offline-sync';
import { sessionStorage } from '../../lib/supabase';

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

export default function ScoutingRoute() {
  const router = useRouter();

  return (
    <CropScoutingScreen
      cycleId="crop_cycle_live"
      cropName="Cassava & Maize"
      plotName="Main Plot"
      syncQueue={syncQueue}
      onBack={() => router.back()}
    />
  );
}
