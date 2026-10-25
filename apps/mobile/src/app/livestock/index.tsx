import { useRouter } from 'expo-router';
import { AnimalsScreen } from '../../screens/AnimalsScreen';

export default function AnimalsRoute() {
  const router = useRouter();
  return <AnimalsScreen onAdd={() => router.push('/livestock/new')} onOpen={(id) => router.push(`/livestock/${id}`)} />;
}
