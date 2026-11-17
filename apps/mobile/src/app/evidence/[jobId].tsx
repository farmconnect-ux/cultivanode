import { colors, space } from '@cultivanode/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  hasProviderAccess,
  isValidJobId,
  loadProviderJobById,
  type DispatchFailureKind,
  type ProviderJob,
} from '../../lib/provider-dispatch';
import { useSession } from '../../lib/session';
import { WorkEvidenceScreen } from '../../screens/WorkEvidenceScreen';
import { Button, Card, Notice, Screen, Text } from '../../ui';

type LoadError = {
  kind: DispatchFailureKind | 'not_found';
  message: string;
};

export default function EvidenceRoute() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { session, account, loadFailed } = useSession();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<ProviderJob | null>(null);
  const [error, setError] = useState<LoadError | null>(null);

  const authorized = hasProviderAccess(account?.roles);

  const fetchJob = useCallback(async () => {
    if (!session) return;
    if (!isValidJobId(jobId)) {
      setJob(null);
      setError({ kind: 'invalid', message: 'This job link is invalid or incomplete.' });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await loadProviderJobById(jobId);
    if (res.ok) {
      setJob(res.data);
      setError(null);
    } else {
      setJob(null);
      setError({ kind: res.kind, message: res.message });
    }
    setLoading(false);
  }, [session, jobId]);

  useEffect(() => {
    if (session === undefined || account === undefined) return;
    if (!session) {
      setLoading(false);
      router.replace('/(auth)/signIn');
      return;
    }
    if (!authorized) {
      setLoading(false);
      return;
    }
    fetchJob();
  }, [session, account, authorized, fetchJob, router]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(provider)/inbox');
    }
  }

  if (session === undefined || account === undefined || (session && authorized && loading)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.leaf[600]} />
      </View>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Card style={styles.card}>
          <Notice tone="warn">Please sign in to access provider work evidence.</Notice>
          <Button title="Sign in" variant="primary" onPress={() => router.replace('/(auth)/signIn')} />
        </Card>
      </Screen>
    );
  }

  if (loadFailed && !account) {
    return (
      <Screen>
        <Card style={styles.card}>
          <Notice tone="warn">Could not verify your account permissions. Check your connection and try again.</Notice>
          <Button title="Retry" variant="primary" onPress={fetchJob} />
          <Button title="Back" variant="outline" onPress={handleBack} />
        </Card>
      </Screen>
    );
  }

  if (!authorized) {
    return (
      <Screen>
        <Card style={styles.card}>
          <Text variant="heading">Provider Access Required</Text>
          <Notice tone="danger">
            Only accounts with an active equipment or service provider role can view and submit work evidence.
          </Notice>
          <Button title="Go to Home" variant="primary" onPress={() => router.replace('/(tabs)/home')} />
        </Card>
      </Screen>
    );
  }

  if (error || !job) {
    const canRetry = error?.kind === 'network' || error?.kind === 'database';
    return (
      <Screen>
        <Card style={styles.card}>
          <Text variant="heading">Unable to Open Job</Text>
          <Notice tone={error?.kind === 'forbidden' ? 'danger' : 'warn'}>
            {error?.message || 'This job could not be loaded.'}
          </Notice>
          {error?.kind === 'unauthenticated' ? (
            <Button title="Sign in" variant="primary" onPress={() => router.replace('/(auth)/signIn')} />
          ) : canRetry ? (
            <Button title="Retry" variant="primary" onPress={fetchJob} />
          ) : null}
          <Button title="Back to Inbox" variant="outline" onPress={handleBack} />
        </Card>
      </Screen>
    );
  }

  return (
    <WorkEvidenceScreen
      job={job}
      onBack={handleBack}
      onJobUpdated={() => {
        fetchJob();
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  card: {
    marginTop: space[6],
    padding: space[5],
    gap: space[4],
  },
});
