/**
 * Responsive tab bar — bottom tabs on mobile, FIXED sidebar on web/tablet+
 */

import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radii, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { SIDEBAR_WIDTH, useResponsive } from '@/hooks/useResponsive';

export default function ResponsiveTabBar({ state, descriptors, navigation }: any) {
  const { useSidebarNav } = useResponsive();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemoStyles(colors);

  if (useSidebarNav) {
    return (
      <View
        style={[
          styles.sidebar,
          Platform.OS === 'web' ? styles.sidebarFixed : undefined,
        ]}
      >
        <View style={styles.sidebarBrand}>
          <View style={styles.sidebarBrandRow}>
            <Image
              source={require('../../../assets/images/Swych_Icon_Only_Transparent.png')}
              style={styles.sidebarBrandLogo}
              resizeMode="contain"
            />
            <Text style={styles.sidebarBrandTitle}>Swych</Text>
          </View>
          <View style={styles.sidebarBrandLine} />
          <Text style={styles.sidebarBrandSub}>CPUT Campus Marketplace</Text>
        </View>

        <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = typeof options.title === 'string' ? options.title : route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? colors.navy : colors.textTertiary,
              size: 22,
            });

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                style={({ pressed }) => [
                  styles.sidebarItem,
                  isFocused && styles.sidebarItemActive,
                  pressed && !isFocused && { opacity: 0.7 },
                ]}
              >
                {icon}
                <Text style={[styles.sidebarLabel, isFocused && styles.sidebarLabelActive]}>
                  {label}
                </Text>
                {options.tabBarBadge != null && (
                  <View style={styles.sidebarBadge}>
                    <Text style={styles.sidebarBadgeText}>{options.tabBarBadge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <View style={styles.footerDot} />
          <Text style={styles.sidebarFooterText}>Cape Peninsula University</Text>
          <Text style={styles.sidebarFooterText}>of Technology</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = typeof options.title === 'string' ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icon = options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? colors.tabActive : colors.tabInactive,
          size: 24,
        });

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            style={styles.bottomItem}
          >
            <View>
              {icon}
              {options.tabBarBadge != null && <View style={styles.bottomBadge} />}
            </View>
            <Text style={[styles.bottomLabel, { color: isFocused ? colors.tabActive : colors.tabInactive }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function useMemoStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return React.useMemo(
    () =>
      StyleSheet.create({
        sidebar: {
          width: SIDEBAR_WIDTH,
          backgroundColor: colors.surface,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing['2xl'],
          justifyContent: 'flex-start',
        },
        sidebarFixed: {
          // @ts-ignore — web-only CSS property
          position: 'fixed' as any,
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        },
        sidebarBrand: {
          paddingHorizontal: Spacing.md,
          marginBottom: Spacing['3xl'],
        },
        sidebarBrandRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
        },
        sidebarBrandLogo: { width: 32, height: 32 },
        sidebarBrandTitle: {
          ...Typography.displayMd,
          color: colors.navy,
          lineHeight: 30,
        },
        sidebarBrandLine: {
          height: 3,
          width: 40,
          backgroundColor: colors.teal,
          borderRadius: 2,
          marginTop: Spacing.md,
        },
        sidebarBrandSub: {
          ...Typography.caption,
          color: colors.textTertiary,
          marginTop: Spacing.sm,
          textTransform: 'none' as const,
          letterSpacing: 0.3,
        },
        sidebarNav: { flex: 1 },
        sidebarItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.md,
          borderRadius: Radii.md,
          marginBottom: Spacing.xs,
        },
        sidebarItemActive: { backgroundColor: colors.overlayLight },
        sidebarLabel: { ...Typography.body, color: colors.textTertiary, flex: 1 },
        sidebarLabelActive: { color: colors.navy, fontWeight: '600' },
        sidebarBadge: {
          backgroundColor: colors.danger,
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 6,
        },
        sidebarBadgeText: { color: colors.textInverse, fontSize: 11, fontWeight: '700' },
        sidebarFooter: {
          paddingVertical: Spacing.xl,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: Spacing.md,
        },
        footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginBottom: Spacing.sm },
        sidebarFooterText: { ...Typography.bodySmall, color: colors.textTertiary },
        bottomBar: {
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: Spacing.sm,
        },
        bottomItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
        bottomLabel: { fontSize: 11, fontWeight: '600' },
        bottomBadge: {
          position: 'absolute',
          top: -2,
          right: -6,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.danger,
        },
      }),
    [colors]
  );
}