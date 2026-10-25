import { Stack } from 'expo-router';
import { useI18n } from '../../i18n';
import { toolStack } from '../../ui/stack';

export default function LivestockLayout() {
  const { t } = useI18n();
  return (
    <Stack screenOptions={{ ...toolStack, title: t.farm.toolNames.livestock }}>
      <Stack.Screen name="log-event" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
