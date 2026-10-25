import { useRouter } from 'expo-router';
import { useSession } from '../../lib/session';
import { FarmSetupScreen } from '../../screens/FarmSetupScreen';
import { Loading } from '../../ui';

export default function FarmSetupRoute() {
  const router = useRouter();
  const { session, account, farms, refresh, setFarm } = useSession();
  if (!session) return <Loading label="" />;
  const firstTime = farms.length === 0;
  return (
    <FarmSetupScreen
      userId={session.user.id}
      firstTime={firstTime}
      defaultState={account?.profile.state}
      onBack={firstTime ? undefined : () => router.back()}
      onSaved={async (id) => {
        setFarm(id);
        await refresh();
        router.replace({ pathname: '/setup/crop', params: { farmId: id, first: firstTime ? '1' : '' } });
      }}
    />
  );
}
