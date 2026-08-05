/**
 * VerifiedBadge — renders a BadgeCheck icon next to a user's name.
 *
 * - Mobile: tap shows an Alert with the badge label ("Verified Student", etc.)
 * - Web/Desktop: hover tooltip via title prop
 * - Full pill mode (iconOnly=false): shows icon + label inline (for SellerCard)
 *
 * Returns null if user has no badge.
 */

import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';

import { Radii, Spacing } from '@/constants/theme';
import type { UserProfile } from '@/types';
import { getVerifiedBadge } from '@/utils/verification';

interface VerifiedBadgeProps {
  user: UserProfile | undefined | null;
  /** Render as full pill with label (default false = icon-only with tap/hover) */
  showLabel?: boolean;
  size?: number;
}

export default function VerifiedBadge({ user, showLabel = false, size = 16 }: VerifiedBadgeProps) {
  const badge = getVerifiedBadge(user);
  if (!badge) return null;

  const description = `Verified ${badge.label}`;

  // Full pill mode — icon + label inline (used in SellerCard non-compact)
  if (showLabel) {
    return (
      <View style={[styles.pill, { backgroundColor: badge.color + '18' }]}>
        <BadgeCheck size={size - 2} color={badge.color} />
        <Text style={[styles.label, { color: badge.color }]}>{badge.label}</Text>
      </View>
    );
  }

  // Icon-only mode — tap shows alert on mobile, hover shows title on web
  if (Platform.OS === 'web') {
    return (
      <View
        // @ts-ignore — title works on web for hover tooltip
        title={description}
        accessibilityLabel={description}
        style={styles.iconWrap}
      >
        <BadgeCheck size={size} color={badge.color} />
      </View>
    );
  }

  // Mobile — tap to see description
  return (
    <Pressable
      onPress={() => Alert.alert(description, `This user's identity has been verified.`)}
      hitSlop={6}
      accessibilityLabel={description}
      style={styles.iconWrap}
    >
      <BadgeCheck size={size} color={badge.color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    marginLeft: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
