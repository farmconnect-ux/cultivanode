import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '../../i18n';
import { HerdLogScreen, type HerdLog } from '../../screens/AnimalsScreen';

export default function HerdLogRoute() {
  const router = useRouter();
  const { t } = useI18n();
  const { id, eventType } = useLocalSearchParams<{ id: string; eventType?: string }>();
  const kind: HerdLog = eventType === 'health' ? 'health' : eventType === 'loss' || eventType === 'mortality' ? 'loss' : 'feed';
  const a = t.animals;
  return (
    <>
      <Stack.Screen options={{ title: kind === 'feed' ? a.logFeed : kind === 'health' ? a.logHealth : a.logLoss }} />
      <HerdLogScreen id={String(id)} kind={kind} onDone={() => router.back()} />
    </>
  );
}
