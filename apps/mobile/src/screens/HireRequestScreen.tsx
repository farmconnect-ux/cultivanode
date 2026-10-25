import { formatNaira, LEGAL_VERSION } from '@cultivanode/shared';
import { addDays } from '@cultivanode/shared/crop-plan';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { shortDate } from '../lib/dates';
import { today } from '../lib/farm';
import { findOffers, JOBS, myTier, priceFor, requestBooking, verifyNin, type BookingError, type HireMode, type NinError, type Offer } from '../lib/hire';
import { useSession } from '../lib/session';
import { color as c, space } from '../theme';
import { Button, Card, Chips, Choice, Empty, Header, Icon, Loading, Notice, Pill, Screen, Steps, Text, TextField } from '../ui';

type Props = { mode: HireMode; onBack: () => void; onSent: (bookingId: string, message: string) => void };
type When = 'tomorrow' | 'two' | 'week' | 'other';

/** Hire in three steps: the job, owners near the farm with their price, then check and send. */
export function HireRequestScreen({ mode, onBack, onSent }: Props) {
  const { t } = useI18n();
  const h = t.hire;
  const { farm, account } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [jobKey, setJobKey] = useState(JOBS[mode][0]!.key);
  const [when, setWhen] = useState<When>('tomorrow');
  const [otherDate, setOtherDate] = useState('');
  const [qty, setQty] = useState(farm?.areaHa ? String(farm.areaHa) : '1');
  const [offers, setOffers] = useState<{ list: Offer[]; radiusKm: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Offer | null>(null);
  const [note, setNote] = useState('');
  const [tier, setTier] = useState<number | null>(null);
  const [nin, setNin] = useState('');
  const [ninConsent, setNinConsent] = useState(false);
  const [error, setError] = useState<BookingError | NinError | 'dateBad' | null>(null);
  const [sending, setSending] = useState(false);

  const job = JOBS[mode].find((j) => j.key === jobKey)!;
  const date = when === 'tomorrow' ? addDays(today(), 1) : when === 'two' ? addDays(today(), 2) : when === 'week' ? addDays(today(), 7) : otherDate.trim();
  const quantity = Number(qty.replace(',', '.'));

  useEffect(() => {
    myTier().then(setTier).catch(() => setTier(null));
  }, []);

  // The farm can load after the first render: start from its size unless the farmer typed something.
  const [qtyTouched, setQtyTouched] = useState(false);
  useEffect(() => {
    if (!qtyTouched && farm?.areaHa) setQty(String(farm.areaHa));
  }, [farm?.areaHa, qtyTouched]);

  async function find() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today() || date > addDays(today(), 60)) return setError('dateBad');
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10000) return setError('bad_quantity');
    if (!farm) return;
    setError(null);
    setStep(2);
    setOffers(null);
    setLoadError(null);
    const res = await findOffers(farm.id, job);
    if ('error' in res) {
      setLoadError(res.error === 'offline' ? t.common.offline : h.errors.errorGeneric);
      return;
    }
    setOffers({ list: res.offers, radiusKm: res.radiusKm });
  }

  async function send() {
    if (!chosen || !farm) return;
    const price = priceFor(chosen, job.unit);
    if (!price) return setError('bad_unit');
    setSending(true);
    setError(null);
    if ((tier ?? 0) < 1) {
      const check = await verifyNin(nin, ninConsent, LEGAL_VERSION);
      if ('error' in check) {
        setSending(false);
        return setError(check.error);
      }
      setTier(1);
    }
    const res = await requestBooking({ listingId: chosen.listingId, farmId: farm.id, date, unit: price.unit, quantity, note });
    setSending(false);
    if ('error' in res) return setError(res.error);
    onSent(res.id, h.sent);
  }

  const errorText = !error
    ? null
    : error === 'dateBad'
      ? h.errors.bad_date
      : error in h.ninErrors
        ? h.ninErrors[error as keyof typeof h.ninErrors]
        : h.errors[error as keyof typeof h.errors] ?? h.errors.errorGeneric;

  const back = step === 1 ? onBack : () => setStep(step === 3 ? 2 : 1);
  const header = <Header onBack={back} backLabel={t.common.back} step={fill(h.step, { n: step })} right={<View style={styles.steps}><Steps n={step} of={3} /></View>} />;
  const title = mode === 'tractor' ? h.tractor : h.hands;

  if (step === 1) {
    return (
      <Screen header={header} footer={<Button title={h.findOwners} icon="search" onPress={find} disabled={!farm} />}>
        <Text variant="title" accessibilityRole="header">{title}</Text>
        <Text variant="heading">{h.whatJob}</Text>
        <Chips label={h.whatJob} value={jobKey} onChange={setJobKey} options={JOBS[mode].map((j) => ({ value: j.key, label: h.jobs[j.key as keyof typeof h.jobs] }))} />
        <Text variant="heading">{h.when}</Text>
        <Chips
          label={h.when}
          value={when}
          onChange={(v) => {
            setWhen(v);
            setError(null);
          }}
          options={[
            { value: 'tomorrow', label: h.tomorrow },
            { value: 'two', label: h.inTwo },
            { value: 'week', label: h.nextWeek },
            { value: 'other', label: h.otherDate },
          ]}
        />
        {when === 'other' ? (
          <TextField
            label={h.dateLabel}
            hint={h.dateHint}
            placeholder={addDays(today(), 3)}
            value={otherDate}
            onChangeText={(v) => setOtherDate(v.replace(/[^0-9-]/g, '').slice(0, 10))}
            keyboardType="numbers-and-punctuation"
          />
        ) : null}
        <TextField
          label={`${h.howMuch} (${h.units[job.unit]})`}
          value={qty}
          onChangeText={(v) => {
            setQty(v.replace(/[^0-9.,]/g, ''));
            setQtyTouched(true);
            setError(null);
          }}
          keyboardType="decimal-pad"
          maxLength={8}
        />
        {errorText ? <Notice>{errorText}</Notice> : null}
      </Screen>
    );
  }

  if (step === 2) {
    return (
      <Screen header={header}>
        <Text variant="title" accessibilityRole="header">{h.jobs[job.key as keyof typeof h.jobs]}</Text>
        <Text muted>{[farm ? fill(h.near, { farm: farm.name }) : '', shortDate(date), `${quantity} ${h.units[job.unit]}`].filter(Boolean).join(' · ')}</Text>
        {loadError ? (
          <>
            <Notice>{loadError}</Notice>
            <Button title={t.common.retry} variant="secondary" onPress={find} />
          </>
        ) : !offers ? (
          <Loading label={t.common.loading} />
        ) : offers.list.length === 0 ? (
          <Empty icon="search" title={h.noneNear} body={h.noneNearBody} action={<Button title={t.common.back} variant="secondary" compact onPress={() => setStep(1)} />} />
        ) : (
          <>
            <Text variant="caption" muted>{fill(h.within, { km: offers.radiusKm })}</Text>
            {offers.list.map((o) => {
              const price = priceFor(o, job.unit);
              return (
                <Card key={o.listingId}>
                  <View style={styles.between}>
                    <View style={styles.flex}>
                      <Text variant="label">{o.title}</Text>
                      <Text variant="caption" muted>{[o.provider.name, fill(h.kmAway, { km: o.distanceKm })].filter(Boolean).join(' · ')}</Text>
                    </View>
                    {price ? (
                      <View style={styles.price}>
                        <Text variant="heading" color={c.primary}>{formatNaira(price.kobo)}</Text>
                        <Text variant="caption" muted>{h.perUnit[price.unit]}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.pills}>
                    {o.provider.rating ? <Pill tone="green" icon="star">{`${o.provider.rating.avg} (${o.provider.rating.count})`}</Pill> : <Pill tone="grey">{h.newProvider}</Pill>}
                    {o.provider.tier >= 1 ? <Pill tone="blue" icon="shield">{h.verified}</Pill> : null}
                    {o.operatorIncluded ? <Pill tone="grey">{h.withOperator}</Pill> : null}
                  </View>
                  {price && price.unit === job.unit ? (
                    <Text variant="caption" muted>{fill(h.estimate, { amount: formatNaira(Math.round(price.kobo * quantity)), qty: quantity, unit: h.units[job.unit] })}</Text>
                  ) : null}
                  <Button
                    title={h.choose}
                    onPress={() => {
                      setChosen(o);
                      setError(null);
                      setStep(3);
                    }}
                  />
                </Card>
              );
            })}
          </>
        )}
      </Screen>
    );
  }

  const price = chosen ? priceFor(chosen, job.unit) : null;
  const needNin = (tier ?? 0) < 1;
  return (
    <Screen
      header={header}
      footer={
        <>
          <Text variant="caption" muted>{h.payNote}</Text>
          <Button title={needNin ? h.ninCheck : h.send} icon="send" onPress={send} loading={sending} disabled={needNin && (!ninConsent || nin.replace(/\s/g, '').length !== 11)} />
        </>
      }
    >
      <Text variant="title" accessibilityRole="header">{h.confirmTitle}</Text>
      <Card>
        <Line label={h.job} value={h.jobs[job.key as keyof typeof h.jobs]} />
        <Line label={h.owner} value={[chosen?.provider.name, chosen?.title].filter(Boolean).join(' · ')} />
        <Line label={h.date} value={shortDate(date)} />
        <Line label={h.farm} value={farm?.name ?? ''} />
        {price ? <Line label={h.price} value={`${formatNaira(price.kobo)} ${h.perUnit[price.unit]}`} /> : null}
        {price ? <Line label={h.total} value={formatNaira(Math.round(price.kobo * quantity))} strong /> : null}
      </Card>
      <TextField label={h.note} placeholder={h.notePlaceholder} value={note} onChangeText={setNote} maxLength={500} multiline />

      {needNin ? (
        <Card tone="amber">
          <View style={styles.row}>
            <Icon name="shield" size={22} color={c.amber} />
            <Text variant="heading" style={styles.flex}>{h.ninTitle}</Text>
          </View>
          <Text>{h.ninBody}</Text>
          <TextField label={h.nin} value={nin} onChangeText={(v) => setNin(v.replace(/[^0-9 ]/g, '').slice(0, 13))} keyboardType="number-pad" maxLength={13} />
          <Choice title={h.ninConsent} selected={ninConsent} onPress={() => setNinConsent(!ninConsent)} />
          {account?.profile.full_name ? <Text variant="caption" muted>{account.profile.full_name}</Text> : null}
        </Card>
      ) : null}

      {errorText ? <Notice>{errorText}</Notice> : null}
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
  flex: { flex: 1 },
  steps: { width: 96 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  between: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  price: { alignItems: 'flex-end' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space[3], minHeight: 32 },
  lineValue: { flexShrink: 1, textAlign: 'right' },
});
