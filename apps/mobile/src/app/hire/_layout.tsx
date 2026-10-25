import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../lib/session';
import { color } from '../../theme';

export default function HireLayout() {
  const { session } = useSession();
  if (session === null) return <Redirect href="/(auth)/welcome" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.page }, animation: 'slide_from_right' }} />;
}
