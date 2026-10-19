import { colors, formatNaira, radius, space } from '@cultivanode/shared';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import {
  saveProviderMaintenanceDates,
  type ProviderJob,
} from '../lib/provider-dispatch';
import { Button, Card, Notice, Screen, Text } from '../ui';

interface Props {
  jobs: ProviderJob[];
  maintenanceDates: string[];
  onMaintenanceDatesChange: (dates: string[]) => void;
  onSelectJob: (job: ProviderJob) => void;
  onBack: () => void;
  isSubView?: boolean;
}

export function ProviderCalendarScreen({
  jobs,
  maintenanceDates,
  onMaintenanceDatesChange,
  onSelectJob,
  onBack,
  isSubView = false,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Generate next 14 days for the interactive calendar schedule
  const calendarDays = useMemo(() => {
    const list: { dateString: string; dayName: string; dayNum: number }[] = [];
    const today = new Date();
    for (let i = -1; i < 13; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const str = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      list.push({ dateString: str, dayName, dayNum });
    }
    return list;
  }, []);

  // Filter jobs for selected date
  const selectedDayJobs = useMemo(() => {
    return jobs.filter((j) => j.jobDate === selectedDate);
  }, [jobs, selectedDate]);

  const isSelectedDateMaintenance = maintenanceDates.includes(selectedDate);

  // Toggle maintenance for selected date
  async function toggleMaintenance() {
    let updated: string[];
    if (isSelectedDateMaintenance) {
      updated = maintenanceDates.filter((d) => d !== selectedDate);
    } else {
      if (selectedDayJobs.some((j) => j.status === 'accepted' || j.status === 'in_progress')) {
        Alert.alert(
          'Active Jobs Scheduled',
          'This date already has confirmed bookings. Marking it as maintenance will notify farmers of potential machinery service delay. Proceed?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Set Maintenance',
              style: 'destructive',
              onPress: async () => {
                const nextDates = [...maintenanceDates, selectedDate];
                onMaintenanceDatesChange(nextDates);
                await saveProviderMaintenanceDates(nextDates);
              },
            },
          ]
        );
        return;
      }
      updated = [...maintenanceDates, selectedDate];
    }
    onMaintenanceDatesChange(updated);
    await saveProviderMaintenanceDates(updated);
  }

  const Wrapper = isSubView ? View : Screen;

  return (
    <Wrapper>
      {/* Top Bar */}
      {!isSubView && (
        <View style={styles.topRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <Text variant="caption" color={colors.leaf[700]}>← Back to Workspace</Text>
          </Pressable>
          <Text variant="caption" color={colors.leaf[800]} style={styles.bold}>
            📅 Availability Calendar
          </Text>
        </View>
      )}

      <Text variant="title" color={colors.leaf[900]}>
        Provider Schedule & Fleet Availability
      </Text>
      <Text muted>
        Manage operational days, track dispatched jobs, and schedule equipment maintenance.
      </Text>

      {/* Horizontal Calendar Strip */}
      <View style={styles.calendarStripContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={calendarDays}
          keyExtractor={(item) => item.dateString}
          renderItem={({ item }) => {
            const isSelected = item.dateString === selectedDate;
            const hasJobs = jobs.some((j) => j.jobDate === item.dateString);
            const isMaint = maintenanceDates.includes(item.dateString);

            return (
              <Pressable
                onPress={() => setSelectedDate(item.dateString)}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isMaint && !isSelected && styles.dayCellMaintenance,
                ]}
              >
                <Text
                  variant="caption"
                  color={isSelected ? '#FAF7F0' : isMaint ? colors.soil[700] : colors.leaf[800]}
                >
                  {item.dayName}
                </Text>
                <Text
                  variant="heading"
                  color={isSelected ? '#FAF7F0' : colors.leaf[900]}
                  style={styles.dayNum}
                >
                  {item.dayNum}
                </Text>
                {/* Indicator dots */}
                <View style={styles.dotsRow}>
                  {hasJobs && <View style={[styles.dot, styles.jobDot]} />}
                  {isMaint && <View style={[styles.dot, styles.maintDot]} />}
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Selected Day Overview */}
      <Card style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <View>
            <Text variant="caption" muted>SCHEDULED DATE</Text>
            <Text variant="heading" color={colors.leaf[800]}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View
            style={[
              styles.statusChip,
              isSelectedDateMaintenance
                ? styles.chipMaintenance
                : selectedDayJobs.length > 0
                ? styles.chipBooked
                : styles.chipAvailable,
            ]}
          >
            <Text
              variant="caption"
              style={[
                styles.chipText,
                isSelectedDateMaintenance && { color: '#B91C1C' },
              ]}
            >
              {isSelectedDateMaintenance
                ? '🔧 MAINTENANCE'
                : selectedDayJobs.length > 0
                ? `🚜 ${selectedDayJobs.length} JOB(S)`
                : '🟢 AVAILABLE'}
            </Text>
          </View>
        </View>

        {/* Maintenance Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.flex}>
            <Text variant="label" color="#123D27">Equipment Maintenance Window</Text>
            <Text variant="caption" muted>
              Block this date for routine servicing or repairs to prevent conflicting booking requests.
            </Text>
          </View>
          <Button
            title={isSelectedDateMaintenance ? 'Clear Maintenance' : 'Set Maintenance'}
            variant={isSelectedDateMaintenance ? 'secondary' : 'primary'}
            onPress={toggleMaintenance}
          />
        </View>
      </Card>

      {/* Jobs Scheduled for this day */}
      <Text variant="label" color={colors.leaf[900]} style={styles.sectionTitle}>
        Jobs on this Date ({selectedDayJobs.length})
      </Text>

      {selectedDayJobs.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text variant="caption" muted style={styles.center}>
            {isSelectedDateMaintenance
              ? '🔧 Date reserved for fleet maintenance. No jobs can be booked.'
              : '🌱 No jobs scheduled on this day. Open for incoming bookings.'}
          </Text>
        </Card>
      ) : (
        selectedDayJobs.map((job) => (
          <Pressable
            key={job.id}
            onPress={() => onSelectJob(job)}
            style={({ pressed }) => [
              styles.jobItem,
              pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={styles.jobItemHeader}>
              <View>
                <Text variant="label" color={colors.leaf[900]}>{job.title}</Text>
                <Text variant="caption" color={colors.leaf[700]}>
                  👤 {job.farmerName} · 📍 {job.farmName}
                </Text>
              </View>
              <View style={styles.jobBadge}>
                <Text variant="caption" style={styles.bold} color={colors.leaf[800]}>
                  {job.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.jobItemDetails}>
              <Text variant="caption" muted>
                {job.quantity} {job.unit} · {job.distanceKm} km away
              </Text>
              <Text variant="label" color={colors.harvest[700]}>
                {formatNaira(job.totalKobo)}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[2],
  },
  bold: { fontWeight: '700' },
  calendarStripContainer: {
    marginVertical: space[3],
  },
  dayCell: {
    width: 60,
    height: 78,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space[2],
    paddingVertical: 6,
    gap: 2,
  },
  dayCellSelected: {
    backgroundColor: '#123D27',
    borderColor: '#123D27',
  },
  dayCellMaintenance: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  dayNum: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    height: 6,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  jobDot: { backgroundColor: '#F59E0B' },
  maintDot: { backgroundColor: '#EF4444' },
  dayCard: {
    padding: space[4],
    backgroundColor: '#FAF7F0',
    borderColor: '#123D27',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    gap: space[3],
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusChip: {
    paddingHorizontal: space[3],
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  chipAvailable: { backgroundColor: '#DCFCE7' },
  chipBooked: { backgroundColor: '#FEF3C7' },
  chipMaintenance: { backgroundColor: '#FEE2E2' },
  chipText: {
    fontWeight: '700',
    fontSize: 11,
    color: '#065F46',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space[2],
    borderTopWidth: 1,
    borderTopColor: colors.soil[100],
    paddingTop: space[3],
  },
  flex: { flex: 1 },
  sectionTitle: {
    marginTop: space[3],
    marginBottom: space[1],
  },
  emptyCard: {
    padding: space[4],
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  center: { textAlign: 'center' },
  jobItem: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space[3],
    gap: space[2],
    marginBottom: space[2],
  },
  jobItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  jobItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.soil[100],
    paddingTop: space[2],
  },
});
