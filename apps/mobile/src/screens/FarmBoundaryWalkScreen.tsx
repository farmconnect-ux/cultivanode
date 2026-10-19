import { colors, radius, space, toPolygonEwkt, toPointEwkt } from '@cultivanode/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import {
  BoundaryTracker,
  calculateDistanceMeters,
  calculatePolygonAreaHectares,
  type BoundaryPoint,
  type GpsAccuracyReading,
} from '../lib/gps-tracker';
import { supabase } from '../lib/supabase';
import { Button, Card, Notice, Screen, Text, TextField } from '../ui';

interface Props {
  onBack: () => void;
  onSaved: (farmId: string) => void;
  initialFarmName?: string;
  state?: string;
  lga?: string;
}

export function FarmBoundaryWalkScreen({
  onBack,
  onSaved,
  initialFarmName = '',
  state = 'Oyo',
  lga = 'Ibadan',
}: Props) {
  const [farmName, setFarmName] = useState(initialFarmName || 'My Main Farm');
  const [currentReading, setCurrentReading] = useState<GpsAccuracyReading | null>(null);
  const [points, setPoints] = useState<BoundaryPoint[]>([]);
  const [isWalking, setIsWalking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const trackerRef = useRef<BoundaryTracker | null>(null);

  const handleNewReading = useCallback(
    (reading: GpsAccuracyReading) => {
      setCurrentReading(reading);

      // Auto-capture boundary points if walking mode is enabled and accuracy is good (< 12 meters)
      if (isWalking) {
        setPoints((prev) => {
          if (prev.length === 0) {
            return [
              {
                lat: reading.latitude,
                lng: reading.longitude,
                accuracy: reading.accuracy,
                altitude: reading.altitude,
                heading: reading.heading,
                timestamp: reading.timestamp,
              },
            ];
          }

          const last = prev[prev.length - 1]!;
          const dist = calculateDistanceMeters(
            { lat: last.lat, lng: last.lng },
            { lat: reading.latitude, lng: reading.longitude }
          );

          // Only record a new vertex if user walked at least 3.5 meters to prevent cluster noise
          if (dist >= 3.5) {
            return [
              ...prev,
              {
                lat: reading.latitude,
                lng: reading.longitude,
                accuracy: reading.accuracy,
                altitude: reading.altitude,
                heading: reading.heading,
                timestamp: reading.timestamp,
              },
            ];
          }

          return prev;
        });
      }
    },
    [isWalking]
  );

  useEffect(() => {
    trackerRef.current = new BoundaryTracker(handleNewReading);
    trackerRef.current.start().then((started) => {
      if (!started) {
        setErrorMsg('Please grant Location & Sensor permissions in phone settings to map boundaries.');
      }
    });

    return () => {
      trackerRef.current?.stop();
    };
  }, [handleNewReading]);

  // Manually add point at corner/waypoint
  function captureWaypoint() {
    if (!currentReading) {
      Alert.alert('Waiting for GPS', 'Acquiring satellite fix. Please step into an open area.');
      return;
    }

    if (currentReading.accuracy > 15) {
      Alert.alert(
        'Low GPS Accuracy',
        `Current accuracy is ±${Math.round(currentReading.accuracy)}m. Wait a few seconds for better satellite triangulation.`
      );
    }

    setPoints((prev) => [
      ...prev,
      {
        lat: currentReading.latitude,
        lng: currentReading.longitude,
        accuracy: currentReading.accuracy,
        altitude: currentReading.altitude,
        heading: currentReading.heading,
        timestamp: currentReading.timestamp,
      },
    ]);
  }

  function handleReset() {
    Alert.alert('Reset Perimeter', 'Clear all recorded corner coordinates?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => setPoints([]) },
    ]);
  }

  const areaHa = calculatePolygonAreaHectares(points);
  const accuracyMeters = currentReading ? Math.round(currentReading.accuracy) : null;
  const isHighAccuracy = accuracyMeters !== null && accuracyMeters <= 5;
  const isMediumAccuracy = accuracyMeters !== null && accuracyMeters > 5 && accuracyMeters <= 12;

  async function handleSaveFarm() {
    if (!farmName.trim()) {
      Alert.alert('Farm Name Required', 'Please provide a name for your farm.');
      return;
    }

    if (points.length < 3) {
      Alert.alert(
        'Perimeter Incomplete',
        'You need at least 3 boundary corners to form a polygon. Walk the farm edges or tap "+ Corner Point".'
      );
      return;
    }

    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) throw new Error('Not signed in');

      const polygonEwkt = toPolygonEwkt(points);
      const centroidPoint = toPointEwkt({ lat: points[0]!.lat, lng: points[0]!.lng });

      const { data: farm, error } = await supabase
        .from('farms')
        .insert({
          name: farmName.trim(),
          owner_id: user.id,
          state,
          lga,
          area_ha: Number(areaHa.toFixed(2)),
          area_is_measured: true,
          location: centroidPoint as any,
          boundary: polygonEwkt as any,
          source: 'self_reported',
        })
        .select('id')
        .single();

      if (error) throw error;

      Alert.alert('Boundary Saved!', `Recorded ${points.length} GPS points (~${areaHa.toFixed(2)} ha).`);
      onSaved(farm.id);
    } catch (err) {
      Alert.alert('Save Failed', 'Could not save farm boundary to Supabase. Check your connection.');
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
          <View style={[styles.signalChip, isHighAccuracy ? styles.signalGood : isMediumAccuracy ? styles.signalMid : styles.signalLow]}>
            <Text variant="caption" style={styles.signalText}>
              🛰️ GPS: {accuracyMeters !== null ? `±${accuracyMeters}m` : 'Acquiring...'}
            </Text>
          </View>
        </View>

        <Text variant="heading" color={colors.leaf[800]}>
          Map Farm Boundary
        </Text>
        <Text variant="caption" muted>
          Walk your farm perimeter or mark corner points with your phone&apos;s GPS
        </Text>
      </View>

      {errorMsg && <Notice tone="info">{errorMsg}</Notice>}

      {/* Accuracy & Sensor Telemetry Card */}
      <Card style={styles.sensorCard}>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text variant="caption" muted>Calculated Area</Text>
            <Text variant="heading" color={colors.leaf[900]}>
              {areaHa.toFixed(2)} ha
            </Text>
            <Text variant="caption" muted>({(areaHa * 2.471).toFixed(2)} acres)</Text>
          </View>

          <View style={styles.metricItem}>
            <Text variant="caption" muted>Points Captured</Text>
            <Text variant="heading" color={colors.leaf[900]}>
              {points.length}
            </Text>
            <Text variant="caption" color={points.length >= 3 ? '#166534' : colors.harvest[700]}>
              {points.length >= 3 ? '✓ Polygon Closed' : 'Need ≥ 3 corners'}
            </Text>
          </View>
        </View>

        {currentReading && (
          <View style={styles.sensorTelemetry}>
            <Text variant="caption" muted>
              🧭 Compass: {currentReading.compassHeading ?? '—'}° · ⛰️ Alt: {currentReading.altitude ? `${Math.round(currentReading.altitude)}m` : '—'} · 🏃 Speed: {currentReading.speed ? `${currentReading.speed.toFixed(1)} m/s` : '0 m/s'}
            </Text>
          </View>
        )}
      </Card>

      {/* Farm Details Input */}
      <Card style={styles.formCard}>
        <TextField
          label="Farm Name"
          placeholder="e.g. Ago-Are Maize Estate"
          value={farmName}
          onChangeText={setFarmName}
        />
      </Card>

      {/* Control Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title={isWalking ? '⏸️ Pause Auto-Tracking' : '🚶 Start Walking Perimeter'}
          variant={isWalking ? 'secondary' : 'primary'}
          onPress={() => setIsWalking(!isWalking)}
        />

        <View style={styles.dualRow}>
          <View style={styles.flex}>
            <Button
              title="📍 + Corner Point"
              variant="secondary"
              onPress={captureWaypoint}
            />
          </View>
          {points.length > 0 && (
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Text variant="caption" color={colors.danger} style={styles.bold}>
                Reset
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Coordinates Log */}
      <View style={styles.logHeader}>
        <Text variant="label">Recorded GPS Vertices ({points.length})</Text>
      </View>

      <FlatList
        data={points}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.coordList}
        renderItem={({ item, index }) => (
          <View style={styles.coordRow}>
            <Text variant="caption" style={styles.vertexIndex}>#{index + 1}</Text>
            <View style={styles.coordInfo}>
              <Text variant="caption" style={styles.coordText}>
                {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
              </Text>
              <Text variant="caption" muted>
                Accuracy: ±{Math.round(item.accuracy)}m {item.altitude ? `· ${Math.round(item.altitude)}m alt` : ''}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footerSave}>
        <Button
          title={saving ? 'Saving Boundary...' : 'Save Measured Farm Boundary'}
          variant="primary"
          onPress={handleSaveFarm}
          disabled={saving || points.length < 3}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space[4],
    paddingTop: space[3],
    marginBottom: space[2],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[2],
  },
  signalChip: {
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  signalGood: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  signalMid: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
  },
  signalLow: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  signalText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  sensorCard: {
    marginHorizontal: space[4],
    padding: space[4],
    backgroundColor: colors.white,
    borderColor: colors.line,
    gap: space[2],
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  sensorTelemetry: {
    borderTopWidth: 1,
    borderTopColor: colors.soil[100],
    paddingTop: space[2],
    alignItems: 'center',
  },
  formCard: {
    marginHorizontal: space[4],
    marginTop: space[2],
    padding: space[3],
  },
  actionButtons: {
    paddingHorizontal: space[4],
    marginTop: space[3],
    gap: space[2],
  },
  dualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  flex: {
    flex: 1,
  },
  resetBtn: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  bold: {
    fontWeight: 'bold',
  },
  logHeader: {
    paddingHorizontal: space[4],
    marginTop: space[3],
    marginBottom: space[1],
  },
  coordList: {
    paddingHorizontal: space[4],
    paddingBottom: space[4],
    gap: space[2],
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    gap: space[3],
  },
  vertexIndex: {
    fontWeight: 'bold',
    color: colors.leaf[700],
    minWidth: 24,
  },
  coordInfo: {
    flex: 1,
  },
  coordText: {
    fontWeight: '600',
    color: '#111827',
  },
  footerSave: {
    padding: space[4],
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
