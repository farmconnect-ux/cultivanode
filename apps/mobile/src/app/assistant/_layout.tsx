import { Stack } from 'expo-router';

export default function AssistantLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: 'AI Field Assistant' }}>
      <Stack.Screen name="index" options={{ title: 'CultivaNode AI' }} />
    </Stack>
  );
}
