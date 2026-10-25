import { useLocalSearchParams, useRouter } from 'expo-router';
import { LOT_TYPES, type LotType } from '../../lib/market';
import { MarketScreen } from '../../screens/MarketScreen';

export default function MarketRoute() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const initial = (LOT_TYPES as readonly string[]).includes(type ?? '') ? (type as LotType) : null;
  return (
    <MarketScreen
      initialType={initial}
      onOpen={(id) => router.push({ pathname: '/market/[id]', params: { id } })}
      onSell={() => router.push('/market/sell')}
      onOrders={() => router.push('/market/orders')}
      onShop={() => router.push('/market/shop')}
    />
  );
}
