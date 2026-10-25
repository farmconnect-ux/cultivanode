import { Pressable, StyleSheet, View } from 'react-native';
import { color as c, radius, space, tap } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Props = {
  title: string;
  hint?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
  /** 'radio' for pick-one lists, 'checkbox' for pick-many. */
  kind?: 'radio' | 'checkbox';
  icon?: IconName;
};

/** A large tappable option card (roles, crops, consents). */
export function Choice({ title, hint, badge, selected, onPress, kind = 'checkbox', icon }: Props) {
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={hint ? `${title}. ${hint}` : title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && !selected && { backgroundColor: c.mintSoft }]}
    >
      {icon ? (
        <View style={[styles.tile, selected && { backgroundColor: c.card }]}>
          <Icon name={icon} size={22} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="label">{title}</Text>
        {hint ? <Text variant="caption" muted>{hint}</Text> : null}
        {badge ? <Text variant="small" color={c.secondary}>{badge}</Text> : null}
      </View>
      <View style={[styles.mark, kind === 'radio' && styles.round, selected && styles.markOn]}>
        {selected ? <Icon name="check" size={16} color={c.onDark} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: tap + 16,
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'center',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  selected: { borderColor: c.secondary, backgroundColor: c.mintSoft },
  tile: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: c.mintSoft, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: c.outline, alignItems: 'center', justifyContent: 'center' },
  round: { borderRadius: 13 },
  markOn: { backgroundColor: c.secondary, borderColor: c.secondary },
  body: { flex: 1, gap: 2 },
});
