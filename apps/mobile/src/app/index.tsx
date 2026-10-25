import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useI18n } from '../i18n';
import { nextStep, useSession } from '../lib/session';
import { color, space } from '../theme';
import { Button, Logo, Notice } from '../ui';

/** Sends each person to the right place: sign in, finish set-up, add a farm, or Home. */
export default function EntryScreen() {
  const { t } = useI18n();
  const { session, account, farms, loadFailed, refresh } = useSession();

  if (session === null) return <Redirect href="/(auth)/welcome" />;

  if (session && account !== undefined) {
    if (loadFailed && !account) {
      return (
        <View style={styles.splash}>
          <Logo size={72} />
          <View style={styles.box}>
            <Notice>{t.account.errorLoad}</Notice>
            <Button title={t.common.retry} variant="mint" onPress={refresh} />
          </View>
        </View>
      );
    }
    const step = nextStep(account, farms);
    if (step === 'setup') return <Redirect href="/setup" />;
    if (step === 'farm') return <Redirect href="/setup/farm" />;
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <View style={styles.splash}>
      <Logo size={88} />
      <ActivityIndicator color={color.mint} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[6], backgroundColor: color.primary, padding: space[6] },
  box: { alignSelf: 'stretch', gap: space[3] },
});
