import { formatNaira } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { shortDate } from '../lib/dates';
import { bookingDetail, cancelBooking, confirmWork, markPaid, rateBooking, RATING_TAGS, type BookingDetail, type BookingError } from '../lib/hire';
import { siteLink } from '../lib/site';
import { color as c, space } from '../theme';
import { Button, Card, Header, Icon, Loading, Notice, Pill, Screen, Text, TextField } from '../ui';
import { statusTone } from './HireScreen';

type Props = { id: string; onBack: () => void };

/** One job: where it stands, what to do next, and paying the owner directly. */
export function BookingScreen({ id, onBack }: Props) {
  const { t, lang } = useI18n();
  const h = t.hire;
  const d = h.detail;
  const [b, setB] = useState<BookingDetail | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<BookingError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const x = await bookingDetail(id);
      setB(x);
      setAmount((a) => a || String(Math.round(Number(x.total_kobo) / 100)));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(key: string, fn: () => Promise<BookingError | null>, done?: string) {
    setBusy(key);
    setError(null);
    const err = await fn();
    setBusy(null);
    if (err) return setError(err);
    if (done) setNotice(done);
    await load();
  }

  const header = <Header onBack={onBack} backLabel={t.common.back} />;
  if (!b) {
    return (
      <Screen header={header}>
        {loadFailed ? (
          <>
            <Notice>{t.common.offline}</Notice>
            <Button title={t.common.retry} variant="secondary" onPress={load} />
          </>
        ) : (
          <Loading label={t.common.loading} />
        )}
      </Screen>
    );
  }

  const name = b.other?.name || b.other_name || h.owner;
  const body =
    b.status === 'requested'
      ? fill(d.requestedBody, { time: new Date(b.expires_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) })
      : b.status === 'accepted'
        ? fill(d.acceptedBody, { name, date: shortDate(b.job_date) })
        : b.status === 'in_progress'
          ? fill(d.inProgressBody, { name })
          : b.status === 'awaiting_confirmation'
            ? fill(d.awaitingBody, { name })
            : b.status === 'confirmed'
              ? fill(d.confirmedBody, { name })
              : b.status === 'completed'
                ? d.completedBody
                : d.closedBody;

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
      <Pill tone={statusTone(b.status)}>{h.status[b.status]}</Pill>
      <Text variant="title" accessibilityRole="header">{b.title}</Text>
      <Text muted>{body}</Text>
      {notice ? <Notice tone="success">{notice}</Notice> : null}
      {error ? <Notice>{h.errors[error] ?? h.errors.errorGeneric}</Notice> : null}

      <Card>
        <Line label={h.date} value={shortDate(b.job_date)} />
        <Line label={h.farm} value={b.farm_name} />
        <Line label={h.howMuch} value={`${b.quantity} ${h.units[b.unit]}`} />
        <Line label={h.price} value={`${formatNaira(Number(b.rate_kobo))} ${h.perUnit[b.unit]}`} />
        <Line label={h.total} value={formatNaira(Number(b.total_kobo))} strong />
      </Card>

      {b.other?.phone ? (
        <Button title={fill(d.call, { name })} icon="phone" variant="secondary" onPress={() => Linking.openURL(`tel:+${b.other!.phone!.replace(/^\+/, '')}`)} />
      ) : null}

      {b.can.confirm ? <Button title={d.confirm} icon="check-circle" onPress={() => run('confirm', () => confirmWork(id))} loading={busy === 'confirm'} /> : null}

      {b.can.mark_paid ? (
        <Card tone="soft">
          <Text variant="heading">{fill(d.payTitle, { name })}</Text>
          <Text muted>{d.payBody}</Text>
          <TextField label={d.amountPaid} value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" prefix="₦" />
          <Button title={d.markPaid} icon="check" onPress={() => run('paid', () => markPaid(id, Number(amount)))} loading={busy === 'paid'} />
        </Card>
      ) : null}
      {b.payment.mine ? <Notice tone="success">{fill(d.paidMine, { amount: formatNaira(Number(b.payment.mine.kobo)), date: shortDate(b.payment.mine.at) })}</Notice> : null}
      {b.payment.theirs_marked ? <Notice tone="info">{fill(d.theyMarked, { name })}</Notice> : null}

      {b.can.rate ? (
        <Card>
          <Text variant="heading">{d.rateTitle}</Text>
          <View style={styles.stars} accessibilityRole="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} accessibilityRole="radio" accessibilityState={{ checked: stars === n }} accessibilityLabel={`${n}`} onPress={() => setStars(n)} style={styles.star}>
                <Icon name="star" size={34} color={n <= stars ? '#e6a92a' : c.outline} />
              </Pressable>
            ))}
          </View>
          <View style={styles.tags}>
            {RATING_TAGS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => setTags(on ? tags.filter((x) => x !== tag) : [...tags, tag].slice(0, 5))}
                  style={[styles.tag, on && styles.tagOn]}
                >
                  <Text variant="small" color={on ? c.onDark : c.primary}>{d.tags[tag]}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextField label={h.note} value={comment} onChangeText={setComment} maxLength={500} multiline />
          <Button title={d.rateSend} onPress={() => run('rate', () => rateBooking(id, stars, tags, comment), d.rated)} loading={busy === 'rate'} disabled={!stars} />
        </Card>
      ) : null}
      {b.my_rating ? <Text variant="caption" muted>{fill(d.yourRating, { stars: b.my_rating.stars })}</Text> : null}

      {b.can.dispute ? (
        <View style={styles.group}>
          <Button title={d.problem} variant="danger" icon="alert-triangle" onPress={() => Linking.openURL(siteLink(lang, `account/bookings/${id}`))} />
          <Text variant="caption" muted>{d.problemHint}</Text>
        </View>
      ) : null}

      {b.can.cancel ? (
        <View style={styles.group}>
          <TextField label={d.cancelReason} value={reason} onChangeText={setReason} maxLength={300} />
          <Button title={d.cancel} variant="danger" icon="x" onPress={() => run('cancel', () => cancelBooking(id, reason))} loading={busy === 'cancel'} />
        </View>
      ) : null}
    </Screen>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text variant="caption" muted>{label}</Text>
      <Text variant={strong ? 'heading' : 'label'} style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[2] },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[3], minHeight: 32 },
  lineValue: { flexShrink: 1, textAlign: 'right' },
  stars: { flexDirection: 'row', gap: space[1] },
  star: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  tag: { minHeight: 36, paddingHorizontal: space[3], borderRadius: 999, borderWidth: 1.5, borderColor: c.outline, justifyContent: 'center' },
  tagOn: { backgroundColor: c.primaryContainer, borderColor: c.primaryContainer },
});
