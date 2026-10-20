import { useRouter } from 'expo-router';
import { FarmBoundaryWalkScreen } from '../../screens/FarmBoundaryWalkScreen';

export default function BoundaryWalkRoute() {
  const router = useRouter();

  return (
    <FarmBoundaryWalkScreen
      initialFarmName="Farm"
      onBack={() => router.back()}
      onSaved={() => router.push('/(tabs)/home')}
    />
  );
}
