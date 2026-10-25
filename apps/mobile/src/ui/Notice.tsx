import { StyleSheet, View } from 'react-native';
import { color as c, radius, space } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const tones: Record<string, { bg: string; fg: string; icon: IconName }> = {
  error: { bg: c.dangerSoft, fg: c.danger, icon: 'alert-circle' },
  info: { bg: c.infoSoft, fg: c.info, icon: 'info' },
  warning: { bg: c.amberSoft, fg: c.amber, icon: 'clock' },
  success: { bg: c.mintSoft, fg: c.secondary, icon: 'check-circle' },
};

/** An inline message that screen readers announce when it appears. */
export function Notice({ tone = 'error', children }: { tone?: 'error' | 'info' | 'warning' | 'success'; children: string }) {
  const t = tones[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg }]}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
    >
      <Icon name={t.icon} size={20} color={t.fg} />
      <Text style={styles.text} color={t.fg}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, padding: space[3] + 2, flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
  text: { flex: 1 },
});
