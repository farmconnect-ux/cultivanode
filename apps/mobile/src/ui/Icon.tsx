import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { color as c } from '../theme';

export type IconName = ComponentProps<typeof Feather>['name'];

/** Line icons (Feather), the same weight as the website's. Decorative unless a label is given. */
export function Icon({ name, size = 22, color = c.secondary, label }: { name: IconName; size?: number; color?: string; label?: string }) {
  return (
    <Feather
      name={name}
      size={size}
      color={color}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      accessibilityLabel={label}
    />
  );
}
