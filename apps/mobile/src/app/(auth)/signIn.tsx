import { useRouter } from 'expo-router';
import { PhoneSignInScreen } from '../../screens/PhoneSignInScreen';

export default function SignInRoute() {
  const router = useRouter();

  return (
    <PhoneSignInScreen
      mode="signIn"
      onBack={() => router.back()}
      onSignedIn={() => router.replace('/')}
    />
  );
}
