import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { submit, useOutbox } from '../lib/outbox';
import { loadStore, setStoreQuantity, STORE_CATEGORIES, STORE_UNITS, type StoreItem } from '../lib/records';
import { useSession } from '../lib/session';
import { color as c, space } from '../theme';
import { Button, Card, Chips, Empty, Loading, Notice, Pill, Screen, Text, TextField } from '../ui';
import { toNumber } from './BooksScreen';

const fmt = (n: number) => n.toLocaleString('en-NG', { maximumFractionDigits: 2 });

/** What is in the farm store, with a quick way to count stock in and out. */
export function StoreScreen({ onAdd }: { onAdd: () => void }) {
  const { t } = useI18n();
  const s = t.store;
  const { farm } = useSession();
  const waiting = useOutbox(['inventory_add']).filter((i) => i.payload.farm_id === farm?.id);
  const [items, setItems] = useState<StoreItem[] | null>(null);
  const [cachedOnly, setCachedOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [change, setChange] = useState('');
  const [busy, setBusy] = useState<'use' | 'add' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!farm) return setItems([]);
    const res = await loadStore(farm.id).catch(() => null);
    setItems(res?.data ?? []);
    setCachedOnly(Boolean(res?.offline));
  }, [farm]);

  useEffect(() => {
    load();
  }, [load, waiting.length]);

  async function adjust(item: StoreItem, dir: 'use' | 'add') {
    const n = toNumber(change);
    if (!Number.isFinite(n) || n <= 0) return setError(s.errors.quantity);
    setBusy(dir);
    const res = await setStoreQuantity(item.id, dir === 'use' ? item.quantity - n : item.quantity + n);
    setBusy(null);
    if (res !== 'ok') return setError(res === 'offline' ? s.needSignal : s.errors.errorGeneric);
    setError(null);
    setChange('');
    setOpen(null);
    await load();
  }

  if (!items) return <Loading label={t.common.loading} />;

  const unit = s.units as Record<string, string>;
  const cat = s.categories as Record<string, string>;
  const queued = waiting.map((i) => ({ id: i.id, name: String(i.payload.item_name), quantity: Number(i.payload.quantity), unit: String(i.payload.unit), category: String(i.payload.category) }));
  const shown = items.filter((x) => !queued.some((q) => q.id === x.id));

  return (
    <Screen
      belowHeader
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      refreshing={refreshing}
      footer={<Button title={s.add} icon="plus" onPress={onAdd} />}
    >
      {cachedOnly ? <Notice tone="info">{t.sync.cachedList}</Notice> : null}
      {queued.map((q) => (
        <Card key={q.id}>
          <View style={styles.between}>
            <View style={styles.flex}>
              <Text variant="label">{q.name}</Text>
              <Text variant="caption" muted>{cat[q.category] ?? q.category}</Text>
            </View>
            <Text variant="label">{`${fmt(q.quantity)} ${unit[q.unit] ?? q.unit}`}</Text>
          </View>
          <Pill tone="amber">{t.sync.waiting}</Pill>
        </Card>
      ))}
      {shown.map((item) => (
        <Card
          key={item.id}
          onPress={() => {
            setOpen(open === item.id ? null : item.id);
            setChange('');
            setError(null);
          }}
          accessibilityLabel={`${item.name}, ${fmt(item.quantity)} ${unit[item.unit] ?? item.unit}`}
        >
          <View style={styles.between}>
            <View style={styles.flex}>
              <Text variant="label">{item.name}</Text>
              <Text variant="caption" muted>{cat[item.category] ?? item.category}</Text>
            </View>
            <Text variant="label" color={item.low ? c.danger : c.primary}>{`${fmt(item.quantity)} ${unit[item.unit] ?? item.unit}`}</Text>
          </View>
          {item.low ? <Pill tone="red" icon="alert-triangle">{s.low}</Pill> : null}
          {open === item.id ? (
            <View style={styles.adjust}>
              <TextField label={s.change} placeholder={s.changeBy} value={change} onChangeText={setChange} keyboardType="numeric" error={error ?? undefined} />
              <View style={styles.row}>
                <Button title={s.use} icon="minus" variant="secondary" onPress={() => adjust(item, 'use')} loading={busy === 'use'} style={styles.flex} />
                <Button title={s.addMore} icon="plus" onPress={() => adjust(item, 'add')} loading={busy === 'add'} style={styles.flex} />
              </View>
            </View>
          ) : null}
        </Card>
      ))}
      {!shown.length && !queued.length ? <Empty icon="package" title={s.empty} body={s.emptyBody} /> : null}
    </Screen>
  );
}

/** Put something in the store. Saved now, or on the phone until there is signal. */
export function StoreAddScreen({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const s = t.store;
  const { session, farm } = useSession();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<(typeof STORE_CATEGORIES)[number]>('seed');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<(typeof STORE_UNITS)[number]>('bags');
  const [lowAt, setLowAt] = useState('');
  const [error, setError] = useState<keyof typeof s.errors | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'sent' | 'queued' | null>(null);

  async function save() {
    if (name.trim().length < 2) return setError('name');
    const q = toNumber(quantity);
    if (!Number.isFinite(q) || q < 0 || quantity.trim() === '') return setError('quantity');
    const low = lowAt.trim() ? toNumber(lowAt) : null;
    if (!session || !farm) return;
    setError(null);
    setBusy(true);
    const res = await submit('inventory_add', session.user.id, {
      farm_id: farm.id,
      item_name: name.trim().slice(0, 120),
      category,
      quantity: q,
      unit,
      reserved_quantity: 0,
      ...(low != null && Number.isFinite(low) && low >= 0 ? { reorder_threshold: low } : {}),
    });
    setBusy(false);
    if (res === 'rejected') return setError('errorGeneric');
    setDone(res);
  }

  if (done) {
    return (
      <Screen belowHeader footer={<Button title={t.common.done} icon="check" onPress={onDone} />}>
        <Notice tone={done === 'sent' ? 'success' : 'info'}>{done === 'sent' ? s.saved : s.queued}</Notice>
      </Screen>
    );
  }

  return (
    <Screen belowHeader footer={<Button title={s.save} icon="check" onPress={save} loading={busy} />}>
      <TextField label={s.name} placeholder={s.namePlaceholder} value={name} onChangeText={setName} maxLength={120} error={error === 'name' ? s.errors.name : undefined} />
      <Text variant="label">{s.category}</Text>
      <Chips label={s.category} value={category} onChange={setCategory} options={STORE_CATEGORIES.map((k) => ({ value: k, label: s.categories[k] }))} />
      <TextField label={s.quantity} placeholder="0" value={quantity} onChangeText={setQuantity} keyboardType="numeric" error={error === 'quantity' ? s.errors.quantity : undefined} />
      <Text variant="label">{s.unit}</Text>
      <Chips label={s.unit} value={unit} onChange={setUnit} options={STORE_UNITS.map((k) => ({ value: k, label: s.units[k] }))} />
      <TextField label={s.lowAt} hint={s.optional} placeholder="0" value={lowAt} onChangeText={setLowAt} keyboardType="numeric" />
      {error === 'errorGeneric' ? <Notice>{s.errors.errorGeneric}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: space[3] },
  between: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  adjust: { gap: space[3], paddingTop: space[2] },
});
