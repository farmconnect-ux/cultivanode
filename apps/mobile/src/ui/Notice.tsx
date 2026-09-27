import { colors, radius, space } from '@cultivanode/shared';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

const tones = {
  error: { bg: '#FDECEA', fg: colors.danger },
  info: { bg: colors.leaf[50], fg: colors.leaf[800] },
} as const;

/** An inline message box that screen readers announce when it appears. */
export function Notice({ tone = 'error', children }: { tone?: keyof typeof tones; children: string }) {
  const t = tones[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg }]}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
    >
      <Text color={t.fg}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, padding: space[4] },
});
