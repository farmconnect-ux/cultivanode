import { brand } from '@cultivanode/shared/brand';
import { space } from '@cultivanode/shared';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import { useI18n } from '../i18n';
import { Logo, Screen, Text } from '../ui';

const GREEN = brand.logo.background; // deep brand green
const CYAN = '#3BC6D9';
const OFF_WHITE = '#FAF7F0';

type Props = { onStart: () => void; onSignIn: () => void };

export function WelcomeScreen({ onStart, onSignIn }: Props) {
  const { t, lang, setLang } = useI18n();
  return (
    <Screen
      background={GREEN}
      footer={
        <>
          <Pressable
            accessibilityRole="button"
            onPress={onStart}
            style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
          >
            <Text variant="label" color={GREEN}>{t.welcome.start}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={({ pressed }) => [styles.primary, styles.outline, pressed && { opacity: 0.85 }]}
          >
            <Text variant="label" color={OFF_WHITE}>{t.welcome.haveAccount}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.switchLanguage}
            onPress={() => setLang(lang === 'en' ? 'yo' : 'en')}
            style={styles.lang}
          >
            <Text variant="caption" color="#9FB7A8">
              {lang === 'en' ? 'English  ·  ' : ''}
              <Text variant="caption" color={OFF_WHITE} style={styles.underline}>{t.common.switchLanguage}</Text>
              {lang === 'yo' ? '  ·  Yorùbá' : ''}
            </Text>
          </Pressable>
        </>
      }
    >
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Logo size={72} />
        <Text variant="title" color={OFF_WHITE} style={styles.title} accessibilityRole="header">
          {t.welcome.title}
        </Text>
        <Text color="#C9D8CF">{t.welcome.intro}</Text>
        <View style={styles.chips}>
          {t.welcome.chips.map((c) => (
            <View key={c} style={styles.chip}>
              <Text variant="caption" color="#BFE7C9">{c}</Text>
            </View>
          ))}
        </View>
        <Text variant="caption" color="#9FB7A8">{brand.tagline}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space[5], paddingTop: space[10] },
  title: { fontSize: 38, lineHeight: 42 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: { backgroundColor: '#1D5237', borderRadius: 999, paddingHorizontal: space[3], paddingVertical: 6 },
  primary: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: CYAN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(250,247,240,0.5)' },
  lang: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
