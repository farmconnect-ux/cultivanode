import { colors, fontSize, fontWeight, lineHeight } from '@cultivanode/shared';
import { Text as RNText, type TextProps } from 'react-native';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption';

const styles = {
  title: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: fontSize['3xl'], lineHeight: fontSize['3xl'] * lineHeight.tight },
  heading: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: fontSize.xl, lineHeight: fontSize.xl * lineHeight.snug },
  body: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: fontSize.base, lineHeight: fontSize.base * lineHeight.normal },
  label: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: fontSize.base, lineHeight: fontSize.base * lineHeight.snug },
  caption: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: fontSize.sm, lineHeight: fontSize.sm * lineHeight.normal },
} as const;

type Props = TextProps & { variant?: Variant; muted?: boolean; color?: string };

/** Text with the CultivaNode type scale. Body text is never smaller than 16. */
export function Text({ variant = 'body', muted, color, style, ...rest }: Props) {
  return <RNText style={[styles[variant], { color: color ?? (muted ? colors.muted : colors.ink) }, style]} {...rest} />;
}
