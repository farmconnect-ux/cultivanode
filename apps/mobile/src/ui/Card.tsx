import { colors, radius, space } from '@tillmate/shared';
import { StyleSheet, View, type ViewProps } from 'react-native';

export function Card({ style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space[5],
    gap: space[2],
  },
});
