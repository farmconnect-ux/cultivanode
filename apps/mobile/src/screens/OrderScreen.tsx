import { formatNaira } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { confirmReceived, loadOrder, reportPayment, type Order, type OrderPart } from '../lib/market';
import { siteLink } from '../lib/site';
import { color as c, font, space } from '../theme';
import { Button, Card, Header, Loading, Notice, Pill, Screen, Text, TextField } from '../ui';

type Props = { id: string; placed?: boolean; onBack: () => void };
const HANDED_OVER = ['ready_for_pickup', 'dispatched', 'in_transit', 'delivered'];

/** One order: for each seller, the bank account to pay, "I've sent the money", then "I received it". */
export function OrderScreen({ id, placed, onBack }: Props) {
  const { t, lang } = useI18n();
  const o = t.orders;
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await loadOrder(id));
    } catch {
      setOrder((x) => (x === undefined ? null : x));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const header = <Header onBack={onBack} backLabel={t.common.back} />;
  if (order === undefined) return <Screen header={header}><Loading label={t.common.loading} /></Screen>;
  if (order === null) {
    return (
      <Screen header={header}>
        <Notice>{t.common.offline}</Notice>
        <Button title={t.common.retry} variant="secondary" onPress={load} />
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      refreshing={refreshing}
    >
      <Text variant="small" muted>{order.number}</Text>
      <Text variant="title" accessibilityRole="header">{order.items.map((i) => i.title).join(', ')}</Text>
      {placed && order.mode === 'direct' ? <Notice tone="success">{o.placed}</Notice> : null}
      <Card>
        {order.items.map((i, n) => (
          <View key={n} style={styles.line}>
            <Text style={styles.flex}>{`${i.quantity} ${i.unit} · ${i.title}`}</Text>
            <Text variant="label">{formatNaira(i.subtotalKobo)}</Text>
          </View>
        ))}
        <View style={styles.line}>
          <Text variant="label">{t.lot.total}</Text>
          <Text style={styles.total}>{formatNaira(order.totalKobo)}</Text>
        </View>
      </Card>

      {order.mode === 'direct' ? <Text variant="caption" muted>{o.onlyHere}</Text> : null}
      {order.parts.map((p) => (order.mode === 'direct' ? <DirectPart key={p.id} part={p} onChanged={load} /> : <EscrowPart key={p.id} part={p} />))}
      {order.mode === 'escrow' && !['paid', 'escrowed', 'released'].includes(order.paymentStatus) ? (
        <Button title={o.payOnWeb} icon="external-link" onPress={() => Linking.openURL(siteLink(lang, `account/marketplace/orders/${order.id}`))} />
      ) : null}
    </Screen>
  );
}

function EscrowPart({ part }: { part: OrderPart }) {
  const { t } = useI18n();
  return (
    <Card>
      <View style={styles.between}>
        <Text variant="label">{part.sellerName}</Text>
        <Pill tone="grey">{t.orders.part[part.status as keyof typeof t.orders.part] ?? part.status}</Pill>
      </View>
    </Card>
  );
}

function DirectPart({ part, onChanged }: { part: OrderPart; onChanged: () => Promise<void> }) {
  const { t } = useI18n();
  const o = t.orders;
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount = formatNaira(part.subtotalKobo + part.deliveryKobo);
  const status = part.direct ?? 'awaiting_payment';

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const err = await fn();
    setBusy(false);
    if (err) setError(err === 'offline' ? t.common.offline : err === 'errorGeneric' ? t.hire.errors.errorGeneric : err);
    else await onChanged();
  }

  return (
    <Card tone={status === 'confirmed' ? 'plain' : 'soft'}>
      <View style={styles.between}>
        <Text variant="heading" style={styles.flex}>{fill(o.payTo, { seller: part.sellerName })}</Text>
        <Pill tone={part.status === 'accepted' ? 'green' : part.status === 'rejected' ? 'red' : 'grey'}>{o.part[part.status as keyof typeof o.part] ?? part.status}</Pill>
      </View>
      {part.payout ? (
        <View style={styles.bank}>
          <Line label={o.amount} value={amount} strong />
          <Line label={o.bank} value={part.payout.bank} />
          <Line label={o.accountName} value={part.payout.name} />
          <Line label={o.accountNumber} value={part.payout.number} mono />
          <Line label={o.reference} value={part.number} mono />
        </View>
      ) : (
        <Notice tone="warning">{o.noAccount}</Notice>
      )}
      {status === 'confirmed' ? (
        <Notice tone="success">{o.confirmed}</Notice>
      ) : status === 'buyer_reported' ? (
        <Notice tone="info">{o.reported}</Notice>
      ) : null}
      {part.tracking ? <Text variant="caption" muted>{part.tracking}</Text> : null}
      {error ? <Notice>{error}</Notice> : null}

      {part.status === 'accepted' ? (
        <Text variant="label" color={c.secondary}>{o.done}</Text>
      ) : status !== 'confirmed' && part.payout && part.status !== 'rejected' ? (
        <>
          <TextField label={o.sentNote} value={ref} onChangeText={setRef} maxLength={120} />
          <Button title={status === 'buyer_reported' ? o.tellSeller : o.sent} icon="send" variant={status === 'buyer_reported' ? 'secondary' : 'primary'} onPress={() => run(() => reportPayment(part.id, ref))} loading={busy} />
        </>
      ) : status === 'confirmed' && HANDED_OVER.includes(part.status) ? (
        <Button title={o.received} icon="check-circle" onPress={() => run(() => confirmReceived(part.id))} loading={busy} />
      ) : null}
    </Card>
  );
}

function Line({ label, value, strong, mono }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <View style={styles.line}>
      <Text variant="caption" muted>{label}</Text>
      <Text variant={strong ? 'heading' : 'label'} selectable style={[styles.value, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[3], minHeight: 30 },
  value: { flexShrink: 1, textAlign: 'right' },
  mono: { fontFamily: font.bold, letterSpacing: 1 },
  bank: { gap: 2, paddingVertical: space[1] },
  total: { fontFamily: font.display, fontSize: 20, color: c.primary },
});
