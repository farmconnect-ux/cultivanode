import { Text as RNText, type TextProps } from 'react-native';
import { color as c, font } from '../theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'small';

const styles = {
  display: { fontFamily: font.display, fontSize: 28, lineHeight: 32 },
  title: { fontFamily: font.display, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: font.heading, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 23 },
  label: { fontFamily: font.semibold, fontSize: 16, lineHeight: 21 },
  caption: { fontFamily: font.body, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: font.semibold, fontSize: 13, lineHeight: 17 },
} as const;

type Props = TextProps & { variant?: Variant; muted?: boolean; color?: string };

/** Text in the CultivaNode type scale: Plus Jakarta Sans for titles, Inter for reading. Body is 16. */
export function Text({ variant = 'body', muted, color, style, ...rest }: Props) {
  const tone = color ?? (muted ? c.inkSoft : variant === 'title' || variant === 'display' ? c.primary : c.ink);
  return <RNText style={[styles[variant], { color: tone }, style]} {...rest} />;
}
