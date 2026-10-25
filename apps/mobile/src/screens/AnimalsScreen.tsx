import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { submit, useOutbox, type OutboxKind } from '../lib/outbox';
import { ANIMAL_TYPES, HEALTH_TYPES, loadHerd, loadHerds, PURPOSES, todayIso, type Herd, type HerdEvent } from '../lib/records';
import { useSession } from '../lib/session';
import { color as c, space } from '../theme';
import { Button, Card, Chips, Empty, Loading, Notice, Pill, Row, Screen, SectionTitle, Text, TextField, type IconName } from '../ui';
import { toNumber } from './BooksScreen';

const TYPE_ICON: Record<string, IconName> = { poultry: 'feather', fish: 'droplet', other: 'circle' };

/** The farm's flocks, ponds and herds. */
export function AnimalsScreen({ onAdd, onOpen }: { onAdd: () => void; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  const a = t.animals;
  const { farm } = useSession();
  const waiting = useOutbox(['herd_add']).filter((i) => i.payload.farm_id === farm?.id);
  const [herds, setHerds] = useState<Herd[] | null>(null);
  const [cachedOnly, setCachedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!farm) return setHerds([]);
    const res = await loadHerds(farm.id).catch(() => null);
    setHerds(res?.data ?? []);
    setCachedOnly(Boolean(res?.offline));
  }, [farm]);

  useEffect(() => {
    load();
  }, [load, waiting.length]);

  if (!herds) return <Loading label={t.common.loading} />;
  const types = a.types as Record<string, string>;
  const shown = herds.filter((h) => !waiting.some((w) => w.id === h.id));

  return (
    <Screen
      belowHeader
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      refreshing={refreshing}
      footer={<Button title={a.add} icon="plus" onPress={onAdd} />}
    >
      {cachedOnly ? <Notice tone="info">{t.sync.cachedList}</Notice> : null}
      {waiting.map((w) => (
        <Row
          key={w.id}
          icon={TYPE_ICON[String(w.payload.animal_type)] ?? 'circle'}
          title={String(w.payload.group_name)}
          detail={`${types[String(w.payload.animal_type)] ?? ''} · ${fill(a.head, { n: Number(w.payload.population) })}`}
          right={<Pill tone="amber">{t.sync.waiting}</Pill>}
        />
      ))}
      {shown.map((h) => (
        <Row
          key={h.id}
          icon={TYPE_ICON[h.type] ?? 'circle'}
          title={h.name}
          detail={[types[h.type] ?? h.type, fill(a.head, { n: h.population }), h.ageWeeks != null ? fill(a.weeks, { n: h.ageWeeks }) : null].filter(Boolean).join(' · ')}
          onPress={() => onOpen(h.id)}
        />
      ))}
      {!shown.length && !waiting.length ? <Empty icon="feather" title={a.empty} body={a.emptyBody} /> : null}
    </Screen>
  );
}

/** Add a flock, pond or herd. */
export function AnimalsAddScreen({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const a = t.animals;
  const { session, farm } = useSession();
  const [name, setName] = useState('');
  const [type, setType] = useState<(typeof ANIMAL_TYPES)[number]>('poultry');
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]>('meat');
  const [count, setCount] = useState('');
  const [age, setAge] = useState('');
  const [breed, setBreed] = useState('');
  const [error, setError] = useState<keyof typeof a.errors | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'sent' | 'queued' | null>(null);

  async function save() {
    if (!name.trim()) return setError('name');
    const n = Math.round(toNumber(count));
    if (!Number.isFinite(n) || n < 1) return setError('count');
    const weeks = age.trim() ? Math.round(toNumber(age)) : null;
    if (!session || !farm) return;
    setError(null);
    setBusy(true);
    const res = await submit('herd_add', session.user.id, {
      farm_id: farm.id,
      group_name: name.trim().slice(0, 100),
      animal_type: type,
      purpose,
      population: n,
      health_status: 'healthy',
      ...(weeks != null && Number.isFinite(weeks) && weeks >= 0 ? { age_weeks: weeks } : {}),
      ...(breed.trim() ? { breed: breed.trim().slice(0, 80) } : {}),
    });
    setBusy(false);
    if (res === 'rejected') return setError('errorGeneric');
    setDone(res);
  }

  if (done) {
    return (
      <Screen belowHeader footer={<Button title={t.common.done} icon="check" onPress={onDone} />}>
        <Notice tone={done === 'sent' ? 'success' : 'info'}>{done === 'sent' ? a.saved : a.queued}</Notice>
      </Screen>
    );
  }

  return (
    <Screen belowHeader footer={<Button title={a.save} icon="check" onPress={save} loading={busy} />}>
      <TextField label={a.name} placeholder={a.namePlaceholder} value={name} onChangeText={setName} maxLength={100} error={error === 'name' ? a.errors.name : undefined} />
      <Text variant="label">{a.type}</Text>
      <Chips label={a.type} value={type} onChange={setType} options={ANIMAL_TYPES.map((k) => ({ value: k, label: a.types[k] }))} />
      <Text variant="label">{a.purpose}</Text>
      <Chips label={a.purpose} value={purpose} onChange={setPurpose} options={PURPOSES.map((k) => ({ value: k, label: a.purposes[k] }))} />
      <TextField label={a.count} placeholder="0" value={count} onChangeText={setCount} keyboardType="number-pad" error={error === 'count' ? a.errors.count : undefined} />
      <TextField label={a.ageWeeks} hint={a.optional} placeholder="0" value={age} onChangeText={setAge} keyboardType="number-pad" />
      <TextField label={a.breed} hint={a.optional} value={breed} onChangeText={setBreed} maxLength={80} />
      {error === 'errorGeneric' ? <Notice>{a.errors.errorGeneric}</Notice> : null}
    </Screen>
  );
}

export type HerdLog = 'feed' | 'health' | 'loss';

/** One flock, pond or herd: its numbers, what was logged, and buttons to log more. */
export function HerdScreen({ id, onLog }: { id: string; onLog: (kind: HerdLog) => void }) {
  const { t } = useI18n();
  const a = t.animals;
  const waiting = useOutbox(['herd_feed', 'herd_health', 'herd_loss']).filter((i) => i.payload.group_id === id);
  const [data, setData] = useState<{ herd: Herd; events: HerdEvent[] } | null | 'missing'>(null);
  const [cachedOnly, setCachedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await loadHerd(id).catch(() => null);
    setData(res?.data ?? 'missing');
    setCachedOnly(Boolean(res?.offline));
  }, [id]);

  useEffect(() => {
    load();
  }, [load, waiting.length]);

  if (data === null) return <Loading label={t.common.loading} />;
  if (data === 'missing') return <Screen belowHeader><Notice>{a.errors.notFound}</Notice></Screen>;
  const { herd, events } = data;
  const types = a.types as Record<string, string>;
  const health = a.healthTypes as Record<string, string>;
  const queued: (HerdEvent & { waiting: true })[] = waiting.map((w) => ({
    id: w.id,
    kind: w.kind === 'herd_feed' ? 'feed' : w.kind === 'herd_loss' ? 'loss' : 'health',
    title: String(w.payload.feed_type ?? w.payload.event_type ?? 'mortality'),
    detail: w.kind === 'herd_feed' ? `${Number(w.payload.quantity_kg)} kg` : w.kind === 'herd_loss' ? String(w.payload.head_affected) : String(w.payload.medication_name ?? ''),
    date: w.createdAt,
    waiting: true,
  }));
  const all = [...queued, ...events.filter((e) => !queued.some((q) => q.id === e.id))];
  const lostWaiting = waiting.filter((w) => w.kind === 'herd_loss').reduce((s, w) => s + Number(w.payload.head_affected || 0), 0);

  const label = (e: HerdEvent) =>
    e.kind === 'feed' ? { title: e.title, detail: e.detail } : e.kind === 'loss' ? { title: fill(a.died, { n: e.detail ?? '0' }), detail: null } : { title: health[e.title] ?? e.title, detail: e.detail };

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
        <View style={styles.footer}>
          <Button title={a.logFeed} icon="shopping-bag" onPress={() => onLog('feed')} />
          <View style={styles.row}>
            <Button title={a.logHealth} icon="shield" variant="secondary" onPress={() => onLog('health')} style={styles.flex} />
            <Button title={a.logLoss} icon="minus-circle" variant="secondary" onPress={() => onLog('loss')} style={styles.flex} />
          </View>
        </View>
      }
    >
      {cachedOnly ? <Notice tone="info">{t.sync.cachedList}</Notice> : null}
      <Text variant="heading">{herd.name}</Text>
      <Text muted>{[types[herd.type] ?? herd.type, herd.breed].filter(Boolean).join(' · ')}</Text>
      <View style={styles.row}>
        <Card style={styles.flex}>
          <Text variant="caption" muted>{a.count}</Text>
          <Text variant="heading" color={c.primary}>{String(Math.max(0, herd.population - lostWaiting))}</Text>
        </Card>
        {herd.ageWeeks != null ? (
          <Card style={styles.flex}>
            <Text variant="caption" muted>{a.ageWeeks}</Text>
            <Text variant="heading" color={c.primary}>{String(herd.ageWeeks)}</Text>
          </Card>
        ) : null}
      </View>
      <SectionTitle title={a.history} />
      {all.length ? (
        all.map((e) => {
          const l = label(e);
          return (
            <Row
              key={e.id}
              icon={e.kind === 'feed' ? 'shopping-bag' : e.kind === 'loss' ? 'minus-circle' : 'shield'}
              title={l.title}
              detail={[l.detail, e.date.slice(0, 10)].filter(Boolean).join(' · ')}
              right={'waiting' in e ? <Pill tone="amber">{t.sync.waiting}</Pill> : undefined}
            />
          );
        })
      ) : (
        <Text muted>{a.noHistory}</Text>
      )}
    </Screen>
  );
}

/** Log feed, a vaccine or treatment, or a loss for one flock, pond or herd. */
export function HerdLogScreen({ id, kind, onDone }: { id: string; kind: HerdLog; onDone: () => void }) {
  const { t } = useI18n();
  const a = t.animals;
  const { session, farm } = useSession();
  const [feed, setFeed] = useState('');
  const [kg, setKg] = useState('');
  const [healthType, setHealthType] = useState<(typeof HEALTH_TYPES)[number]>('vaccination');
  const [medicine, setMedicine] = useState('');
  const [lost, setLost] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<keyof typeof a.errors | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<'sent' | 'queued' | null>(null);

  async function save() {
    if (!session || !farm) return;
    let out: { kind: OutboxKind; payload: Record<string, unknown> };
    const base = { farm_id: farm.id, group_id: id };
    const note = notes.trim() ? { notes: notes.trim().slice(0, 1000) } : {};
    if (kind === 'feed') {
      const q = toNumber(kg);
      if (!Number.isFinite(q) || q <= 0) return setError('kg');
      out = { kind: 'herd_feed', payload: { ...base, feed_type: (feed.trim() || a.feedType).slice(0, 80), quantity_kg: q, feeding_date: todayIso(), ...note } };
    } else if (kind === 'health') {
      if (!medicine.trim() && !notes.trim()) return setError('medicine');
      out = { kind: 'herd_health', payload: { ...base, event_type: healthType, ...(medicine.trim() ? { medication_name: medicine.trim().slice(0, 120) } : {}), administered_on: todayIso(), ...note } };
    } else {
      const n = Math.round(toNumber(lost));
      if (!Number.isFinite(n) || n < 1) return setError('lost');
      out = { kind: 'herd_loss', payload: { ...base, head_affected: n, administered_on: todayIso(), ...note } };
    }
    setError(null);
    setBusy(true);
    const res = await submit(out.kind, session.user.id, out.payload);
    setBusy(false);
    if (res === 'rejected') return setError('errorGeneric');
    setDone(res);
  }

  if (done) {
    return (
      <Screen belowHeader footer={<Button title={t.common.done} icon="check" onPress={onDone} />}>
        <Notice tone={done === 'sent' ? 'success' : 'info'}>{done === 'sent' ? a.saved : a.queued}</Notice>
      </Screen>
    );
  }

  return (
    <Screen belowHeader footer={<Button title={t.common.save} icon="check" onPress={save} loading={busy} />}>
      {kind === 'feed' ? (
        <>
          <TextField label={a.feedType} placeholder={a.feedPlaceholder} value={feed} onChangeText={setFeed} maxLength={80} />
          <TextField label={a.kg} placeholder="0" value={kg} onChangeText={setKg} keyboardType="numeric" error={error === 'kg' ? a.errors.kg : undefined} />
        </>
      ) : kind === 'health' ? (
        <>
          <Text variant="label">{a.healthType}</Text>
          <Chips label={a.healthType} value={healthType} onChange={setHealthType} options={HEALTH_TYPES.map((k) => ({ value: k, label: a.healthTypes[k] }))} />
          <TextField label={a.medicine} placeholder={a.medicinePlaceholder} value={medicine} onChangeText={setMedicine} maxLength={120} error={error === 'medicine' ? a.errors.medicine : undefined} />
        </>
      ) : (
        <TextField label={a.lost} placeholder="0" value={lost} onChangeText={setLost} keyboardType="number-pad" error={error === 'lost' ? a.errors.lost : undefined} />
      )}
      <TextField label={kind === 'loss' ? a.cause : a.notes} hint={a.optional} value={notes} onChangeText={setNotes} maxLength={1000} multiline />
      {error === 'errorGeneric' ? <Notice>{a.errors.errorGeneric}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: space[3] },
  footer: { gap: space[3] },
});
