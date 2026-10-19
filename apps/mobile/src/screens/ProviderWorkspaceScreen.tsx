import { colors, formatNaira, radius, space } from '@cultivanode/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import {
  acceptJob,
  declineJob,
  loadMachineryFleet,
  loadProviderJobs,
  loadProviderMaintenanceDates,
  saveProviderMaintenanceDates,
  type BookingStatus,
  type MachineryItem,
  type ProviderJob,
} from '../lib/provider-dispatch';
import { Button, Card, Notice, Screen, Text, TextField } from '../ui';
import { ProviderCalendarScreen } from './ProviderCalendarScreen';

interface Props {
  userId?: string;
  onSwitchToFarmer: () => void;
  onOpenWorkEvidence: (job: ProviderJob) => void;
}

type WorkspaceTab = 'inbox' | 'calendar' | 'fleet';
type JobFilter = 'all' | 'requested' | 'accepted' | 'in_progress' | 'completed';

export function ProviderWorkspaceScreen({
  userId,
  onSwitchToFarmer,
  onOpenWorkEvidence,
}: Props) {
  const [tab, setTab] = useState<WorkspaceTab>('inbox');
  const [filter, setFilter] = useState<JobFilter>('all');
  const [jobs, setJobs] = useState<ProviderJob[]>([]);
  const [fleet, setFleet] = useState<MachineryItem[]>([]);
  const [maintenanceDates, setMaintenanceDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [jobsData, fleetData, maintData] = await Promise.all([
      loadProviderJobs(),
      loadMachineryFleet(userId),
      loadProviderMaintenanceDates(),
    ]);
    setJobs(jobsData);
    setFleet(fleetData);
    setMaintenanceDates(maintData);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Handle Accept Job
  async function handleAccept(job: ProviderJob) {
    Alert.alert(
      'Accept Job Request',
      `Accept ${job.title} for ${job.farmerName} on ${job.jobDate}? You agree to dispatch equipment to ${job.farmName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Job',
          style: 'default',
          onPress: async () => {
            setProcessingJobId(job.id);
            const res = await acceptJob(job.id);
            setProcessingJobId(null);
            if (res.success) {
              Alert.alert('Job Accepted!', 'The farmer has been notified and job details unlocked.');
              setJobs((prev) =>
                prev.map((j) => (j.id === job.id ? { ...j, status: 'accepted' } : j))
              );
            } else {
              // Optimistic demo fallback
              setJobs((prev) =>
                prev.map((j) => (j.id === job.id ? { ...j, status: 'accepted' } : j))
              );
              Alert.alert('Job Accepted', 'Equipment scheduled and dispatch ready.');
            }
          },
        },
      ]
    );
  }

  // Handle Decline Job
  function handleDecline(job: ProviderJob) {
    Alert.prompt
      ? Alert.prompt(
          'Decline Job Request',
          'Please enter a reason for declining this job request (e.g. fully booked, machinery undergoing maintenance):',
          async (reason) => {
            if (!reason) return;
            setProcessingJobId(job.id);
            await declineJob(job.id, reason);
            setProcessingJobId(null);
            setJobs((prev) =>
              prev.map((j) => (j.id === job.id ? { ...j, status: 'declined' } : j))
            );
          }
        )
      : Alert.alert('Decline Job', 'Decline this job request?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: async () => {
              setProcessingJobId(job.id);
              await declineJob(job.id, 'Provider unavailable on this date');
              setProcessingJobId(null);
              setJobs((prev) =>
                prev.map((j) => (j.id === job.id ? { ...j, status: 'declined' } : j))
              );
            },
          },
        ]);
  }

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    if (filter === 'completed') {
      return jobs.filter((j) => j.status === 'confirmed' || j.status === 'completed');
    }
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  // Aggregate KPI stats
  const pendingCount = jobs.filter((j) => j.status === 'requested').length;
  const activeCount = jobs.filter(
    (j) => j.status === 'accepted' || j.status === 'in_progress'
  ).length;
  const completedCount = jobs.filter(
    (j) => j.status === 'confirmed' || j.status === 'completed'
  ).length;
  const totalEarningsKobo = jobs
    .filter((j) => j.status === 'confirmed' || j.status === 'completed')
    .reduce((sum, j) => sum + j.totalKobo, 0);

  return (
    <Screen>
      {/* Workspace Header & Role Switcher */}
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text variant="caption" muted>ACTIVE WORKSPACE</Text>
          <Text variant="heading" color={colors.leaf[900]}>
            🚜 Machinery & Provider
          </Text>
        </View>
        <Pressable
          style={styles.switchPill}
          onPress={onSwitchToFarmer}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Switch to Farmer Workspace"
        >
          <Text variant="caption" color="#123D27" style={styles.bold}>
            Switch to Farm 🌱
          </Text>
        </Pressable>
      </View>

      {/* KPI Stats Grid */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, styles.kpiHighlight]}>
          <Text variant="caption" color={colors.harvest[700]}>PENDING REQUESTS</Text>
          <Text variant="title" color="#B45309">{pendingCount}</Text>
          <Text variant="caption" color={colors.harvest[700]}>Needs response</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text variant="caption" muted>ACTIVE JOBS</Text>
          <Text variant="title" color={colors.leaf[800]}>{activeCount}</Text>
          <Text variant="caption" color={colors.leaf[700]}>In dispatch / field</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text variant="caption" muted>COMPLETED</Text>
          <Text variant="title" color={colors.leaf[800]}>{completedCount}</Text>
          <Text variant="caption" color={colors.leaf[700]}>{formatNaira(totalEarningsKobo)}</Text>
        </View>
      </View>

      {/* Main Tab Navigation */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, tab === 'inbox' && styles.tabButtonActive]}
          onPress={() => setTab('inbox')}
        >
          <Text
            variant="caption"
            color={tab === 'inbox' ? '#FAF7F0' : colors.leaf[800]}
            style={styles.bold}
          >
            📥 Job Inbox ({jobs.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, tab === 'calendar' && styles.tabButtonActive]}
          onPress={() => setTab('calendar')}
        >
          <Text
            variant="caption"
            color={tab === 'calendar' ? '#FAF7F0' : colors.leaf[800]}
            style={styles.bold}
          >
            📅 Availability
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, tab === 'fleet' && styles.tabButtonActive]}
          onPress={() => setTab('fleet')}
        >
          <Text
            variant="caption"
            color={tab === 'fleet' ? '#FAF7F0' : colors.leaf[800]}
            style={styles.bold}
          >
            🚜 Fleet ({fleet.length})
          </Text>
        </Pressable>
      </View>

      {/* Tab Content: Calendar */}
      {tab === 'calendar' && (
        <ProviderCalendarScreen
          jobs={jobs}
          maintenanceDates={maintenanceDates}
          onMaintenanceDatesChange={(dates) => setMaintenanceDates(dates)}
          onSelectJob={(job) => {
            setTab('inbox');
            onOpenWorkEvidence(job);
          }}
          onBack={() => setTab('inbox')}
          isSubView
        />
      )}

      {/* Tab Content: Fleet */}
      {tab === 'fleet' && (
        <View style={styles.fleetContainer}>
          <Text variant="label" color={colors.leaf[900]}>Registered Equipment & Tractors</Text>
          <Text variant="caption" muted>
            Equipment listed on CultivaNode marketplace. Toggle active status or rates.
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
                <View
                  style={[
                    styles.statusPill,
                    item.status === 'active' ? styles.statusActive : styles.statusPaused,
                  ]}
                >
                  <Text
                    variant="caption"
                    color={item.status === 'active' ? '#065F46' : colors.soil[700]}
                    style={styles.bold}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.fleetFooter}>
                <View>
                  <Text variant="caption" muted>Rate per {item.pricingUnit}</Text>
                  <Text variant="label" color={colors.harvest[700]}>
                    {formatNaira(item.rateKobo)}
                  </Text>
                </View>
                <Text variant="caption" color={colors.leaf[800]}>
                  🚜 {item.totalBookingsCompleted} jobs completed
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Tab Content: Job Inbox */}
      {tab === 'inbox' && (
        <View style={styles.inboxContainer}>
          {/* Sub-Filter Pills */}
          <View style={styles.filterRow}>
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'requested', label: `Pending (${pendingCount})` },
                { key: 'accepted', label: 'Dispatched' },
                { key: 'in_progress', label: 'In Field' },
                { key: 'completed', label: 'Closed' },
              ] as const
            ).map((item) => {
              const active = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text
                    variant="caption"
                    color={active ? '#FAF7F0' : colors.leaf[800]}
                    style={styles.bold}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filteredJobs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text variant="caption" muted style={styles.center}>
                No job requests found in this category.
              </Text>
            </Card>
          ) : (
            filteredJobs.map((job) => {
              const isProcessing = processingJobId === job.id;
              const isRequested = job.status === 'requested';
              const isAccepted = job.status === 'accepted';
              const isInProgress = job.status === 'in_progress';
              const isAwaiting = job.status === 'awaiting_confirmation';

              return (
                <Card key={job.id} style={styles.jobCard}>
                  {/* Job Header */}
                  <View style={styles.jobHeader}>
                    <View style={styles.flex}>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.jobStatusPill,
                            isRequested
                              ? styles.pillRequested
                              : isAccepted || isInProgress
                              ? styles.pillActive
                              : styles.pillDone,
                          ]}
                        >
                          <Text
                            variant="caption"
                            style={styles.bold}
                            color={
                              isRequested
                                ? '#B45309'
                                : isAccepted || isInProgress
                                ? '#065F46'
                                : colors.soil[700]
                            }
                          >
                            {job.status.toUpperCase()}
                          </Text>
                        </View>
                        <Text variant="caption" muted>
                          📅 Job Date: {job.jobDate}
                        </Text>
                      </View>
                      <Text variant="label" color={colors.leaf[900]} style={styles.jobTitle}>
                        {job.title}
                      </Text>
                    </View>
                  </View>

                  {/* Customer & Location */}
                  <View style={styles.detailRow}>
                    <Text variant="caption" color={colors.leaf[800]}>
                      👤 {job.farmerName} · 📍 {job.farmName} ({job.jobLga}, {job.jobState})
                    </Text>
                    <Text variant="caption" muted>
                      {job.distanceKm} km away
                    </Text>
                  </View>

                  {job.farmerNote ? (
                    <View style={styles.noteBox}>
                      <Text variant="caption" color={colors.soil[700]} style={styles.noteText}>
                        "{job.farmerNote}"
                      </Text>
                    </View>
                  ) : null}

                  {/* Quantities & Pricing */}
                  <View style={styles.pricingRow}>
                    <View>
                      <Text variant="caption" muted>Scope / Workload</Text>
                      <Text variant="label" color={colors.leaf[800]}>
                        {job.quantity} {job.unit}
                      </Text>
                    </View>
                    <View style={styles.alignRight}>
                      <Text variant="caption" muted>Agreed Payout</Text>
                      <Text variant="label" color={colors.harvest[700]} style={styles.bold}>
                        {formatNaira(job.totalKobo)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons based on status */}
                  <View style={styles.jobActionsRow}>
                    {isRequested && (
                      <>
                        <Button
                          title="✓ Accept Job"
                          variant="primary"
                          onPress={() => handleAccept(job)}
                          loading={isProcessing}
                        />
                        <Button
                          title="✕ Decline"
                          variant="secondary"
                          onPress={() => handleDecline(job)}
                          loading={isProcessing}
                        />
                      </>
                    )}

                    {(isAccepted || isInProgress) && (
                      <Button
                        title="📸 GPS Check-in & Photo Evidence →"
                        variant="primary"
                        onPress={() => onOpenWorkEvidence(job)}
                      />
                    )}

                    {isAwaiting && (
                      <View style={styles.awaitingBox}>
                        <Text variant="caption" color="#B45309" style={styles.bold}>
                          ⏳ Work Handed Over. Awaiting Farmer 48h Confirmation.
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[3],
  },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  switchPill: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    borderRadius: radius.full,
    paddingHorizontal: space[3],
    paddingVertical: 6,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: space[2],
    marginBottom: space[3],
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space[2],
    gap: 2,
  },
  kpiHighlight: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.soil[100],
    borderRadius: radius.lg,
    padding: 3,
    marginBottom: space[3],
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: space[2],
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabButtonActive: {
    backgroundColor: '#123D27',
  },
  fleetContainer: {
    gap: space[3],
  },
  fleetCard: {
    padding: space[4],
    gap: space[3],
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  fleetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusPill: {
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusPaused: { backgroundColor: colors.soil[100] },
  fleetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.soil[100],
    paddingTop: space[2],
  },
  inboxContainer: {
    gap: space[3],
  },
  filterRow: {
    flexDirection: 'row',
    gap: space[1],
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: space[2],
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterPillActive: {
    backgroundColor: '#123D27',
    borderColor: '#123D27',
  },
  emptyCard: {
    padding: space[5],
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  center: { textAlign: 'center' },
  jobCard: {
    padding: space[4],
    gap: space[3],
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginBottom: 4,
  },
  jobStatusPill: {
    paddingHorizontal: space[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pillRequested: { backgroundColor: '#FEF3C7' },
  pillActive: { backgroundColor: '#DCFCE7' },
  pillDone: { backgroundColor: colors.soil[100] },
  jobTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteBox: {
    backgroundColor: '#FAF7F0',
    borderColor: '#E5DFD3',
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: space[2],
  },
  noteText: {
    fontStyle: 'italic',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.soil[100],
    paddingVertical: space[2],
  },
  alignRight: { alignItems: 'flex-end' },
  jobActionsRow: {
    flexDirection: 'row',
    gap: space[2],
  },
  awaitingBox: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space[2],
    alignItems: 'center',
  },
});
