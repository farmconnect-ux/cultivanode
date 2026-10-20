import { Stack } from 'expo-router';

export default function OrdersLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: 'My Orders' }}>
      <Stack.Screen name="index" options={{ title: 'Purchases & Sales' }} />
    </Stack>
  );
}
