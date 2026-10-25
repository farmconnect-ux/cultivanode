import { useRouter } from 'expo-router';
import { PhoneSignInScreen } from '../../screens/PhoneSignInScreen';

export default function SignUpRoute() {
  const router = useRouter();

  return (
    <PhoneSignInScreen
      mode="signUp"
      onBack={() => router.back()}
      onSignedIn={() => router.replace('/')}
    />
  );
}
