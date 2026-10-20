import { colors, radius, space } from '@cultivanode/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, ActivityIndicator, ScrollView } from 'react-native';
import { Button, Card, Screen, Text } from '../../ui';
import { useEffect, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';

export default function LivestockDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching the specific batch
    setTimeout(() => {
      setBatch({
        id,
        name: id === '3' ? 'Tag #001' : 'Broiler Flock A',
        type: id === '3' ? 'Cattle' : 'Poultry',
        tracking: id === '3' ? 'individual' : 'batch',
        headCount: id === '3' ? 1 : 498,
        stage: 'Growers',
        breed: id === '3' ? "N'Dama" : 'Mixed',
        dateAdded: '2026-09-01'
      });
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading || !batch) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.leaf[600]} />
      </View>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" color={colors.leaf[900]}>{batch.name}</Text>
        <Text variant="caption" muted>{batch.type} · Registered {batch.dateAdded}</Text>
      </View>

      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <Text variant="caption" muted>HEAD COUNT</Text>
          <Text variant="title" color={colors.leaf[800]}>{batch.headCount}</Text>
        </Card>
        {batch.tracking === 'batch' ? (
          <Card style={styles.kpiCard}>
            <Text variant="caption" muted>STAGE</Text>
            <Text variant="label" color={colors.leaf[800]}>{batch.stage}</Text>
          </Card>
        ) : (
          <Card style={styles.kpiCard}>
            <Text variant="caption" muted>BREED</Text>
            <Text variant="label" color={colors.leaf[800]}>{batch.breed}</Text>
          </Card>
        )}
      </View>

      <Text variant="label" color={colors.leaf[900]} style={{ marginTop: space[4], marginBottom: space[2] }}>
        Quick Actions
      </Text>

      <View style={styles.actionGrid}>
        <Button
          title="Log Feed"
          variant="secondary"
          onPress={() => router.push({ pathname: '/livestock/log-event', params: { id, eventType: 'feed' } })}
          style={styles.actionBtn}
        />
        <Button
          title="Log Health"
          variant="secondary"
          onPress={() => router.push({ pathname: '/livestock/log-event', params: { id, eventType: 'health' } })}
          style={styles.actionBtn}
        />
        <Button
          title="Log Mortality"
          variant="gold"
          onPress={() => router.push({ pathname: '/livestock/log-event', params: { id, eventType: 'mortality' } })}
          style={styles.actionBtn}
        />
      </View>

      <Text variant="label" color={colors.leaf[900]} style={{ marginTop: space[4], marginBottom: space[2] }}>
        Recent History
      </Text>
      <Card style={styles.historyCard}>
        <View style={styles.historyRow}>
          <Feather name="activity" size={16} color={colors.leaf[600]} />
          <View style={{ flex: 1, marginLeft: space[2] }}>
            <Text variant="label" color={colors.leaf[900]}>Feed Logged</Text>
            <Text variant="caption" muted>2 bags of Layer Mash</Text>
          </View>
          <Text variant="caption" muted>Yesterday</Text>
        </View>
        <View style={[styles.historyRow, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space[3], marginTop: space[3] }]}>
          <Feather name="alert-circle" size={16} color="#B45309" />
          <View style={{ flex: 1, marginLeft: space[2] }}>
            <Text variant="label" color={colors.leaf[900]}>Mortality</Text>
            <Text variant="caption" muted>2 birds (Suspected heat stress)</Text>
          </View>
          <Text variant="caption" muted>Oct 18</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space[4], gap: space[1] },
  kpiGrid: { flexDirection: 'row', gap: space[2] },
  kpiCard: { flex: 1, padding: space[3], alignItems: 'center', gap: space[1] },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  actionBtn: { flexGrow: 1, minWidth: '48%' },
  historyCard: { padding: space[4], backgroundColor: colors.white },
  historyRow: { flexDirection: 'row', alignItems: 'center' }
});
