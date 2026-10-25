import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { color as c, radius, space } from '../theme';

type Props = ViewProps & { tone?: 'plain' | 'dark' | 'soft' | 'amber'; onPress?: () => void; accessibilityLabel?: string };

const tones = {
  plain: { backgroundColor: c.card, borderColor: c.line },
  dark: { backgroundColor: c.primary, borderColor: c.primary },
  soft: { backgroundColor: c.mintSoft, borderColor: c.mintSoft },
  amber: { backgroundColor: c.amberSoft, borderColor: c.amberSoft },
} as const;

/** A white panel with a hairline border. `dark` is the deep-green highlight card. */
export function Card({ style, tone = 'plain', onPress, ...rest }: Props) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, tones[tone], pressed && styles.pressed, style as object]}
        {...rest}
      />
    );
  }
  return <View style={[styles.card, tones[tone], style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space[4], gap: space[2] + 2 },
  pressed: { opacity: 0.85 },
});
