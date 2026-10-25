import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { myShop, sellLot, type LotType } from '../lib/market';
import { useSession } from '../lib/session';
import { color as c, radius, space } from '../theme';
import { Button, Chips, Header, Icon, Notice, Screen, Text, TextField } from '../ui';

type Props = { onBack: () => void; onDone: (message: string) => void; onShop: () => void };
const UNITS = ['bag', 'kg', 'tonne', 'basket', 'crate', 'piece', 'litre'] as const;

/** Sell my harvest: photo, what, how much, price. Saved on the phone when there is no connection. */
export function SellScreen({ onBack, onDone, onShop }: Props) {
  const { t } = useI18n();
  const s = t.sell;
  const { session, account, farm } = useSession();
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<LotType>('produce');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('bag');
  const [price, setPrice] = useState('');
  const [min, setMin] = useState('1');
  const [about, setAbout] = useState('');
  const [error, setError] = useState<keyof typeof s.errors | null>(null);
  const [busy, setBusy] = useState(false);
  const [needBank, setNeedBank] = useState(false);

  useEffect(() => {
    if (session) myShop(session.user.id).then((sh) => setNeedBank(!sh?.payout)).catch(() => undefined);
  }, [session]);

  async function pick(camera: boolean) {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [4, 3] };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0].uri);
  }

  async function publish() {
    const q = Number(qty.replace(',', '.'));
    const p = Number(price.replace(/[,\s]/g, ''));
    if (title.trim().length < 3) return setError('title');
    if (!Number.isFinite(q) || q <= 0) return setError('quantity');
    if (!Number.isFinite(p) || p <= 0) return setError('price');
    if (!session) return;
    setBusy(true);
    setError(null);
    const res = await sellLot(session.user.id, account?.profile.full_name ?? null, {
      title: title.trim(),
      type,
      unit,
      priceNaira: p,
      quantity: q,
      minOrder: Number(min) || 1,
      description: about,
      state: farm?.state ?? account?.profile.state ?? null,
      lga: farm?.lga ?? account?.profile.lga ?? null,
      farmId: type === 'produce' ? farm?.id ?? null : null,
      photoUri: photo,
    });
    setBusy(false);
    if (res === 'errorGeneric') return setError('generic');
    onDone(res === 'live' ? s.live : s.queued);
  }

  return (
    <Screen header={<Header onBack={onBack} backLabel={t.common.back} title={s.title} />} footer={<Button title={s.publish} icon="tag" onPress={publish} loading={busy} />}>
      <Text muted>{s.intro}</Text>
      {needBank ? (
        <Notice tone="warning">{s.needBank}</Notice>
      ) : null}
      {needBank ? <Button title={t.shop.addBank} variant="secondary" icon="credit-card" onPress={onShop} /> : null}

      {photo ? (
        <Pressable accessibilityRole="button" accessibilityLabel={s.retake} onPress={() => pick(true)}>
          <Image source={{ uri: photo }} style={styles.photo} accessibilityIgnoresInvertColors />
        </Pressable>
      ) : (
        <View style={styles.photoRow}>
          <Pressable accessibilityRole="button" onPress={() => pick(true)} style={[styles.photoBox, styles.flex]}>
            <Icon name="camera" size={28} />
            <Text variant="label" color={c.secondary}>{s.photo}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={s.photo} onPress={() => pick(false)} style={styles.galleryBox}>
            <Icon name="image" size={24} />
          </Pressable>
        </View>
      )}

      <TextField label={s.what} placeholder={s.whatPlaceholder} value={title} onChangeText={setTitle} maxLength={140} error={error === 'title' ? s.errors.title : undefined} />
      <Text variant="label">{s.kind}</Text>
      <Chips label={s.kind} value={type} onChange={setType} options={(['produce', 'input'] as const).map((v) => ({ value: v, label: t.market.types[v] }))} />
      <TextField label={s.quantity} value={qty} onChangeText={(v) => setQty(v.replace(/[^0-9.,]/g, ''))} keyboardType="decimal-pad" maxLength={8} error={error === 'quantity' ? s.errors.quantity : undefined} />
      <Text variant="label">{s.unit}</Text>
      <Chips label={s.unit} value={unit} onChange={setUnit} options={UNITS.map((u) => ({ value: u, label: s.units[u] }))} />
      <TextField
        label={fill(s.price, { unit: s.units[unit] })}
        value={price}
        onChangeText={(v) => setPrice(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        prefix="₦"
        maxLength={10}
        error={error === 'price' ? s.errors.price : undefined}
      />
      <TextField label={s.min} value={min} onChangeText={(v) => setMin(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" maxLength={6} />
      <TextField label={s.about} placeholder={s.aboutPlaceholder} value={about} onChangeText={setAbout} maxLength={2000} multiline />
      {error === 'generic' ? <Notice>{s.errors.generic}</Notice> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  photo: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: c.track },
  photoRow: { flexDirection: 'row', gap: space[3] },
  photoBox: { height: 120, borderRadius: radius.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: c.outline, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', gap: space[2] },
  galleryBox: { width: 88, height: 120, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
});
