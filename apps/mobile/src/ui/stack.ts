// Native header for the farm-tool stacks (books, store, animals), styled like the rest of the app.
import { color, font } from '../theme';

export const toolStack = {
  headerShown: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: color.page },
  headerTintColor: color.primary,
  headerTitleStyle: { fontFamily: font.heading, fontSize: 18, color: color.primary },
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: color.page },
};
