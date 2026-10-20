import { colors, radius, space } from '@cultivanode/shared';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator } from 'react-native';
import { Button, Card, Screen, Text } from '../ui';
import { OfflineSyncQueue, type PendingSyncItem } from '../lib/offline-sync';
import { sessionStorage } from '../lib/supabase';
import { useRouter } from 'expo-router';

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

export default function SyncCenterRoute() {
  const router = useRouter();
  const [queue, setQueue] = useState<PendingSyncItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const q = await syncQueue.getQueue();
    setQueue(q);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function handleRetryAll() {
    setSyncing(true);
    // In a real implementation, we would hook this up to the actual sync dispatcher
    // that knows how to route each `kind` to the right API endpoint.
    // For now, we simulate a network attempt.
    setTimeout(async () => {
      // Simulate failure to sync since we might still be offline
      await loadQueue();
      setSyncing(false);
    }, 1500);
  }

  async function handleClear(id: string) {
    await syncQueue.remove(id);
    await loadQueue();
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.leaf[600]} />
      </View>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" color={colors.leaf[900]}>Sync Center</Text>
        <Text variant="caption" muted>
          Items saved offline waiting to upload to CultivaNode.
        </Text>
      </View>

      <View style={styles.kpiBox}>
        <Text variant="title" color={queue.length > 0 ? '#B45309' : colors.leaf[600]}>
          {queue.length}
        </Text>
        <Text variant="label" muted>Pending Items</Text>
      </View>

      <View style={styles.actionRow}>
        <Button
          title="Retry All Uploads"
          variant="primary"
          onPress={handleRetryAll}
          loading={syncing}
          disabled={queue.length === 0}
          style={{ flex: 1 }}
        />
      </View>

      <View style={styles.list}>
        {queue.length === 0 ? (
          <Card style={styles.empty}>
            <Text variant="caption" muted>You are fully synced!</Text>
          </Card>
        ) : (
          queue.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View>
                  <Text variant="label" color={colors.leaf[900]}>{formatKind(item.kind)}</Text>
                  <Text variant="caption" muted>Saved {new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                <View style={styles.badge}>
                  <Text variant="caption" color="#B45309" style={{ fontWeight: 'bold' }}>Pending</Text>
                </View>
              </View>

              {item.lastError && (
                <View style={styles.errorBox}>
                  <Text variant="caption" color={colors.danger}>{item.lastError}</Text>
                </View>
              )}

              <View style={styles.itemFooter}>
                <Text variant="caption" muted>Attempts: {item.attempts}</Text>
                <Button
                  title="Discard"
                  variant="secondary"
                  onPress={() => handleClear(item.id)}
                  style={styles.discardBtn}
                />
              </View>
            </Card>
          ))
        )}
      </View>
      <Button title="Back" variant="secondary" onPress={() => router.back()} style={{ marginTop: space[4] }} />
    </Screen>
  );
}

function formatKind(kind: string) {
  return kind.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const styles = StyleSheet.create({
  header: { marginBottom: space[4] },
  kpiBox: { backgroundColor: colors.white, padding: space[4], alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, marginBottom: space[4] },
  actionRow: { flexDirection: 'row', marginBottom: space[4] },
  list: { gap: space[3] },
  empty: { padding: space[6], alignItems: 'center' },
  itemCard: { padding: space[4], gap: space[3] },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { backgroundColor: '#FEF3C7', paddingHorizontal: space[2], paddingVertical: 2, borderRadius: radius.sm },
  errorBox: { backgroundColor: '#FEE2E2', padding: space[2], borderRadius: radius.sm },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space[2] },
  discardBtn: { minHeight: 32, paddingHorizontal: space[3] }
});
