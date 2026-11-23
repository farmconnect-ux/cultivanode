import { useRouter } from 'expo-router';
import { AssistantScreen } from '../../screens/AssistantScreen';

export default function AssistantRoute() {
  const router = useRouter();
  return <AssistantScreen onBack={() => router.back()} />;
}
