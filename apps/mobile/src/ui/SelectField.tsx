import { colors, radius, space, touchTarget } from '@cultivanode/shared';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';

type Option = { value: string; label: string };

type Props = {
  label: string;
  placeholder: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  closeLabel: string;
  error?: string;
};

/** A field that opens a full-screen list (long lists like the 37 states are easier to scroll than a spinner). */
export function SelectField({ label, placeholder, value, options, onChange, closeLabel, error }: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const current = options.find((o) => o.value === value);
  return (
    <View style={styles.wrap}>
      <Text variant="label">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder}`}
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: error ? colors.danger : colors.line }]}
      >
        <Text muted={!current}>{current?.label ?? placeholder}</Text>
        <Text muted>▾</Text>
      </Pressable>
      {error ? <Text variant="caption" color={colors.danger}>{error}</Text> : null}
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.sheet, { paddingTop: insets.top + space[3], paddingBottom: insets.bottom }]}>
          <View style={styles.sheetHead}>
            <Text variant="heading">{label}</Text>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.close}>
              <Text variant="label" color={colors.leaf[700]}>{closeLabel}</Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: item.value === value }}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.leaf[50] }]}
              >
                <Text variant={item.value === value ? 'label' : 'body'}>{item.label}</Text>
                {item.value === value ? <Text color={colors.leaf[600]}>✓</Text> : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1] + 2 },
  field: {
    minHeight: touchTarget,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheet: { flex: 1, backgroundColor: colors.cream },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space[6],
    paddingBottom: space[3],
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  close: { minHeight: touchTarget, justifyContent: 'center', paddingHorizontal: space[2] },
  row: {
    minHeight: touchTarget,
    paddingHorizontal: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
});
