import { useLocalSearchParams, useRouter } from 'expo-router';
import { HerdScreen } from '../../screens/AnimalsScreen';

export default function HerdRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HerdScreen id={String(id)} onLog={(eventType) => router.push({ pathname: '/livestock/log-event', params: { id, eventType } })} />;
}
