import { formatNgPhone } from '@cultivanode/shared';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { signOut } from '../lib/auth';
import { myTier } from '../lib/hire';
import { useSession } from '../lib/session';
import { siteLink } from '../lib/site';
import { color as c, space } from '../theme';
import { Button, Card, Icon, Notice, Pill, Row, Screen, Text } from '../ui';

type Props = { onVerify: () => void; onRoles: () => void; onOrders: () => void; onShop: () => void; onProvider: () => void };

/** Me: who you are, NIN status, your shop and orders, language, help and signing out. */
export function MeScreen({ onVerify, onRoles, onOrders, onShop, onProvider }: Props) {
  const { t, lang, setLang } = useI18n();
  const me = t.me;
  const a = t.account;
  const { account } = useSession();
  const [tier, setTier] = useState<number | null>(null);
  const [busy, setBusy] = useState<'local' | 'global' | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    myTier().then(setTier).catch(() => setTier(account?.profile.verification_tier ?? null));
  }, [account?.profile.verification_tier]);

  async function out(scope: 'local' | 'global') {
    setBusy(scope);
    setOffline(false);
    const ok = await signOut(scope);
    setBusy(null);
    if (!ok) setOffline(true);
  }

  const p = account?.profile;
  const provider = Boolean(account?.roles.some((r) => r.role === 'machinery_owner' || r.role === 'service_provider'));
  const phone = p?.phone && /^234[0-9]{10}$/.test(p.phone.replace(/\D/g, '')) ? formatNgPhone(p.phone.replace(/\D/g, '')) : p?.phone;

  return (
    <Screen inTabs>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text variant="title" color={c.onDark}>{(p?.full_name ?? '?').trim().charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <Text variant="title" numberOfLines={1}>{p?.full_name ?? me.title}</Text>
          {phone ? <Text muted>{phone}</Text> : null}
        </View>
      </View>

      {tier !== null && tier < 1 ? (
        <Card tone="amber" onPress={onVerify} accessibilityLabel={me.verify}>
          <View style={styles.row}>
            <Icon name="shield" size={22} color={c.amber} />
            <View style={styles.flex}>
              <Text variant="label">{me.verify}</Text>
              <Text variant="caption" muted>{me.verifyHint}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={c.inkSoft} />
          </View>
        </Card>
      ) : tier !== null ? (
        <Pill tone="green" icon="shield">{me.verified}</Pill>
      ) : null}

      <Card>
        <Text variant="small" muted>{me.roles}</Text>
        <View style={styles.pills}>
          {(account?.roles ?? []).map((r) => (
            <Pill key={r.role} tone="green">{t.roleSimple[r.role] ?? t.roleNames[r.role]}</Pill>
          ))}
          {(account?.pending ?? []).map((r) => (
            <Pill key={`p-${r.role}`} tone="grey">{`${t.roleSimple[r.role] ?? t.roleNames[r.role]} · ${me.pending}`}</Pill>
          ))}
        </View>
      </Card>

      <Card>
        <Row icon="shield" title="Roles & verification docs" onPress={onRoles} />
        <Row icon="package" title={me.myOrders} onPress={onOrders} />
        <Row icon="briefcase" title={me.myShop} onPress={onShop} />
        {provider ? <Row icon="inbox" title={me.provider} onPress={onProvider} /> : null}
        <Row
          icon="globe"
          title={a.appLanguage}
          detail={t.common.languageName}
          onPress={() => setLang(lang === 'en' ? 'yo' : 'en')}
          right={<Text variant="label" color={c.secondary}>{t.common.switchLanguage}</Text>}
        />
      </Card>

      <Card>
        <Row icon="help-circle" title={me.help} onPress={() => Linking.openURL(siteLink(lang, 'contact'))} />
        <Row icon="external-link" title={me.website} onPress={() => Linking.openURL(siteLink(lang, 'account'))} />
        <Row icon="file-text" title={me.terms} onPress={() => Linking.openURL(siteLink(lang, 'terms'))} />
        <Row icon="lock" title={me.privacy} onPress={() => Linking.openURL(siteLink(lang, 'privacy'))} />
      </Card>

      {offline ? <Notice>{t.common.offline}</Notice> : null}
      <Button title={a.signOut} variant="secondary" icon="log-out" onPress={() => out('local')} loading={busy === 'local'} />
      <Button
        title={a.signOutAll}
        variant="danger"
        onPress={() =>
          Alert.alert(a.signOutAll, a.signOutAllConfirm, [
            { text: a.cancel, style: 'cancel' },
            { text: a.signOutAll, style: 'destructive', onPress: () => out('global') },
          ])
        }
        loading={busy === 'global'}
      />
      <Text variant="caption" muted style={styles.center}>{a.signOutAllHint}</Text>
      <Text variant="caption" muted style={styles.center}>{fill(me.version, { v: Constants.expoConfig?.version ?? '' })}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
});
