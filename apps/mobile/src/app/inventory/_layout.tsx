import { Stack } from 'expo-router';

export default function InventoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: 'Inventory' }}>
      <Stack.Screen name="index" options={{ title: 'Stock & Inputs' }} />
    </Stack>
  );
}
