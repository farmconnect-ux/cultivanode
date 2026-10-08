import { colors, radius, space, nairaToKobo } from '@cultivanode/shared';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Notice, Screen, Text, TextField } from '../ui';
import { OfflineSyncQueue } from '../lib/offline-sync';

interface Props {
  onBack: () => void;
  onListingCreated: () => void;
  syncQueue: OfflineSyncQueue;
  defaultLocation?: { state: string; lga: string; lat: number; lng: number };
}

export function MobileNewListingScreen({
  onBack,
  onListingCreated,
  syncQueue,
  defaultLocation = { state: 'Oyo', lga: 'Ibadan', lat: 7.3775, lng: 3.9470 },
}: Props) {
  const [title, setTitle] = useState('');
  const [listingType, setListingType] = useState<'produce' | 'input' | 'machinery' | 'labour'>('produce');
  const [unit, setUnit] = useState('bag');
  const [priceNaira, setPriceNaira] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim() || !priceNaira.trim() || !quantity.trim()) {
      Alert.alert('Incomplete', 'Please fill in title, price, and available quantity.');
      return;
    }

    const priceKobo = nairaToKobo(priceNaira);
    if (!priceKobo || priceKobo <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price in Naira.');
      return;
    }

    setSubmitting(true);
    try {
      // Queue offline-friendly listing draft or live publication
      await syncQueue.enqueue('create_marketplace_listing', {
        title: title.trim(),
        listingType,
        unit,
        basePriceKobo: priceKobo,
        availableQuantity: Number(quantity),
        description: description.trim(),
        location: defaultLocation,
        createdAt: new Date().toISOString(),
      });

      setNotice('Listing draft created and queued for network sync.');
      setTimeout(() => {
        onListingCreated();
      }, 1200);
    } catch {
      Alert.alert('Error', 'Could not save listing draft.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text variant="caption" color={colors.leaf[700]}>← Back</Text>
          </Pressable>
          <Text variant="caption" muted>Mobile Seller Studio</Text>
        </View>

        <Text variant="heading" color={colors.leaf[800]}>
          Create New Listing
        </Text>
        <Text variant="caption" muted>
          Sell your harvest produce, agro inputs, or machinery services
        </Text>

        {notice && <Notice tone="info">{notice}</Notice>}

        <Card style={styles.formCard}>
          <TextField
            label="Listing Title"
            placeholder="e.g. Yellow Maize 50kg Bags"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.fieldGroup}>
            <Text variant="caption" style={styles.fieldLabel}>Listing Type</Text>
            <View style={styles.typeSelector}>
              {(['produce', 'input', 'machinery', 'labour'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setListingType(t)}
                  style={[
                    styles.typeChip,
                    listingType === t && styles.typeChipActive,
                  ]}
                >
                  <Text
                    variant="caption"
                    color={listingType === t ? '#FFFFFF' : colors.leaf[900]}
                    style={styles.chipText}
                  >
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextField
            label="Price in Naira (₦)"
            placeholder="e.g. 25000"
            keyboardType="numeric"
            value={priceNaira}
            onChangeText={setPriceNaira}
          />

          <View style={styles.row}>
            <View style={styles.flexHalf}>
              <TextField
                label="Available Quantity"
                placeholder="e.g. 50"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
            <View style={styles.flexHalf}>
              <TextField
                label="Unit (bag, kg, tonne)"
                placeholder="bag"
                value={unit}
                onChangeText={setUnit}
              />
            </View>
          </View>

          <TextField
            label="Description / Storage Conditions"
            placeholder="Describe harvest date, grain moisture, packaging, and pickup location."
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.locCard}>
            <Text variant="caption" muted>
              📍 Location Pin: {defaultLocation.lga}, {defaultLocation.state} (GPS Captured)
            </Text>
          </View>

          <Button
            title={submitting ? 'Saving…' : 'Publish to Marketplace'}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: space[4],
    gap: space[3],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formCard: {
    gap: space[3],
  },
  fieldGroup: {
    gap: space[1],
  },
  fieldLabel: {
    fontWeight: 'bold',
    color: colors.leaf[900],
  },
  typeSelector: {
    flexDirection: 'row',
    gap: space[2],
  },
  typeChip: {
    flex: 1,
    paddingVertical: space[2],
    borderRadius: radius.md,
    backgroundColor: colors.soil[100],
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: colors.leaf[700],
  },
  chipText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    gap: space[2],
  },
  flexHalf: {
    flex: 1,
  },
  locCard: {
    backgroundColor: colors.leaf[50],
    padding: space[2],
    borderRadius: radius.sm,
  },
});
