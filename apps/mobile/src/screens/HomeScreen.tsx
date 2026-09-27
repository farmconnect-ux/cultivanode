import { colors, formatNgPhone, radius, space } from '@cultivanode/shared';
import { brand } from '@cultivanode/shared/brand';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import type { Account } from '../lib/account';
import { signOut } from '../lib/auth';
import { siteLink } from '../lib/site';
import { Button, Card, Notice, Screen, Text } from '../ui';

type Props = { account: Account; justJoined: boolean; onSignedOut: () => void };

const GREEN = brand.logo.background;
const QUICK_ICONS = ['👷🏾', '🚜', '🧪', '📒'];

function initials(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
}

export function HomeScreen({ account, justJoined, onSignedOut }: Props) {
  const { t, lang, setLang } = useI18n();
  const [busy, setBusy] = useState<'local' | 'global' | null>(null);
  const [offline, setOffline] = useState(false);
  const a = t.account;
  const p = account.profile;
  const tier = Math.min(Math.max(p.verification_tier, 0), a.tiers.length - 1);

  async function doSignOut(scope: 'local' | 'global') {
    setBusy(scope);
    setOffline(false);
    const ok = await signOut(scope);
    setBusy(null);
    if (ok) onSignedOut();
    else setOffline(true);
  }

  function confirmSignOutAll() {
    Alert.alert(a.signOutAll, a.signOutAllConfirm, [
      { text: a.cancel, style: 'cancel' },
      { text: a.signOutAll, style: 'destructive', onPress: () => doSignOut('global') },
    ]);
  }

  return (
    <Screen>
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text variant="caption" muted>{a.greeting}</Text>
          <Text variant="heading" color={colors.leaf[800]} accessibilityRole="header">
            {p.full_name ?? ''}
          </Text>
        </View>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text variant="label" color={GREEN}>{initials(p.full_name)}</Text>
        </View>
      </View>

      {justJoined ? <Notice tone="info">{`${fill(a.welcome, { name: p.full_name ?? '' })} ${a.welcomeNew}`}</Notice> : null}

      <View style={styles.hero}>
        <Text variant="caption" color="#A9C7B5">{a.tierTitle}</Text>
        <Text variant="heading" color="#FAF7F0">{a.tiers[tier]}</Text>
        <Text variant="caption" color="#C9D8CF">{a.tierHint}</Text>
      </View>

      <View style={styles.quick}>
        {a.quick.map((label, i) => (
          <View key={label} style={styles.tile} accessible accessibilityLabel={`${label}. ${a.comingSoon}`}>
            <Text style={styles.icon}>{QUICK_ICONS[i]}</Text>
            <Text variant="caption" style={styles.center}>{label}</Text>
            <Text variant="caption" muted style={styles.soon}>{a.comingSoon}</Text>
          </View>
        ))}
      </View>
      <Text variant="caption" muted>{a.comingSoonTools}</Text>

      <Card>
        <Text variant="label">{a.yourRoles}</Text>
        {account.roles.length === 0 && account.pending.length === 0 ? <Text muted>{a.noRoles}</Text> : null}
        {account.roles.map((r) => (
          <RoleRow key={`${r.role}:${r.provider_type ?? ''}`} name={roleName(t, r)} />
        ))}
        {account.pending.map((r) => (
          <RoleRow key={`p:${r.role}:${r.provider_type ?? ''}`} name={roleName(t, r)} status={a.pending} />
        ))}
      </Card>

      <Card>
        <Text muted>{a.moreOnWeb}</Text>
        <Button
          title={a.openWebsite}
          variant="secondary"
          onPress={() => Linking.openURL(siteLink(lang, 'account'))}
          accessibilityRole="link"
        />
      </Card>

      <Card>
        <Text variant="label">{a.settings}</Text>
        {p.phone ? <Row label={a.phone} value={displayPhone(p.phone)} /> : null}
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
        {offline ? <Notice>{t.common.offline}</Notice> : null}
        <Button title={a.signOut} variant="secondary" onPress={() => doSignOut('local')} loading={busy === 'local'} />
        <Button title={a.signOutAll} variant="secondary" onPress={confirmSignOutAll} loading={busy === 'global'} />
        <Text variant="caption" muted>{a.signOutAllHint}</Text>
      </Card>
    </Screen>
  );
}

function displayPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return /^234[0-9]{10}$/.test(digits) ? formatNgPhone(digits) : phone;
}

function roleName(
  t: ReturnType<typeof useI18n>['t'],
  r: Account['roles'][number],
): string {
  return r.provider_type ? `${t.roleNames[r.role]} · ${t.providerTypes[r.provider_type]}` : t.roleNames[r.role];
}

function RoleRow({ name, status }: { name: string; status?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.flex}>{name}</Text>
      {status ? (
        <View style={styles.pill}>
          <Text variant="caption" color={colors.harvest[700]}>{status}</Text>
        </View>
      ) : (
        <Text color={colors.leaf[600]}>✓</Text>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text muted>{label}</Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.harvest[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { backgroundColor: GREEN, borderRadius: radius.lg + 8, padding: space[5], gap: space[2] },
  quick: { flexDirection: 'row', gap: space[2] },
  tile: {
    flex: 1,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: space[3],
    paddingHorizontal: space[1],
    alignItems: 'center',
    gap: 4,
  },
  icon: { fontSize: 24, lineHeight: 30 },
  center: { textAlign: 'center' },
  soon: { fontSize: 11, textAlign: 'center' },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  pill: { backgroundColor: colors.harvest[50], borderRadius: 999, paddingHorizontal: space[3], paddingVertical: 4 },
});
