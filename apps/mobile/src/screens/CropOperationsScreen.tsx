import { colors, radius, space, formatNaira } from '@cultivanode/shared';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Notice, Screen, Text } from '../ui';
import { OfflineSyncQueue } from '../lib/offline-sync';

interface ScheduledTask {
  id: string;
  name: string;
  stage: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'skipped';
  requiredEquipment?: string | null;
  costKobo: number;
}

interface Props {
  cycleId: string;
  cropName: string;
  plotName: string;
  tasks: ScheduledTask[];
  onBack: () => void;
  syncQueue: OfflineSyncQueue;
}

export function CropOperationsScreen({
  cycleId,
  cropName,
  plotName,
  tasks: initialTasks,
  onBack,
  syncQueue,
}: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleMarkComplete(task: ScheduledTask) {
    try {
      await syncQueue.enqueue('complete_operation', {
        operationId: task.id,
        cycleId,
        completedAt: new Date().toISOString(),
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'completed' } : t))
      );

      setStatusMessage(`Task "${task.name}" completed (queued for sync).`);
    } catch {
      Alert.alert('Error', 'Failed to update operation.');
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="caption" muted>
          Field Operations • {cropName} ({plotName})
        </Text>
        <Text variant="heading" color={colors.leaf[800]}>
          Today&apos;s Field Tasks
        </Text>
      </View>

      {statusMessage && <Notice tone="info">{statusMessage}</Notice>}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text variant="body" style={styles.taskTitle}>
                  {item.name}
                </Text>
                <Text variant="caption" muted>
                  Stage: {item.stage} • Due: {item.dueDate}
                </Text>
                {item.requiredEquipment && (
                  <Text variant="caption" color={colors.harvest[700]}>
                    🚜 Requires: {item.requiredEquipment}
                  </Text>
                )}
              </View>

              {item.status === 'completed' ? (
                <Text variant="caption" color={colors.leaf[700]}>
                  ✓ Done
                </Text>
              ) : (
                <Button title="Done" onPress={() => handleMarkComplete(item)} />
              )}
            </View>
          </Card>
        )}
      />

      <View style={styles.footer}>
        <Button title="← Back" variant="secondary" onPress={onBack} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: space[4],
  },
  list: {
    gap: space[3],
    paddingBottom: space[4],
  },
  card: {
    padding: space[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[3],
  },
  flex: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    marginTop: space[4],
  },
});
