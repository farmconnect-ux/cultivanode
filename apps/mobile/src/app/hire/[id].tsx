import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookingScreen } from '../../screens/BookingScreen';

export default function BookingRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookingScreen id={String(id)} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/hire'))} />;
}
