import { useLocalSearchParams, useRouter } from 'expo-router';
import { LotScreen } from '../../screens/LotScreen';

export default function LotRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <LotScreen
      id={String(id)}
      onBack={() => router.back()}
      onPlaced={(orderId) => router.replace({ pathname: '/market/order/[id]', params: { id: orderId, placed: '1' } })}
    />
  );
}
