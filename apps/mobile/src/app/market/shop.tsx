import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShopScreen } from '../../screens/ShopScreen';

export default function ShopRoute() {
  const router = useRouter();
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  return <ShopScreen toast={toast} onBack={() => router.back()} onSell={() => router.push('/market/sell')} />;
}
