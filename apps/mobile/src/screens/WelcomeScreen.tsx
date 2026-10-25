import { brand } from '@cultivanode/shared/brand';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n, type Lang } from '../i18n';
import { color as c, font, radius, space, tap } from '../theme';
import { Button, Icon, Logo, Text } from '../ui';

type Props = { onStart: () => void; onSignIn: () => void };

const LANGS: { value: Lang; label: string; hint: string }[] = [
  { value: 'yo', label: 'Yorùbá', hint: 'Èdè Yorùbá' },
  { value: 'en', label: 'English', hint: 'English language' },
];

/** First screen: choose the language, then start or sign in. */
export function WelcomeScreen({ onStart, onSignIn }: Props) {
  const { t, lang, setLang } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.page, { paddingTop: insets.top + space[6], paddingBottom: insets.bottom + space[5] }]}>
      <StatusBar style="light" />
      <View style={styles.brand}>
        <Logo size={44} />
        <Text style={styles.brandName} color={c.onDark}>{brand.name}</Text>
      </View>

      <View style={styles.hero}>
        <Text variant="display" color={c.onDark} style={styles.title} accessibilityRole="header">{t.start.title}</Text>
        <Text color={c.onDarkSoft} style={styles.intro}>{t.start.intro}</Text>
      </View>

      <View style={styles.bottom}>
        <Text variant="label" color={c.onDarkSoft}>{t.start.pickLanguage}</Text>
        <View style={styles.langs} accessibilityRole="radiogroup">
          {LANGS.map((l) => {
            const on = l.value === lang;
            return (
              <Pressable
                key={l.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={l.hint}
                onPress={() => setLang(l.value)}
                style={[styles.lang, on && styles.langOn]}
              >
                <Text style={styles.langText} color={on ? c.primary : c.onDark}>{l.label}</Text>
                {on ? <Icon name="check-circle" size={20} color={c.secondary} /> : null}
              </Pressable>
            );
          })}
        </View>
        <Button title={t.start.start} variant="mint" onPress={onStart} icon="arrow-right" />
        <Pressable accessibilityRole="button" onPress={onSignIn} style={styles.signIn}>
          <Text variant="label" color={c.onDark}>{t.start.haveAccount}</Text>
        </Pressable>
        <Text variant="caption" color={c.onDarkSoft} style={styles.center}>{t.start.free}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.primary, paddingHorizontal: space[5], justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  brandName: { fontFamily: font.heading, fontSize: 20 },
  hero: { gap: space[4] },
  title: { fontSize: 38, lineHeight: 44 },
  intro: { fontSize: 18, lineHeight: 26 },
  bottom: { gap: space[3] },
  langs: { flexDirection: 'row', gap: space[3], marginBottom: space[2] },
  lang: {
    flex: 1,
    minHeight: tap + 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  langOn: { backgroundColor: c.card, borderColor: c.card },
  langText: { fontFamily: font.bold, fontSize: 18 },
  signIn: { minHeight: tap, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
