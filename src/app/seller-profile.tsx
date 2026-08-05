import React, { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Avatar, Button, ListingCard, StarRating, VerifiedBadge } from '@/components/ui';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { MOCK_LISTINGS, MOCK_REVIEWS, MOCK_USERS } from '@/data/mockData';
import { useResponsive } from '@/hooks/useResponsive';

const TABS = ['Listings', 'Reviews'] as const;

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const seller = MOCK_USERS.find((u) => u.id === id);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Listings');
  const { isDesktop, contentMaxWidth, isWeb } = useResponsive();

  if (!seller) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text>Seller not found</Text></View></SafeAreaView>;
  }

  const sellerListings = MOCK_LISTINGS.filter((l) => l.seller_id === seller.id && l.status === 'active');
  const sellerReviews = MOCK_REVIEWS.filter((r) => r.seller_id === seller.id);
  const avgRating = sellerReviews.length > 0 ? sellerReviews.reduce((s, r) => s + r.rating, 0) / sellerReviews.length : 0;
  const memberSince = new Date(seller.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={isWeb ? [] : ['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[{ maxWidth: contentMaxWidth, alignSelf: 'center' as any, width: '100%' as any }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={24} color={Colors.textPrimary} /></Pressable>
        </View>

        {/* Profile */}
        <View style={styles.profileSection}>
          <Avatar uri={seller.avatar_url} name={seller.full_name} size="xl" />
          <View style={styles.nameRow}>
            <Text style={styles.name}>{seller.full_name}</Text>
            <VerifiedBadge user={seller} size={18} />
          </View>
          <StarRating rating={avgRating} size="md" showCount count={sellerReviews.length} />
          <Text style={styles.meta}>Member since {memberSince}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <View style={styles.tabContent}>
          {activeTab === 'Listings' ? (
            <View style={styles.grid}>
              {sellerListings.map((listing) => (
                <View key={listing.id} style={styles.gridItem}>
                  <ListingCard listing={listing} onPress={() => router.push(`/listing-detail?id=${listing.id}`)} />
                </View>
              ))}
              {sellerListings.length === 0 && <Text style={styles.emptyText}>No listings</Text>}
            </View>
          ) : (
            sellerReviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Avatar uri={review.reviewer?.avatar_url} name={review.reviewer?.full_name ?? ''} size="sm" />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewerName}>{review.reviewer?.full_name}</Text>
                    <StarRating rating={review.rating} size="sm" />
                  </View>
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</Text>
                </View>
                {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
              </View>
            ))
          )}
        </View>
        </View>
      </ScrollView>

      <View style={styles.bottomAction}>
        <Button title="Message Seller" variant="secondary" onPress={() => Alert.alert('Chat', 'Chat coming soon')} fullWidth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: Spacing.xl },
  profileSection: { alignItems: 'center', paddingBottom: Spacing.xl, gap: Spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  name: { ...Typography.titleLg, color: Colors.textPrimary },
  meta: { ...Typography.bodySmall, color: Colors.textSecondary },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginHorizontal: Spacing.xl },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.navy },
  tabText: { ...Typography.titleSm, color: Colors.textTertiary },
  tabTextActive: { color: Colors.navy },
  tabContent: { padding: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridItem: { width: '48%', flexGrow: 1 },
  emptyText: { ...Typography.body, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing['3xl'] },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewInfo: { flex: 1, gap: 2 },
  reviewerName: { ...Typography.titleSm, color: Colors.textPrimary },
  reviewDate: { ...Typography.bodySmall, color: Colors.textTertiary },
  reviewComment: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md, lineHeight: 22 },
  bottomAction: { padding: Spacing.xl, paddingBottom: Spacing['3xl'], borderTopWidth: 1, borderTopColor: Colors.border },
});
