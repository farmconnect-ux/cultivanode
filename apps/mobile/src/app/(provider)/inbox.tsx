import { colors, formatNaira, radius, space } from '@cultivanode/shared';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { acceptJob, declineJob, validateDeclineReason, type ProviderJob } from '../../lib/provider-dispatch';
import { Button, Card, Notice, PromptModal, Screen, Text } from '../../ui';
import { useProvider } from './_layout';
import { useRouter } from 'expo-router';

type JobFilter = 'all' | 'requested' | 'accepted' | 'in_progress' | 'completed';

export default function InboxRoute() {
  const router = useRouter();
  const { jobs, jobsError, setJobs, refresh } = useProvider();
  const [filter, setFilter] = useState<JobFilter>('all');
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<ProviderJob | null>(null);

  async function handleAccept(job: ProviderJob) {
    if (processingJobId) return;
    Alert.alert(
      'Accept Job Request',
      `Accept ${job.title} for ${job.farmerName} on ${job.jobDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Job',
          onPress: async () => {
            setProcessingJobId(job.id);
            const res = await acceptJob(job.id);
            setProcessingJobId(null);
            if (res.success) {
              setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'accepted' } : j)));
            } else {
              Alert.alert('Could not accept job', res.error || 'Please try again.');
            }
          },
        },
      ]
    );
  }

  function handleDecline(job: ProviderJob) {
    if (processingJobId) return;
    setDeclineTarget(job);
  }

  async function submitDecline(reason: string) {
    if (!declineTarget || processingJobId) return;
    const job = declineTarget;
    setProcessingJobId(job.id);
    const res = await declineJob(job.id, reason);
    setProcessingJobId(null);
    if (res.success) {
      setDeclineTarget(null);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'declined' } : j)));
    } else {
      Alert.alert('Could not decline job', res.error || 'Please try again.');
    }
  }

  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    if (filter === 'completed') return jobs.filter((j) => j.status === 'confirmed' || j.status === 'completed');
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  const pendingCount = jobs.filter((j) => j.status === 'requested').length;
  const activeCount = jobs.filter((j) => j.status === 'accepted' || j.status === 'in_progress').length;
  const totalEarningsKobo = jobs
    .filter((j) => j.status === 'confirmed' || j.status === 'completed')
    .reduce((sum, j) => sum + j.totalKobo, 0);

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text variant="caption" muted>ACTIVE WORKSPACE</Text>
          <Text variant="heading" color={colors.leaf[900]}>🚜 Provider Inbox</Text>
        </View>
        <Pressable style={styles.switchPill} onPress={() => router.push('/(tabs)/home')}>
          <Text variant="caption" color="#123D27" style={styles.bold}>Switch to Farm 🌱</Text>
        </Pressable>
      </View>

      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, styles.kpiHighlight]}>
          <Text variant="caption" color={colors.harvest[700]}>PENDING</Text>
          <Text variant="title" color="#B45309">{pendingCount}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text variant="caption" muted>ACTIVE</Text>
          <Text variant="title" color={colors.leaf[800]}>{activeCount}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text variant="caption" muted>EARNED</Text>
          <Text variant="title" color={colors.leaf[800]}>{formatNaira(totalEarningsKobo)}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'requested', label: `Pending (${pendingCount})` },
            { key: 'accepted', label: 'Active' },
            { key: 'completed', label: 'Closed' },
          ] as const
        ).map((item) => {
          const active = filter === item.key;
          return (
            <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text variant="caption" color={active ? '#FAF7F0' : colors.leaf[800]} style={styles.bold}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.inboxContainer}>
        {jobsError ? (
          <Card style={styles.emptyCard}>
            <Notice tone={jobsError.kind === 'forbidden' ? 'danger' : 'warn'}>{jobsError.message}</Notice>
            <View style={styles.retryRow}>
              {jobsError.kind === 'unauthenticated' ? (
                <Button title="Sign in" variant="primary" onPress={() => router.replace('/(auth)/signIn')} />
              ) : jobsError.kind !== 'forbidden' ? (
                <Button title="Retry" variant="primary" onPress={refresh} />
              ) : null}
            </View>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text variant="label" color={colors.leaf[900]} style={styles.center}>No jobs yet</Text>
            <Text variant="caption" muted style={styles.center}>
              New equipment and service booking requests from farmers will appear here.
            </Text>
          </Card>
        ) : (
          filteredJobs.map((job) => {
            const isProcessing = processingJobId === job.id;
            const isRequested = job.status === 'requested';
            const isActive = job.status === 'accepted' || job.status === 'in_progress';
            return (
              <Card key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.flex}>
                    <View style={styles.statusRow}>
                      <View style={[styles.jobStatusPill, isRequested ? styles.pillRequested : isActive ? styles.pillActive : styles.pillDone]}>
                        <Text variant="caption" style={styles.bold} color={isRequested ? '#B45309' : isActive ? '#065F46' : colors.soil[700]}>
                          {job.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text variant="caption" muted>📅 {job.jobDate}</Text>
                    </View>
                    <Text variant="label" color={colors.leaf[900]} style={styles.jobTitle}>{job.title}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="caption" color={colors.leaf[800]}>👤 {job.farmerName} · 📍 {job.farmName}</Text>
                </View>

                <View style={styles.pricingRow}>
                  <View>
                    <Text variant="caption" muted>Scope</Text>
                    <Text variant="label" color={colors.leaf[800]}>{job.quantity} {job.unit}</Text>
                  </View>
                  <View style={styles.alignRight}>
                    <Text variant="caption" muted>Payout</Text>
                    <Text variant="label" color={colors.harvest[700]} style={styles.bold}>{formatNaira(job.totalKobo)}</Text>
                  </View>
                </View>

                <View style={styles.jobActionsRow}>
                  {isRequested && (
                    <>
                      <Button
                        title="✓ Accept"
                        variant="primary"
                        onPress={() => handleAccept(job)}
                        loading={isProcessing}
                        disabled={Boolean(processingJobId)}
                      />
                      <Button
                        title="✕ Decline"
                        variant="secondary"
                        onPress={() => handleDecline(job)}
                        loading={isProcessing}
                        disabled={Boolean(processingJobId)}
                      />
                    </>
                  )}
                  {isActive && (
                    <Button title="📸 Evidence →" variant="primary" onPress={() => router.push(`/evidence/${job.id}`)} />
                  )}
                </View>
              </Card>
            );
          })
        )}
      </View>

      <PromptModal
        visible={Boolean(declineTarget)}
        title="Decline Job Request"
        description={declineTarget ? `Let ${declineTarget.farmerName} know why you cannot take ${declineTarget.title}.` : undefined}
        label="Reason for declining"
        placeholder="e.g. Tractor scheduled for maintenance on this date"
        confirmLabel="Decline Job"
        cancelLabel="Keep Request"
        submitting={Boolean(declineTarget && processingJobId === declineTarget.id)}
        validate={validateDeclineReason}
        onCancel={() => {
          if (!processingJobId) setDeclineTarget(null);
        }}
        onConfirm={submitDecline}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space[3] },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  switchPill: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC', borderWidth: 1.5, borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: 6 },
  kpiGrid: { flexDirection: 'row', gap: space[2], marginBottom: space[3] },
  kpiCard: { flex: 1, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: space[2], gap: 2 },
  kpiHighlight: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  filterRow: { flexDirection: 'row', gap: space[1], flexWrap: 'wrap', marginBottom: space[3] },
  filterPill: { paddingHorizontal: space[2], paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  filterPillActive: { backgroundColor: '#123D27', borderColor: '#123D27' },
  inboxContainer: { gap: space[3] },
  emptyCard: { padding: space[5], alignItems: 'center', gap: space[3], backgroundColor: colors.white },
  retryRow: { width: '100%', marginTop: space[1] },
  center: { textAlign: 'center' },
  jobCard: { padding: space[4], gap: space[3], backgroundColor: colors.white, borderColor: colors.line },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginBottom: 4 },
  jobStatusPill: { paddingHorizontal: space[2], paddingVertical: 2, borderRadius: radius.full },
  pillRequested: { backgroundColor: '#FEF3C7' },
  pillActive: { backgroundColor: '#DCFCE7' },
  pillDone: { backgroundColor: colors.soil[100] },
  jobTitle: { fontSize: 16, lineHeight: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.soil[100], paddingVertical: space[2] },
  alignRight: { alignItems: 'flex-end' },
  jobActionsRow: { flexDirection: 'row', gap: space[2] },
});
