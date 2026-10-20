import { colors, space } from '@cultivanode/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text, TextField } from '../../ui';
import { OfflineSyncQueue } from '../../lib/offline-sync';
import { sessionStorage, supabase } from '../../lib/supabase';
import { loadFarmerWorkspaceData } from '../../lib/data';

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

export default function LogEventRoute() {
  const router = useRouter();
  const { id, eventType } = useLocalSearchParams<{ id: string, eventType: 'feed' | 'health' | 'mortality' }>();
  const [loading, setLoading] = useState(false);

  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const titles = {
    feed: 'Log Feed Usage',
    health: 'Log Vaccination / Health',
    mortality: 'Log Mortality',
  };

  async function handleSave() {
    if (!quantity && eventType !== 'health') return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user.id) return;

      const fData = await loadFarmerWorkspaceData(session.user.id);
      if (!fData?.farmId) return;

      const payload = {
        farm_id: fData.farmId,
        livestock_id: id,
        event_type: eventType,
        quantity: Number(quantity) || 0,
        notes,
        created_at: new Date().toISOString(),
      };

      await syncQueue.enqueue('livestock_event', payload);

      router.back();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" color={eventType === 'mortality' ? '#B45309' : colors.leaf[900]}>
          {titles[eventType ?? 'feed']}
        </Text>
      </View>

      <View style={styles.form}>
        {eventType === 'feed' && (
          <TextField
            label="Quantity Consumed (kg or bags)"
            placeholder="e.g. 2 bags"
            value={quantity}
            onChangeText={setQuantity}
          />
        )}

        {eventType === 'mortality' && (
          <TextField
            label="Number of Losses"
            placeholder="e.g. 5"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
        )}

        <TextField
          label="Notes / Description"
          placeholder={eventType === 'health' ? "e.g. Administered Newcastle Vaccine" : "e.g. Suspected heat stress"}
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          title="Save Event"
          variant={eventType === 'mortality' ? 'gold' : 'primary'}
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
});
