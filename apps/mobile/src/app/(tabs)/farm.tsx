import { useRouter } from 'expo-router';
import { FarmScreen } from '../../screens/FarmScreen';

const TOOL_ROUTES = {
  livestock: '/livestock',
  books: '/books',
  inventory: '/inventory',
  map: '/farms/boundary_walk',
  scouting: '/operations/scouting',
} as const;

export default function FarmRoute() {
  const router = useRouter();
  return (
    <FarmScreen
      onAddCrop={() => router.push('/setup/crop')}
      onAddFarm={() => router.push('/setup/farm')}
      onTool={(tool) => router.push(TOOL_ROUTES[tool])}
    />
  );
}
