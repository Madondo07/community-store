import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart, Share2 } from 'lucide-react-native';

import { Button, CategoryChip, ListingImage, SellerCard, StarRating } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useResponsive } from '@/hooks/useResponsive';
import { getOrCreateConversation } from '@/lib/api/conversations';
import { getListing } from '@/lib/api/listings';
import { getPriceDropPercent } from '@/utils/pricing';
import type { Listing } from '@/types';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, isWishlisted } = useApp();
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    getListing(id)
      .then(setListing)
      .catch((err) => console.warn('Failed to load listing:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleMessageSeller = async () => {
    if (!listing) return;
    if (!state.user) {
      router.push('/(auth)');
      return;
    }
    try {
      const conversationId = await getOrCreateConversation(state.user.id, listing.seller_id, listing.id);
      router.push({
        pathname: '/chat-thread',
        params: {
          conversationId,
          otherUserId: listing.seller_id,
          otherUserName: listing.seller?.full_name ?? 'Seller',
          listingId: listing.id,
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not start conversation.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.navy} /></View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text>Listing not found</Text></View>
      </SafeAreaView>
    );
  }

  const dropPercent = getPriceDropPercent(listing);
  const isOwnListing = !!state.user && listing.seller_id === state.user.id;
  const isSold = listing.status === 'sold';
  const addToCartLabel = isOwnListing ? 'Your Listing' : isSold ? 'Sold Out' : 'Add to Cart';
  const addToCartDisabled = isOwnListing || isSold;

  const detailContent = (
    <>
      {/* Tags */}
      <View style={styles.tagRow}>
        <CategoryChip label={listing.condition === 'new' ? 'New' : 'Used'} selected={listing.condition === 'new'} onPress={() => {}} />
        <CategoryChip label={listing.category.charAt(0).toUpperCase() + listing.category.slice(1)} onPress={() => {}} />
      </View>

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>R{listing.price.toLocaleString()}</Text>
        {dropPercent != null && (
          <>
            <Text style={styles.previousPrice}>R{listing.previous_price!.toLocaleString()}</Text>
            <View style={styles.dropChip}>
              <Text style={styles.dropChipText}>-{dropPercent}%</Text>
            </View>
          </>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{listing.title}</Text>

      {/* Rating */}
      <View style={styles.ratingRow}>
        <StarRating rating={listing.avg_rating ?? 0} size="md" showCount count={listing.review_count ?? 0} />
      </View>

      {/* Seller */}
      {listing.seller ? (
        <SellerCard
          seller={listing.seller}
          compact
          onPress={() => router.push(`/seller-profile?id=${listing.seller_id}`)}
        />
      ) : (
        <View style={styles.sellerUnavailable}>
          <Text style={styles.sellerUnavailableText}>Seller information unavailable</Text>
        </View>
      )}

      {/* Description */}
      <View style={styles.descSection}>
        <Text style={styles.descTitle}>Description</Text>
        <Text style={styles.desc} numberOfLines={expanded ? undefined : 3}>{listing.description}</Text>
        <Pressable onPress={() => setExpanded(!expanded)}>
          <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      </View>

      {/* Desktop: inline actions */}
      {isDesktop && (
        <View style={styles.desktopActions}>
          <Button
            title={addToCartLabel}
            disabled={addToCartDisabled}
            onPress={() => {
              dispatch({ type: 'ADD_TO_CART', payload: listing });
              Alert.alert('Added', `${listing.title} added to cart`);
            }}
            fullWidth
          />
          {!isOwnListing && (
            <Button
              title="Message Seller"
              variant="secondary"
              onPress={handleMessageSeller}
              fullWidth
            />
          )}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, isDesktop && { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as any, paddingHorizontal: Spacing['2xl'] }]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn} accessibilityLabel="Go back">
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Pressable
              onPress={() => dispatch({ type: 'TOGGLE_WISHLIST', payload: listing.id })}
              style={styles.headerBtn}
              accessibilityLabel={isWishlisted(listing.id) ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Heart size={22} color={isWishlisted(listing.id) ? Colors.danger : Colors.textPrimary} fill={isWishlisted(listing.id) ? Colors.danger : 'transparent'} />
            </Pressable>
            <Pressable onPress={() => Alert.alert('Share', 'Share feature coming soon')} style={styles.headerBtn} accessibilityLabel="Share">
              <Share2 size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Desktop: side-by-side layout */}
        {isDesktop ? (
          <View style={[styles.desktopRow, { maxWidth: contentMaxWidth, alignSelf: 'center' as const }]}>
            <View style={styles.desktopImageWrap}>
              <ListingImage uri={listing.images[0]} style={styles.desktopImageFill} iconSize={40} />
            </View>
            <View style={styles.desktopContent}>{detailContent}</View>
          </View>
        ) : (
          <>
            <ListingImage uri={listing.images[0]} style={styles.image} iconSize={40} />
            <View style={styles.dots}><View style={styles.dotActive} /></View>
            <View style={styles.content}>{detailContent}</View>
          </>
        )}
      </ScrollView>

      {/* Mobile: sticky bottom actions */}
      {!isDesktop && (
        <View style={styles.actions}>
          <Button
            title={addToCartLabel}
            disabled={addToCartDisabled}
            onPress={() => {
              dispatch({ type: 'ADD_TO_CART', payload: listing });
              Alert.alert('Added', `${listing.title} added to cart`);
            }}
            fullWidth
            style={{ flex: 1 }}
          />
          {!isOwnListing && (
            <Button
              title="Message Seller"
              variant="secondary"
              onPress={handleMessageSeller}
              style={{ flex: 1 }}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.xl, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  image: { width: '100%', aspectRatio: 1, backgroundColor: Colors.surfaceAlt },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.sm },
  dotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.navy },
  content: { padding: Spacing.xl },
  tagRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  price: { ...Typography.price, color: Colors.navy },
  previousPrice: { ...Typography.body, color: Colors.textTertiary, textDecorationLine: 'line-through' },
  dropChip: { backgroundColor: Colors.success, borderRadius: Radii.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  dropChipText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '700' },
  title: { ...Typography.titleLg, color: Colors.textPrimary, marginBottom: Spacing.md },
  ratingRow: { marginBottom: Spacing.xl },
  sellerUnavailable: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sellerUnavailableText: { ...Typography.bodySmall, color: Colors.textTertiary },
  descSection: { marginTop: Spacing.xl },
  descTitle: { ...Typography.titleMd, color: Colors.textPrimary, marginBottom: Spacing.sm },
  desc: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  readMore: { ...Typography.bodySmall, color: Colors.blue, fontWeight: '600', marginTop: Spacing.xs },
  actions: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.xl, paddingBottom: Spacing['3xl'], borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  // Desktop
  desktopRow: { flexDirection: 'row', gap: Spacing['3xl'], padding: Spacing['2xl'], paddingTop: Spacing['5xl'] },
  // aspectRatio lives on this wrapper (not the image inside it) — a
  // flex:1 row child's own width is always reliably resolved by the
  // flexbox layout, whereas an aspectRatio + percentage-width Image
  // nested another level down inside that flex:1 chain intermittently
  // resolved to zero height on web. The image/fallback below just fills
  // whatever size this wrapper already settled on.
  desktopImageWrap: { flex: 1, maxWidth: 600, aspectRatio: 1, borderRadius: Radii.lg, overflow: 'hidden', backgroundColor: Colors.surfaceAlt },
  desktopImageFill: { width: '100%', height: '100%' },
  desktopContent: { flex: 1, minWidth: 300 },
  desktopActions: { gap: Spacing.md, marginTop: Spacing['2xl'] },
});
