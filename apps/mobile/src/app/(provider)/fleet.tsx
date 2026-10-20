import { colors, formatNaira, radius, space } from '@cultivanode/shared';
import { StyleSheet, View } from 'react-native';
import { Card, Screen, Text } from '../../ui';
import { useProvider } from './_layout';

export default function FleetRoute() {
  const { fleet } = useProvider();

  return (
    <Screen>
      <View style={styles.fleetContainer}>
        <Text variant="label" color={colors.leaf[900]}>Registered Equipment</Text>
        <Text variant="caption" muted>
          Equipment listed on CultivaNode marketplace.
        </Text>

        {fleet.map((item) => (
          <Card key={item.id} style={styles.fleetCard}>
            <View style={styles.fleetHeader}>
              <View style={styles.flex}>
                <Text variant="label" color={colors.leaf[900]}>{item.title}</Text>
                <Text variant="caption" color={colors.leaf[700]}>
                  Category: {item.category.toUpperCase()} · Radius: {item.serviceRadiusKm} km
                </Text>
              </View>
              <View style={[styles.statusPill, item.status === 'active' ? styles.statusActive : styles.statusPaused]}>
                <Text variant="caption" color={item.status === 'active' ? '#065F46' : colors.soil[700]} style={styles.bold}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.fleetFooter}>
              <View>
                <Text variant="caption" muted>Rate per {item.pricingUnit}</Text>
                <Text variant="label" color={colors.harvest[700]}>{formatNaira(item.rateKobo)}</Text>
              </View>
              <Text variant="caption" color={colors.leaf[800]}>🚜 {item.totalBookingsCompleted} jobs</Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fleetContainer: { gap: space[3], marginTop: space[4] },
  fleetCard: { padding: space[4], gap: space[3], backgroundColor: colors.white, borderColor: colors.line },
  fleetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  statusPill: { paddingHorizontal: space[2], paddingVertical: 2, borderRadius: radius.full },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusPaused: { backgroundColor: colors.soil[100] },
  fleetFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.soil[100], paddingTop: space[2] },
});
