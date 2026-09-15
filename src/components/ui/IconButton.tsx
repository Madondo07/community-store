import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

interface IconButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
  /** Extra invisible touch area on each side. Default 10 — combined with a
   *  typical 24px icon that lands right at the ~44x44 minimum touch target,
   *  without changing how anything looks. */
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps a bare icon (back arrow, close X, etc.) with a consistent tap
 * target. Screens across the app were each hand-rolling
 * `<Pressable onPress={...} accessibilityLabel="Go back"><ArrowLeft ... /></Pressable>`
 * with no hitSlop — a ~24x24 touch target, and inconsistent with the few
 * places that did add one. This is the one shared version.
 */
export default function IconButton({ onPress, children, accessibilityLabel, hitSlop = 10, style }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {children}
    </Pressable>
  );
}
