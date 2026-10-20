import { colors, space } from '@cultivanode/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text, TextField, SelectField, Choice } from '../../ui';
import { OfflineSyncQueue } from '../../lib/offline-sync';
import { sessionStorage, supabase } from '../../lib/supabase';
import { loadFarmerWorkspaceData } from '../../lib/data';

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

export default function NewLivestockRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [trackingType, setTrackingType] = useState<'batch' | 'individual'>('batch');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('poultry');

  // Batch specific fields
  const [population, setPopulation] = useState('');
  const [stage, setStage] = useState('');

  // Individual specific fields
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('female');

  async function handleSave() {
    if (!name) return;
    if (trackingType === 'batch' && (!population || !stage)) return;
    if (trackingType === 'individual' && !breed) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user.id) return;

      const fData = await loadFarmerWorkspaceData(session.user.id);
      if (!fData?.farmId) return;

      const payload = {
        farm_id: fData.farmId,
        tracking_type: trackingType,
        name,
        species,
        population: trackingType === 'batch' ? Number(population) : 1,
        stage: trackingType === 'batch' ? stage : 'Adult',
        breed: trackingType === 'individual' ? breed : 'Mixed',
        sex: trackingType === 'individual' ? sex : 'mixed',
        created_at: new Date().toISOString(),
      };

      // Queue offline mutation. Notice we map it to 'livestock_event' sync kind.
      await syncQueue.enqueue('livestock_event', { action: 'register_livestock', ...payload });

      router.back();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" color={colors.leaf[900]}>Register Livestock</Text>
      </View>

      <View style={styles.form}>
        <Text variant="label" color={colors.leaf[800]}>Tracking Type</Text>
        <Choice
          title="Batch / Flock"
          hint="Best for poultry and aquaculture."
          selected={trackingType === 'batch'}
          onPress={() => setTrackingType('batch')}
          kind="radio"
        />
        <Choice
          title="Individual Tagging"
          hint="Best for cattle, sheep, and goats."
          selected={trackingType === 'individual'}
          onPress={() => setTrackingType('individual')}
          kind="radio"
        />

        <View style={styles.divider} />

        <SelectField
          label="Species"
          placeholder="Select species"
          value={species}
          onChange={setSpecies}
          closeLabel="Done"
          options={[
            { label: 'Poultry', value: 'poultry' },
            { label: 'Cattle', value: 'cattle' },
            { label: 'Fish (Aquaculture)', value: 'fish' },
            { label: 'Goats / Sheep', value: 'goats_sheep' },
            { label: 'Pigs', value: 'pigs' },
          ]}
        />

        <TextField
          label={trackingType === 'batch' ? "Batch Name" : "Tag Number / ID"}
          placeholder={trackingType === 'batch' ? "e.g. Broiler Flock A" : "e.g. #001"}
          value={name}
          onChangeText={setName}
        />

        {trackingType === 'batch' ? (
          <>
            <TextField
              label="Starting Population"
              placeholder="e.g. 500"
              value={population}
              onChangeText={setPopulation}
              keyboardType="numeric"
            />
            <TextField
              label="Current Growth Stage"
              placeholder="e.g. Day-old chicks, Growers, Layers"
              value={stage}
              onChangeText={setStage}
            />
          </>
        ) : (
          <>
            <TextField
              label="Breed"
              placeholder="e.g. N'Dama, White Fulani"
              value={breed}
              onChangeText={setBreed}
            />
            <SelectField
              label="Sex"
              placeholder="Select sex"
              value={sex}
              onChange={setSex}
              closeLabel="Done"
              options={[
                { label: 'Female', value: 'female' },
                { label: 'Male', value: 'male' },
              ]}
            />
          </>
        )}

        <Button
          title="Save Registration"
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
  form: { gap: space[3] },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: space[2] }
});
