import { formatNaira } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useI18n } from '../i18n';
import { shortDate } from '../lib/dates';
import { myOrders } from '../lib/market';
import { useSession } from '../lib/session';
import { space } from '../theme';
import { Card, Empty, Header, Loading, Notice, Pill, Screen, Text } from '../ui';

type Row = Awaited<ReturnType<typeof myOrders>>[number];

/** The buyer's orders, newest first. */
export function OrdersScreen({ onBack, onOpen }: { onBack: () => void; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  const o = t.orders;
  const { session } = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setRows(await myOrders(session.user.id));
      setFailed(false);
    } catch {
      setFailed(true);
      setRows((r) => r ?? []);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen header={<Header onBack={onBack} backLabel={t.common.back} title={o.title} />}>
      {failed ? <Notice>{t.common.offline}</Notice> : null}
      {!rows ? <Loading label={t.common.loading} /> : rows.length === 0 ? <Empty icon="package" title={o.none} body={o.noneBody} /> : null}
      {(rows ?? []).map((r) => (
        <Card key={r.id} onPress={() => onOpen(r.id)} accessibilityLabel={`${r.number}, ${r.title}`}>
          <View style={styles.between}>
            <Pill tone={['paid', 'released'].includes(r.paymentStatus) ? 'green' : 'amber'}>{r.number}</Pill>
            {r.placedAt ? <Text variant="caption" muted>{shortDate(r.placedAt)}</Text> : null}
          </View>
          <Text variant="label" numberOfLines={2}>{r.title}</Text>
          <Text variant="caption" muted>{formatNaira(r.totalKobo)}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
});
