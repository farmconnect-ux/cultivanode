import { useRouter } from 'expo-router';
import { AccountDeleteScreen } from '../../screens/AccountDeleteScreen';

export default function DeleteAccountRoute() {
  const router = useRouter();
  return (
    <AccountDeleteScreen
      onBack={() => router.back()}
      onDeleted={() => router.replace('/(auth)/welcome')}
    />
  );
}
