import { formatNaira } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { fill, useI18n } from '../i18n';
import { loadLots, pendingLots, sendPendingLots, type Lot, type LotType } from '../lib/market';
import { useSession } from '../lib/session';
import { color as c, font, radius, space, tap } from '../theme';
import { Card, Chips, Empty, Icon, Loading, Notice, Pill, Screen, Text } from '../ui';

type Props = {
  initialType?: LotType | null;
  onOpen: (lotId: string) => void;
  onSell: () => void;
  onOrders: () => void;
  onShop: () => void;
};

/** Market tab: search, filter by type, and lots with price, seller and place. Selling starts here too. */
export function MarketScreen({ initialType = null, onOpen, onSell, onOrders, onShop }: Props) {
  const { t } = useI18n();
  const m = t.market;
  const { session, account } = useSession();
  const [type, setType] = useState<LotType | 'all'>(initialType ?? 'all');
  const [q, setQ] = useState('');
  const [lots, setLots] = useState<Lot[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (initialType) setType(initialType);
  }, [initialType]);

  const load = useCallback(async () => {
    try {
      setLots(await loadLots({ type: type === 'all' ? null : type, q }));
      setOffline(false);
    } catch {
      setOffline(true);
      setLots((l) => l ?? []);
    }
    if (session) {
      await sendPendingLots(session.user.id, account?.profile.full_name ?? null).catch(() => 0);
      setPending((await pendingLots()).length);
    }
  }, [type, q, session, account?.profile.full_name]);

  useEffect(() => {
    const id = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  return (
    <Screen
      inTabs
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      refreshing={refreshing}
    >
      <View style={styles.top}>
        <Text variant="display" accessibilityRole="header" style={styles.flex}>{m.title}</Text>
        <Pressable accessibilityRole="button" onPress={onOrders} style={styles.iconBtn} accessibilityLabel={m.myOrders}>
          <Icon name="package" size={22} color={c.primary} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onShop} style={styles.iconBtn} accessibilityLabel={m.myShop}>
          <Icon name="briefcase" size={22} color={c.primary} />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Icon name="search" size={20} color={c.inkSoft} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={m.search}
          placeholderTextColor="#8a948d"
          style={styles.searchInput}
          accessibilityLabel={m.search}
          returnKeyType="search"
        />
        {q ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t.common.close} onPress={() => setQ('')} hitSlop={8}>
            <Icon name="x" size={18} color={c.inkSoft} />
          </Pressable>
        ) : null}
      </View>

      <Chips
        label={m.title}
        value={type}
        onChange={setType}
        options={(['all', 'produce', 'input', 'service', 'labour', 'machinery'] as const).map((v) => ({ value: v, label: m.types[v] }))}
      />

      <Card tone="amber" onPress={onSell} accessibilityLabel={m.sell}>
        <View style={styles.row}>
          <View style={styles.sellIcon}>
            <Icon name="tag" size={22} color={c.amber} />
          </View>
          <Text variant="label" style={styles.flex}>{m.sell}</Text>
          <Icon name="chevron-right" size={20} color={c.inkSoft} />
        </View>
      </Card>

      {pending ? <Notice tone="warning">{fill(m.pendingLots, { n: pending })}</Notice> : null}
      {offline ? <Notice tone="warning">{m.offline}</Notice> : null}

      {!lots ? (
        <Loading label={t.common.loading} />
      ) : lots.length === 0 ? (
        <Empty icon="shopping-bag" title={m.none} body={m.noneBody} />
      ) : (
        lots.map((l) => <LotCard key={l.id} lot={l} onPress={() => onOpen(l.id)} />)
      )}
    </Screen>
  );
}

function LotCard({ lot, onPress }: { lot: Lot; onPress: () => void }) {
  const { t } = useI18n();
  const m = t.market;
  return (
    <Card onPress={onPress} accessibilityLabel={`${lot.title}, ${formatNaira(lot.priceKobo)} ${fill(m.per, { unit: lot.unit })}`} style={styles.lot}>
      {lot.image ? (
        <Image source={{ uri: lot.image }} style={styles.photo} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.photo, styles.noPhoto]}>
          <Icon name="image" size={28} color={c.outline} />
        </View>
      )}
      <View style={styles.lotBody}>
        <Text variant="label" numberOfLines={2}>{lot.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatNaira(lot.priceKobo)}</Text>
          <Text variant="caption" muted>{fill(m.per, { unit: lot.unit })}</Text>
        </View>
        <Text variant="caption" muted numberOfLines={1}>{[lot.seller.name, lot.place].filter(Boolean).join(' · ')}</Text>
        <View style={styles.pills}>
          {lot.seller.rating !== null ? <Pill tone="green" icon="star">{`${lot.seller.rating.toFixed(1)}`}</Pill> : <Pill tone="grey">{m.newSeller}</Pill>}
          {lot.seller.verified ? <Pill tone="blue" icon="shield">{m.verified}</Pill> : null}
          {lot.available > 0 ? <Pill tone="grey">{fill(m.available, { n: lot.available, unit: lot.unit })}</Pill> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  iconBtn: { width: tap, height: tap, borderRadius: tap / 2, borderWidth: 1, borderColor: c.line, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  search: {
    minHeight: tap + 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: c.outline,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
    gap: space[2],
  },
  searchInput: { flex: 1, minHeight: tap, fontFamily: font.body, fontSize: 17, color: c.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  sellIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  lot: { flexDirection: 'row', gap: space[3], padding: space[3] },
  photo: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: c.track },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  lotBody: { flex: 1, gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: space[1] },
  price: { fontFamily: font.display, fontSize: 18, color: c.primary },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1] },
});
