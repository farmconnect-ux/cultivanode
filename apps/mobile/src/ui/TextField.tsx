import { useState, type Ref } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { color as c, font, radius, space, tap } from '../theme';
import { Text } from './Text';

type Props = TextInputProps & { label: string; hint?: string; error?: string; ref?: Ref<TextInput>; prefix?: string };

export function TextField({ label, hint, error, style, onFocus, onBlur, ref, prefix, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <View style={[styles.box, { borderColor: error ? c.danger : focused ? c.secondary : c.outline }, focused && styles.focused]}>
        {prefix ? <Text style={styles.prefix} muted>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor="#8a948d"
          style={[styles.input, Platform.OS === 'web' && styles.web, style]}
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
      </View>
      {error ? (
        <Text variant="caption" color={c.danger}>{error}</Text>
      ) : hint ? (
        <Text variant="caption" muted>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  box: {
    minHeight: tap + 4,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[4],
  },
  focused: { borderWidth: 2 },
  prefix: { marginRight: space[2] },
  web: { outlineWidth: 0 },
  input: { flex: 1, minHeight: tap, fontFamily: font.body, fontSize: 17, color: c.ink, paddingVertical: space[3] },
});
