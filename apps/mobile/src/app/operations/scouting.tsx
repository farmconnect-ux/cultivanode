import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScoutScreen } from '../../screens/ScoutScreen';

export default function ScoutingRoute() {
  const router = useRouter();
  const { cropId } = useLocalSearchParams<{ cropId?: string }>();
  return <ScoutScreen initialCropId={cropId} onBack={() => router.back()} />;
}
