import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color as c, radius, space, tap } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

type Option = { value: string; label: string; hint?: string };

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
        style={[styles.field, { borderColor: error ? c.danger : c.outline }]}
      >
        <Text muted={!current} style={styles.flex} numberOfLines={1}>{current?.label ?? placeholder}</Text>
        <Icon name="chevron-down" size={20} color={c.inkSoft} />
      </Pressable>
      {error ? <Text variant="caption" color={c.danger}>{error}</Text> : null}
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.sheet, { paddingTop: insets.top + space[3], paddingBottom: insets.bottom }]}>
          <View style={styles.sheetHead}>
            <Text variant="heading">{label}</Text>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.close}>
              <Text variant="label" color={c.secondary}>{closeLabel}</Text>
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
                style={({ pressed }) => [styles.row, (pressed || item.value === value) && { backgroundColor: c.mintSoft }]}
              >
                <View style={styles.flex}>
                  <Text variant={item.value === value ? 'label' : 'body'}>{item.label}</Text>
                  {item.hint ? <Text variant="caption" muted>{item.hint}</Text> : null}
                </View>
                {item.value === value ? <Icon name="check" size={20} /> : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  flex: { flex: 1 },
  field: {
    minHeight: tap + 4,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    backgroundColor: c.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  sheet: { flex: 1, backgroundColor: c.page },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space[5],
    paddingBottom: space[3],
    borderBottomWidth: 1,
    borderColor: c.line,
  },
  close: { minHeight: tap, justifyContent: 'center', paddingHorizontal: space[2] },
  row: {
    minHeight: tap + 8,
    paddingHorizontal: space[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    borderBottomWidth: 1,
    borderColor: c.line,
  },
});
