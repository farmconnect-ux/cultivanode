import { useLocalSearchParams, useRouter } from 'expo-router';
import { HomeScreen } from '../../screens/HomeScreen';

export default function HomeRoute() {
  const router = useRouter();
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  return (
    <HomeScreen
      toast={toast}
      onGo={(target) => {
        switch (target.to) {
          case 'hire':
            return router.push({ pathname: '/hire/new', params: { mode: target.kind } });
          case 'sell':
            return router.push('/market/sell');
          case 'buy':
            return router.navigate({ pathname: '/(tabs)/market', params: { type: 'input' } });
          case 'market':
            return router.navigate('/(tabs)/market');
          case 'addCrop':
            return router.push('/setup/crop');
          case 'addFarm':
            return router.push('/setup/farm');
          case 'jobs':
            return router.navigate('/(tabs)/farm');
          case 'help':
            return router.push({ pathname: '/assistant', params: target.job ? { topic: `${target.job.cropName}: ${target.job.name}` } : {} });
        }
      }}
    />
  );
}
