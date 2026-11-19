import { colors, formatNaira, radius, space } from '@cultivanode/shared';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import {
  BoundaryTracker,
  type GpsAccuracyReading,
} from '../lib/gps-tracker';
import {
  checkInJob,
  finishJobWork,
  submitWorkProofPhoto,
  type ProviderJob,
} from '../lib/provider-dispatch';
import { Button, Card, Notice, Screen, Text, TextField } from '../ui';

interface ProofItem {
  id: string;
  kind: 'before' | 'after' | 'extra';
  uri: string;
  timestamp: number;
  accuracy: number;
  hectares?: number;
}

interface Props {
  job: ProviderJob;
  onBack: () => void;
  onJobUpdated: () => void;
}

export function WorkEvidenceScreen({ job, onBack, onJobUpdated }: Props) {
  const [currentReading, setCurrentReading] = useState<GpsAccuracyReading | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(Boolean(job.checkedInAt));
  const [checkingIn, setCheckingIn] = useState(false);
  const [selectedKind, setSelectedKind] = useState<'before' | 'after' | 'extra'>('before');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [hectaresInput, setHectaresInput] = useState<string>(job.quantity.toString());
  const [submittingProof, setSubmittingProof] = useState(false);
  const [finishingJob, setFinishingJob] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const trackerRef = useRef<BoundaryTracker | null>(null);
  const submittingProofRef = useRef(false);
  const finishingJobRef = useRef(false);

  const handleNewReading = useCallback((reading: GpsAccuracyReading) => {
    setCurrentReading(reading);
  }, []);

  useEffect(() => {
    trackerRef.current = new BoundaryTracker(handleNewReading);
    trackerRef.current.start().then((started) => {
      if (!started) {
        setErrorMsg('Please grant Location permissions to verify work location.');
      }
    });

    return () => {
      trackerRef.current?.stop();
    };
  }, [handleNewReading]);

  const accuracyMeters = currentReading ? Math.round(currentReading.accuracy) : null;
  const isGoodAccuracy = accuracyMeters !== null && accuracyMeters <= 12;

  // Handle GPS Check-In
  async function handleCheckIn() {
    if (!currentReading) {
      Alert.alert('Acquiring GPS', 'Waiting for satellite fix. Please step into an open area.');
      return;
    }

    setCheckingIn(true);
    const res = await checkInJob(job.id, {
      lat: currentReading.latitude,
      lng: currentReading.longitude,
    });
    setCheckingIn(false);

    if (res.success) {
      setIsCheckedIn(true);
      Alert.alert('Checked In!', 'Arrived at farm. GPS coordinates recorded.');
      onJobUpdated();
    } else {
      Alert.alert('Check-In Failed', res.error || 'Could not record GPS check-in. Please verify you are at the farm and try again.');
    }
  }

  // Camera capture
  async function handleTakePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission', 'Camera permission is required to capture work evidence.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setCapturedPhoto(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  }

  // Gallery picker
  async function handlePickPhoto() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Gallery Permission', 'Media gallery access is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setCapturedPhoto(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  }

  // Upload proof photo
  async function handleUploadProof() {
    if (submittingProof || submittingProofRef.current) return;
    if (!capturedPhoto) {
      Alert.alert('Photo Needed', 'Please capture or select a photo first.');
      return;
    }

    if (!currentReading) {
      Alert.alert('GPS Required', 'Acquiring satellite fix to geo-tag work proof...');
      return;
    }

    const ha = parseFloat(hectaresInput.replace(',', '.'));
    submittingProofRef.current = true;
    setSubmittingProof(true);

    try {
      const res = await submitWorkProofPhoto(
        job.id,
        capturedPhoto,
        selectedKind,
        currentReading,
        Number.isFinite(ha) ? ha : undefined
      );

      if (!res?.success) {
        Alert.alert(
          'Upload Failed',
          res?.error || 'Could not upload work proof photo. Please try again.'
        );
        return;
      }

      // Save proof to local list only after confirmed backend persistence
      const newProof: ProofItem = {
        id: `${Date.now()}-${selectedKind}`,
        kind: selectedKind,
        uri: capturedPhoto,
        timestamp: currentReading.timestamp,
        accuracy: currentReading.accuracy,
        hectares: Number.isFinite(ha) ? ha : undefined,
      };

      setProofs((prev) => [...prev, newProof]);
      setCapturedPhoto(null);

      // Auto-advance kind if before was taken
      if (selectedKind === 'before') {
        setSelectedKind('after');
      }

      Alert.alert('Evidence Uploaded', `${selectedKind.toUpperCase()} photo verified with GPS.`);
      onJobUpdated();
    } catch {
      Alert.alert('Upload Failed', 'Could not upload work proof photo. Please try again.');
    } finally {
      submittingProofRef.current = false;
      setSubmittingProof(false);
    }
  }

  // Finish work & Handover to farmer
  async function handleFinishWork() {
    if (finishingJob || finishingJobRef.current) return;
    const hasBefore = proofs.some((p) => p.kind === 'before');
    const hasAfter = proofs.some((p) => p.kind === 'after');

    if (!hasBefore || !hasAfter) {
      Alert.alert(
        'Missing Proof Photos',
        'CultivaNode requires at least one "BEFORE" and one "AFTER" photo to complete work handover.'
      );
      return;
    }

    const ha = parseFloat(hectaresInput.replace(',', '.'));
    if (!Number.isFinite(ha) || ha <= 0) {
      Alert.alert('Area Required', 'Please enter valid total hectares completed.');
      return;
    }

    Alert.alert(
      'Hand Over Work?',
      `Submit ${ha} hectares of completed work? The farmer will have 48 hours to confirm or inspect.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Handover',
          style: 'default',
          onPress: async () => {
            if (finishingJob || finishingJobRef.current) return;
            finishingJobRef.current = true;
            setFinishingJob(true);
            try {
              const res = await finishJobWork(job.id, ha);
              if (res?.success) {
                Alert.alert('Work Handed Over!', 'Job transitioned to Awaiting Confirmation.');
                onJobUpdated();
                onBack();
              } else {
                Alert.alert(
                  'Handover Failed',
                  res?.error || 'Could not submit work handover. Please try again.'
                );
              }
            } catch {
              Alert.alert('Handover Failed', 'Could not submit work handover. Please try again.');
            } finally {
              finishingJobRef.current = false;
              setFinishingJob(false);
            }
          },
        },
      ]
    );
  }

  const hasBefore = proofs.some((p) => p.kind === 'before');
  const hasAfter = proofs.some((p) => p.kind === 'after');

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text variant="caption" color={colors.leaf[700]}>← Back to Dispatch</Text>
        </Pressable>
        <View
          style={[
            styles.signalChip,
            isGoodAccuracy ? styles.signalGood : styles.signalMid,
          ]}
        >
          <Text variant="caption" style={styles.signalText}>
            🛰️ GPS: {accuracyMeters !== null ? `±${accuracyMeters}m` : 'Acquiring...'}
          </Text>
        </View>
      </View>

      <Text variant="title" color={colors.leaf[900]}>
        Work Evidence & Dispatch
      </Text>
      <Text muted>
        Provide GPS check-in and geotagged before/after photo proof for {job.farmName}.
      </Text>

      {errorMsg ? <Notice tone="error">{errorMsg}</Notice> : null}

      {/* Job Details Card */}
      <Card style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View>
            <Text variant="caption" muted>CLIENT & FARM</Text>
            <Text variant="heading" color={colors.leaf[800]}>{job.farmerName}</Text>
            <Text variant="caption" color={colors.leaf[700]}>📍 {job.farmName} ({job.jobLga}, {job.jobState})</Text>
          </View>
          <View style={styles.badge}>
            <Text variant="caption" color={colors.leaf[800]} style={styles.bold}>
              {job.quantity} {job.unit}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text variant="caption" muted>Agreed Service:</Text>
          <Text variant="caption" color={colors.soil[900]} style={styles.bold}>{job.title}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="caption" muted>Total Amount:</Text>
          <Text variant="label" color={colors.harvest[700]}>{formatNaira(job.totalKobo)}</Text>
        </View>
        {job.farmerPhone ? (
          <View style={styles.infoRow}>
            <Text variant="caption" muted>Farmer Phone:</Text>
            <Text variant="caption" color={colors.leaf[800]}>📞 {job.farmerPhone}</Text>
          </View>
        ) : null}
      </Card>

      {/* Step 1: GPS Check-in */}
      <Card style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text variant="label" color="#123D27">
            Step 1: Farm Check-In (GPS)
          </Text>
          <Text variant="caption" color={isCheckedIn ? colors.leaf[700] : colors.harvest[700]}>
            {isCheckedIn ? '✓ CHECKED IN' : 'REQUIRED'}
          </Text>
        </View>
        <Text variant="caption" muted>
          Confirm your physical arrival at the farm perimeter before starting machinery operations.
        </Text>
        <Button
          title={isCheckedIn ? '✓ Verified at Farm (Check-In Done)' : '📍 Check In at Farm (Phone GPS)'}
          variant={isCheckedIn ? 'secondary' : 'primary'}
          onPress={handleCheckIn}
          loading={checkingIn}
          disabled={isCheckedIn}
        />
      </Card>

      {/* Step 2: Photo Proof Capture */}
      <Card style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text variant="label" color="#123D27">
            Step 2: Geotagged Proof Photos
          </Text>
          <Text variant="caption" color={hasBefore && hasAfter ? colors.leaf[700] : colors.harvest[700]}>
            {hasBefore && hasAfter ? '✓ READY' : 'MIN 2 PHOTOS'}
          </Text>
        </View>

        {/* Kind selector pills */}
        <View style={styles.kindSelector}>
          {(['before', 'after', 'extra'] as const).map((kind) => {
            const isSelected = selectedKind === kind;
            const isDone = proofs.some((p) => p.kind === kind);
            return (
              <Pressable
                key={kind}
                style={[
                  styles.kindPill,
                  isSelected && styles.kindPillActive,
                  isDone && styles.kindPillDone,
                ]}
                onPress={() => setSelectedKind(kind)}
              >
                <Text
                  variant="caption"
                  color={isSelected ? '#FAF7F0' : isDone ? colors.leaf[800] : colors.soil[700]}
                  style={styles.bold}
                >
                  {kind === 'before' ? '📸 Before Work' : kind === 'after' ? '🚜 After Work' : '🔍 Extra / Soil'}
                  {isDone ? ' ✓' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Camera / Gallery triggers */}
        <View style={styles.photoActionsRow}>
          <Button
            title="📷 Take Live Photo"
            variant="primary"
            onPress={handleTakePhoto}
          />
          <Button
            title="🖼️ Pick Photo"
            variant="secondary"
            onPress={handlePickPhoto}
          />
        </View>

        {/* Photo Preview & Upload */}
        {capturedPhoto && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
            <View style={styles.previewMeta}>
              <Text variant="caption" color="#FAF7F0" style={styles.bold}>
                Tag: {selectedKind.toUpperCase()}
              </Text>
              <Text variant="caption" color="#C9D8CF">
                GPS: {currentReading ? `${currentReading.latitude.toFixed(5)}, ${currentReading.longitude.toFixed(5)}` : 'Logged'}
              </Text>
            </View>
            <Button
              title={submittingProof ? 'Uploading...' : '⚡ Upload Proof Photo'}
              variant="primary"
              onPress={handleUploadProof}
              loading={submittingProof}
              disabled={submittingProof}
            />
          </View>
        )}

        {/* Uploaded Proofs List */}
        {proofs.length > 0 && (
          <View style={styles.proofsList}>
            <Text variant="caption" muted>ATTACHED PROOFS ({proofs.length}):</Text>
            <FlatList
              horizontal
              data={proofs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.proofThumbCard}>
                  <Image source={{ uri: item.uri }} style={styles.proofThumb} />
                  <View style={styles.proofThumbBadge}>
                    <Text variant="caption" color="#FAF7F0" style={styles.miniBadge}>
                      {item.kind.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </Card>

      {/* Step 3: Complete & Handover */}
      <Card style={styles.stepCard}>
        <Text variant="label" color="#123D27">
          Step 3: Final Area & Handover
        </Text>
        <Text variant="caption" muted>
          Enter the actual measured hectares completed by machinery operator.
        </Text>
        <TextField
          label="Total Hectares Worked"
          value={hectaresInput}
          onChangeText={setHectaresInput}
          keyboardType="decimal-pad"
          hint="e.g. 5.5"
        />
        <Button
          title={finishingJob ? 'Submitting Handover...' : '🤝 Hand Over Work to Farmer'}
          variant="primary"
          onPress={handleFinishWork}
          loading={finishingJob}
          disabled={!hasBefore || !hasAfter || finishingJob}
        />
        <Text variant="caption" muted style={styles.center}>
          Requires at least 1 Before photo and 1 After photo.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[2],
  },
  signalChip: {
    paddingHorizontal: space[3],
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  signalGood: { backgroundColor: '#DCFCE7' },
  signalMid: { backgroundColor: '#FEF3C7' },
  signalText: { fontWeight: '700', fontSize: 12 },
  jobCard: {
    padding: space[4],
    backgroundColor: '#FAF7F0',
    borderColor: '#123D27',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    gap: space[2],
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: space[3],
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  bold: { fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.soil[100], marginVertical: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepCard: {
    padding: space[4],
    gap: space[3],
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kindSelector: {
    flexDirection: 'row',
    gap: space[2],
  },
  kindPill: {
    flex: 1,
    paddingVertical: space[2],
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.soil[300],
    backgroundColor: '#FAF7F0',
  },
  kindPillActive: {
    backgroundColor: '#123D27',
    borderColor: '#123D27',
  },
  kindPillDone: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: space[2],
  },
  previewContainer: {
    backgroundColor: '#123D27',
    borderRadius: radius.lg,
    padding: space[3],
    gap: space[2],
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
  },
  previewMeta: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  proofsList: {
    gap: space[2],
  },
  proofThumbCard: {
    marginRight: space[2],
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  proofThumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
  },
  proofThumbBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  miniBadge: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  center: {
    textAlign: 'center',
  },
});
