import { colors, space } from '@cultivanode/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text, TextField, SelectField } from '../../../ui';
import { OfflineSyncQueue } from '../../../lib/offline-sync';
import { sessionStorage, supabase } from '../../../lib/supabase';
import { loadFarmerWorkspaceData } from '../../../lib/data';

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

export default function NewInventoryRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('seed');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('bags (25kg)');

  async function handleSave() {
    if (!name || !quantity) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user.id) return;

      const fData = await loadFarmerWorkspaceData(session.user.id);
      if (!fData?.farmId) return;

      const payload = {
        farm_id: fData.farmId,
        item_name: name,
        category,
        quantity: Number(quantity) || 0,
        unit,
        reserved_quantity: 0,
        unit_cost_kobo: 0,
      };

      // Queue offline mutation
      await syncQueue.enqueue('inventory_issue', payload);

      router.back();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" color={colors.leaf[900]}>Add Inventory</Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Item Name"
          placeholder="e.g. DK 777 Maize Seed"
          value={name}
          onChangeText={setName}
        />
        <SelectField
          label="Category"
          placeholder="Select category"
          value={category}
          onChange={setCategory}
          closeLabel="Done"
          options={[
            { label: 'Seed', value: 'seed' },
            { label: 'Fertilizer', value: 'fertilizer' },
            { label: 'Herbicide', value: 'herbicide' },
            { label: 'Pesticide', value: 'pesticide' },
            { label: 'Equipment Part', value: 'equipment_part' },
          ]}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Quantity"
              placeholder="e.g. 5"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Unit"
              placeholder="e.g. bags"
              value={unit}
              onChangeText={setUnit}
            />
          </View>
        </View>
        <Button
          title="Save to Inventory"
          variant="primary"
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: space[4] }}
        />
        <Button
          title="Cancel"
          variant="secondary"
          onPress={() => router.back()}
          disabled={loading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space[4] },
  form: { gap: space[4] },
  row: { flexDirection: 'row', gap: space[3] },
  flex: { flex: 1 }
});
