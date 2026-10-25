import { useRouter } from 'expo-router';
import { OrdersScreen } from '../../screens/OrdersScreen';

export default function OrdersRoute() {
  const router = useRouter();
  return <OrdersScreen onBack={() => router.back()} onOpen={(id) => router.push({ pathname: '/market/order/[id]', params: { id } })} />;
}
