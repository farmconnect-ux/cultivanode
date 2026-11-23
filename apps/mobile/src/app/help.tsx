import { useLocalSearchParams, useRouter } from 'expo-router';
import { HelpScreen } from '../screens/HelpScreen';

export default function HelpRoute() {
  const router = useRouter();
  const { topic, advice } = useLocalSearchParams<{ topic?: string; advice?: string }>();
  return <HelpScreen topic={topic} advice={advice} onBack={() => router.back()} onScout={() => router.push('/operations/scouting')} onAssistant={() => router.push('/operations/assistant')} />;
}
