import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';
import type { UserProfile } from '@/types';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';

interface SellerCardProps {
  seller: UserProfile;
  compact?: boolean;
  onPress?: () => void;
}

export default function SellerCard({
  seller,
  compact = false,
  onPress,
}: SellerCardProps) {
  const memberSince = new Date(seller.created_at).toLocaleDateString('en-ZA', {
    month: 'short',
    year: 'numeric',
  });

  const content = (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Avatar uri={seller.avatar_url} name={seller.full_name} size={compact ? 'md' : 'lg'} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={compact ? styles.nameSm : styles.name} numberOfLines={1}>{seller.full_name}</Text>
          <VerifiedBadge user={seller} size={compact ? 14 : 16} />
        </View>
        {!compact && <VerifiedBadge user={seller} showLabel />}
        <Text style={styles.meta}>Member since {memberSince}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={`View ${seller.full_name}'s profile`}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  containerCompact: {
    padding: Spacing.md,
  },
  info: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    ...Typography.titleMd,
    color: Colors.textPrimary,
  },
  nameSm: {
    ...Typography.titleSm,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  meta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
