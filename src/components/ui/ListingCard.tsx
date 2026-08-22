import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, Star } from 'lucide-react-native';

import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getPriceDropPercent } from '@/utils/pricing';
import type { Listing } from '@/types';
import ListingImage from './ListingImage';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
}

export default function ListingCard({ listing, onPress }: ListingCardProps) {
  const { dispatch, isWishlisted } = useApp();
  const isNew = listing.condition === 'new';
  const wishlisted = isWishlisted(listing.id);
  const dropPercent = getPriceDropPercent(listing);
  const isSold = listing.status === 'sold';

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
        <ListingImage uri={listing.images[0]} style={[styles.image, isSold && styles.imageSold]} iconSize={22} />

        {/* Sold is the only badge shown when sold — same top-right slot
            the condition badge normally occupies, condition/price-drop
            badges are suppressed rather than stacked underneath it. */}
        {isSold ? (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>SOLD</Text>
          </View>
        ) : (
          <>
            {/* Condition badge — top right */}
            <View style={[styles.conditionBadge, isNew ? styles.conditionNew : styles.conditionUsed]}>
              <Text style={[styles.conditionText, isNew ? styles.conditionTextNew : styles.conditionTextUsed]}>
                {isNew ? 'New' : 'Used'}
              </Text>
            </View>

            {/* Price-drop badge — below condition badge */}
            {dropPercent != null && (
              <View style={styles.dropBadge}>
                <Text style={styles.dropText}>-{dropPercent}%</Text>
              </View>
            )}
          </>
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
        <View style={styles.priceRow}>
          <Text style={styles.price}>R{listing.price.toLocaleString()}</Text>
          {dropPercent != null && (
            <Text style={styles.previousPrice}>R{listing.previous_price!.toLocaleString()}</Text>
          )}
        </View>
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
    aspectRatio: 5 / 4,
  },
  imageSold: {
    opacity: 0.5,
  },

  // Sold badge — same top-right slot as the condition badge
  soldBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    backgroundColor: Colors.danger,
  },
  soldBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    lineHeight: 12,
    color: Colors.textInverse,
    fontWeight: '700',
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

  // Price-drop badge — below condition badge
  dropBadge: {
    position: 'absolute',
    top: Spacing.xs + 18, // below condition badge
    right: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    backgroundColor: Colors.success,
  },
  dropText: {
    ...Typography.caption,
    fontSize: 9,
    lineHeight: 12,
    color: Colors.textInverse,
    fontWeight: '700',
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    ...Typography.priceSm,
    color: Colors.navy,
  },
  previousPrice: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
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
