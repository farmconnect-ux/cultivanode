import { colors, formatNaira, radius, space } from '@cultivanode/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Button, Card, Screen, Text } from '../../ui';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { loadFarmerWorkspaceData, loadTransactions, type MobileTransaction } from '../../lib/data';

export default function BooksRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<MobileTransaction[]>([]);

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id;
    if (!userId) return;

    try {
      const fData = await loadFarmerWorkspaceData(userId);
      if (fData?.farmId) {
        const txs = await loadTransactions(fData.farmId);
        setTransactions(txs);
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

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amountKobo, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amountKobo, 0);
  const net = totalIncome - totalExpense;

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
        <Text variant="heading" color={colors.leaf[900]}>📒 Farm Books</Text>
        <Text variant="caption" muted>Integer Kobo Ledger</Text>
      </View>

      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <Text variant="caption" muted>INCOME</Text>
          <Text variant="label" color={colors.leaf[700]}>{formatNaira(totalIncome)}</Text>
        </Card>
        <Card style={styles.kpiCard}>
          <Text variant="caption" muted>EXPENSES</Text>
          <Text variant="label" color="#B45309">{formatNaira(totalExpense)}</Text>
        </Card>
        <Card style={styles.kpiCard}>
          <Text variant="caption" muted>NET</Text>
          <Text variant="label" color={net >= 0 ? colors.leaf[700] : '#B45309'}>{formatNaira(net)}</Text>
        </Card>
      </View>

      <View style={styles.listContainer}>
        <Text variant="label" color={colors.leaf[900]} style={{ marginBottom: space[2] }}>Recent Transactions</Text>

        {transactions.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: space[6] }}>
            <Text variant="caption" muted>No transactions recorded yet.</Text>
          </Card>
        ) : (
          transactions.map((t) => (
            <Card key={t.id} style={styles.txCard}>
              <View style={styles.txHeader}>
                <View>
                  <Text variant="label" color={colors.leaf[900]}>{t.description}</Text>
                  <Text variant="caption" muted>{t.date} · {t.category}</Text>
                </View>
                <Text variant="label" color={t.type === 'income' ? colors.leaf[700] : '#B45309'}>
                  {t.type === 'income' ? '+' : '-'}{formatNaira(t.amountKobo)}
                </Text>
              </View>
            </Card>
          ))
        )}
      </View>

      <View style={styles.actionRow}>
        <Button
          title="Log Expense"
          variant="secondary"
          onPress={() => router.push({ pathname: '/books/new', params: { type: 'expense' } })}
          style={styles.flexBtn}
        />
        <Button
          title="Log Income"
          variant="primary"
          onPress={() => router.push({ pathname: '/books/new', params: { type: 'income' } })}
          style={styles.flexBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: space[4], gap: space[2] },
  kpiGrid: { flexDirection: 'row', gap: space[2], marginBottom: space[4] },
  kpiCard: { flex: 1, padding: space[3], alignItems: 'center', gap: space[1] },
  listContainer: { gap: space[2], marginBottom: space[4] },
  txCard: { padding: space[3] },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: space[3] },
  flexBtn: { flex: 1 }
});
