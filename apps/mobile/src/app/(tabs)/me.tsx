import { useRouter } from 'expo-router';
import { MeScreen } from '../../screens/MeScreen';

export default function MeRoute() {
  const router = useRouter();
  return (
    <MeScreen
      onVerify={() => router.push('/me/verify')}
      onRoles={() => router.push('/me/roles')}
      onOrders={() => router.push('/market/orders')}
      onShop={() => router.push('/market/shop')}
      onProvider={() => router.push('/(provider)/inbox')}
    />
  );
}
