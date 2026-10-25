import { useRouter } from 'expo-router';
import { BooksScreen } from '../../screens/BooksScreen';

export default function BooksRoute() {
  const router = useRouter();
  return <BooksScreen onAdd={(type) => router.push({ pathname: '/books/new', params: { type } })} />;
}
