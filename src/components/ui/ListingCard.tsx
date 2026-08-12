import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, Star } from 'lucide-react-native';

import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  /** Show a "Sponsored" badge alongside the condition badge */
  sponsored?: boolean;
}

export default function ListingCard({ listing, onPress, sponsored = false }: ListingCardProps) {
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
      {/* Image — roughly 65-70% of card via aspectRatio */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: listing.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Condition badge — top right */}
        <View style={[styles.conditionBadge, isNew ? styles.conditionNew : styles.conditionUsed]}>
          <Text style={[styles.conditionText, isNew ? styles.conditionTextNew : styles.conditionTextUsed]}>
            {isNew ? 'New' : 'Used'}
          </Text>
        </View>

        {/* Sponsored badge — below condition badge */}
        {sponsored && (
          <View style={styles.sponsoredBadge}>
            <Text style={styles.sponsoredText}>Sponsored</Text>
          </View>
        )}

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
            size={Spacing.lg}
            color={wishlisted ? Colors.danger : Colors.textInverse}
            fill={wishlisted ? Colors.danger : 'transparent'}
          />
        </Pressable>
      </View>

      {/* Details — title, price, rating */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
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
    // ~65-70% of card height when content below is ~30-35%
    aspectRatio: 4 / 3,
  },

  // Condition badge — top right
  conditionBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  conditionNew: { backgroundColor: Colors.successLight },
  conditionUsed: { backgroundColor: Colors.surfaceAlt },
  conditionText: {
    ...Typography.caption,
    fontSize: 9,
    lineHeight: 12,
  },
  conditionTextNew: { color: Colors.success },
  conditionTextUsed: { color: Colors.textSecondary },

  // Sponsored badge — below condition badge
  sponsoredBadge: {
    position: 'absolute',
    top: Spacing.xs + 18, // below condition badge
    right: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    backgroundColor: Colors.blue,
  },
  sponsoredText: {
    ...Typography.caption,
    fontSize: 9,
    lineHeight: 12,
    color: Colors.textInverse,
  },

  // Wishlist heart — top left
  heartBtn: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    width: Spacing['2xl'] + Spacing.xs,
    height: Spacing['2xl'] + Spacing.xs,
    borderRadius: Spacing.md + 2,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Details
  content: {
    padding: Spacing.sm,
    gap: 2,
  },
  title: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  price: {
    ...Typography.priceSm,
    color: Colors.navy,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  reviewCount: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
    marginLeft: 3,
    textTransform: 'none',
  },
});
