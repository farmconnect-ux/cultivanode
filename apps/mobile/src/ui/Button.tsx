import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { color as c, font, radius, space, tap } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'mint' | 'danger' | 'gold';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  icon?: IconName;
  /** Shrink to fit the label instead of filling the row. */
  compact?: boolean;
};

const palette: Record<Variant, { bg: string; pressed: string; fg: string; border: string }> = {
  primary: { bg: c.primaryContainer, pressed: c.primary, fg: c.onDark, border: c.primaryContainer },
  secondary: { bg: c.card, pressed: c.mintSoft, fg: c.primary, border: c.outline },
  ghost: { bg: 'transparent', pressed: c.mintSoft, fg: c.secondary, border: 'transparent' },
  mint: { bg: c.mint, pressed: '#4edea3', fg: c.primary, border: c.mint },
  gold: { bg: c.mint, pressed: '#4edea3', fg: c.primary, border: c.mint },
  danger: { bg: c.card, pressed: c.dangerSoft, fg: c.danger, border: '#f3c4c4' },
};

export function Button({ title, variant = 'primary', loading, disabled, icon, compact, style, ...rest }: Props) {
  const p = palette[variant];
  const off = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: off, busy: Boolean(loading) }}
      disabled={off}
      style={(state) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: state.pressed ? p.pressed : p.bg, borderColor: p.border },
        off && styles.off,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={20} color={p.fg} /> : null}
          <Text style={styles.label} color={p.fg} numberOfLines={2}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: tap + 4,
    paddingHorizontal: space[3],
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { alignSelf: 'flex-start', minHeight: tap, paddingHorizontal: space[4] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], alignSelf: 'stretch' },
  label: { fontFamily: font.bold, fontSize: 16, flexShrink: 1, textAlign: 'center' },
  off: { opacity: 0.55 },
});
