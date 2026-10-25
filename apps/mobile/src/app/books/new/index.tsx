import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '../../../i18n';
import { BookEntryScreen } from '../../../screens/BooksScreen';

export default function NewBookEntryRoute() {
  const router = useRouter();
  const { t } = useI18n();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const kind = type === 'income' ? 'income' : 'expense';
  return (
    <>
      <Stack.Screen options={{ title: kind === 'income' ? t.books.newIn : t.books.newOut }} />
      <BookEntryScreen type={kind} onDone={() => router.back()} />
    </>
  );
}
