import { colors, space } from '@cultivanode/shared';
import type { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider, useI18n } from './src/i18n';
import { loadAccount, type Account } from './src/lib/account';
import { signOut } from './src/lib/auth';
import { initMonitoring, reportError, withMonitoring } from './src/lib/monitoring';
import { supabase, supabaseConfigured } from './src/lib/supabase';
import { HomeScreen } from './src/screens/HomeScreen';
import { MarketplaceBrowseScreen, type MobileListingItem } from './src/screens/MarketplaceBrowseScreen';
import { CropOperationsScreen } from './src/screens/CropOperationsScreen';
import { CropScoutingScreen } from './src/screens/CropScoutingScreen';
import { MobileNewListingScreen } from './src/screens/MobileNewListingScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { PhoneSignInScreen } from './src/screens/PhoneSignInScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { Button, Logo, Notice, Screen } from './src/ui';
import { OfflineSyncQueue } from './src/lib/offline-sync';
import { sessionStorage } from './src/lib/supabase';
import { loadMarketplaceListings, loadFarmerWorkspaceData, type MobileFarmSummary } from './src/lib/data';

initMonitoring();

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

type Guest = 'welcome' | 'signIn' | 'signUp';
type AccountState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; account: Account | null };
type ActiveView = 'home' | 'marketplace' | 'operations' | 'scouting' | 'sell';

function Root() {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [guest, setGuest] = useState<Guest>('welcome');
  const [account, setAccount] = useState<AccountState>({ status: 'loading' });
  const [justJoined, setJustJoined] = useState(false);
  const [view, setView] = useState<ActiveView>('home');
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [listings, setListings] = useState<MobileListingItem[]>([]);
  const [farmData, setFarmData] = useState<MobileFarmSummary | null>(null);

  const userId = session?.user.id;

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!userId) return;
    setAccount({ status: 'loading' });
    try {
      const [acc, mkListings, fData] = await Promise.all([
        loadAccount(userId),
        loadMarketplaceListings(),
        loadFarmerWorkspaceData(userId),
      ]);
      setAccount({ status: 'ready', account: acc });
      setListings(mkListings);
      setFarmData(fData);
    } catch (error) {
      reportError('account_load_failed', error);
      setAccount({ status: 'error' });
    }
  }, [userId]);

  useEffect(() => {
    if (userId) void refreshAccount();
    else {
      setAccount({ status: 'loading' });
      setJustJoined(false);
      setGuest('welcome');
      setView('home');
    }
  }, [userId, refreshAccount]);

  const signedOut = useCallback(() => setSession(null), []);

  if (!supabaseConfigured) {
    return (
      <Screen>
        <Logo />
        <Notice>{t.common.notConfigured}</Notice>
      </Screen>
    );
  }

  if (session === undefined || (session && account.status === 'loading')) return <Splash label={t.common.loading} />;

  if (!session) {
    if (guest === 'welcome') {
      return <WelcomeScreen onStart={() => setGuest('signUp')} onSignIn={() => setGuest('signIn')} />;
    }
    return <PhoneSignInScreen mode={guest} onBack={() => setGuest('welcome')} />;
  }

  if (account.status === 'error') {
    return (
      <Screen>
        <Logo />
        <Notice>{t.account.errorLoad}</Notice>
        <Button title={t.common.retry} onPress={refreshAccount} />
        <Button title={t.account.signOut} variant="secondary" onPress={() => signOut('local').then(signedOut)} />
      </Screen>
    );
  }

  const acct = account.status === 'ready' ? account.account : null;
  if (!acct || !acct.profile.onboarded_at) {
    return (
      <OnboardingScreen
        onDone={(welcome) => {
          setJustJoined(welcome);
          void refreshAccount();
        }}
        onSignedOut={() => signOut('local').then(signedOut)}
      />
    );
  }

  // Active sub-views router
  if (view === 'marketplace') {
    return (
      <MarketplaceBrowseScreen
        listings={listings}
        initialCategory={marketFilter}
        onSelectListing={(item) => {
          // Open direct inquiry via Web account or details
          setView('marketplace');
        }}
        onOpenCreateListing={() => setView('sell')}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'operations') {
    return (
      <CropOperationsScreen
        cycleId={farmData?.tasks[0]?.cycleId || 'crop_cycle_live'}
        cropName={farmData?.activeCrop || 'Crop Cycle'}
        plotName={farmData?.plotName || 'Primary Plot'}
        tasks={farmData?.tasks || []}
        syncQueue={syncQueue}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'scouting') {
    return (
      <CropScoutingScreen
        cycleId={farmData?.tasks[0]?.cycleId || 'crop_cycle_live'}
        cropName={farmData?.activeCrop || 'Cassava & Maize'}
        plotName={farmData?.plotName || 'Main Plot'}
        syncQueue={syncQueue}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'sell') {
    return (
      <MobileNewListingScreen
        syncQueue={syncQueue}
        onListingCreated={() => {
          void refreshAccount();
          setView('marketplace');
        }}
        onBack={() => setView('home')}
      />
    );
  }

  return (
    <HomeScreen
      account={acct}
      justJoined={justJoined}
      onSignedOut={signedOut}
      onNavigate={(dest, filter) => {
        if (filter) setMarketFilter(filter);
        setView(dest);
      }}
    />
  );
}

function Splash({ label }: { label: string }) {
  return (
    <View style={styles.splash} accessibilityLabel={label}>
      <StatusBar style="light" />
      <Logo size={88} />
      <ActivityIndicator color={colors.white} />
    </View>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <Root />
        <StatusBar style="dark" />
      </I18nProvider>
    </SafeAreaProvider>
  );
}

export default withMonitoring(App);

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[6], backgroundColor: '#123D27' },
});
