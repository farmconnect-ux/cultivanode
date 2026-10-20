import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkEvidenceScreen } from '../../screens/WorkEvidenceScreen';
import { useProvider } from '../(provider)/_layout';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@cultivanode/shared';

export default function EvidenceRoute() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { jobs, refresh } = useProvider();

  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.leaf[600]} />
      </View>
    );
  }

  return (
    <WorkEvidenceScreen
      job={job}
      onBack={() => router.back()}
      onJobUpdated={() => {
        refresh();
      }}
    />
  );
}
