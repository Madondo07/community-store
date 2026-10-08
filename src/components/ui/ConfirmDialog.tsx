import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Names the action on the confirm button, e.g. "Sign Out", "Delete". */
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button for irreversible actions. */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Cross-platform confirmation dialog. `Alert.alert` is a no-op on
 * react-native-web (see the note in Toast.tsx), so any confirm built on it
 * silently never appears — and never asks — on web. This renders a real
 * <Modal> on every platform.
 *
 * Mount <ConfirmProvider> once near the root, then:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, message, confirmLabel, destructive: true }))) return;
 *
 * Resolves `true` only when the confirm button is pressed. Cancel, tapping
 * the backdrop and the Android back button all resolve `false`.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback<ConfirmFn>((opts) => {
    // A second dialog opening while one is up counts as cancelling the first.
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(opts);
    });
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: Spacing.xl,
        },
        card: {
          width: '100%',
          maxWidth: 400,
          backgroundColor: colors.surface,
          borderRadius: Radii.lg,
          padding: Spacing.xl,
          ...Shadows.lg,
        },
        title: { ...Typography.titleMd, color: colors.textPrimary },
        message: { ...Typography.body, color: colors.textSecondary, marginTop: Spacing.sm },
        actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.xl },
        btn: {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.xl,
          borderRadius: Radii.md,
          borderWidth: 1.5,
          alignItems: 'center',
        },
        cancelBtn: { borderColor: colors.border, backgroundColor: 'transparent' },
        cancelText: { ...Typography.body, color: colors.textPrimary, fontWeight: '600' },
        confirmText: { ...Typography.body, fontWeight: '600' },
      }),
    [colors],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        visible={options !== null}
        transparent
        animationType="fade"
        onRequestClose={() => settle(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={() => settle(false)} accessibilityLabel="Dismiss">
          {/* Inner Pressable swallows taps so touching the card doesn't hit the backdrop. */}
          <Pressable style={styles.card} onPress={() => {}} accessibilityViewIsModal>
            <Text style={styles.title} accessibilityRole="header">{options?.title}</Text>
            <Text style={styles.message}>{options?.message}</Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => settle(false)}
                style={[styles.btn, styles.cancelBtn]}
                accessibilityRole="button"
                accessibilityLabel={options?.cancelLabel ?? 'Cancel'}
              >
                <Text style={styles.cancelText}>{options?.cancelLabel ?? 'Cancel'}</Text>
              </Pressable>
              <Pressable
                onPress={() => settle(true)}
                style={[
                  styles.btn,
                  {
                    backgroundColor: options?.destructive ? Colors.danger : colors.navy,
                    borderColor: options?.destructive ? Colors.danger : colors.navy,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={options?.confirmLabel}
              >
                <Text
                  style={[
                    styles.confirmText,
                    // Destructive = red bg → white text; primary = navy bg (light) /
                    // teal bg (dark) → the palette's own inverse text keeps the
                    // navy-on-teal contrast rule in dark mode.
                    { color: options?.destructive ? Colors.textInverse : colors.textInverse },
                  ]}
                >
                  {options?.confirmLabel}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
