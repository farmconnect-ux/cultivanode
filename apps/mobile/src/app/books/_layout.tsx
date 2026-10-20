import { Stack } from 'expo-router';

export default function BooksLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: 'Farm Books' }}>
      <Stack.Screen name="index" options={{ title: 'Ledger & Finances' }} />
    </Stack>
  );
}
