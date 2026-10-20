import { colors, space } from '@cultivanode/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text, TextField, SelectField } from '../../../ui';
import { OfflineSyncQueue } from '../../../lib/offline-sync';
import { sessionStorage, supabase } from '../../../lib/supabase';
import { loadFarmerWorkspaceData } from '../../../lib/data';

const syncQueue = new OfflineSyncQueue(sessionStorage as any);

export default function NewTransactionRoute() {
  const router = useRouter();
  const { type = 'expense' } = useLocalSearchParams<{ type: 'income' | 'expense' }>();
  const [loading, setLoading] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(type === 'income' ? 'Produce Sale' : 'Input');

  const incomeCategories = [
    { label: 'Produce Sale', value: 'Produce Sale' },
    { label: 'Service Provided', value: 'Service Provided' },
    { label: 'Other Income', value: 'Other Income' },
  ];

  const expenseCategories = [
    { label: 'Input (Seeds, Fertilizer)', value: 'Input' },
    { label: 'Machinery Hire', value: 'Machinery Hire' },
    { label: 'Labour', value: 'Labour' },
    { label: 'Logistics', value: 'Logistics' },
    { label: 'Other Expense', value: 'Other Expense' },
  ];

  async function handleSave() {
    if (!description || !amount) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user.id) return;

      const fData = await loadFarmerWorkspaceData(session.user.id);
      if (!fData?.farmId) return;

      const kobo = Math.round(Number(amount) * 100);

      const payload = {
        farm_id: fData.farmId,
        financial_type: type,
        category,
        description,
        amount_kobo: kobo,
        payment_method: 'cash',
        transaction_date: new Date().toISOString(),
      };

      // Queue offline mutation. Notice we mapped the generic operation sync queue correctly.
      await syncQueue.enqueue('complete_operation', { type: 'financial_transaction', ...payload });

      router.back();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="heading" color={type === 'income' ? colors.leaf[900] : '#B45309'}>
          Log {type === 'income' ? 'Income' : 'Expense'}
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Amount (₦)"
          placeholder="e.g. 5000"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <SelectField
          label="Category"
          placeholder="Select category"
          value={category}
          onChange={setCategory}
          closeLabel="Done"
          options={type === 'income' ? incomeCategories : expenseCategories}
        />
        <TextField
          label="Description"
          placeholder={type === 'income' ? "e.g. Sold 10 bags of Maize" : "e.g. Paid for weeding"}
          value={description}
          onChangeText={setDescription}
        />

        <Button
          title={`Save ${type === 'income' ? 'Income' : 'Expense'}`}
          variant={type === 'income' ? 'primary' : 'gold'}
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
