import { useI18n } from '../../i18n';
import { Empty, Screen } from '../../ui';

// Replaced by the hire flow in the next stage.
export default function HireRoute() {
  const { t } = useI18n();
  return (
    <Screen inTabs>
      <Empty icon="truck" title={t.home.hireTractor} body={t.home.soon} />
    </Screen>
  );
}
