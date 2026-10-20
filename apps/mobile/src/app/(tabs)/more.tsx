import { colors, formatNgPhone, radius, space } from '@cultivanode/shared';
import { useState, useEffect } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../../i18n';
import { loadAccount, type Account } from '../../lib/account';
import { signOut } from '../../lib/auth';
import { siteLink } from '../../lib/site';
import { supabase } from '../../lib/supabase';
import { Button, Card, Notice, Screen, Text } from '../../ui';
import { useRouter } from 'expo-router';

export default function MoreRoute() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [busy, setBusy] = useState<'local' | 'global' | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user.id) {
        loadAccount(session.user.id).then(setAccount);
      }
    });
  }, []);

  if (!account) return <Screen><Text>Loading...</Text></Screen>;

  const a = t.account;
  const p = account.profile;

  async function doSignOut(scope: 'local' | 'global') {
    setBusy(scope);
    setOffline(false);
    const ok = await signOut(scope);
    setBusy(null);
    if (ok) {
      supabase.auth.signOut();
    } else {
      setOffline(true);
    }
  }

  function confirmSignOutAll() {
    Alert.alert(a.signOutAll, a.signOutAllConfirm, [
      { text: a.cancel, style: 'cancel' },
      { text: a.signOutAll, style: 'destructive', onPress: () => doSignOut('global') },
    ]);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" color={colors.leaf[900]}>More Tools</Text>
      </View>

      <View style={styles.actionHubRow}>
        <Button
          title="📦 Inventory & Inputs"
          variant="secondary"
          onPress={() => router.push('/inventory')}
        />
        <Button
          title="🐄 Livestock & Poultry"
          variant="secondary"
          onPress={() => router.push('/livestock')}
        />
        <Button
          title="📦 My Orders"
          variant="secondary"
          onPress={() => router.push('/orders')}
        />
        <Button
          title="🧠 AI Field Assistant"
          variant="secondary"
          onPress={() => router.push('/assistant')}
        />
        <Button
          title="📒 Farm Books (Ledger)"
          variant="secondary"
          onPress={() => router.push('/books')}
        />
        <Button
          title="🔄 Sync Center"
          variant="gold"
          onPress={() => router.push('/sync-center')}
        />
      </View>

      <Card style={{ marginTop: space[4] }}>
        <Text variant="label">{a.settings}</Text>
        {p.phone ? (
          <View style={styles.row}>
            <Text muted>{a.phone}</Text>
            <Text variant="label">{displayPhone(p.phone)}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => setLang(lang === 'en' ? 'yo' : 'en')}
          style={styles.row}
        >
          <Text>{a.appLanguage}</Text>
          <Text variant="label" color={colors.leaf[700]}>
            {t.common.languageName} → {t.common.switchLanguage}
          </Text>
        </Pressable>
      </Card>

      <Card style={{ marginTop: space[4] }}>
        <Text muted>{a.moreOnWeb}</Text>
        <Button
          title={a.openWebsite}
          variant="secondary"
          onPress={() => Linking.openURL(siteLink(lang, 'account'))}
          accessibilityRole="link"
        />
      </Card>

      <Card style={{ marginTop: space[4] }}>
        <Text variant="label" color={colors.danger}>Account Security</Text>
        {offline ? <Notice>{t.common.offline}</Notice> : null}
        <Button title={a.signOut} variant="secondary" onPress={() => doSignOut('local')} loading={busy === 'local'} />
        <Button title={a.signOutAll} variant="secondary" onPress={confirmSignOutAll} loading={busy === 'global'} />
      </Card>
    </Screen>
  );
}

function displayPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return /^234[0-9]{10}$/.test(digits) ? formatNgPhone(digits) : phone;
}

const styles = StyleSheet.create({
  header: { marginBottom: space[4] },
  actionHubRow: { gap: space[3] },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
});
