import { colors, radius, space } from '@cultivanode/shared';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Notice, Screen, Text } from '../ui';
import { OfflineSyncQueue } from '../lib/offline-sync';

interface Props {
  cycleId: string;
  cropName: string;
  plotName: string;
  onBack: () => void;
  syncQueue: OfflineSyncQueue;
}

export function CropScoutingScreen({ cycleId, cropName, plotName, onBack, syncQueue }: Props) {
  const [category, setCategory] = useState<'pest' | 'disease' | 'weed' | 'water_stress'>('pest');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'severe'>('low');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleSave() {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter observation details before saving.');
      return;
    }

    setSaving(true);
    try {
      await syncQueue.enqueue('scouting_observation', {
        cycleId,
        category,
        severity,
        description: description.trim(),
        capturedAt: new Date().toISOString(),
      });

      setStatusMessage('Observation saved to offline sync queue.');
      setDescription('');
    } catch {
      Alert.alert('Error', 'Failed to save scouting observation locally.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text variant="caption" color={colors.leaf[700]}>← Back</Text>
          </Pressable>
        </View>
        <Text variant="caption" muted>
          Field Scouting • {cropName} ({plotName})
        </Text>
        <Text variant="heading" color={colors.leaf[800]}>
          Log Crop Observation
        </Text>
      </View>

      {statusMessage && <Notice tone="info">{statusMessage}</Notice>}

      <Card style={styles.card}>
        <Text variant="label" style={styles.label}>
          Issue Category
        </Text>
        <View style={styles.buttonRow}>
          {(['pest', 'disease', 'weed', 'water_stress'] as const).map((cat) => (
            <Button
              key={cat}
              title={cat.replace('_', ' ')}
              variant={category === cat ? 'primary' : 'secondary'}
              onPress={() => setCategory(cat)}
            />
          ))}
        </View>

        <Text variant="label" style={styles.label}>
          Severity Level
        </Text>
        <View style={styles.buttonRow}>
          {(['low', 'medium', 'high', 'severe'] as const).map((sev) => (
            <Button
              key={sev}
              title={sev}
              variant={severity === sev ? 'primary' : 'secondary'}
              onPress={() => setSeverity(sev)}
            />
          ))}
        </View>

        <Text variant="label" style={styles.label}>
          Field Notes / Symptoms
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Stem borer larvae visible on south boundary..."
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <View style={styles.actions}>
          <Button title="Cancel" variant="secondary" onPress={onBack} disabled={saving} />
          <Button
            title={saving ? 'Saving...' : 'Save to Sync Queue'}
            onPress={handleSave}
            disabled={saving}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: space[4],
  },
  topRow: {
    marginBottom: space[2],
  },
  card: {
    padding: space[4],
    gap: space[3],
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: radius.md,
    padding: space[3],
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space[2],
    marginTop: space[3],
  },
});
