import { formatNaira } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useI18n } from '../i18n';
import { shortDate } from '../lib/dates';
import { myBookings, type BookingSummary } from '../lib/hire';
import { useSession } from '../lib/session';
import { color as c, space } from '../theme';
import { Button, Card, Empty, Icon, Notice, Pill, Screen, SectionTitle, Text } from '../ui';

type Props = {
  toast?: string;
  onStart: (mode: 'tractor' | 'hands') => void;
  onOpen: (bookingId: string) => void;
  onProviderTools: () => void;
  onAddFarm: () => void;
};

const OPEN = new Set(['requested', 'accepted', 'in_progress', 'awaiting_confirmation', 'confirmed', 'disputed']);

export function statusTone(status: string): 'green' | 'amber' | 'red' | 'grey' | 'blue' {
  if (status === 'requested' || status === 'awaiting_confirmation' || status === 'confirmed') return 'amber';
  if (status === 'accepted' || status === 'in_progress' || status === 'completed') return 'green';
  if (status === 'disputed') return 'red';
  return 'grey';
}

/** Hire tab: the two ways to hire, then the farmer's jobs (and a way into provider tools for owners). */
export function HireScreen({ toast, onStart, onOpen, onProviderTools, onAddFarm }: Props) {
  const { t } = useI18n();
  const h = t.hire;
  const { account, farm } = useSession();
  const [jobs, setJobs] = useState<BookingSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setJobs(await myBookings());
      setFailed(false);
    } catch {
      setFailed(true);
      setJobs((j) => j ?? []);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const provider = Boolean(account?.roles.some((r) => r.role === 'machinery_owner' || r.role === 'service_provider'));
  const mine = (jobs ?? []).filter((j) => j.my_side === 'farmer');
  const forMe = (jobs ?? []).filter((j) => j.my_side === 'provider' && j.status === 'requested');
  const open = mine.filter((j) => OPEN.has(j.status));
  const past = mine.filter((j) => !OPEN.has(j.status));

  return (
    <Screen
      inTabs
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      refreshing={refreshing}
    >
      <Text variant="display" accessibilityRole="header">{h.title}</Text>
      <Text muted>{h.intro}</Text>
      {toast ? <Notice tone="success">{toast}</Notice> : null}

      {!farm ? (
        <Card tone="amber">
          <Text>{h.noFarm}</Text>
          <Button title={t.home.noFarm} icon="plus" onPress={onAddFarm} />
        </Card>
      ) : null}

      <BigChoice icon="truck" title={h.tractor} hint={h.tractorHint} onPress={() => onStart('tractor')} disabled={!farm} />
      <BigChoice icon="users" title={h.hands} hint={h.handsHint} onPress={() => onStart('hands')} disabled={!farm} />

      {provider ? (
        <Card tone="soft" onPress={onProviderTools} accessibilityLabel={h.openProvider}>
          <View style={styles.row}>
            <Icon name="inbox" size={22} />
            <Text variant="label" style={styles.flex}>{forMe.length ? `${h.requests} · ${forMe.length}` : h.openProvider}</Text>
            <Icon name="chevron-right" size={20} color={c.inkSoft} />
          </View>
        </Card>
      ) : null}

      <SectionTitle title={h.yourJobs} />
      {failed ? <Notice>{t.common.offline}</Notice> : null}
      {jobs && mine.length === 0 && !failed ? <Empty icon="calendar" title={h.noJobs} body={h.noJobsBody} /> : null}
      {[...open, ...past].map((j) => (
        <Card key={j.id} onPress={() => onOpen(j.id)} accessibilityLabel={`${j.title}, ${h.status[j.status]}`}>
          <View style={styles.between}>
            <Pill tone={statusTone(j.status)}>{h.status[j.status]}</Pill>
            <Text variant="caption" muted>{shortDate(j.job_date)}</Text>
          </View>
          <Text variant="label">{j.title}</Text>
          <Text variant="caption" muted>
            {[j.other_name, `${j.quantity} ${h.units[j.unit]}`, formatNaira(Number(j.total_kobo))].filter(Boolean).join(' · ')}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}

function BigChoice({ icon, title, hint, onPress, disabled }: { icon: 'truck' | 'users'; title: string; hint: string; onPress: () => void; disabled: boolean }) {
  return (
    <Card onPress={disabled ? undefined : onPress} accessibilityLabel={`${title}. ${hint}`} style={disabled ? styles.off : undefined}>
      <View style={styles.row}>
        <View style={styles.big}>
          <Icon name={icon} size={28} />
        </View>
        <View style={styles.flex}>
          <Text variant="heading">{title}</Text>
          <Text variant="caption" muted>{hint}</Text>
        </View>
        <Icon name="chevron-right" size={22} color={c.inkSoft} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  big: { width: 56, height: 56, borderRadius: 14, backgroundColor: c.mintSoft, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.5 },
});
