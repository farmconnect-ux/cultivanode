import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '../../lib/session';
import { CropSetupScreen } from '../../screens/CropSetupScreen';
import { Loading } from '../../ui';

export default function CropSetupRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ farmId?: string; first?: string }>();
  const { session, farms, farm } = useSession();
  const target = farms.find((f) => f.id === params.farmId) ?? farm;
  if (!session || !target) return <Loading label="" />;
  const first = params.first === '1';
  const home = (toast?: string) => router.replace({ pathname: '/(tabs)/home', params: toast ? { toast } : {} });
  return (
    <CropSetupScreen
      userId={session.user.id}
      farmId={target.id}
      farmAreaHa={target.areaHa}
      onBack={first ? undefined : () => router.back()}
      onSkip={first ? () => home() : undefined}
      onSaved={(message) => home(message)}
    />
  );
}
