import { colors, radius, space } from '@cultivanode/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Button, Card, Screen, Text } from '../../ui';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { loadFarmerWorkspaceData, loadInventory, type MobileInventoryItem } from '../../lib/data';

export default function InventoryRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<MobileInventoryItem[]>([]);

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;
    if (!userId) return;

    try {
      const fData = await loadFarmerWorkspaceData(userId);
      if (fData?.farmId) {
        const items = await loadInventory(fData.farmId);
        setInventoryItems(items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
        <Text variant="heading" color={colors.leaf[900]}>📦 Inventory</Text>
        <Text variant="caption" muted>Manage your farm inputs and stock levels.</Text>
      </View>

      <View style={styles.inventoryContainer}>
        {inventoryItems.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: space[6] }}>
            <Text variant="caption" muted>Your inventory is empty.</Text>
          </Card>
        ) : (
          inventoryItems.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View>
                  <Text variant="label" color={colors.leaf[900]}>{item.name}</Text>
                  <Text variant="caption" muted>{item.category}</Text>
                </View>
                {item.status === 'low' && (
                  <View style={styles.lowStockBadge}>
                    <Text variant="caption" color="#B45309" style={styles.bold}>Low Stock</Text>
                  </View>
                )}
              </View>
              <View style={styles.itemFooter}>
                <View>
                  <Text variant="caption" muted>Quantity Available</Text>
                  <Text variant="label" color={colors.leaf[800]}>{item.quantity} {item.unit}</Text>
                </View>
                <Button
                  title="+ Add"
                  variant="secondary"
                  onPress={() => router.push('/inventory/new')}
                  style={styles.addButton}
                />
              </View>
            </Card>
          ))
        )}
      </View>

      <Button
        title="🛒 Buy Inputs from Marketplace"
        variant="primary"
        onPress={() => router.push('/(tabs)/marketplace')}
        style={{ marginTop: space[4] }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space[4], gap: space[2] },
  inventoryContainer: { gap: space[3] },
  itemCard: { padding: space[4], gap: space[3], backgroundColor: colors.white },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  lowStockBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: space[2], paddingVertical: 2, borderRadius: radius.sm },
  bold: { fontWeight: '700' },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space[3] },
  addButton: { minHeight: 32, paddingHorizontal: space[3] }
});
