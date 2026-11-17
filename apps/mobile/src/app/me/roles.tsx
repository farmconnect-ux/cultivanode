import { useRouter } from 'expo-router';
import { RolesScreen } from '../../screens/RolesScreen';

export default function RolesRoute() {
  const router = useRouter();
  return <RolesScreen onBack={() => router.back()} />;
}
