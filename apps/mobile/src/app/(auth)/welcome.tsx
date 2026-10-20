import { useRouter } from 'expo-router';
import { WelcomeScreen } from '../../screens/WelcomeScreen';

export default function WelcomeRoute() {
  const router = useRouter();

  return (
    <WelcomeScreen
      onStart={() => router.push('/(auth)/signUp')}
      onSignIn={() => router.push('/(auth)/signIn')}
    />
  );
}
