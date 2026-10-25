import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color as c, space } from '../theme';

type Props = {
  children: ReactNode;
  /** Pinned under the content (main action of the screen). */
  footer?: ReactNode;
  /** Pinned above the content (back link and title). */
  header?: ReactNode;
  background?: string;
  /** Inside the tab bar: the bottom safe area is already handled. */
  inTabs?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Under a native stack header (farm tools): the header already clears the status bar. */
  belowHeader?: boolean;
};

/** A scrolling page with safe-area padding, keyboard avoidance, and optional pinned header and footer. */
export function Screen({ children, footer, header, background = c.page, inTabs, onRefresh, refreshing = false, belowHeader }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header ? <View style={[styles.header, { paddingTop: insets.top + space[2] }]}>{header}</View> : null}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: header ? space[2] : belowHeader ? space[4] : insets.top + space[4] }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} colors={[c.secondary]} /> : undefined}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: (inTabs ? 0 : insets.bottom) + space[4] }]}>{footer}</View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: space[5], paddingBottom: space[2], gap: space[2] },
  content: { paddingHorizontal: space[5], paddingBottom: space[8], gap: space[4] },
  footer: {
    paddingHorizontal: space[5],
    paddingTop: space[3],
    gap: space[3],
    borderTopWidth: 1,
    borderTopColor: c.line,
    backgroundColor: c.card,
  },
});
