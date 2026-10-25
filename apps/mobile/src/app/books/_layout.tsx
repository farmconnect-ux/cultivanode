import { Stack } from 'expo-router';
import { useI18n } from '../../i18n';
import { toolStack } from '../../ui/stack';

export default function BooksLayout() {
  const { t } = useI18n();
  return <Stack screenOptions={{ ...toolStack, title: t.farm.toolNames.books }} />;
}
