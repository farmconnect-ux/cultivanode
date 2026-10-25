import { formatNaira } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { submit, useOutbox } from '../lib/outbox';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, loadBook, PAYMENT_METHODS, todayIso, type BookEntry } from '../lib/records';
import { useSession } from '../lib/session';
import { color as c, space } from '../theme';
import { Button, Card, Chips, Empty, Loading, Notice, Pill, Row, Screen, SectionTitle, Text, TextField } from '../ui';

export const toNumber = (v: string) => Number(v.replace(/[,\s₦]/g, ''));

/** Farm books: money in and out for the open farm, including entries still waiting on the phone. */
export function BooksScreen({ onAdd }: { onAdd: (type: 'income' | 'expense') => void }) {
  const { t } = useI18n();
  const b = t.books;
  const { farm } = useSession();
  const waiting = useOutbox(['book_entry']).filter((i) => i.payload.farm_id === farm?.id);
  const [entries, setEntries] = useState<BookEntry[] | null>(null);
  const [cachedOnly, setCachedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!farm) return setEntries([]);
    const res = await loadBook(farm.id).catch(() => null);
    setEntries(res?.data ?? []);
    setCachedOnly(Boolean(res?.offline));
  }, [farm]);

  useEffect(() => {
    load();
  }, [load, waiting.length]);

  if (!entries) return <Loading label={t.common.loading} />;

  const queued: (BookEntry & { waiting: true })[] = waiting.map((i) => ({
    id: i.id,
    type: i.payload.type as 'income' | 'expense',
    category: String(i.payload.category),
    description: String(i.payload.description),
    amountKobo: Number(i.payload.amount_kobo),
    date: String(i.payload.transaction_date ?? ''),
    waiting: true,
  }));
  const all = [...queued, ...entries.filter((e) => !queued.some((q) => q.id === e.id))];
  const sum = (type: 'income' | 'expense') => all.filter((e) => e.type === type).reduce((s, e) => s + e.amountKobo, 0);
  const moneyIn = sum('income');
  const moneyOut = sum('expense');
  const cat = b.categories as Record<string, string>;

  return (
    <Screen
      belowHeader
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      refreshing={refreshing}
      footer={
        <View style={styles.actions}>
          <Button title={b.addOut} icon="minus" variant="secondary" onPress={() => onAdd('expense')} style={styles.flex} />
          <Button title={b.addIn} icon="plus" onPress={() => onAdd('income')} style={styles.flex} />
        </View>
      }
    >
      {cachedOnly ? <Notice tone="info">{t.sync.cachedList}</Notice> : null}
      {queued.length ? <Notice tone="warning">{fill(t.sync.waitingCount, { n: queued.length })}</Notice> : null}
      <View style={styles.kpis}>
        <Card style={styles.flex}>
          <Text variant="caption" muted>{b.moneyIn}</Text>
          <Text variant="label" color={c.secondary}>{formatNaira(moneyIn)}</Text>
        </Card>
        <Card style={styles.flex}>
          <Text variant="caption" muted>{b.moneyOut}</Text>
          <Text variant="label" color={c.danger}>{formatNaira(moneyOut)}</Text>
        </Card>
      </View>
      <Card tone="soft">
        <Text variant="caption" muted>{b.left}</Text>
        <Text variant="heading" color={moneyIn - moneyOut < 0 ? c.danger : c.primary}>{formatNaira(moneyIn - moneyOut)}</Text>
      </Card>

      {all.length ? (
        <>
          <SectionTitle title={b.recent} />
          {all.map((e) => (
            <Row
              key={e.id}
              icon={e.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'}
              title={e.description}
              detail={[cat[e.category] ?? e.category, e.date?.slice(0, 10)].filter(Boolean).join(' · ')}
              right={
                <View style={styles.right}>
                  <Text variant="label" color={e.type === 'income' ? c.secondary : c.danger}>{`${e.type === 'income' ? '+' : '−'}${formatNaira(e.amountKobo)}`}</Text>
                  {'waiting' in e ? <Pill tone="amber">{t.sync.waiting}</Pill> : null}
                </View>
              }
            />
          ))}
        </>
      ) : (
        <Empty icon="book-open" title={b.empty} body={b.emptyBody} />
      )}
    </Screen>
  );
}

/** Write down money in or out. Saved now, or on the phone until there is signal. */
export function BookEntryScreen({ type, onDone }: { type: 'income' | 'expense'; onDone: () => void }) {
  const { t } = useI18n();
  const b = t.books;
  const { session, farm } = useSession();
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [category, setCategory] = useState<string>(categories[0]);
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>('cash');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<keyof typeof b.errors | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'sent' | 'queued' | null>(null);

  async function save() {
    const naira = toNumber(amount);
    if (!Number.isFinite(naira) || naira <= 0) return setError('amount');
    const description = note.trim() || (b.categories as Record<string, string>)[category];
    if (description.length < 2) return setError('note');
    if (!session || !farm) return;
    setError(null);
    setBusy(true);
    const res = await submit('book_entry', session.user.id, {
      farm_id: farm.id,
      type,
      category,
      description: description.slice(0, 500),
      amount_kobo: Math.round(naira * 100),
      payment_method: method,
      transaction_date: todayIso(),
    });
    setBusy(false);
    if (res === 'rejected') return setError('errorGeneric');
    setDone(res);
  }

  if (done) {
    return (
      <Screen belowHeader footer={<Button title={t.common.done} icon="check" onPress={onDone} />}>
        <Notice tone={done === 'sent' ? 'success' : 'info'}>{done === 'sent' ? b.saved : b.queued}</Notice>
      </Screen>
    );
  }

  const cat = b.categories as Record<string, string>;
  return (
    <Screen belowHeader footer={<Button title={b.save} icon="check" onPress={save} loading={busy} />}>
      <TextField label={b.amount} prefix="₦" placeholder={b.amountPlaceholder} value={amount} onChangeText={setAmount} keyboardType="numeric" error={error === 'amount' ? b.errors.amount : undefined} />
      <Text variant="label">{b.category}</Text>
      <Chips label={b.category} value={category} onChange={setCategory} options={categories.map((k) => ({ value: k, label: cat[k] }))} />
      <TextField label={b.note} placeholder={b.notePlaceholder} value={note} onChangeText={setNote} maxLength={500} error={error === 'note' ? b.errors.note : undefined} />
      <Text variant="label">{b.method}</Text>
      <Chips label={b.method} value={method} onChange={setMethod} options={PAYMENT_METHODS.map((k) => ({ value: k, label: b.methods[k] }))} />
      {error === 'errorGeneric' ? <Notice>{b.errors.errorGeneric}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: space[3] },
  kpis: { flexDirection: 'row', gap: space[3] },
  right: { alignItems: 'flex-end', gap: 4 },
});
