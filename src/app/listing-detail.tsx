import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart, Share2 } from 'lucide-react-native';

import { Button, CategoryChip, SellerCard, StarRating } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { MOCK_LISTINGS } from '@/data/mockData';
import { useResponsive } from '@/hooks/useResponsive';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dispatch, isWishlisted } = useApp();
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();
  const listing = MOCK_LISTINGS.find((l) => l.id === id);
  const [expanded, setExpanded] = useState(false);

  if (!listing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text>Listing not found</Text></View>
      </SafeAreaView>
    );
  }

  const detailContent = (
    <>
      {/* Tags */}
      <View style={styles.tagRow}>
        <CategoryChip label={listing.condition === 'new' ? 'New' : 'Used'} selected={listing.condition === 'new'} onPress={() => {}} />
        <CategoryChip label={listing.category.charAt(0).toUpperCase() + listing.category.slice(1)} onPress={() => {}} />
      </View>

      {/* Price */}
      <Text style={styles.price}>R{listing.price.toLocaleString()}</Text>

      {/* Title */}
      <Text style={styles.title}>{listing.title}</Text>

      {/* Rating */}
      <View style={styles.ratingRow}>
        <StarRating rating={listing.avg_rating ?? 0} size="md" showCount count={listing.review_count ?? 0} />
      </View>

      {/* Seller */}
      {listing.seller && (
        <SellerCard
          seller={listing.seller}
          compact
          onPress={() => router.push(`/seller-profile?id=${listing.seller_id}`)}
        />
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
            title="Add to Cart"
            onPress={() => {
              dispatch({ type: 'ADD_TO_CART', payload: listing });
              Alert.alert('Added', `${listing.title} added to cart`);
            }}
            fullWidth
          />
          <Button
            title="Message Seller"
            variant="secondary"
            onPress={() => Alert.alert('Message', 'Chat coming soon')}
            fullWidth
          />
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
              <Image source={{ uri: listing.images[0] }} style={styles.desktopImage} resizeMode="cover" />
            </View>
            <View style={styles.desktopContent}>{detailContent}</View>
          </View>
        ) : (
          <>
            <Image source={{ uri: listing.images[0] }} style={styles.image} resizeMode="cover" />
            <View style={styles.dots}><View style={styles.dotActive} /></View>
            <View style={styles.content}>{detailContent}</View>
          </>
        )}
      </ScrollView>

      {/* Mobile: sticky bottom actions */}
      {!isDesktop && (
        <View style={styles.actions}>
          <Button
            title="Add to Cart"
            onPress={() => {
              dispatch({ type: 'ADD_TO_CART', payload: listing });
              Alert.alert('Added', `${listing.title} added to cart`);
            }}
            fullWidth
            style={{ flex: 1 }}
          />
          <Button
            title="Message Seller"
            variant="secondary"
            onPress={() => Alert.alert('Message', 'Chat coming soon')}
            style={{ flex: 1 }}
          />
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
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: Colors.surfaceAlt },
  dots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.sm },
  dotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.navy },
  content: { padding: Spacing.xl },
  tagRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  price: { ...Typography.price, color: Colors.navy, marginBottom: Spacing.xs },
  title: { ...Typography.titleLg, color: Colors.textPrimary, marginBottom: Spacing.md },
  ratingRow: { marginBottom: Spacing.xl },
  descSection: { marginTop: Spacing.xl },
  descTitle: { ...Typography.titleMd, color: Colors.textPrimary, marginBottom: Spacing.sm },
  desc: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22 },
  readMore: { ...Typography.bodySmall, color: Colors.blue, fontWeight: '600', marginTop: Spacing.xs },
  actions: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.xl, paddingBottom: Spacing['3xl'], borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  // Desktop
  desktopRow: { flexDirection: 'row', gap: Spacing['3xl'], padding: Spacing['2xl'], paddingTop: Spacing['5xl'] },
  desktopImageWrap: { flex: 1, maxWidth: 600 },
  desktopImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: Radii.lg, backgroundColor: Colors.surfaceAlt },
  desktopContent: { flex: 1, minWidth: 300 },
  desktopActions: { gap: Spacing.md, marginTop: Spacing['2xl'] },
});
