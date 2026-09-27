import { colors, radius, space, touchTarget } from '@cultivanode/shared';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';

type Props = {
  title: string;
  hint?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
  /** 'radio' for pick-one lists, 'checkbox' for pick-many. */
  kind?: 'radio' | 'checkbox';
};

/** A large tappable option card (roles, account type, consents). */
export function Choice({ title, hint, badge, selected, onPress, kind = 'checkbox' }: Props) {
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={hint ? `${title}. ${hint}` : title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && { backgroundColor: colors.leaf[50] },
      ]}
    >
      <View style={[styles.mark, kind === 'radio' && styles.round, selected && styles.markOn]}>
        {selected ? <Text variant="caption" color={colors.white}>✓</Text> : null}
      </View>
      <View style={styles.body}>
        <Text variant="label">{title}</Text>
        {hint ? <Text variant="caption" muted>{hint}</Text> : null}
        {badge ? (
          <Text variant="caption" color={colors.leaf[700]} style={styles.badge}>
            {badge}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: touchTarget,
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'flex-start',
    padding: space[4],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.leaf[600], backgroundColor: colors.leaf[50] },
  mark: {
    width: 24,
    height: 24,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: { borderRadius: 12 },
  markOn: { backgroundColor: colors.leaf[600], borderColor: colors.leaf[600] },
  body: { flex: 1, gap: 2 },
  badge: { fontWeight: '600' },
});
