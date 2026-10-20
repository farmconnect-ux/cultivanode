import { colors, radius, space } from '@cultivanode/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { Button, Card, Screen, Text } from '../../ui';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { loadFarmerWorkspaceData } from '../../lib/data';

// Placeholder data since we don't have the table created yet. We mock the `loadLivestockBatches`.
export default function LivestockIndexRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    // Simulate network delay and offline cache retrieval
    setTimeout(() => {
      setBatches([
        { id: '1', name: 'Broiler Flock A', type: 'Poultry', tracking: 'batch', headCount: 498, stage: 'Growers' },
        { id: '2', name: 'Catfish Pond 1', type: 'Fish', tracking: 'batch', headCount: 1200, stage: 'Fingerlings' },
        { id: '3', name: 'Tag #001', type: 'Cattle', tracking: 'individual', headCount: 1, breed: "N'Dama" },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        <Text variant="heading" color={colors.leaf[900]}>🐄 Flocks & Herds</Text>
        <Text variant="caption" muted>Manage your livestock batches and individual animals.</Text>
      </View>

      <View style={styles.listContainer}>
        {batches.length === 0 ? (
          <Card style={styles.empty}>
            <Text variant="caption" muted>No livestock registered yet.</Text>
          </Card>
        ) : (
          batches.map((b) => (
            <Pressable key={b.id} onPress={() => router.push(`/livestock/${b.id}`)}>
              {({ pressed }) => (
                <Card style={[styles.card, pressed && styles.cardPressed]}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text variant="label" color={colors.leaf[900]}>{b.name}</Text>
                      <Text variant="caption" muted>{b.type} · {b.tracking === 'batch' ? 'Batch' : 'Individual Tag'}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text variant="caption" color={colors.leaf[800]} style={styles.bold}>{b.headCount} Head</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text variant="caption" muted>
                      {b.tracking === 'batch' ? `Stage: ${b.stage}` : `Breed: ${b.breed}`}
                    </Text>
                    <Text variant="caption" color={colors.leaf[600]}>Manage →</Text>
                  </View>
                </Card>
              )}
            </Pressable>
          ))
        )}
      </View>

      <Button
        title="+ Register New Livestock"
        variant="primary"
        onPress={() => router.push('/livestock/new')}
        style={{ marginTop: space[4] }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space[4], gap: space[2] },
  listContainer: { gap: space[3] },
  empty: { padding: space[6], alignItems: 'center' },
  card: { padding: space[4], gap: space[3], backgroundColor: colors.white },
  cardPressed: { opacity: 0.8, backgroundColor: colors.leaf[50] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { backgroundColor: '#DCFCE7', paddingHorizontal: space[2], paddingVertical: 2, borderRadius: radius.sm },
  bold: { fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space[2] },
});
