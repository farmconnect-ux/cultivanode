import { useLocalSearchParams, useRouter } from 'expo-router';
import { HireScreen } from '../../screens/HireScreen';

export default function HireRoute() {
  const router = useRouter();
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  return (
    <HireScreen
      toast={toast}
      onStart={(mode) => router.push({ pathname: '/hire/new', params: { mode } })}
      onOpen={(id) => router.push({ pathname: '/hire/[id]', params: { id } })}
      onProviderTools={() => router.push('/(provider)/inbox')}
      onAddFarm={() => router.push('/setup/farm')}
    />
  );
}
