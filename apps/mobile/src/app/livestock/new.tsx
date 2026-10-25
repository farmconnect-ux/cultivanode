import { Stack, useRouter } from 'expo-router';
import { useI18n } from '../../i18n';
import { AnimalsAddScreen } from '../../screens/AnimalsScreen';

export default function AnimalsAddRoute() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <>
      <Stack.Screen options={{ title: t.animals.add }} />
      <AnimalsAddScreen onDone={() => router.back()} />
    </>
  );
}
