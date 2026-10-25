import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../i18n';
import { useSession } from '../../lib/session';
import { color as c, font } from '../../theme';
import { Icon, type IconName } from '../../ui';

const icon = (name: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon name={name} size={focused ? 25 : 24} color={String(color)} />;
  };

/** Five tabs, the same everywhere: Home, My farm, Hire, Market, Me. */
export default function TabsLayout() {
  const { t } = useI18n();
  const { session } = useSession();
  const insets = useSafeAreaInsets();
  if (session === null) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.inkSoft,
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, paddingBottom: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarStyle: {
          height: 74 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 10,
          borderTopColor: c.line,
          backgroundColor: c.card,
        },
        sceneStyle: { backgroundColor: c.page },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t.tabs.home, tabBarIcon: icon('home') }} />
      <Tabs.Screen name="farm" options={{ title: t.tabs.farm, tabBarIcon: icon('feather') }} />
      <Tabs.Screen name="hire" options={{ title: t.tabs.hire, tabBarIcon: icon('truck') }} />
      <Tabs.Screen name="market" options={{ title: t.tabs.market, tabBarIcon: icon('shopping-bag') }} />
      <Tabs.Screen name="me" options={{ title: t.tabs.me, tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
