import { useRouter } from 'expo-router';
import { VerifyNinScreen } from '../../screens/VerifyNinScreen';

export default function VerifyRoute() {
  const router = useRouter();
  return <VerifyNinScreen onBack={() => router.back()} onDone={() => router.back()} />;
}
