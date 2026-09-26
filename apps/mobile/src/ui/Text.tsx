import { colors, fontSize, fontWeight, lineHeight } from '@tillmate/shared';
import { Text as RNText, type TextProps } from 'react-native';

type Variant = 'title' | 'heading' | 'body' | 'label' | 'caption';

const styles = {
  title: { fontSize: fontSize['3xl'], fontWeight: fontWeight.extrabold, lineHeight: fontSize['3xl'] * lineHeight.tight },
  heading: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, lineHeight: fontSize.xl * lineHeight.snug },
  body: { fontSize: fontSize.base, fontWeight: fontWeight.regular, lineHeight: fontSize.base * lineHeight.normal },
  label: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, lineHeight: fontSize.base * lineHeight.snug },
  caption: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, lineHeight: fontSize.sm * lineHeight.normal },
} as const;

type Props = TextProps & { variant?: Variant; muted?: boolean; color?: string };

/** Text with the Tillmate type scale. Body text is never smaller than 16. */
export function Text({ variant = 'body', muted, color, style, ...rest }: Props) {
  return <RNText style={[styles[variant], { color: color ?? (muted ? colors.muted : colors.ink) }, style]} {...rest} />;
}
