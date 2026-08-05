import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, Star } from 'lucide-react-native';

import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
}

export default function ListingCard({ listing, onPress }: ListingCardProps) {
  const { dispatch, isWishlisted } = useApp();
  const isNew = listing.condition === 'new';
  const wishlisted = isWishlisted(listing.id);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${listing.title}, R${listing.price}`}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: listing.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={[styles.badge, isNew ? styles.badgeNew : styles.badgeUsed]}>
          <Text style={[styles.badgeText, isNew ? styles.badgeTextNew : styles.badgeTextUsed]}>
            {isNew ? 'New' : 'Used'}
          </Text>
        </View>
        {/* Wishlist heart */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            dispatch({ type: 'TOGGLE_WISHLIST', payload: listing.id });
          }}
          style={styles.heartBtn}
          hitSlop={6}
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={16}
            color={wishlisted ? Colors.danger : Colors.textInverse}
            fill={wishlisted ? Colors.danger : 'transparent'}
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.price}>R{listing.price.toLocaleString()}</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={11}
              color={Colors.warning}
              fill={i <= Math.round(listing.avg_rating ?? 0) ? Colors.warning : 'transparent'}
            />
          ))}
          {listing.review_count != null && (
            <Text style={styles.reviewCount}>({listing.review_count})</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  badge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  badgeNew: { backgroundColor: Colors.successLight },
  badgeUsed: { backgroundColor: Colors.surfaceAlt },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeTextNew: { color: Colors.success },
  badgeTextUsed: { color: Colors.textSecondary },
  heartBtn: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.sm,
  },
  title: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  price: {
    ...Typography.priceSm,
    color: Colors.navy,
    fontSize: 15,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  reviewCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginLeft: 3,
  },
});
