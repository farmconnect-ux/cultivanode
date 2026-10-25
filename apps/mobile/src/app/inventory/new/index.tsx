import { Stack, useRouter } from 'expo-router';
import { useI18n } from '../../../i18n';
import { StoreAddScreen } from '../../../screens/StoreScreen';

export default function StoreAddRoute() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <>
      <Stack.Screen options={{ title: t.store.add }} />
      <StoreAddScreen onDone={() => router.back()} />
    </>
  );
}
