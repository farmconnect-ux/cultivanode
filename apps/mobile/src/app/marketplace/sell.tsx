import { useRouter } from 'expo-router';
import { MobileNewListingScreen } from '../../screens/MobileNewListingScreen';
import { OfflineSyncQueue } from '../../lib/offline-sync';
import { sessionStorage } from '../../lib/supabase';

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

export default function SellRoute() {
  const router = useRouter();

  return (
    <MobileNewListingScreen
      syncQueue={syncQueue}
      onListingCreated={() => router.back()}
      onBack={() => router.back()}
    />
  );
}
