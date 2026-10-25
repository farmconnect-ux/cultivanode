import { formatNaira } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { shortDate } from '../lib/dates';
import { confirmPaymentReceived, moveOrder, myShop, savePayout, shopOrders, type Shop, type ShopOrder } from '../lib/market';
import { useSession } from '../lib/session';
import { space } from '../theme';
import { Button, Card, Empty, Header, Loading, Notice, Pill, Screen, SectionTitle, Text, TextField } from '../ui';

/** My shop: the bank account buyers pay into, and orders to confirm, send and get paid for. */
export function ShopScreen({ onBack, onSell, toast }: { onBack: () => void; onSell: () => void; toast?: string }) {
  const { t } = useI18n();
  const s = t.shop;
  const { session, account } = useSession();
  const [shop, setShop] = useState<Shop | null | undefined>(undefined);
  const [orders, setOrders] = useState<ShopOrder[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const sh = await myShop(session.user.id);
      setShop(sh);
      setOrders(sh ? await shopOrders(sh.id) : []);
    } catch {
      setShop((x) => (x === undefined ? null : x));
      setOrders((o) => o ?? []);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen
      header={<Header onBack={onBack} backLabel={t.common.back} title={shop?.name ?? s.title} />}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      refreshing={refreshing}
    >
      {toast ? <Notice tone="success">{toast}</Notice> : null}
      {shop === undefined ? <Loading label={t.common.loading} /> : null}

      <SectionTitle title={s.bank} />
      {shop?.payout && !editing ? (
        <Card>
          <Text variant="label">{shop.payout.bank}</Text>
          <Text muted>{`${shop.payout.name} · ${shop.payout.number}`}</Text>
          <Button title={s.editBank} variant="secondary" compact icon="edit-2" onPress={() => setEditing(true)} />
        </Card>
      ) : shop !== undefined ? (
        <BankForm
          initial={shop?.payout ?? null}
          defaultName={account?.profile.full_name ?? ''}
          onSaved={async () => {
            setEditing(false);
            await load();
          }}
          userId={session?.user.id ?? ''}
          shopName={account?.profile.full_name ?? null}
        />
      ) : null}

      <SectionTitle title={s.orders} action={t.market.sell} onAction={onSell} />
      {orders && orders.length === 0 ? <Empty icon="inbox" title={s.none} body={s.noneBody} /> : null}
      {(orders ?? []).map((o) => (
        <OrderCard key={o.id} order={o} onChanged={load} />
      ))}
    </Screen>
  );
}

function BankForm({ initial, defaultName, onSaved, userId, shopName }: { initial: Shop['payout']; defaultName: string; onSaved: () => void; userId: string; shopName: string | null }) {
  const { t } = useI18n();
  const s = t.shop;
  const [bank, setBank] = useState(initial?.bank ?? '');
  const [name, setName] = useState(initial?.name ?? defaultName);
  const [number, setNumber] = useState(initial?.number ?? '');
  const [error, setError] = useState<keyof typeof s.errors | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const err = await savePayout(userId, shopName, { bank, accountName: name, number });
    setBusy(false);
    if (err) return setError(err);
    setError(null);
    onSaved();
  }

  return (
    <Card tone="soft">
      <Text muted>{s.bankHint}</Text>
      <TextField label={s.bankName} placeholder={s.bankPlaceholder} value={bank} onChangeText={setBank} maxLength={80} error={error === 'bank' ? s.errors.bank : undefined} />
      <TextField label={s.accountName} value={name} onChangeText={setName} maxLength={120} error={error === 'name' ? s.errors.name : undefined} />
      <TextField
        label={s.accountNumber}
        value={number}
        onChangeText={(v) => setNumber(v.replace(/[^0-9]/g, '').slice(0, 10))}
        keyboardType="number-pad"
        maxLength={10}
        error={error === 'number' ? s.errors.number : undefined}
      />
      {error === 'offline' || error === 'errorGeneric' ? <Notice>{s.errors[error]}</Notice> : null}
      <Button title={t.common.save} icon="check" onPress={save} loading={busy} />
    </Card>
  );
}

function OrderCard({ order, onChanged }: { order: ShopOrder; onChanged: () => Promise<void> }) {
  const { t } = useI18n();
  const s = t.shop;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const paid = order.direct === null || order.direct === 'confirmed';

  async function run(key: string, fn: () => Promise<string | null>) {
    setBusy(key);
    setError(null);
    const err = await fn();
    setBusy(null);
    if (err) setError(err === 'offline' ? t.common.offline : err === 'errorGeneric' ? t.hire.errors.errorGeneric : err);
    else await onChanged();
  }

  return (
    <Card>
      <View style={styles.between}>
        <Pill tone={order.status === 'rejected' ? 'red' : order.status === 'accepted' || order.status === 'delivered' ? 'green' : 'amber'}>
          {t.orders.part[order.status as keyof typeof t.orders.part] ?? order.status}
        </Pill>
        <Text variant="caption" muted>{shortDate(order.createdAt)}</Text>
      </View>
      <Text variant="label">{order.items || order.number}</Text>
      <Text variant="caption" muted>{[formatNaira(order.subtotalKobo), order.address].filter(Boolean).join(' · ')}</Text>
      {order.direct ? <Pill tone={order.direct === 'confirmed' ? 'green' : order.direct === 'buyer_reported' ? 'amber' : 'grey'} icon="credit-card">{s.direct[order.direct as keyof typeof s.direct] ?? order.direct}</Pill> : null}
      {order.buyerRef ? <Text variant="caption" muted>{fill(s.buyerRef, { ref: order.buyerRef })}</Text> : null}
      {error ? <Notice>{error}</Notice> : null}

      {order.direct && order.direct !== 'confirmed' && !['rejected', 'cancelled'].includes(order.status) ? (
        <>
          <Text variant="caption" muted>{s.checkFirst}</Text>
          <Button title={s.paymentReceived} icon="check-circle" variant={order.direct === 'buyer_reported' ? 'primary' : 'secondary'} onPress={() => run('paid', () => confirmPaymentReceived(order.id))} loading={busy === 'paid'} />
        </>
      ) : null}

      <View style={styles.actions}>
        {order.status === 'placed' ? (
          <>
            <Button title={s.confirmOrder} compact onPress={() => run('confirm', () => moveOrder(order.id, 'confirmed'))} loading={busy === 'confirm'} />
            <Button title={s.reject} compact variant="danger" onPress={() => setRejecting(!rejecting)} />
          </>
        ) : null}
        {['confirmed', 'preparing'].includes(order.status) && paid ? (
          <Button title={s.markSent} compact icon="truck" onPress={() => run('sent', () => moveOrder(order.id, 'dispatched'))} loading={busy === 'sent'} />
        ) : null}
        {['dispatched', 'in_transit', 'ready_for_pickup'].includes(order.status) ? (
          <Button title={s.markDelivered} compact icon="check" onPress={() => run('delivered', () => moveOrder(order.id, 'delivered'))} loading={busy === 'delivered'} />
        ) : null}
        {order.phone ? <Button title={s.call} compact variant="secondary" icon="phone" onPress={() => Linking.openURL(`tel:${order.phone}`)} /> : null}
      </View>
      {rejecting ? (
        <>
          <TextField label={s.rejectReason} value={reason} onChangeText={setReason} maxLength={300} />
          <Button title={s.reject} variant="danger" onPress={() => run('reject', () => moveOrder(order.id, 'rejected', reason))} loading={busy === 'reject'} disabled={!reason.trim()} />
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
});
