import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../lib/session';
import { color } from '../../theme';

export default function AuthLayout() {
  const { session } = useSession();
  // Signed in already (or the code just worked): the entry screen decides where to go next.
  if (session) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.page }, animation: 'slide_from_right' }} />;
}
