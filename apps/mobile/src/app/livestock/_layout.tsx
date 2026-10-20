import { Stack } from 'expo-router';

export default function LivestockLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: 'Livestock & Poultry' }}>
      <Stack.Screen name="index" options={{ title: 'Flocks & Herds' }} />
      <Stack.Screen name="new" options={{ title: 'Add Livestock' }} />
      <Stack.Screen name="[id]" options={{ title: 'Batch Details' }} />
      <Stack.Screen name="log-event" options={{ title: 'Log Event', presentation: 'modal' }} />
    </Stack>
  );
}
