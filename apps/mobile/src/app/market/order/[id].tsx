import { useLocalSearchParams, useRouter } from 'expo-router';
import { OrderScreen } from '../../../screens/OrderScreen';

export default function OrderRoute() {
  const router = useRouter();
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  return <OrderScreen id={String(id)} placed={placed === '1'} onBack={() => (router.canGoBack() ? router.back() : router.replace('/market/orders'))} />;
}
