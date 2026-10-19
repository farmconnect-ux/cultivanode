import { colors, formatNgPhone, radius, space } from '@cultivanode/shared';
import { brand } from '@cultivanode/shared/brand';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import type { Account } from '../lib/account';
import { signOut } from '../lib/auth';
import { siteLink } from '../lib/site';
import { Button, Card, Notice, Screen, Text } from '../ui';
import type { MobileFarmSummary } from '../lib/data';

type NavDestination =
  | 'marketplace'
  | 'operations'
  | 'scouting'
  | 'sell'
  | 'boundary_walk'
  | 'provider_workspace';

type Props = {
  account: Account;
  justJoined: boolean;
  onSignedOut: () => void;
  onNavigate?: (destination: NavDestination, filter?: string) => void;
  farmData?: MobileFarmSummary | null;
  pendingSyncCount?: number;
};

const GREEN = brand.logo.background;
const QUICK_ICONS = ['👷🏾', '🚜', '🧪', '📒'];

function initials(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
}

export function HomeScreen({
  account,
  justJoined,
  onSignedOut,
  onNavigate,
  farmData,
  pendingSyncCount = 0,
}: Props) {
  const { t, lang, setLang } = useI18n();
  const [busy, setBusy] = useState<'local' | 'global' | null>(null);
  const [offline, setOffline] = useState(false);
  const a = t.account;
  const p = account.profile;
  const tier = Math.min(Math.max(p.verification_tier, 0), a.tiers.length - 1);

  const handleTilePress = (index: number) => {
    if (!onNavigate) return;
    if (index === 0) onNavigate('marketplace', 'labour');
    else if (index === 1) onNavigate('provider_workspace');
    else if (index === 2) onNavigate('marketplace', 'input');
    else if (index === 3) onNavigate('operations');
  };

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
        <Pressable
          style={styles.providerPill}
          onPress={() => onNavigate?.('provider_workspace')}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Switch to Machinery and Provider Workspace"
        >
          <Text variant="caption" color="#123D27" style={styles.bold}>
            🚜 Provider Mode
          </Text>
        </Pressable>
        <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text variant="label" color={GREEN}>{initials(p.full_name)}</Text>
        </View>
      </View>

      {/* Offline Sync Banner */}
      {pendingSyncCount > 0 && (
        <View style={styles.syncBanner}>
          <Text variant="caption" color={colors.leaf[900]} style={styles.syncText}>
            🔄 {pendingSyncCount} observation(s) queued for offline sync
          </Text>
        </View>
      )}

      {justJoined ? (
        <>
          <Notice tone="info">{`${fill(a.welcome, { name: p.full_name ?? '' })} ${a.welcomeNew}`}</Notice>
          <Card style={styles.onboardingActionCard}>
            <Text variant="label" color="#123D27">
              🛰️ Recommended Next Step: Map Farm Boundary
            </Text>
            <Text variant="caption" color={colors.soil[700]}>
              Map your farm perimeter using your phone's built-in GPS and compass for precise hectare calculations, tractor bookings, and weather insights.
            </Text>
            <Button
              title="Start GPS Boundary Walk"
              variant="primary"
              onPress={() => onNavigate?.('boundary_walk')}
            />
          </Card>
        </>
      ) : null}

      <View style={styles.hero}>
        <Text variant="caption" color="#A9C7B5">{a.tierTitle}</Text>
        <Text variant="heading" color="#FAF7F0">{a.tiers[tier]}</Text>
        <Text variant="caption" color="#C9D8CF">{a.tierHint}</Text>
      </View>

      {/* Live Farm & Synoptic Weather Card */}
      <Card style={styles.farmCard}>
        <View style={styles.farmHeader}>
          <View>
            <Text variant="caption" muted>ACTIVE FARM</Text>
            <Text variant="heading" color={colors.leaf[900]}>
              {farmData?.farmName ?? 'CultivaNode Agro Hub'}
            </Text>
          </View>
          <View style={styles.weatherBadge}>
            <Text variant="caption" color={colors.harvest[700]} style={styles.bold}>
              ⛅ 29°C · NiMet
            </Text>
          </View>
        </View>

        <View style={styles.farmDetailsRow}>
          <View style={styles.statBox}>
            <Text variant="caption" muted>Crop Cycle</Text>
            <Text variant="label" color={colors.leaf[800]}>
              {farmData?.activeCrop ?? 'Cassava & Maize'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text variant="caption" muted>Plot Name</Text>
            <Text variant="label" color={colors.leaf[800]}>
              {farmData?.plotName ?? 'Plot A (Main)'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text variant="caption" muted>Open Tasks</Text>
            <Text variant="label" color={colors.harvest[700]}>
              {farmData?.tasks ? farmData.tasks.filter((t) => t.status === 'pending').length : 2} Due
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.mapBoundaryBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
          ]}
          onPress={() => onNavigate?.('boundary_walk')}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Measure Farm Boundary with phone GPS and sensors"
        >
          <Text variant="label" color="#123D27" style={styles.mapBoundaryText}>
            🛰️ Measure Farm Boundary (Walk Perimeter)
          </Text>
          <Text variant="caption" color={colors.leaf[700]}>
            High-precision GPS & compass tracking →
          </Text>
        </Pressable>
      </Card>

      <View style={styles.quick}>
        {a.quick.map((label, i) => (
          <Pressable
            key={label}
            onPress={() => handleTilePress(i)}
            style={({ pressed }) => [
              styles.tile,
              pressed && { opacity: 0.8, backgroundColor: colors.harvest[50] },
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${label}. Tap to open.`}
          >
            <Text style={styles.icon}>{QUICK_ICONS[i]}</Text>
            <Text variant="caption" style={styles.center}>{label}</Text>
            <View style={styles.liveBadge}>
              <Text variant="caption" color={colors.leaf[700]} style={styles.liveBadgeText}>
                {a.comingSoon}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Text variant="caption" muted>{a.comingSoonTools}</Text>

      {/* Field Actions Hub */}
      <View style={styles.actionHubRow}>
        <Button
          title="🌾 Field Tasks"
          variant="primary"
          onPress={() => onNavigate?.('operations')}
        />
        <Button
          title="📸 Scouting"
          variant="secondary"
          onPress={() => onNavigate?.('scouting')}
        />
        <Button
          title="🚜 Dispatch Hub"
          variant="secondary"
          onPress={() => onNavigate?.('provider_workspace')}
        />
      </View>

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
  providerPill: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: space[3],
    paddingVertical: 4,
  },
  hero: { backgroundColor: GREEN, borderRadius: radius.lg + 8, padding: space[5], gap: space[2] },
  onboardingActionCard: {
    backgroundColor: '#FAF7F0',
    borderColor: '#123D27',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
  },
  syncBanner: {
    backgroundColor: '#E0F2FE',
    borderColor: '#7DD3FC',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: space[2],
    paddingHorizontal: space[3],
  },
  syncText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  farmCard: {
    padding: space[4],
    gap: space[3],
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weatherBadge: {
    backgroundColor: colors.harvest[50],
    borderColor: colors.harvest[200],
    borderWidth: 1,
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  bold: {
    fontWeight: 'bold',
  },
  farmDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.soil[100],
    paddingTop: space[3],
    gap: space[2],
  },
  statBox: {
    flex: 1,
    gap: 2,
  },
  mapBoundaryBtn: {
    marginTop: space[3],
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: space[3],
    alignItems: 'center',
    gap: 2,
  },
  mapBoundaryText: {
    fontWeight: '700',
    textAlign: 'center',
  },
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
  liveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginTop: 2,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionHubRow: {
    flexDirection: 'row',
    gap: space[3],
    marginVertical: space[1],
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  pill: { backgroundColor: colors.harvest[50], borderRadius: 999, paddingHorizontal: space[3], paddingVertical: 4 },
});
