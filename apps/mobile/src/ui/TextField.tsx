import { colors, fontSize, radius, space, touchTarget } from '@tillmate/shared';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './Text';

type Props = TextInputProps & { label: string; hint?: string; error?: string };

export function TextField({ label, hint, error, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { borderColor: error ? colors.danger : focused ? colors.leaf[600] : colors.line },
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color={colors.danger}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" muted>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1] + 2 },
  input: {
    minHeight: touchTarget,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    fontSize: fontSize.base,
    color: colors.ink,
    backgroundColor: colors.white,
  },
});
