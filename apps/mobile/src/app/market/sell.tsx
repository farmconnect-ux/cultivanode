import { useRouter } from 'expo-router';
import { SellScreen } from '../../screens/SellScreen';

export default function SellRoute() {
  const router = useRouter();
  return (
    <SellScreen
      onBack={() => router.back()}
      onShop={() => router.push('/market/shop')}
      onDone={(message) => router.replace({ pathname: '/market/shop', params: { toast: message } })}
    />
  );
}
