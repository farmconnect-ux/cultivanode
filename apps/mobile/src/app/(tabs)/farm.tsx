import { colors, radius, space } from '@cultivanode/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View, Pressable } from 'react-native';
import { Button, Card, Screen, Text } from '../../ui';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { loadFarmerWorkspaceData, type MobileFarmSummary } from '../../lib/data';

export default function FarmsRoute() {
  const router = useRouter();
  const [farmData, setFarmData] = useState<MobileFarmSummary | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user.id) {
        loadFarmerWorkspaceData(session.user.id).then(setFarmData);
      }
    });
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" color={colors.leaf[900]}>🌾 My Farms</Text>
      </View>

      {farmData ? (
        <Card style={styles.farmCard}>
          <Text variant="label" color={colors.leaf[900]}>{farmData.farmName}</Text>
          <Text variant="caption" muted>{farmData.plotName} · {farmData.activeCrop}</Text>
          <Button
            title="🛰️ Map Boundary"
            variant="secondary"
            onPress={() => router.push('/farms/boundary_walk')}
            style={{ marginTop: space[3] }}
          />
        </Card>
      ) : (
        <Card style={styles.emptyCard}>
          <Text variant="caption" muted>Loading farm data...</Text>
        </Card>
      )}

      <Button
        title="+ Add New Farm"
        variant="primary"
        onPress={() => {}}
        style={{ marginTop: space[4] }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space[4] },
  farmCard: { padding: space[4], gap: space[2] },
  emptyCard: { padding: space[5], alignItems: 'center' }
});
