import { colors, radius, space, touchTarget } from '@cultivanode/shared';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'gold';

type Props = Omit<PressableProps, 'children'> & { title: string; variant?: Variant; loading?: boolean };

const palette: Record<Variant, { bg: string; bgPressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.leaf[600], bgPressed: colors.leaf[800], fg: colors.white },
  secondary: { bg: colors.white, bgPressed: colors.leaf[50], fg: colors.leaf[700], border: colors.leaf[600] },
  gold: { bg: colors.harvest[300], bgPressed: colors.harvest[400], fg: colors.ink },
};

export function Button({ title, variant = 'primary', loading, disabled, style, ...rest }: Props) {
  const p = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        { backgroundColor: state.pressed ? p.bgPressed : p.bg, borderColor: p.border ?? 'transparent' },
        (disabled || loading) && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={p.fg} /> : <Text variant="label" color={p.fg}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    paddingHorizontal: space[5],
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
});
