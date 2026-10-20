import { colors, formatNaira, radius, space } from '@cultivanode/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { Button, Card, Screen, Text } from '../../ui';
import { useCallback, useEffect, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';

export default function OrdersIndexRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'purchases' | 'sales'>('purchases');
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setOrders([
        { id: '1', type: 'purchase', item: 'NPK 15:15:15', qty: '5 bags', amountKobo: 7500000, status: 'processing', date: 'Oct 18, 2026' },
        { id: '2', type: 'sale', item: 'White Maize', qty: '2 Tons', amountKobo: 45000000, status: 'completed', date: 'Oct 10, 2026' },
        { id: '3', type: 'purchase', item: 'DK 777 Seeds', qty: '2 bags', amountKobo: 1200000, status: 'delivered', date: 'Sep 25, 2026' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredOrders = orders.filter(o => o.type === tab);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.leaf[600]} />
      </View>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" color={colors.leaf[900]}>📦 My Orders</Text>
        <Text variant="caption" muted>Track your marketplace purchases and crop sales.</Text>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, tab === 'purchases' && styles.tabButtonActive]}
          onPress={() => setTab('purchases')}
        >
          <Text variant="caption" color={tab === 'purchases' ? '#FAF7F0' : colors.leaf[800]} style={styles.bold}>
            🛒 Purchases
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, tab === 'sales' && styles.tabButtonActive]}
          onPress={() => setTab('sales')}
        >
          <Text variant="caption" color={tab === 'sales' ? '#FAF7F0' : colors.leaf[800]} style={styles.bold}>
            🌾 Sales
          </Text>
        </Pressable>
      </View>

      <View style={styles.listContainer}>
        {filteredOrders.length === 0 ? (
          <Card style={styles.empty}>
            <Text variant="caption" muted>No {tab} found.</Text>
          </Card>
        ) : (
          filteredOrders.map((o) => (
            <Card key={o.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text variant="label" color={colors.leaf[900]}>{o.item}</Text>
                  <Text variant="caption" muted>{o.date} · {o.qty}</Text>
                </View>
                <View style={[styles.badge, o.status === 'completed' || o.status === 'delivered' ? styles.badgeSuccess : styles.badgePending]}>
                  <Text variant="caption" color={o.status === 'completed' || o.status === 'delivered' ? '#065F46' : '#B45309'} style={styles.bold}>
                    {o.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text variant="label" color={colors.harvest[700]}>{formatNaira(o.amountKobo)}</Text>
                <Text variant="caption" color={colors.leaf[600]}>View Details →</Text>
              </View>
            </Card>
          ))
        )}
      </View>

      <Button
        title={tab === 'purchases' ? "Buy Inputs" : "List Produce for Sale"}
        variant="primary"
        onPress={() => router.push(tab === 'purchases' ? '/(tabs)/marketplace' : '/marketplace/sell')}
        style={{ marginTop: space[4] }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space[4], gap: space[2] },
  tabBar: { flexDirection: 'row', backgroundColor: colors.soil[100], borderRadius: radius.lg, padding: 3, marginBottom: space[4], gap: 4 },
  tabButton: { flex: 1, paddingVertical: space[2], alignItems: 'center', borderRadius: radius.md },
  tabButtonActive: { backgroundColor: '#123D27' },
  bold: { fontWeight: '700' },
  listContainer: { gap: space[3] },
  empty: { padding: space[6], alignItems: 'center' },
  card: { padding: space[4], gap: space[3], backgroundColor: colors.white },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { paddingHorizontal: space[2], paddingVertical: 2, borderRadius: radius.sm },
  badgeSuccess: { backgroundColor: '#DCFCE7' },
  badgePending: { backgroundColor: '#FEF3C7' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space[2] },
});
