import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { MarketplaceBrowseScreen, type MobileListingItem } from '../../screens/MarketplaceBrowseScreen';
import { loadMarketplaceListings } from '../../lib/data';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@cultivanode/shared';

export default function MarketplaceRoute() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<MobileListingItem[]>([]);

  useEffect(() => {
    loadMarketplaceListings().then(data => {
      setListings(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.leaf[600]} />
      </View>
    );
  }

  return (
    <MarketplaceBrowseScreen
      listings={listings}
      initialCategory="all"
      onSelectListing={() => {}}
      onOpenCreateListing={() => router.push('/marketplace/sell')}
      onBack={() => router.back()}
    />
  );
}
