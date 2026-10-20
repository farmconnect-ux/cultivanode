import { useRouter } from 'expo-router';
import { ProviderCalendarScreen } from '../../screens/ProviderCalendarScreen';
import { useProvider } from './_layout';

export default function CalendarRoute() {
  const router = useRouter();
  const { jobs, maintenanceDates, setMaintenanceDates } = useProvider();

  return (
    <ProviderCalendarScreen
      jobs={jobs}
      maintenanceDates={maintenanceDates}
      onMaintenanceDatesChange={setMaintenanceDates}
      onSelectJob={(job) => {
        router.push(`/evidence/${job.id}`);
      }}
      onBack={() => router.back()}
      isSubView
    />
  );
}
