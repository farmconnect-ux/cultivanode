import { useLocalSearchParams, useRouter } from 'expo-router';
import { HireRequestScreen } from '../../screens/HireRequestScreen';

export default function NewHireRoute() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  return (
    <HireRequestScreen
      mode={mode === 'hands' ? 'hands' : 'tractor'}
      onBack={() => router.back()}
      onSent={(id) => router.replace({ pathname: '/hire/[id]', params: { id } })}
    />
  );
}
