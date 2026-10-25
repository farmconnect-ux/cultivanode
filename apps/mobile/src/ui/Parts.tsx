// Small building blocks used across screens.
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { color as c, radius, space, tap } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** Back arrow + title, for screens pushed on top of the tabs. */
export function Header({ title, onBack, backLabel, right, step }: { title?: string; onBack?: () => void; backLabel: string; right?: ReactNode; step?: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} hitSlop={8} style={styles.back}>
            <Icon name="arrow-left" size={24} color={c.primary} />
          </Pressable>
        ) : null}
        <View style={styles.flex}>{step ? <Text variant="small" muted>{step}</Text> : null}</View>
        {right}
      </View>
      {title ? <Text variant="title" accessibilityRole="header">{title}</Text> : null}
    </View>
  );
}

/** Thin progress bar for multi-step flows and crop days. */
export function Progress({ value, tone = c.secondary, label }: { value: number; tone?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: tone }]} />
    </View>
  );
}

/** Step dots for onboarding and the hire flow: "Step 2 of 3". */
export function Steps({ n, of }: { n: number; of: number }) {
  return (
    <View style={styles.steps}>
      {Array.from({ length: of }, (_, i) => (
        <View key={i} style={[styles.stepBar, i < n && { backgroundColor: c.secondary }]} />
      ))}
    </View>
  );
}

const pillTones = {
  green: { bg: c.mintSoft, fg: c.secondary },
  amber: { bg: c.amberSoft, fg: c.amber },
  red: { bg: c.dangerSoft, fg: c.danger },
  grey: { bg: c.track, fg: c.inkSoft },
  mint: { bg: c.mint, fg: c.primary },
  blue: { bg: c.infoSoft, fg: c.info },
} as const;

export function Pill({ children, tone = 'green', icon }: { children: string; tone?: keyof typeof pillTones; icon?: IconName }) {
  const t = pillTones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {icon ? <Icon name={icon} size={14} color={t.fg} /> : null}
      <Text variant="small" color={t.fg}>{children}</Text>
    </View>
  );
}

/** A big square-ish shortcut with an icon tile ("Hire a tractor"). */
export function Tile({ icon, label, onPress, tone = 'green', hint }: { icon: IconName; label: string; onPress: () => void; tone?: 'green' | 'amber'; hint?: string }) {
  const amber = tone === 'amber';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { backgroundColor: c.mintSoft }]}
    >
      <View style={[styles.tileIcon, { backgroundColor: amber ? c.amberSoft : c.mintSoft }]}>
        <Icon name={icon} size={24} color={amber ? c.amber : c.secondary} />
      </View>
      <Text variant="label" style={styles.flex} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

/** A tappable list row with icon, title, detail and a chevron. */
export function Row({ icon, title, detail, right, onPress, danger }: { icon?: IconName; title: string; detail?: string; right?: ReactNode; onPress?: () => void; danger?: boolean }) {
  const body = (
    <>
      {icon ? (
        <View style={[styles.rowIcon, danger && { backgroundColor: c.dangerSoft }]}>
          <Icon name={icon} size={20} color={danger ? c.danger : c.secondary} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <Text variant="label" color={danger ? c.danger : undefined}>{title}</Text>
        {detail ? <Text variant="caption" muted>{detail}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" size={20} color={c.inkSoft} /> : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.mintSoft }]}>
      {body}
    </Pressable>
  );
}

/** Section title with an optional action on the right ("See all"). */
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <Text variant="heading" accessibilityRole="header">{title}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={styles.sectionAction}>
          <Text variant="label" color={c.secondary}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Nothing here yet: an icon, a line of text and one way forward. */
export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={28} />
      </View>
      <Text variant="heading" style={styles.center}>{title}</Text>
      {body ? <Text muted style={styles.center}>{body}</Text> : null}
      {action}
    </View>
  );
}

/** Pick-one chips in a wrapping row (crops, units, ratings). */
export function Chips<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void; label: string }) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.value)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text variant="label" color={on ? c.onDark : c.primary}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={c.secondary} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  header: { gap: space[2] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space[2], minHeight: tap },
  back: { width: tap, height: tap, marginLeft: -space[3], alignItems: 'center', justifyContent: 'center' },
  track: { height: 8, borderRadius: 4, backgroundColor: c.track, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  steps: { flexDirection: 'row', gap: space[2] },
  stepBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: c.track },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  tile: {
    flex: 1,
    minHeight: 76,
    borderRadius: radius.lg,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[3] + 2,
  },
  tileIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: tap + 12, flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2], paddingHorizontal: space[1] },
  rowIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: c.mintSoft, alignItems: 'center', justifyContent: 'center' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space[2] },
  sectionAction: { minHeight: 36, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: space[3], paddingVertical: space[8], paddingHorizontal: space[4] },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.mintSoft, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  chip: { minHeight: 44, paddingHorizontal: space[4], borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.outline, backgroundColor: c.card, justifyContent: 'center' },
  chipOn: { backgroundColor: c.primaryContainer, borderColor: c.primaryContainer },
  loading: { paddingVertical: space[10], alignItems: 'center' },
});
