import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, XCircle } from 'lucide-react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

interface ToastProps {
  /** Null/empty hides the toast. */
  message: string | null;
  variant?: 'success' | 'error';
  /** Called once the auto-dismiss timer fires — clear `message` here. */
  onHide: () => void;
  duration?: number;
}

/**
 * Small self-dismissing banner, anchored to the TOP of the screen (below
 * the notch/status bar) — most users here are on mobile, where a
 * bottom-anchored toast sits under the thumb and is easy to miss, and can
 * get covered by the keyboard on a form screen like this one.
 *
 * Exists because react-native-web's `Alert` is a no-op stub
 * (`static alert() {}` — confirmed in
 * node_modules/react-native-web/src/exports/Alert), so every screen that
 * relied on Alert.alert for success/error feedback shows nothing at all on
 * web. This is a real, in-tree component instead. Pair with the
 * `useToast` hook (src/hooks/useToast.ts) rather than hand-rolling the
 * show/hide state per screen.
 */
export default function Toast({ message, variant = 'success', onHide, duration = 2200 }: ToastProps) {
  const insets = useSafeAreaInsets();
  // useState (not useRef) for the lazily-created Animated.Value — reading
  // `.current` off a ref during render trips the react-hooks/refs lint rule.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!message) return;
    Animated.timing(progress, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    const timer = setTimeout(() => {
      Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => onHide());
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;

  const Icon = variant === 'success' ? CheckCircle2 : XCircle;
  const backgroundColor = variant === 'success' ? Colors.success : Colors.danger;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  return (
    <Animated.View
      style={[
        styles.toast,
        { top: insets.top + Spacing.md, backgroundColor, opacity: progress, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Icon size={18} color={Colors.textInverse} />
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radii.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 50,
  },
  text: { ...Typography.bodySmall, color: Colors.textInverse, fontWeight: '600', flex: 1 },
});
