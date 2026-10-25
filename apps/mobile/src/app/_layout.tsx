import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider } from '../i18n';
import { withMonitoring } from '../lib/monitoring';
import { sendPendingLots } from '../lib/market';
import { startAutoSync } from '../lib/outbox';
import { SessionProvider, useSession } from '../lib/session';
import { color } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Sends what was saved without signal (records, crop checks, market lots) as soon as the phone is back online. */
function AutoSync() {
  const { session, account } = useSession();
  const uid = session?.user.id;
  const name = account?.profile.full_name ?? null;
  useEffect(() => {
    if (!uid) return;
    return startAutoSync(() => sendPendingLots(uid, name));
  }, [uid, name]);
  return null;
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <AutoSync />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.page }, animation: 'slide_from_right' }} />
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

export default withMonitoring(RootLayout);
