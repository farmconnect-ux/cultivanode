import { useRouter } from 'expo-router';
import { signOut } from '../../lib/auth';
import { useSession } from '../../lib/session';
import { OnboardingScreen } from '../../screens/OnboardingScreen';

export default function SetupRoute() {
  const router = useRouter();
  const { refresh } = useSession();
  return (
    <OnboardingScreen
      onDone={async () => {
        await refresh();
        router.replace('/');
      }}
      onSignedOut={() => {
        signOut('local');
      }}
    />
  );
}
