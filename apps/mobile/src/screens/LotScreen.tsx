import { formatNaira, formatNgPhone, NIGERIAN_STATES } from '@cultivanode/shared';
import { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { escrowOn, loadLot, placeOrder, type Lot, type OrderError } from '../lib/market';
import { useSession } from '../lib/session';
import { siteLink } from '../lib/site';
import { color as c, font, radius, space } from '../theme';
import { Button, Card, Header, Icon, Loading, Notice, Pill, Screen, SelectField, Text, TextField } from '../ui';

type Props = { id: string; onBack: () => void; onPlaced: (orderId: string) => void };

const DELIVERY_KOBO = 300_000; // same flat fee the server charges per seller

/** One lot: photos, price, seller, and ordering it with delivery details. */
export function LotScreen({ id, onBack, onPlaced }: Props) {
  const { t, lang } = useI18n();
  const l = t.lot;
  const m = t.market;
  const { account, farm } = useSession();
  const { width } = useWindowDimensions();
  const [lot, setLot] = useState<Lot | null | undefined>(undefined);
  const [escrow, setEscrow] = useState(false);
  const [qty, setQty] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<OrderError | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    loadLot(id)
      .then((x) => {
        setLot(x);
        if (x) setQty(String(x.minOrder));
      })
      .catch(() => setLot(null));
    escrowOn().then(setEscrow).catch(() => setEscrow(false));
  }, [id]);

  useEffect(() => {
    setState((s) => s || farm?.state || account?.profile.state || '');
    setLga((v) => v || farm?.lga || account?.profile.lga || '');
    setPhone((p) => p || (account?.profile.phone ? formatNgPhone(account.profile.phone) : ''));
  }, [farm, account]);

  const header = <Header onBack={onBack} backLabel={t.common.back} />;
  if (lot === undefined) return <Screen header={header}><Loading label={t.common.loading} /></Screen>;
  if (lot === null) return <Screen header={header}><Notice>{l.errors.listing_unavailable}</Notice></Screen>;

  const n = Number(qty.replace(',', '.'));
  const items = Number.isFinite(n) && n > 0 ? Math.round(lot.priceKobo * n) : 0;
  const soldOut = lot.available <= 0;

  async function order() {
    if (!lot) return;
    if (!Number.isFinite(n) || n <= 0) return setError('empty');
    setPlacing(true);
    setError(null);
    const res = await placeOrder({ listingId: lot.id, quantity: n, address, state, lga, phone: phone.replace(/\s/g, ''), notes });
    setPlacing(false);
    if ('error' in res) return setError(res.error);
    onPlaced(res.id);
  }

  return (
    <Screen
      header={header}
      footer={
        soldOut ? (
          <Button title={l.soldOut} disabled />
        ) : escrow ? (
          <>
            <Text variant="caption" muted>{l.escrowNote}</Text>
            <Button title={t.orders.payOnWeb} icon="external-link" onPress={() => Linking.openURL(siteLink(lang, `marketplace/${lot.id}`))} />
          </>
        ) : (
          <>
            <View style={styles.total}>
              <Text variant="label">{l.total}</Text>
              <Text style={styles.totalNum}>{formatNaira(items + (items ? DELIVERY_KOBO : 0))}</Text>
            </View>
            <Button title={l.place} icon="check" onPress={order} loading={placing} />
          </>
        )
      }
    >
      {lot.images.length ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.photos}>
          {lot.images.map((uri) => (
            <Image key={uri} source={{ uri }} style={[styles.photo, { width: width - space[5] * 2 }]} accessibilityIgnoresInvertColors />
          ))}
        </ScrollView>
      ) : null}

      <Text variant="title" accessibilityRole="header">{lot.title}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatNaira(lot.priceKobo)}</Text>
        <Text muted>{fill(m.per, { unit: lot.unit })}</Text>
      </View>

      <Card>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Icon name="user" size={20} />
          </View>
          <View style={styles.flex}>
            <Text variant="label">{lot.seller.name || l.seller}</Text>
            {lot.place ? <Text variant="caption" muted>{fill(l.from, { place: lot.place })}</Text> : null}
          </View>
        </View>
        <View style={styles.pills}>
          {lot.seller.rating !== null ? <Pill tone="green" icon="star">{`${lot.seller.rating.toFixed(1)} (${lot.seller.ratingCount})`}</Pill> : <Pill tone="grey">{m.newSeller}</Pill>}
          {lot.seller.verified ? <Pill tone="blue" icon="shield">{m.verified}</Pill> : null}
          <Pill tone={soldOut ? 'red' : 'grey'}>{soldOut ? l.soldOut : fill(m.available, { n: lot.available, unit: lot.unit })}</Pill>
        </View>
        {lot.minOrder > 1 ? <Text variant="caption" muted>{fill(l.min, { n: lot.minOrder, unit: lot.unit })}</Text> : null}
      </Card>

      {lot.description ? <Text>{lot.description}</Text> : null}

      {!soldOut && !escrow ? (
        <>
          <TextField label={fill(l.howMany, { unit: lot.unit })} value={qty} onChangeText={(v) => setQty(v.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad" maxLength={8} />
          <Text variant="heading">{l.deliverTo}</Text>
          <TextField label={l.address} value={address} onChangeText={setAddress} maxLength={200} />
          <SelectField
            label={t.onboarding.state}
            placeholder={t.onboarding.statePlaceholder}
            value={state}
            options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
            onChange={setState}
            closeLabel={t.common.close}
          />
          <TextField label={t.onboarding.lga} value={lga} onChangeText={setLga} maxLength={60} />
          <TextField label={l.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={20} />
          <TextField label={l.notes} value={notes} onChangeText={setNotes} maxLength={500} multiline />
          <Card>
            <Line label={l.items} value={formatNaira(items)} />
            <Line label={l.delivery} value={formatNaira(items ? DELIVERY_KOBO : 0)} />
          </Card>
          <Notice tone="info">{l.directNote}</Notice>
        </>
      ) : null}

      {error ? <Notice>{l.errors[error] ?? l.errors.errorGeneric}</Notice> : null}
    </Screen>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text muted>{label}</Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  photos: { marginHorizontal: 0 },
  photo: { height: 220, borderRadius: radius.lg, backgroundColor: c.track },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: space[2] },
  price: { fontFamily: font.display, fontSize: 28, color: c.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.mintSoft, alignItems: 'center', justifyContent: 'center' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 30 },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalNum: { fontFamily: font.display, fontSize: 22, color: c.primary },
});
