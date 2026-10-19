import { colors, radius, space, formatNaira } from '@cultivanode/shared';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Notice, Screen, Text, TextField } from '../ui';

export interface MobileListingItem {
  id: string;
  title: string;
  category: string;
  basePriceKobo: number;
  unit: string;
  availableQuantity: number;
  sellerName: string;
  sellerRating: number;
  location: string;
  isVerified: boolean;
}

interface Props {
  listings: MobileListingItem[];
  onSelectListing: (listing: MobileListingItem) => void;
  onOpenCreateListing: () => void;
  onBack: () => void;
  initialCategory?: string;
}

export function MarketplaceBrowseScreen({
  listings,
  onSelectListing,
  onOpenCreateListing,
  onBack,
  initialCategory = 'all',
}: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);

  const categories = [
    { key: 'all', label: 'All Items' },
    { key: 'produce', label: 'Produce' },
    { key: 'input', label: 'Inputs' },
    { key: 'machinery', label: 'Machinery' },
    { key: 'labour', label: 'Labour' },
  ];

  const filtered = listings.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      search.trim() === '' ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text variant="caption" color={colors.leaf[700]}>← Back</Text>
          </Pressable>
          <Button title="+ Sell" onPress={onOpenCreateListing} />
        </View>
        <Text variant="heading" color={colors.leaf[800]}>
          CultivaNode Market
        </Text>
        <Text variant="caption" muted>
          Direct farm harvest, inputs, machinery and labour
        </Text>
      </View>

      <View style={styles.searchBox}>
        <TextField
          label="Search Marketplace"
          placeholder="e.g. Maize, NPK, Tractor..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.categories}>
        {categories.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setActiveCategory(c.key)}
            style={[
              styles.catChip,
              activeCategory === c.key && styles.catChipActive,
            ]}
          >
            <Text
              variant="caption"
              color={activeCategory === c.key ? '#FFFFFF' : colors.leaf[900]}
              style={styles.catText}
            >
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Card>
            <Text variant="body" muted style={styles.center}>
              No listings found matching your search.
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelectListing(item)}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.chip}>
                  <Text variant="caption" color={colors.leaf[700]}>
                    {item.category.toUpperCase()}
                  </Text>
                </View>
                {item.isVerified && (
                  <View style={styles.verifiedChip}>
                    <Text variant="caption" color="#166534">
                      ✓ Verified
                    </Text>
                  </View>
                )}
              </View>

              <Text variant="label" style={styles.title}>
                {item.title}
              </Text>

              <Text variant="caption" muted>
                Seller: {item.sellerName} • ★ {item.sellerRating.toFixed(1)}
              </Text>

              <View style={styles.cardFooter}>
                <View>
                  <Text variant="caption" muted>
                    Stock: {item.availableQuantity} {item.unit}
                  </Text>
                  <Text variant="heading" color={colors.leaf[900]}>
                    {formatNaira(item.basePriceKobo)}/{item.unit}
                  </Text>
                </View>

                <Text variant="caption" muted>
                  📍 {item.location}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
    gap: space[1],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[2],
  },
  searchBox: {
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  categories: {
    flexDirection: 'row',
    paddingHorizontal: space[4],
    gap: space[2],
    marginBottom: space[3],
  },
  catChip: {
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.full,
    backgroundColor: colors.soil[100],
  },
  catChipActive: {
    backgroundColor: colors.leaf[700],
  },
  catText: {
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: space[4],
    gap: space[3],
    paddingBottom: space[8],
  },
  card: {
    gap: space[2],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: colors.leaf[50],
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  verifiedChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  title: {
    fontSize: 16,
    color: colors.leaf[900],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.soil[100],
    paddingTop: space[2],
    marginTop: space[1],
  },
  center: {
    textAlign: 'center',
    padding: space[4],
  },
});
